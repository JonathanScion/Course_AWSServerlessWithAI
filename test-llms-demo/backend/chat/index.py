import json
import os
import boto3
from concurrent.futures import ThreadPoolExecutor, as_completed
import traceback

# Initialize clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ['REGION'])
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime', region_name=os.environ['REGION'])

KNOWLEDGE_BASE_ID = os.environ['KNOWLEDGE_BASE_ID']

def retrieve_from_knowledge_base(query: str, max_results: int = 5):
    """Query the Bedrock Knowledge Base for relevant context"""
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

        # Extract and format the retrieved chunks
        contexts = []
        for result in response.get('retrievalResults', []):
            content = result.get('content', {}).get('text', '')
            if content:
                contexts.append(content)

        return contexts
    except Exception as e:
        print(f"Error retrieving from knowledge base: {str(e)}")
        return []

def query_claude(question: str, context: str):
    """Query Claude 3.5 Sonnet via Bedrock"""
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

        response = bedrock_runtime.invoke_model(
            modelId='us.anthropic.claude-3-5-sonnet-20241022-v2:0',
            body=body
        )

        response_body = json.loads(response['body'].read())
        answer = response_body['content'][0]['text']

        return {
            'model': 'Claude 3.5 Sonnet',
            'answer': answer,
            'status': 'success'
        }
    except Exception as e:
        print(f"Error querying Claude: {str(e)}")
        print(traceback.format_exc())
        return {
            'model': 'Claude 3.5 Sonnet',
            'answer': f'Error: {str(e)}',
            'status': 'error'
        }

def query_llama(question: str, context: str):
    """Query Meta Llama 3 70B via Bedrock"""
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

        response = bedrock_runtime.invoke_model(
            modelId='meta.llama3-70b-instruct-v1:0',
            body=body
        )

        response_body = json.loads(response['body'].read())
        answer = response_body['generation']

        return {
            'model': 'Meta Llama 3 70B',
            'answer': answer,
            'status': 'success'
        }
    except Exception as e:
        print(f"Error querying Llama: {str(e)}")
        print(traceback.format_exc())
        return {
            'model': 'Meta Llama 3 70B',
            'answer': f'Error: {str(e)}',
            'status': 'error'
        }

def query_titan(question: str, context: str):
    """Query Amazon Titan Express via Bedrock"""
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

        response = bedrock_runtime.invoke_model(
            modelId='amazon.titan-text-express-v1',
            body=body
        )

        response_body = json.loads(response['body'].read())
        answer = response_body['results'][0]['outputText']

        return {
            'model': 'Amazon Titan Express',
            'answer': answer,
            'status': 'success'
        }
    except Exception as e:
        print(f"Error querying Titan: {str(e)}")
        print(traceback.format_exc())
        return {
            'model': 'Amazon Titan Express',
            'answer': f'Error: {str(e)}',
            'status': 'error'
        }

def handler(event, context):
    """Lambda handler for chat requests"""
    try:
        # Parse request body
        body = json.loads(event['body'])
        question = body.get('question', '').strip()

        if not question:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Question is required'})
            }

        # Retrieve context from knowledge base
        print(f"Retrieving context for question: {question}")
        contexts = retrieve_from_knowledge_base(question)
        context_text = "\n\n".join(contexts) if contexts else "No relevant context found in the knowledge base."

        print(f"Retrieved {len(contexts)} context chunks")

        # Query all three LLMs in parallel
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
                except Exception as e:
                    print(f"Error getting result from {name}: {str(e)}")
                    results.append({
                        'model': name,
                        'answer': f'Error: {str(e)}',
                        'status': 'error'
                    })

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'question': question,
                'contexts_found': len(contexts),
                'responses': results
            })
        }

    except Exception as e:
        print(f"Handler error: {str(e)}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
