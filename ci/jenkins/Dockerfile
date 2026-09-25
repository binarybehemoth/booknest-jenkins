# BookNest's Jenkins controller: pinned core and plugins; configuration comes from casc.yaml
FROM jenkins/jenkins:2.568.3-lts-jdk21
ENV JAVA_OPTS=-Djenkins.install.runSetupWizard=false \
    CASC_JENKINS_CONFIG=/var/jenkins_conf/casc.yaml
COPY --chown=jenkins:jenkins plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
