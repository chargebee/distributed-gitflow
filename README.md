## Distributed Git Flow - GitHub Action

A GitHub action implementation to support [Distributed Git Flow](docs/distributed-gitflow.md). 

This action automatically raises the PRs to sync the upstream branch changes with the corresponding downstream branches. It will take care of merging this PR without any manual intervention if there is no merge conflict. In case of any merge conflicts, it notifies the respective squad via Slack. It also reports the squads on PR create and merge.