# OpenSearch Serverless Encryption Policy
resource "aws_opensearchserverless_security_policy" "encryption" {
  name = "${local.collection_name}-encryption"
  type = "encryption"

  policy = jsonencode({
    Rules = [
      {
        ResourceType = "collection"
        Resource     = ["collection/${local.collection_name}"]
      }
    ]
    AWSOwnedKey = true
  })
}

# OpenSearch Serverless Network Policy
resource "aws_opensearchserverless_security_policy" "network" {
  name = "${local.collection_name}-network"
  type = "network"

  policy = jsonencode([
    {
      Rules = [
        {
          ResourceType = "collection"
          Resource     = ["collection/${local.collection_name}"]
        },
        {
          ResourceType = "dashboard"
          Resource     = ["collection/${local.collection_name}"]
        }
      ]
      AllowFromPublic = true
    }
  ])
}

# OpenSearch Serverless Collection
resource "aws_opensearchserverless_collection" "vectors" {
  name = local.collection_name
  type = "VECTORSEARCH"

  description = "Vector database for RAG knowledge base"

  tags = {
    Name    = local.collection_name
    Project = local.project_name
  }

  depends_on = [
    aws_opensearchserverless_security_policy.encryption,
    aws_opensearchserverless_security_policy.network
  ]
}

# OpenSearch Serverless Data Access Policy
resource "aws_opensearchserverless_access_policy" "data" {
  name = "${local.collection_name}-access"
  type = "data"

  policy = jsonencode([
    {
      Rules = [
        {
          ResourceType = "collection"
          Resource     = ["collection/${local.collection_name}"]
          Permission = [
            "aoss:CreateCollectionItems",
            "aoss:DeleteCollectionItems",
            "aoss:UpdateCollectionItems",
            "aoss:DescribeCollectionItems"
          ]
        },
        {
          ResourceType = "index"
          Resource     = ["index/${local.collection_name}/*"]
          Permission = [
            "aoss:CreateIndex",
            "aoss:DeleteIndex",
            "aoss:UpdateIndex",
            "aoss:DescribeIndex",
            "aoss:ReadDocument",
            "aoss:WriteDocument"
          ]
        }
      ]
      Principal = [
        aws_iam_role.knowledge_base.arn,
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      ]
    }
  ])

  depends_on = [aws_opensearchserverless_collection.vectors]
}
