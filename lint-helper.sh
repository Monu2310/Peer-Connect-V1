#!/bin/bash

# Script to help fix ESLint issues in the PeerConnect codebase

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}PeerConnect Linting Helper${NC}"
echo -e "${YELLOW}=========================${NC}"

# Check if we're in the project root
if [ ! -d "./client" ] || [ ! -d "./server" ]; then
  echo -e "${RED}Error: This script must be run from the project root directory.${NC}"
  exit 1
fi

function lint_client() {
  echo -e "${YELLOW}Running ESLint on client code...${NC}"
  cd client
  npm run lint
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Client code linting successful!${NC}"
  else
    echo -e "${RED}Client code has linting issues.${NC}"
    echo -e "${YELLOW}Would you like to attempt automatic fixes? (y/n)${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}Attempting to fix client linting issues...${NC}"
      npm run lint:fix
      echo -e "${GREEN}Automatic fixing complete. Please check the remaining issues manually.${NC}"
    fi
  fi
  cd ..
}

function lint_server() {
  echo -e "${YELLOW}Running ESLint on server code...${NC}"
  cd server
  npm run lint
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Server code linting successful!${NC}"
  else
    echo -e "${RED}Server code has linting issues.${NC}"
    echo -e "${YELLOW}Would you like to attempt automatic fixes? (y/n)${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}Attempting to fix server linting issues...${NC}"
      npm run lint:fix
      echo -e "${GREEN}Automatic fixing complete. Please check the remaining issues manually.${NC}"
    fi
  fi
  cd ..
}

# Main menu
echo "Select an option:"
echo "1) Lint client code"
echo "2) Lint server code"
echo "3) Lint both client and server"
echo "4) Exit"

read -n 1 -r
echo

case $REPLY in
  1) lint_client ;;
  2) lint_server ;;
  3) 
    lint_client
    echo
    lint_server
    ;;
  *) 
    echo -e "${YELLOW}Exiting linting helper.${NC}"
    exit 0
    ;;
esac

echo -e "${GREEN}Linting check complete.${NC}"