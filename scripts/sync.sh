#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -eq 0 ]]; then
  read -r -p "运行模式：[D] dry-run（预演）/ [r] 正式写入，直接回车默认 dry-run: " mode
  case "$(echo "$mode" | tr '[:upper:]' '[:lower:]')" in
    r|run|real) exec node "$SCRIPT_DIR/sync.js" ;;
    *)          exec node "$SCRIPT_DIR/sync.js" --dry ;;
  esac
fi

exec node "$SCRIPT_DIR/sync.js" "$@"
