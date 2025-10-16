# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["FileUploadApp", "UploadRequestInitiated", { stat = "Sum", label = "Upload Requests" }],
            [".", "UploadConfirmed", { stat = "Sum", label = "Successful Uploads" }],
            [".", "DownloadRequest", { stat = "Sum", label = "Download Requests" }],
            [".", "DeleteRequest", { stat = "Sum", label = "Delete Requests" }],
            [".", "ListFilesRequest", { stat = "Sum", label = "List Requests" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "API Request Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["FileUploadApp", "UploadError", { stat = "Sum", label = "Upload Errors" }],
            [".", "DownloadError", { stat = "Sum", label = "Download Errors" }],
            [".", "DeleteError", { stat = "Sum", label = "Delete Errors" }],
            [".", "ListFilesError", { stat = "Sum", label = "List Errors" }],
            [".", "ConfirmError", { stat = "Sum", label = "Confirm Errors" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Error Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["FileUploadApp", "UploadResponseTime", { stat = "Average", label = "Upload Avg" }],
            [".", "DownloadResponseTime", { stat = "Average", label = "Download Avg" }],
            [".", "ListResponseTime", { stat = "Average", label = "List Avg" }],
            [".", "DeleteResponseTime", { stat = "Average", label = "Delete Avg" }],
            [".", "ConfirmResponseTime", { stat = "Average", label = "Confirm Avg" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Response Time (ms)"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["FileUploadApp", "FileSize", { stat = "Average", label = "Average File Size" }],
            ["...", { stat = "Maximum", label = "Max File Size" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "File Size Metrics (bytes)"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.upload.function_name],
            ["...", "...", "...", aws_lambda_function.list.function_name],
            ["...", "...", "...", aws_lambda_function.download.function_name],
            ["...", "...", "...", aws_lambda_function.delete.function_name],
            ["...", "...", "...", aws_lambda_function.confirm.function_name]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Invocations"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.upload.function_name],
            ["...", "...", "...", aws_lambda_function.list.function_name],
            ["...", "...", "...", aws_lambda_function.download.function_name],
            ["...", "...", "...", aws_lambda_function.delete.function_name],
            ["...", "...", "...", aws_lambda_function.confirm.function_name]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Errors"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", aws_api_gateway_rest_api.api.name],
            [".", "4XXError", ".", "."],
            [".", "5XXError", ".", "."]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "API Gateway Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.files_metadata.name],
            [".", "ConsumedWriteCapacityUnits", ".", "."]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Capacity"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '/aws/lambda/${aws_lambda_function.upload.function_name}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20"
          region  = var.aws_region
          title   = "Recent Lambda Errors"
          stacked = false
        }
      }
    ]
  })
}

# CloudWatch Alarms

# High error rate alarm
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.project_name}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UploadError"
  namespace           = "FileUploadApp"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors upload errors"
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}

# Lambda errors alarm for each function
resource "aws_cloudwatch_metric_alarm" "upload_lambda_errors" {
  alarm_name          = "${var.project_name}-upload-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors upload lambda errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.upload.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "list_lambda_errors" {
  alarm_name          = "${var.project_name}-list-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors list lambda errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.list.function_name
  }

  tags = local.common_tags
}

# API Gateway 5XX errors alarm
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${var.project_name}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.api.name
  }

  tags = local.common_tags
}

# High response time alarm
resource "aws_cloudwatch_metric_alarm" "high_response_time" {
  alarm_name          = "${var.project_name}-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UploadResponseTime"
  namespace           = "FileUploadApp"
  period              = 300
  statistic           = "Average"
  threshold           = 2000
  alarm_description   = "This metric monitors upload response time"
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}

# Lambda throttles alarm
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "${var.project_name}-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This metric monitors lambda throttling across all functions"
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}
