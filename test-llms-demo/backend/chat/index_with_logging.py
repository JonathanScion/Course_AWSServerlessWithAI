import json
import os
import boto3
from concurrent.futures import ThreadPoolExecutor, as_completed
import traceback
import logging

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ['REGION'])
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime', region_name=os.environ['REGION'])

KNOWLEDGE_BASE_ID = os.environ['KNOWLEDGE_BASE_ID']

def retrieve_from_knowledge_base(query: str, max_results: int = 5):
    """Query the Bedrock Knowledge Base for relevant context"""
    logger.info(f"retrieve_from_knowledge_base: Starting - query='{query}', max_results={max_results}")
    try:
        response = bedrock_agent_runtime.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={
                'text': query
            },
            retrievalConfiguration={
                'vectorSearchConfiguration': {
                    'numberOfResults': max_results
                }
            }
        )

        logger.info(f"retrieve_from_knowledge_base: Bedrock API response received")

        # Extract and format the retrieved chunks
        contexts = []
        for idx, result in enumerate(response.get('retrievalResults', [])):
            content = result.get('content', {}).get('text', '')
            if content:
                contexts.append(content)
                logger.debug(f"retrieve_from_knowledge_base: Context {idx+1} - length={len(content)}")

        logger.info(f"retrieve_from_knowledge_base: Success - retrieved {len(contexts)} contexts")
        return contexts

    except Exception as e:
        logger.error(f"retrieve_from_knowledge_base: ERROR - {str(e)}", exc_info=True)
        return []

def query_claude(question: str, context: str):
    """Query Claude 3.5 Sonnet via Bedrock"""
    logger.info(f"query_claude: Starting - question length={len(question)}, context length={len(context)}")
    try:
        prompt = f"""You are a helpful assistant. Use the following context to answer the question.

Context:
{context}

Question: {question}

Answer based on the context provided. If the context doesn't contain enough information, say so."""

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7
        })

        logger.info("query_claude: Invoking Bedrock model anthropic.claude-3-5-sonnet-20241022-v2:0")
        response = bedrock_runtime.invoke_model(
            modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
            body=body
        )

        response_body = json.loads(response['body'].read())
        answer = response_body['content'][0]['text']

        logger.info(f"query_claude: Success - answer length={len(answer)}")
        return {
            'model': 'Claude 3.5 Sonnet',
            'answer': answer,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"query_claude: ERROR - {str(e)}", exc_info=True)
        return {
            'model': 'Claude 3.5 Sonnet',
            'answer': f'Error: {str(e)}',
            'status': 'error'
        }

def query_llama(question: str, context: str):
    """Query Meta Llama 3 70B via Bedrock"""
    logger.info(f"query_llama: Starting - question length={len(question)}, context length={len(context)}")
    try:
        prompt = f"""You are a helpful assistant. Use the following context to answer the question.

Context:
{context}

Question: {question}

Answer based on the context provided. If the context doesn't contain enough information, say so."""

        body = json.dumps({
            "prompt": prompt,
            "max_gen_len": 2000,
            "temperature": 0.7,
            "top_p": 0.9
        })

        logger.info("query_llama: Invoking Bedrock model meta.llama3-70b-instruct-v1:0")
        response = bedrock_runtime.invoke_model(
            modelId='meta.llama3-70b-instruct-v1:0',
            body=body
        )

        response_body = json.loads(response['body'].read())
        answer = response_body.get('generation', '')

        logger.info(f"query_llama: Success - answer length={len(answer)}")
        logger.debug(f"query_llama: Response body keys: {response_body.keys()}")

        return {
            'model': 'Meta Llama 3 70B',
            'answer': answer,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"query_llama: ERROR - {str(e)}", exc_info=True)
        return {
            'model': 'Meta Llama 3 70B',
            'answer': f'Error: {str(e)}',
            'status': 'error'
        }

def query_titan(question: str, context: str):
    """Query Amazon Titan Express via Bedrock"""
    logger.info(f"query_titan: Starting - question length={len(question)}, context length={len(context)}")
    try:
        prompt = f"""You are a helpful assistant. Use the following context to answer the question.

Context:
{context}

Question: {question}

Answer based on the context provided. If the context doesn't contain enough information, say so."""

        body = json.dumps({
            "inputText": prompt,
            "textGenerationConfig": {
                "maxTokenCount": 2000,
                "temperature": 0.7,
                "topP": 0.9
            }
        })

        logger.info("query_titan: Invoking Bedrock model amazon.titan-text-express-v1")
        response = bedrock_runtime.invoke_model(
            modelId='amazon.titan-text-express-v1',
            body=body
        )

        response_body = json.loads(response['body'].read())
        answer = response_body['results'][0]['outputText']

        logger.info(f"query_titan: Success - answer length={len(answer)}")
        return {
            'model': 'Amazon Titan Express',
            'answer': answer,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"query_titan: ERROR - {str(e)}", exc_info=True)
        return {
            'model': 'Amazon Titan Express',
            'answer': f'Error: {str(e)}',
            'status': 'error'
        }

def handler(event, context):
    """Lambda handler for chat requests"""
    request_id = context.request_id if context else 'local-test'
    logger.info(f"handler: START - request_id={request_id}")
    logger.debug(f"handler: Event: {json.dumps(event)}")

    try:
        # Parse request body
        body = json.loads(event['body'])
        question = body.get('question', '').strip()

        logger.info(f"handler: Question received - '{question}'")

        if not question:
            logger.warning("handler: Empty question provided")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Question is required'})
            }

        # Retrieve context from knowledge base
        logger.info(f"handler: Retrieving context for question: {question}")
        contexts = retrieve_from_knowledge_base(question)
        context_text = "\n\n".join(contexts) if contexts else "No relevant context found in the knowledge base."

        logger.info(f"handler: Retrieved {len(contexts)} context chunks, total length={len(context_text)}")

        # Query all three LLMs in parallel
        logger.info("handler: Querying all 3 LLMs in parallel")
        results = []
        with ThreadPoolExecutor(max_workers=3) as executor:
            # Submit all three queries
            future_claude = executor.submit(query_claude, question, context_text)
            future_llama = executor.submit(query_llama, question, context_text)
            future_titan = executor.submit(query_titan, question, context_text)

            # Collect results as they complete
            futures = {
                'claude': future_claude,
                'llama': future_llama,
                'titan': future_titan
            }

            for name, future in futures.items():
                try:
                    result = future.result(timeout=50)
                    results.append(result)
                    logger.info(f"handler: {name} completed - status={result.get('status')}")
                except Exception as e:
                    logger.error(f"handler: {name} failed - {str(e)}", exc_info=True)
                    results.append({
                        'model': name,
                        'answer': f'Error: {str(e)}',
                        'status': 'error'
                    })

        response_data = {
            'question': question,
            'contexts_found': len(contexts),
            'responses': results
        }

        logger.info(f"handler: SUCCESS - request_id={request_id}, contexts={len(contexts)}, responses={len(results)}")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data)
        }

    except Exception as e:
        logger.error(f"handler: FATAL ERROR - request_id={request_id}, error={str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
