#!/bin/bash
#
# Playground lifecycle management for Gutenberg Issue Triage
#
# Usage:
#   .claude/bin/playground.sh start [--blueprint=path] [--port=9400]
#   .claude/bin/playground.sh stop
#   .claude/bin/playground.sh status
#   .claude/bin/playground.sh url
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TRIAGE_DIR="$PROJECT_DIR/.claude/.triage"
PID_FILE="$TRIAGE_DIR/playground.pid"
LOG_FILE="$TRIAGE_DIR/playground.log"
URL_FILE="$TRIAGE_DIR/playground.url"

# Defaults
PORT=9400
BLUEPRINT=""

# Parse arguments
parse_args() {
    for arg in "$@"; do
        case $arg in
            --blueprint=*)
                BLUEPRINT="${arg#*=}"
                ;;
            --port=*)
                PORT="${arg#*=}"
                ;;
        esac
    done
}

# Ensure .triage directory exists
ensure_triage_dir() {
    mkdir -p "$TRIAGE_DIR"
}

# Check if playground is running
is_running() {
    if [[ -f "$PID_FILE" ]]; then
        local pid
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# Wait for server to be ready
wait_for_ready() {
    local url="http://127.0.0.1:$PORT"
    local max_attempts=30
    local attempt=0

    echo "Waiting for Playground to be ready at $url..."

    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -q "200\|302\|301"; then
            echo "Playground is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done

    echo "Timeout waiting for Playground to start"
    return 1
}

# Start playground
cmd_start() {
    parse_args "$@"
    ensure_triage_dir

    if is_running; then
        echo "Playground is already running (PID: $(cat "$PID_FILE"))"
        echo "URL: $(cat "$URL_FILE" 2>/dev/null || echo "http://127.0.0.1:$PORT")"
        return 0
    fi

    # Build command
    local cmd="npx @wp-playground/cli server --port=$PORT"

    if [[ -n "$BLUEPRINT" ]]; then
        if [[ ! -f "$BLUEPRINT" ]]; then
            echo "Error: Blueprint file not found: $BLUEPRINT"
            return 1
        fi
        cmd="$cmd --blueprint=$BLUEPRINT"
    fi

    echo "Starting Playground..."
    echo "Command: $cmd"

    # Start in background, redirect output to log
    $cmd > "$LOG_FILE" 2>&1 &
    local pid=$!

    echo "$pid" > "$PID_FILE"
    echo "http://127.0.0.1:$PORT" > "$URL_FILE"

    echo "Started with PID: $pid"

    # Wait for ready
    if wait_for_ready; then
        echo ""
        echo "Playground running at: http://127.0.0.1:$PORT"
        echo "Logs: $LOG_FILE"
        return 0
    else
        echo "Failed to start. Check logs: $LOG_FILE"
        cmd_stop
        return 1
    fi
}

# Stop playground
cmd_stop() {
    if ! is_running; then
        echo "Playground is not running"
        rm -f "$PID_FILE" "$URL_FILE"
        return 0
    fi

    local pid
    pid=$(cat "$PID_FILE")

    echo "Stopping Playground (PID: $pid)..."

    # Send SIGTERM first (graceful)
    kill -TERM "$pid" 2>/dev/null || true

    # Wait up to 5 seconds for graceful shutdown
    local count=0
    while kill -0 "$pid" 2>/dev/null && [[ $count -lt 5 ]]; do
        sleep 1
        count=$((count + 1))
    done

    # Force kill if still running
    if kill -0 "$pid" 2>/dev/null; then
        echo "Force killing..."
        kill -9 "$pid" 2>/dev/null || true
    fi

    rm -f "$PID_FILE" "$URL_FILE"
    echo "Stopped"
}

# Show status
cmd_status() {
    if is_running; then
        local pid
        pid=$(cat "$PID_FILE")
        local url
        url=$(cat "$URL_FILE" 2>/dev/null || echo "http://127.0.0.1:$PORT")
        echo "Playground is running"
        echo "  PID: $pid"
        echo "  URL: $url"
        echo "  Log: $LOG_FILE"
    else
        echo "Playground is not running"
        rm -f "$PID_FILE" "$URL_FILE"
        return 1
    fi
}

# Get URL
cmd_url() {
    if is_running; then
        cat "$URL_FILE" 2>/dev/null || echo "http://127.0.0.1:$PORT"
    else
        echo "Playground is not running" >&2
        return 1
    fi
}

# Show logs
cmd_logs() {
    if [[ -f "$LOG_FILE" ]]; then
        tail -f "$LOG_FILE"
    else
        echo "No log file found"
        return 1
    fi
}

# Main
case "${1:-}" in
    start)
        shift
        cmd_start "$@"
        ;;
    stop)
        cmd_stop
        ;;
    status)
        cmd_status
        ;;
    url)
        cmd_url
        ;;
    logs)
        cmd_logs
        ;;
    *)
        echo "Usage: $0 {start|stop|status|url|logs}"
        echo ""
        echo "Commands:"
        echo "  start [--blueprint=path] [--port=9400]  Start Playground"
        echo "  stop                                     Stop Playground"
        echo "  status                                   Check if running"
        echo "  url                                      Print the Playground URL"
        echo "  logs                                     Tail the log file"
        exit 1
        ;;
esac
