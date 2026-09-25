// BookNest's pipeline, versioned with the code (Chapter 5)
@Library('booknest-lib@v1.1.0') _

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
        seedCheck()
        echo "Image tag: ${imageTag()}"
      }
    }
  }
}
