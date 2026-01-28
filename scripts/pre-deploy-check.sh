#!/usr/bin/env bash
#
# Standardized Pre-Deployment Check Script
# Part of @pharma/infraconfig library
#
# Usage: ./pre-deploy-check.sh
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
COMPONENT_NAME="${COMPONENT_NAME:-$(basename "$PROJECT_ROOT")}"

echo -e "${BLUE}========================================================================"
echo "Pre-Deployment Validation: $COMPONENT_NAME"
echo "Powered by @pharma/infraconfig"
echo -e "========================================================================${NC}"
echo

# Step 1: Validate Node.js version
echo -e "${BLUE}[1/6]${NC} Checking Node.js version..."
REQUIRED_NODE_VERSION=20
CURRENT_NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$CURRENT_NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
    echo -e "${RED}✗${NC} Node.js version must be >= ${REQUIRED_NODE_VERSION} (current: ${CURRENT_NODE_VERSION})"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js version OK (${CURRENT_NODE_VERSION})"
echo

# Step 2: Install dependencies if needed
echo -e "${BLUE}[2/6]${NC} Checking dependencies..."
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo "Installing dependencies..."
    (cd "$PROJECT_ROOT" && npm ci --no-audit --no-fund)
fi
echo -e "${GREEN}✓${NC} Dependencies OK"
echo

# Step 3: Clean and build
echo -e "${BLUE}[3/6]${NC} Building project..."
rm -rf "$PROJECT_ROOT/dist"
if ! (cd "$PROJECT_ROOT" && npm run build); then
    echo
    echo -e "${RED}========================================================================${NC}"
    echo -e "${RED}TYPESCRIPT COMPILATION FAILED${NC}"
    echo -e "${RED}========================================================================${NC}"
    echo
    echo -e "${YELLOW}Fix the TypeScript errors above before deploying.${NC}"
    echo
    exit 1
fi
echo -e "${GREEN}✓${NC} Build successful"
echo

# Step 4: Run linter (optional)
echo -e "${BLUE}[4/6]${NC} Running linter..."
if (cd "$PROJECT_ROOT" && npm run lint 2>/dev/null); then
    echo -e "${GREEN}✓${NC} Linting passed"
else
    echo -e "${YELLOW}⚠${NC} Linting skipped or failed (non-blocking)"
fi
echo

# Step 5: Run tests
echo -e "${BLUE}[5/6]${NC} Running tests..."
if ! (cd "$PROJECT_ROOT" && npm test); then
    echo
    echo -e "${RED}========================================================================${NC}"
    echo -e "${RED}TESTS FAILED${NC}"
    echo -e "${RED}========================================================================${NC}"
    echo
    echo -e "${YELLOW}Fix the test failures above before deploying.${NC}"
    echo
    exit 1
fi
echo -e "${GREEN}✓${NC} All tests passed"
echo

# Step 6: Validate Docker configuration
echo -e "${BLUE}[6/6]${NC} Validating Docker setup..."
DOCKER_FILE=""
if [ -f "$PROJECT_ROOT/Dockerfile" ]; then
    DOCKER_FILE="$PROJECT_ROOT/Dockerfile"
elif [ -f "$PROJECT_ROOT/docker/Dockerfile" ]; then
    DOCKER_FILE="$PROJECT_ROOT/docker/Dockerfile"
fi

if [ -n "$DOCKER_FILE" ]; then
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ] || [ -f "$PROJECT_ROOT/docker-compose.yaml" ]; then
        echo -e "${GREEN}✓${NC} Docker configuration found"
    else
        echo -e "${YELLOW}⚠${NC} Dockerfile found but no docker-compose.yml"
    fi
else
    echo -e "${YELLOW}⚠${NC} No Dockerfile found"
fi
echo

# Success
echo -e "${GREEN}========================================================================"
echo "✓ PRE-DEPLOYMENT VALIDATION PASSED: $COMPONENT_NAME"
echo "========================================================================${NC}"
echo
echo "Ready to deploy. Next steps:"
echo "  1. Ensure infra-config.json is available"
echo "  2. Run: ./deploy.sh [path/to/infra-config.json]"
echo
