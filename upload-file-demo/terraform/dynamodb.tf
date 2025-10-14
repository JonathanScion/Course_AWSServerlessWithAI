resource "aws_dynamodb_table" "files_metadata" {
  name           = "${var.project_name}-files-metadata"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "fileId"

  attribute {
    name = "fileId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-files-metadata"
    }
  )
}
