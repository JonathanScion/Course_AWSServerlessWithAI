resource "aws_dynamodb_table" "calculation_logs" {
  name           = "${var.project_name}-calculation-logs"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  range_key      = "timestamp"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  tags = {
    Name        = "${var.project_name}-calculation-logs"
    Environment = "production"
  }
}
