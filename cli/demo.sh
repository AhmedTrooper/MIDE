#!/bin/bash
# Quick demo of MIDE CLI functionality

echo "======================================"
echo "   MIDE CLI Demo"
echo "======================================"
echo ""

# Check if mide is installed
if ! command -v mide &> /dev/null; then
    echo "❌ MIDE CLI not found. Installing..."
    cd "$(dirname "$0")" && ./install.sh
    echo ""
fi

# Create a demo project
DEMO_DIR="/tmp/mide-demo-$(date +%s)"
echo "📁 Creating demo project at: $DEMO_DIR"
mkdir -p "$DEMO_DIR"

cat > "$DEMO_DIR/README.md" << 'EOF'
# MIDE Demo Project

Welcome to MIDE!

This project was opened using the CLI command.
EOF

cat > "$DEMO_DIR/hello.js" << 'EOF'
// Welcome to MIDE!
console.log("Hello from MIDE Editor!");

function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("Developer"));
EOF

cat > "$DEMO_DIR/styles.css" << 'EOF'
/* MIDE Demo Styles */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #1e1e1e;
  color: #d4d4d4;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}
EOF

echo "✓ Demo project created!"
echo ""
echo "Demo files:"
ls -1 "$DEMO_DIR"
echo ""
echo "======================================"
echo "   Usage Examples"
echo "======================================"
echo ""
echo "1. Open current directory:"
echo "   $ cd /your/project"
echo "   $ mide ."
echo ""
echo "2. Open specific directory:"
echo "   $ mide /path/to/project"
echo ""
echo "3. Open parent directory:"
echo "   $ mide .."
echo ""
echo "======================================"
echo ""
echo "🚀 Now opening demo project with MIDE..."
echo ""

# Open the demo project
mide "$DEMO_DIR"

echo "✓ MIDE launched with demo project!"
echo ""
echo "Tip: You can delete the demo project later:"
echo "  rm -rf $DEMO_DIR"
echo ""
