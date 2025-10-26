variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
  # Set this when running: terraform apply -var="github_org=YourGitHubUsername"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "Course_AWSServerlessWithAI"
}
