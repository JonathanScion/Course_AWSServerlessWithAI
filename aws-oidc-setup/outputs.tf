output "oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider"
  value       = aws_iam_openid_connect_provider.github.arn
}

output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions IAM role (add this to GitHub Secrets as AWS_ROLE_ARN)"
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_role_name" {
  description = "Name of the GitHub Actions IAM role"
  value       = aws_iam_role.github_actions.name
}

output "setup_instructions" {
  description = "Next steps after Terraform apply"
  value       = <<-EOT

  ✅ OIDC Setup Complete!

  Next steps:
  1. Copy the Role ARN above: ${aws_iam_role.github_actions.arn}
  2. Go to: https://github.com/${var.github_org}/${var.github_repo}/settings/secrets/actions
  3. Create a new secret:
     - Name: AWS_ROLE_ARN
     - Value: ${aws_iam_role.github_actions.arn}
  4. Your GitHub Actions workflows can now authenticate to AWS using OIDC!

  EOT
}
