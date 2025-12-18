#!/bin/bash
# Installation script for MIDE CLI

echo "Installing MIDE CLI..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_SCRIPT="$SCRIPT_DIR/mide"

# Make the CLI script executable
chmod +x "$CLI_SCRIPT"

# Check if user has permission to write to /usr/local/bin
if [ -w "/usr/local/bin" ]; then
    # Create symlink in /usr/local/bin
    ln -sf "$CLI_SCRIPT" /usr/local/bin/mide
    echo "✓ MIDE CLI installed successfully!"
    echo "You can now use 'mide .' to open directories"
else
    # Install to user's local bin
    mkdir -p "$HOME/.local/bin"
    ln -sf "$CLI_SCRIPT" "$HOME/.local/bin/mide"
    
    echo "✓ MIDE CLI installed to ~/.local/bin/mide"
    echo ""
    echo "Make sure ~/.local/bin is in your PATH."
    echo "Add this line to your ~/.bashrc or ~/.zshrc:"
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "Then reload your shell:"
    echo "  source ~/.bashrc  # or source ~/.zshrc"
fi

echo ""
echo "Usage:"
echo "  mide .           # Open current directory"
echo "  mide /path/to/dir  # Open specific directory"
echo ""
