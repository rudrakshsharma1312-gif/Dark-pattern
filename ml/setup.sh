#!/usr/bin/env bash
# DarkGuard AI — ML environment setup
# Run once from the repo root: bash ml/setup.sh
set -e

VENV_DIR="ml/.venv"

echo "=== DarkGuard ML setup ==="

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment at $VENV_DIR ..."
  python3 -m venv "$VENV_DIR"
fi

echo "Installing dependencies ..."
"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet -r ml/requirements.txt

echo ""
echo "Setup complete. Activate with:"
echo "  source ml/.venv/bin/activate"
echo ""
echo "Then run the pipeline:"
echo "  python3 ml/train.py"

