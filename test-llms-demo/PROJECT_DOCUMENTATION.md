# Multi-LLM RAG Chatbot - Project Documentation

## Overview
A chatbot application that allows users to ask questions and receive answers from THREE different LLMs simultaneously, all powered by the same RAG (Retrieval-Augmented Generation) database.

## Key Features
- **Single input field** - User types one question
- **Three answer windows** - Display responses from 3 different LLMs side-by-side
- **Shared RAG database** - All LLMs query the same knowledge base
- **File management interface**:
  - Upload documents (drag & drop or file picker)
  - View list of uploaded files
  - Remove files from the system

## Architecture Components

### 1. Web Interface (Frontend)
- **Purpose**: Chat widget and file management UI
- **Technology**: HTML/CSS/JavaScript (static files)
- **Hosting**: S3 + CloudFront
- **Features**:
  - Single question input field
  - Three side-by-side response panels (one per LLM)
  - File upload interface
  - File list with delete capability

### 2. API Gateway
- **Purpose**: HTTP endpoint for frontend requests
- **Routes**:
  - `POST /chat` - Submit questions
  - `POST /upload` - Upload documents
  - `GET /documents` - List uploaded files
  - `DELETE /documents/{id}` - Remove documents

### 3. Lambda Functions

#### Chat Lambda
- **Purpose**: Coordinate AI responses
- **Process**:
  1. Receive question from API Gateway
  2. Query Bedrock Knowledge Base for relevant context
  3. Send question + context to all 3 LLMs in parallel
  4. Return all 3 responses

#### Document Processing Lambda
- **Purpose**: Handle file uploads and deletions
- **Process**:
  1. Receive file from API Gateway
  2. Store in S3
  3. Trigger Knowledge Base sync
  4. Return success/failure

### 4. S3 Document Storage
- **Purpose**: Store all company documents
- **Features**:
  - Versioning enabled
  - Lifecycle policies (optional)
  - Event notifications to trigger processing

### 5. Bedrock Knowledge Base (RAG Engine)
- **Purpose**: Make documents searchable by AI
- **Process**:
  1. Reads documents from S3
  2. Chunks text into searchable segments
  3. Converts chunks to embeddings (vector format)
  4. Stores in Vector Database
  5. Performs semantic search on queries

### 6. Vector Database
- **Technology**: OpenSearch Serverless (or Aurora/Pinecone)
- **Purpose**: Store and search document embeddings
- **Access**: Used by Bedrock Knowledge Base

### 7. Bedrock LLMs (3 Models - Pure AWS Bedrock)
- **Model 1**: Claude Sonnet 4 (Anthropic)
- **Model 2**: Meta Llama 3 70B (Meta)
- **Model 3**: Amazon Titan Premier (AWS)
- **Purpose**: Generate natural language answers based on retrieved context
- **Key Benefit**: All models accessed via single AWS service - no external API keys needed!

## Data Flow

### Question Answering Flow
```
User types question
    ↓
Frontend sends to API Gateway
    ↓
API Gateway triggers Chat Lambda
    ↓
Lambda queries Bedrock Knowledge Base
    ↓
Knowledge Base searches Vector Database
    ↓
Returns relevant document chunks
    ↓
Lambda sends (question + chunks) to 3 LLMs in parallel
    ↓
Each LLM generates an answer
    ↓
Lambda returns all 3 answers
    ↓
API Gateway sends to Frontend
    ↓
Frontend displays in 3 separate windows
```

### Document Upload Flow
```
User uploads file via UI
    ↓
Frontend sends to API Gateway
    ↓
API Gateway triggers Document Lambda
    ↓
Lambda stores file in S3
    ↓
S3 event notification triggers Knowledge Base sync
    ↓
Knowledge Base processes new document:
  - Chunks the content
  - Creates embeddings
  - Updates Vector Database
    ↓
Document now searchable
    ↓
Success response to user
```

### Document Deletion Flow
```
User clicks delete on file
    ↓
Frontend sends DELETE request
    ↓
Lambda removes file from S3
    ↓
Knowledge Base syncs (removes from index)
    ↓
Success response to user
```

## Technical Decisions - FINAL

### LLM Selection ✅ DECIDED
- **Claude Sonnet 4** - Industry-leading reasoning and accuracy
- **Meta Llama 3 70B** - Top open-source model, cost-effective
- **Amazon Titan Premier** - AWS native, optimized for AWS
- All accessed via **AWS Bedrock only** - no external APIs

### AWS Configuration ✅ DECIDED
- Region: us-east-1 (most Bedrock models available)
- Authentication: AWS IAM (no additional auth for MVP)
- Rate limiting: API Gateway throttling

### Frontend Framework ✅ DECIDED
- React 18 with hooks
- Custom CSS (no framework dependency)

### Infrastructure as Code ✅ DECIDED
- AWS CDK with TypeScript
- Type-safe, modern, great developer experience

### Supported File Types ✅ DECIDED
- PDF, TXT, DOC, DOCX, MD
- Max size: 10MB

## Security Considerations
- CORS configuration
- API authentication (API keys, Cognito, IAM)
- S3 bucket policies
- File size limits
- File type validation
- Input sanitization

## Future Enhancements
- User feedback on answers (thumbs up/down)
- Answer comparison metrics
- Response time tracking
- Cost per query tracking
- A/B testing capabilities
- Conversation history
- Multi-turn conversations
