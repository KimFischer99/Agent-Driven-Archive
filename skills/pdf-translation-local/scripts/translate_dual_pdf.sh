#!/usr/bin/env bash
set -euo pipefail

BABELDOC_ROOT="${BABELDOC_ROOT:-}"
BABELDOC_RUNNER="${BABELDOC_RUNNER:-}"
MODEL_NAME="${OLLAMA_MODEL:-}"
OLLAMA_URL="${OLLAMA_URL:-}"

if [ -z "$BABELDOC_RUNNER" ] && [ -n "$BABELDOC_ROOT" ]; then
  BABELDOC_RUNNER="$BABELDOC_ROOT/run-translate.sh"
fi

ignore_cache=0
pdfs=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --ignore-cache)
      ignore_cache=1
      shift
      ;;
    -*)
      echo "Unsupported option: $1" >&2
      exit 2
      ;;
    *)
      pdfs+=("$1")
      shift
      ;;
  esac
done

if [ "${#pdfs[@]}" -eq 0 ]; then
  echo "Usage: $0 [--ignore-cache] file.pdf [more.pdf ...]" >&2
  exit 2
fi

if [ -z "$BABELDOC_RUNNER" ]; then
  echo "Set BABELDOC_RUNNER or BABELDOC_ROOT before running this script." >&2
  exit 1
fi

if [ ! -x "$BABELDOC_RUNNER" ]; then
  echo "Missing executable BabelDOC runner: $BABELDOC_RUNNER" >&2
  exit 1
fi

if [ -n "$MODEL_NAME" ]; then
  if [ -n "$OLLAMA_URL" ]; then
    if ! curl -fsS "$OLLAMA_URL" | grep -q "$MODEL_NAME"; then
      echo "Configured model not available: $MODEL_NAME" >&2
      echo "Check model endpoint with: curl -s $OLLAMA_URL" >&2
      exit 1
    fi
  fi
fi

for input in "${pdfs[@]}"; do
  if [ ! -f "$input" ]; then
    echo "Input file not found: $input" >&2
    exit 1
  fi

  case "$input" in
    *.pdf|*.PDF) ;;
    *)
      echo "Input is not a PDF: $input" >&2
      exit 1
      ;;
  esac

  input_dir="$(cd "$(dirname "$input")" && pwd -P)"
  input_name="$(basename "$input")"
  stem="${input_name%.[Pp][Dd][Ff]}"
  source_output="$input_dir/${stem}.no_watermark.zh-CN.dual.md"
  final_output="$input_dir/${stem}_dual.md"

  args=("$input_dir/$input_name" --output "$input_dir" --no-mono --body-only --hide-skipped --primary-font-family serif)
  if [ "$ignore_cache" -eq 1 ]; then
    args+=(--ignore-cache)
  fi

  start_epoch="$(date +%s)"
  "$BABELDOC_RUNNER" "${args[@]}"
  end_epoch="$(date +%s)"

  if [ ! -f "$source_output" ]; then
    echo "Expected BabelDOC output not found: $source_output" >&2
    exit 1
  fi

  mv -f "$source_output" "$final_output"
  echo "Output: $final_output"
  echo "Elapsed seconds: $((end_epoch - start_epoch))"
done
