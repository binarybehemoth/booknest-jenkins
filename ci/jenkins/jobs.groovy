// Job DSL: one multibranch job per BookNest repository
['booknest-jenkins', 'booknest-jenkins-lib'].each { repo ->
  multibranchPipelineJob(repo) {
    displayName("BookNest (${repo})")
    branchSources {
      branchSource {
        source {
          github {
            id(repo)
            repoOwner('binarybehemoth')
            repository(repo)
            repositoryUrl("https://github.com/binarybehemoth/${repo}")
            configuredByUrl(false)
            credentialsId('github-booknest')
            traits {
              gitHubBranchDiscovery { strategyId(1) }
              gitHubPullRequestDiscovery { strategyId(1) }
            }
          }
        }
      }
    }
    orphanedItemStrategy {
      discardOldItems { daysToKeep(7); numToKeep(5) }
    }
    triggers { periodicFolderTrigger { interval('4h') } }
  }
}
