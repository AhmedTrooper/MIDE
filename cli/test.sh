#!/bin/bash
# Test script for MIDE CLI functionality

echo "🧪 Testing MIDE CLI Installation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

test_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $1"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $1"
        ((FAILED++))
    fi
}

# Test 1: Check if mide command exists
echo "Test 1: Checking if 'mide' command exists..."
command -v mide &> /dev/null
test_result "mide command found in PATH"
echo ""

# Test 2: Check if CLI script is executable
echo "Test 2: Checking if CLI script is executable..."
[ -x "$(command -v mide)" ]
test_result "mide script is executable"
echo ""

# Test 3: Check symlink
echo "Test 3: Checking symlink..."
if [ -L "$HOME/.local/bin/mide" ] || [ -L "/usr/local/bin/mide" ]; then
    test_result "mide symlink exists"
else
    false
    test_result "mide symlink exists"
fi
echo ""

# Test 4: Check if script can find MIDE executable
echo "Test 4: Checking if MIDE executable exists..."
DEV_EXEC="$HOME/ProgrammingFiles/Professional/MIDE/src-tauri/target/debug/app"
REL_EXEC="$HOME/ProgrammingFiles/Professional/MIDE/src-tauri/target/release/app"
if [ -f "$DEV_EXEC" ] || [ -f "$REL_EXEC" ]; then
    test_result "MIDE executable found"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: MIDE executable not found"
    echo "   Run 'npm run tauri dev' or 'npm run tauri build' first"
    ((FAILED++))
fi
echo ""

# Test 5: Create and test with temporary directory
echo "Test 5: Testing path resolution with temp directory..."
TEST_DIR="/tmp/mide-cli-test-$$"
mkdir -p "$TEST_DIR"
if [ -d "$TEST_DIR" ]; then
    test_result "Test directory created"
    rm -rf "$TEST_DIR"
else
    false
    test_result "Test directory created"
fi
echo ""

# Test 6: Check PATH configuration
echo "Test 6: Checking PATH configuration..."
if echo "$PATH" | grep -q "$HOME/.local/bin" || echo "$PATH" | grep -q "/usr/local/bin"; then
    test_result "PATH includes CLI directory"
else
    echo -e "${YELLOW}⚠ WARNING${NC}: ~/.local/bin not in PATH"
    echo "   Add 'export PATH=\"\$HOME/.local/bin:\$PATH\"' to ~/.bashrc"
    ((FAILED++))
fi
echo ""

# Summary
echo "═══════════════════════════════════════════"
echo "           Test Results Summary"
echo "═══════════════════════════════════════════"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo "═══════════════════════════════════════════"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "You can now use MIDE CLI:"
    echo "  $ mide ."
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed or warnings present${NC}"
    echo ""
    echo "To fix:"
    echo "  1. Run: cd ~/ProgrammingFiles/Professional/MIDE/cli && ./install.sh"
    echo "  2. Build MIDE: npm run tauri dev"
    echo "  3. Check your PATH includes ~/.local/bin"
    echo ""
    exit 1
fi
