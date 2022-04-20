## Distributed Git Flow - GitHub Action

A GitHub action implementation to support [Distributed Git Flow](docs/distributed-gitflow.md). 

This action automatically raises the PRs to sync the upstream branch changes with the corresponding downstream branches. It will take care of merging this PR without any 
manual intervention if there is no merge conflict. In case of any merge conflicts, it notifies the respective squad via Slack. It also reports the squads on PR create and merge.

## GitHub Action Configuration

To configure this action on a GitHub repository, you need two secrets

* `GH_APP_CREDENTIALS_TOKEN` - A GitHub Action Credentials token that can be obtained by following [this tutorial](https://dev.to/dtinth/authenticating-as-a-github-app-in-a-github-actions-workflow-27co). This GitHub App requires the following permissions
  - Contents - Read & Write
  - Metadata - Read Only
  - Pull Requests - Read & Write

* `SLACK_BOT_TOKEN` - A Slack Bot Token, that can be obtained by creating a new app in your slack workspace with the [chat:write](https://api.slack.com/scopes/chat:write) OAuth Permission. After creating the slack app, make sure you are creating the required squad's slack channels in your slack workspace and add this newly created slack app to those channels. For example, if you have two squads, `mantis` and `viper`, then you need the following channels
  - `master` - To notify the PR open/close changes on the `master` branch
  - `staging-mantis` - To notify the PR open/close changes and merge conflicts on the `staging/mantis` branch
  - `develop-mantis` - To notify the PR open/close changes and merge conflicts on the `develop/mantis` branch
  - `staging-viper` - To notify the PR open/close changes and merge conflicts on the `staging/viper` branch
  - `develop-viper` - To notify the PR open/close changes and merge conflicts on the `develop/viper` branch

```yaml
# .github/workflows/pr.yml
name: On PR Status Change
on:
  pull_request:
      types:
        - opened
        - closed
      branches:  
        - master  
        - 'staging/**'
        - 'develop/**'
# env:
#   SLACK_CHANNEL_PREFIX: test  <- an optional prefix for the slack channel names. Eg. test-staging-mantis, test-develop-viper
jobs:
  prStatusChange:
    runs-on: ubuntu-latest
    steps:
      - name: Obtain GitHub App Installation Access Token
        id: githubAppAuth
        run: |
          TOKEN="$(npx obtain-github-app-installation-access-token ci ${{ secrets.GH_APP_CREDENTIALS_TOKEN }})"
          echo "::set-output name=GH_APP_TOKEN::$TOKEN"
      - uses: chargebee/distributed-gitflow@master
        env:
          GITHUB_TOKEN: ${{ steps.githubAppAuth.outputs.GH_APP_TOKEN }}
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

## What it does

After successful configuration of this GitHub action as mentioned above, it will take care of automating all the manual work needed in keeping all the *protected branches* in sync as mentioned in the [Distributed Git Flow](docs/distributed-gitflow.md) document.

### Adding Labels To PR
- Upon PR creation, it creates a `label` on the PR with the name of the `base` (`from`) branch. It will enable to filter the PRs based on the labels.  

### On PR merge to master
- Upon merging a PR to `master`, it will create a PR to all the squad's staging branch `staging/{squad_name}`
- if a PR already exists, it won't create any new PR
- Notifies on slack's `master` channel

### On PR merge to staging/{squad_name}
- Upon merging a PR to `staging/{squad_name}`, it will create a PR to the corresponding squad's develop branch `develop/{squad_name}`
- if a PR already exists, it won't create any new PR
- Notifies on slack's `staging/{squad_name}` channel
- if the PR is not from the `master` or the `develop/{squad_name}` branch, the `base` (`from`) branch will be deleted.

### On PR merge to develop/{squad_name}
- Notifies on slack's `develop/{squad_name}` channel
- - if the PR is not from the `staging/{squad_name}` branch, the `base` (`from`) branch will be deleted.

### On PR create to staging/{squad_name}
- Notifies on slack's `staging/{squad_name}` channel
- If the PR is from the `master` branch, it will be automatically merged. In case of merge conflicts, the PR will be closed and notifies about the merge conflict on the `staging/{squad_name}` channel

### On PR create to develop/{squad_name}
- Notifies on slack's `develop/{squad_name}` channel
- If the PR is from the corresponding `staging` branch, it will be automatically merged. In case of merge conflicts, the PR will be closed and notifies about the merge conflict on the `develop/{squad_name}` channel


## How to make changes and deploy
1. create a new branch
2. make the required changes and build the package using the `npm run release` command.
3. raise a PR to the `master` branch
4. After the PR merge, the updated GitHub action can be a accessed from `chargebee/distributed-gitflow@master` 