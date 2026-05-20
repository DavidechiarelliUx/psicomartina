#!/usr/bin/env sh
set -eu

PROJECT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
/Library/PostgreSQL/17/bin/pg_ctl -D "$PROJECT_DIR/postgres-data" stop
