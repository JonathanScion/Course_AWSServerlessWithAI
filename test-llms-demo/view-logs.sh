#!/bin/bash
# Helper script to view Lambda logs

FUNCTION_NAME=${1:-multi-llm-rag-chat}
MINUTES_AGO=${2:-60}

echo "Viewing logs for: /aws/lambda/$FUNCTION_NAME"
echo "From last $MINUTES_AGO minutes..."
echo "---"

# Calculate start time (current time - minutes in milliseconds)
START_TIME=$(($(date +%s) * 1000 - $MINUTES_AGO * 60 * 1000))

# Get log events
aws logs filter-log-events \
  --log-group-name "/aws/lambda/$FUNCTION_NAME" \
  --region us-east-1 \
  --start-time "$START_TIME" \
  --query 'events[*].[timestamp,message]' \
  --output text | \
  while IFS=$'\t' read -r timestamp message; do
    # Convert timestamp to readable format
    date_str=$(date -d "@$((timestamp / 1000))" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -r "$((timestamp / 1000))" '+%Y-%m-%d %H:%M:%S' 2>/dev/null)
    echo "[$date_str] $message"
  done
