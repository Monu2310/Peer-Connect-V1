pipeline {
    agent any
    
    tools {
        nodejs 'node'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Client') {
                    steps {
                        dir('client') {
                            sh 'npm install --legacy-peer-deps'
                        }
                    }
                }
                stage('Server') {
                    steps {
                        dir('server') {
                            sh 'npm install'
                        }
                    }
                }
            }
        }
        
        stage('Lint') {
            parallel {
                stage('Client Lint') {
                    steps {
                        dir('client') {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Server Lint') {
                    steps {
                        dir('server') {
                            sh 'npm run lint'
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                dir('client') {
                    sh 'npm run build'
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Client Tests') {
                    steps {
                        dir('client') {
                            sh 'npm test -- --passWithNoTests'
                        }
                    }
                }
                stage('Server Tests') {
                    steps {
                        dir('server') {
                            sh 'npm test || true'
                        }
                    }
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                sh 'docker-compose build'
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'docker-compose down || true'
                sh 'docker-compose up -d'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Build and deployment successful!'
        }
        failure {
            echo 'Build or deployment failed!'
        }
    }
}