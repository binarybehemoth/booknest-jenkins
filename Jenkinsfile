// BookNest's pipeline, versioned with the code (Chapter 5)
@Library('booknest-lib@v1.2.0') _

pipeline {
  agent { label 'docker' }
  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 15, unit: 'MINUTES')
  }
  environment {
    REGISTRY = 'localhost:32550'
    IMAGE = "${REGISTRY}/booknest-api"
    DB_PORT = '0'                                  // Compose picks a free host port
    CHAT_WEBHOOK_URL = 'http://l2-hook:8080/booknest'
  }
  stages {
    stage('Inspect') {
      steps {
        sh 'echo "Building $BRANCH_NAME at $(git rev-parse --short HEAD)"'
        seedCheck()
        script {
          env.TAG = imageTag()
          env.COMPOSE_PROJECT_NAME = "l2-ci-${env.TAG}"
        }
      }
    }
    stage('Test') {
      steps {
        sh 'mkdir -p test-results'
        sh '''docker compose --profile test run --rm --build \
                -e NPM_CONFIG_UPDATE_NOTIFIER=false \
                -v "$WORKSPACE/test-results:/app/test-results" test npm run test:ci'''
      }
      post {
        always {
          junit 'test-results/*.xml'
          sh 'docker compose --profile test down -v --rmi local'
        }
      }
    }
    stage('Build image') {
      steps {
        sh 'docker build --target runtime -t "$IMAGE:$TAG" .'
      }
    }
    stage('Push') {
      when { branch 'main' }
      steps {
        script {
          docker.withRegistry("http://${env.REGISTRY}", 'l2-registry') {
            def image = docker.image("${env.IMAGE}:${env.TAG}")
            image.push()
            image.push('main')
          }
        }
        sh 'docker image inspect -f "{{index .RepoDigests 0}}" "$IMAGE:$TAG" > image.txt'
        archiveArtifacts artifacts: 'image.txt', fingerprint: true
      }
    }
  }
  post {
    always {
      sh 'docker image rm -f "$IMAGE:$TAG" "$IMAGE:main" || true'
    }
    unsuccessful { notifyTeam() }
    fixed { notifyTeam() }
  }
}
