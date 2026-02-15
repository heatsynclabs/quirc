#!/bin/sh
set -e

DB_PATH=/ircd/ircd.db
BACKUP_INTERVAL="${BACKUP_INTERVAL:-300}"

# ── S3/Spaces helpers ────────────────────────────────────────────────

HAS_SPACES=false

setup_mc() {
  if [ -z "$DO_SPACES_KEY" ] || [ -z "$DO_SPACES_SECRET" ] || [ -z "$DO_SPACES_BUCKET" ]; then
    echo "[backup] Spaces credentials not configured — running without persistence"
    return 1
  fi
  mc alias set spaces \
    "https://${DO_SPACES_REGION:-sfo3}.digitaloceanspaces.com" \
    "$DO_SPACES_KEY" "$DO_SPACES_SECRET" --api S3v4 > /dev/null 2>&1
  return 0
}

restore_db() {
  echo "[backup] Checking for existing backup..."
  if mc cp "spaces/${DO_SPACES_BUCKET}/backups/ircd.db" "$DB_PATH" > /dev/null 2>&1; then
    echo "[backup] Database restored from Spaces"
  else
    echo "[backup] No backup found — starting fresh"
  fi
}

upload_db() {
  if [ ! -f "$DB_PATH" ]; then return; fi
  mc cp "$DB_PATH" "spaces/${DO_SPACES_BUCKET}/backups/ircd.db" > /dev/null 2>&1 && \
    echo "[backup] Database saved to Spaces" || \
    echo "[backup] Upload failed"
}

periodic_backup() {
  while true; do
    sleep "$BACKUP_INTERVAL"
    upload_db
  done
}

# ── Main ─────────────────────────────────────────────────────────────

if setup_mc; then
  HAS_SPACES=true
  restore_db
fi

if [ "$HAS_SPACES" = true ]; then
  periodic_backup &
fi

# Graceful shutdown: let Ergo flush, then upload final state
cleanup() {
  echo "[backup] Shutting down..."
  kill -TERM "$PID" 2>/dev/null
  wait "$PID" 2>/dev/null
  if [ "$HAS_SPACES" = true ]; then
    upload_db
  fi
  exit 0
}
trap cleanup TERM INT

# Start Ergo in the foreground
/ircd/ergo run --conf /ircd/ircd.yaml &
PID=$!
wait "$PID"
