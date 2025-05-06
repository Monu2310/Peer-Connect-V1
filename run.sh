#!/bin/bash

# Script to manage PeerConnect application deployment using Docker

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_header() {
  echo -e "${YELLOW}=====================================================${NC}"
  echo -e "${YELLOW}              PeerConnect Docker Manager             ${NC}"
  echo -e "${YELLOW}=====================================================${NC}"
  echo ""
}

check_prerequisites() {
  echo -e "${YELLOW}Checking prerequisites...${NC}"
  
  # Check if Docker is installed
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
  fi
  
  # Check if Docker Compose is installed
  if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}All prerequisites are installed!${NC}"
}

start_application() {
  echo -e "${YELLOW}Starting PeerConnect application...${NC}"
  
  # Build and start containers in detached mode
  docker-compose up -d --build
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}PeerConnect application started successfully!${NC}"
    echo -e "${GREEN}Frontend: http://localhost${NC}"
    echo -e "${GREEN}Backend API: http://localhost:5111${NC}"
  else
    echo -e "${RED}Failed to start the application. Please check the logs using:${NC}"
    echo -e "${RED}docker-compose logs${NC}"
  fi
}

stop_application() {
  echo -e "${YELLOW}Stopping PeerConnect application...${NC}"
  
  # Stop and remove containers
  docker-compose down
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}PeerConnect application stopped successfully!${NC}"
  else
    echo -e "${RED}Failed to stop the application.${NC}"
  fi
}

view_logs() {
  echo -e "${YELLOW}Showing logs...${NC}"
  docker-compose logs -f
}

display_help() {
  echo "Usage: ./run.sh [command]"
  echo ""
  echo "Commands:"
  echo "  start       Start the PeerConnect application"
  echo "  stop        Stop the PeerConnect application"
  echo "  restart     Restart the PeerConnect application"
  echo "  logs        View the application logs"
  echo "  help        Display this help message"
  echo ""
}

# Main script execution
print_header
check_prerequisites

# Process command line arguments
case "$1" in
  start)
    start_application
    ;;
  stop)
    stop_application
    ;;
  restart)
    stop_application
    start_application
    ;;
  logs)
    view_logs
    ;;
  help|*)
    display_help
    ;;
esac