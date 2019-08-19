# Gutenberg pull request automation

This is a [GitHub Action](https://help.github.com/en/categories/automating-your-workflow-with-github-actions) which contains various automation to assist with managing pull requests in the Gutenberg GitHub repository:

- `add-first-time-contributor-label`: Adds the 'First Time Contributor' label to PRs opened by contributors that have not yet made a commit.
- `add-milestone`: Assigns the correct milestone to PRs once merged.
- `assign-fixed-issues`: Assigns any issues 'fixed' by the PR to the author of the PR.

# Installation and usage

To use the action, include it in your workflow configuration file:

```yaml
jobs:
  pull-request-automation:
    runs-on: ubuntu-latest
    steps:
      - uses: WordPress/gutenberg/packages/pull-request-automation@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}

```

# API

## Inputs

- `github_token`: Required. GitHub API token to use for making API requests. This should be passed to the action via a secret.

## Outputs

_None._

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
