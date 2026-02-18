#!/usr/bin/env bash
# PAI Observability Server — Lifecycle Management (Linux)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/apps/server"
CLIENT_DIR="$SCRIPT_DIR/apps/client"
SERVER_PID_FILE="/tmp/pai-observability-server.pid"
CLIENT_PID_FILE="/tmp/pai-observability-client.pid"
SERVER_PORT=4000
CLIENT_PORT=5172

log() { echo "[PAI Observability] $*"; }

is_running() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid=$(cat "$pid_file")
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    rm -f "$pid_file"
  fi
  return 1
}

start() {
  log "Starting server..."

  if is_running "$SERVER_PID_FILE"; then
    log "Server already running (PID: $(cat "$SERVER_PID_FILE"))"
  else
    cd "$SERVER_DIR"
    bun run src/index.ts &
    echo $! > "$SERVER_PID_FILE"
    log "Server started (PID: $!, port: $SERVER_PORT)"
  fi

  log "Starting client..."

  if is_running "$CLIENT_PID_FILE"; then
    log "Client already running (PID: $(cat "$CLIENT_PID_FILE"))"
  else
    cd "$CLIENT_DIR"
    bun run dev &
    echo $! > "$CLIENT_PID_FILE"
    log "Client started (PID: $!, port: $CLIENT_PORT)"
  fi

  log "Dashboard: http://localhost:$CLIENT_PORT"
  log "API:       http://localhost:$SERVER_PORT"
}

stop() {
  log "Stopping..."

  if is_running "$SERVER_PID_FILE"; then
    kill "$(cat "$SERVER_PID_FILE")" 2>/dev/null || true
    rm -f "$SERVER_PID_FILE"
    log "Server stopped"
  else
    log "Server not running"
  fi

  if is_running "$CLIENT_PID_FILE"; then
    kill "$(cat "$CLIENT_PID_FILE")" 2>/dev/null || true
    rm -f "$CLIENT_PID_FILE"
    log "Client stopped"
  else
    log "Client not running"
  fi

  # Cleanup any orphaned processes
  fuser -k "$SERVER_PORT/tcp" 2>/dev/null || true
  fuser -k "$CLIENT_PORT/tcp" 2>/dev/null || true
}

status() {
  echo "=== PAI Observability Server ==="
  if is_running "$SERVER_PID_FILE"; then
    echo "  Server: RUNNING (PID: $(cat "$SERVER_PID_FILE"), port: $SERVER_PORT)"
    curl -sf "http://localhost:$SERVER_PORT/health" | python3 -m json.tool 2>/dev/null || echo "  Health: unreachable"
  else
    echo "  Server: STOPPED"
  fi

  if is_running "$CLIENT_PID_FILE"; then
    echo "  Client: RUNNING (PID: $(cat "$CLIENT_PID_FILE"), port: $CLIENT_PORT)"
  else
    echo "  Client: STOPPED"
  fi
}

restart() {
  stop
  sleep 1
  start
}

case "${1:-}" in
  start)   start ;;
  stop)    stop ;;
  restart) restart ;;
  status)  status ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
