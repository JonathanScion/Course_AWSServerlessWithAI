# WAF Web ACL for API Gateway
resource "aws_wafv2_web_acl" "api_waf" {
  name  = "${var.project_name}-api-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule 1: AWS Managed - Common Rule Set (OWASP Top 10)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-KnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: Rate Limiting (1000 requests per 5 minutes per IP)
  rule {
    name     = "RateLimitRule"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-RateLimit"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4: Geographic blocking (optional - currently allows all)
  # Uncomment to restrict to specific countries
  # rule {
  #   name     = "GeoBlockRule"
  #   priority = 4
  #
  #   action {
  #     block {}
  #   }
  #
  #   statement {
  #     geo_match_statement {
  #       country_codes = ["CN", "RU"]  # Block China and Russia
  #     }
  #   }
  #
  #   visibility_config {
  #     cloudwatch_metrics_enabled = true
  #     metric_name                = "${var.project_name}-GeoBlock"
  #     sampled_requests_enabled   = true
  #   }
  # }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-WAF"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "${var.project_name}-api-waf"
  }
}

# Associate WAF with API Gateway Stage
resource "aws_wafv2_web_acl_association" "api_gateway" {
  resource_arn = aws_api_gateway_stage.prod.arn
  web_acl_arn  = aws_wafv2_web_acl.api_waf.arn
}

# CloudWatch Log Group for WAF
resource "aws_cloudwatch_log_group" "waf_logs" {
  name              = "aws-waf-logs-${var.project_name}"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-waf-logs"
  }
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "waf_logging" {
  resource_arn            = aws_wafv2_web_acl.api_waf.arn
  log_destination_configs = ["${aws_cloudwatch_log_group.waf_logs.arn}:*"]
}
