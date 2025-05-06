# PeerConnect 1.0

A campus social network application that helps students connect with peers, join activities, and build communities.

## Technologies Used

- **Frontend**: React.js, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB
- **DevOps**: Docker, Jenkins
- **Code Quality**: ESLint

## Getting Started with Docker

### Prerequisites

- Docker and Docker Compose installed on your machine
- Git for version control

### Running the Application with Docker

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd PeerConnect1.0
   ```

2. Create a `.env` file in the server directory (use `.env.example` as a template)

3. Build and run the Docker containers:

   ```bash
   docker-compose up -d
   ```

4. Access the application:

   - Frontend: http://localhost
   - Backend API: http://localhost:5111

5. To stop the containers:
   ```bash
   docker-compose down
   ```

## Development Setup (Without Docker)

### Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)
- MongoDB instance

### Setup Instructions

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd PeerConnect1.0
   ```

2. Install dependencies for the client:

   ```bash
   cd client
   npm install --legacy-peer-deps
   ```

3. Install dependencies for the server:

   ```bash
   cd ../server
   npm install
   ```

4. Create a `.env` file in the server directory (use `.env.example` as a template)

5. Start the server:

   ```bash
   npm run dev
   ```

6. Start the client (in a different terminal):

   ```bash
   cd ../client
   npm start
   ```

7. Access the application at http://localhost:3000

## Using ESLint

### Client-side Linting

```bash
cd client
npm run lint        # Check for linting issues
npm run lint:fix    # Fix linting issues automatically
```

### Server-side Linting

```bash
cd server
npm run lint        # Check for linting issues
npm run lint:fix    # Fix linting issues automatically
```

## CI/CD with Jenkins

This project includes a Jenkinsfile for setting up a CI/CD pipeline. The pipeline includes the following stages:

1. **Checkout**: Fetch the latest code from the repository
2. **Install Dependencies**: Install npm packages for both client and server
3. **Lint**: Run ESLint on both client and server code
4. **Build**: Build the React application
5. **Test**: Run tests for both client and server
6. **Docker Build**: Build Docker images for all services
7. **Deploy**: Deploy the application using Docker Compose (only on the main branch)

### Setting up Jenkins

1. Install Jenkins and required plugins:

   - NodeJS Plugin
   - Docker Pipeline Plugin
   - BlueOcean (recommended for better UI)

2. Configure Jenkins with the necessary tools:

   - NodeJS installation
   - Docker and Docker Compose

3. Create a new Pipeline job in Jenkins that uses the Jenkinsfile from the repository

## Project Structure

- `client/`: React frontend application
- `server/`: Node.js backend API
- `docker-compose.yml`: Docker Compose configuration
- `Jenkinsfile`: Jenkins pipeline configuration
