#!/usr/bin/env bash

# SkillForge Setup & Diagnostics Engine
# Automates local setups, dependency verification, config seeding, and container deployment.

set -e

# Terminal Colors for Professional Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}================================================================${NC}"
echo -e "${CYAN}                🛠️  SKILLFORGE PLATFORM AUTO-SETUP ${NC}"
echo -e "${PURPLE}================================================================${NC}"

# Helper function to print logs
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}
log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}
log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}
log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# --- STEP 1: Prerequisite Checker ---
log_info "Verifying dependencies and environment..."

check_cmd() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Dependency '$1' is missing. Please install it before running this script."
        exit 1
    fi
}

check_cmd "node"
check_cmd "npm"
check_cmd "docker"
check_cmd "docker-compose"
check_cmd "python3"
check_cmd "pip3"

log_success "All build tools verified."

# --- STEP 2: Configure Environment Variables ---
log_info "Synchronizing environment configurations..."

# Create root-level .env if missing (used by Docker Compose)
if [ ! -f .env ]; then
    log_warn "Root-level .env not found. Creating a default one..."
    cat <<EOT > .env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=supersecretjwtsecretkeyskillforge2026
EOT
    log_success "Created default root .env. Please update it with valid API Keys later."
else
    log_success "Root .env file is present."
fi

# Sync backend .env
if [ ! -f backend/.env ]; then
    log_warn "Backend .env not found. Copying from example template..."
    cp backend/.env.example backend/.env
    # Update default configurations for local execution
    sed -i 's/localhost/127.0.0.1/g' backend/.env || true
    log_success "Created backend/.env"
else
    log_success "Backend .env is present."
fi

# Sync RAG-Service .env
if [ ! -f RAG-Service/.env ]; then
    log_warn "RAG-Service .env not found. Copying from example template..."
    cp RAG-Service/.env.example RAG-Service/.env
    sed -i 's/host:port/127.0.0.1:5432/g' RAG-Service/.env || true
    sed -i 's/user:password/postgres:postgres/g' RAG-Service/.env || true
    sed -i 's/database/loop_hack_db/g' RAG-Service/.env || true
    log_success "Created RAG-Service/.env"
else
    log_success "RAG-Service .env is present."
fi

# Sync Agent-Service .env
if [ ! -f Agent-Service/.env ]; then
    log_warn "Agent-Service .env not found. Copying from example template..."
    cp Agent-Service/.env.example Agent-Service/.env
    log_success "Created Agent-Service/.env"
else
    log_success "Agent-Service .env is present."
fi

# Sync Frontend .env.local
if [ ! -f frontend/.env.local ]; then
    log_warn "Frontend .env.local not found. Creating default local dev configs..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > frontend/.env.local
    log_success "Created frontend/.env.local"
else
    log_success "Frontend configs are present."
fi

# --- STEP 3: Install Package Dependencies ---
log_info "Installing package dependencies (this might take a few moments)..."

# Backend Dependencies
log_info "Installing backend dependencies..."
(cd backend && npm install --legacy-peer-deps --quiet)

# RAG-Service Dependencies
log_info "Installing RAG service dependencies..."
(cd RAG-Service && npm install --legacy-peer-deps --quiet)

# Frontend Dependencies
log_info "Installing frontend client dependencies..."
(cd frontend && npm install --legacy-peer-deps --quiet)

# Agent-Service Python virtual environment
log_info "Configuring Python virtual environment in Agent-Service..."
if [ ! -d Agent-Service/.venv ]; then
    python3 -m venv Agent-Service/.venv
fi
# Activate venv and install dependencies
source Agent-Service/.venv/bin/activate
pip install -r Agent-Service/requirements.txt --quiet
deactivate

log_success "Package dependencies successfully installed across all services."

# --- STEP 4: Orchestrate Containers via Docker Compose ---
log_info "Orchestrating containers via Docker Compose..."

# Prompt user for docker-compose start
read -p "Do you want to build and spin up the Docker containers now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    log_info "Spinning up SkillForge services..."
    docker-compose up --build -d
    log_success "Docker containers are building/running in the background!"
    log_info "Run 'docker-compose ps' to view running status or 'docker-compose logs -f' for logs."
else
    log_warn "Docker Compose startup skipped by user."
fi

echo -e "${PURPLE}================================================================${NC}"
echo -e "${GREEN}    🎉 SETUP COMPLETE! SKILLFORGE IS READY TO LAUNCH! ${NC}"
echo -e "${PURPLE}================================================================${NC}"
echo -e "You can launch services locally in separate terminals:"
echo -e "  - Frontend:  cd frontend && npm run dev (runs on http://localhost:3000)"
echo -e "  - Backend:   cd backend && npm run dev  (runs on http://localhost:5000)"
echo -e "  - RAG Service: cd RAG-Service && npm run dev (runs on http://localhost:5002)"
echo -e "  - Agent Service: cd Agent-Service && uvicorn app.main:app --reload --port 8000"
echo -e "${PURPLE}================================================================${NC}"
