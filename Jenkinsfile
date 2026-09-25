// BookNest's pipeline, versioned with the code (Chapter 5)
pipeline {
  agent { label 'linux' }
  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 15, unit: 'MINUTES')
  }
  stages {
    stage('Inspect') {
      steps {
        sh 'echo "Building $BRANCH_NAME at $(git rev-parse --short HEAD)"'
        sh 'test "$(grep -c \'"title"\' db/seed.json)" -eq 6'
      }
    }
  }
}
