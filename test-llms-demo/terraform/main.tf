terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-course-awsserverless"
    key            = "test-llms-demo/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

locals {
  project_name        = var.project_name
  document_bucket     = "${var.project_name}-docs-${data.aws_caller_identity.current.account_id}"
  frontend_bucket     = "${var.project_name}-frontend-${random_string.bucket_suffix.result}"
  collection_name     = "${var.project_name}-vectors"
  knowledge_base_name = "${var.project_name}-kb"
}
