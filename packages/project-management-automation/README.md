# Gutenberg project management automation

This is a [GitHub Action](https://help.github.com/en/categories/automating-your-workflow-with-github-actions) which contains various automation to assist with managing the Gutenberg GitHub repository:

- `add-first-time-contributor-label`: Adds the 'First Time Contributor' label to PRs opened by contributors that have not yet made a commit.
- `add-milestone`: Assigns the correct milestone to PRs once merged.
- `assign-fixed-issues`: Assigns any issues 'fixed' by a newly opened PR to the author of that PR.

# Installation and usage

To use the action, include it in your workflow configuration file:

```yaml
on: pull_request
jobs:
  pull-request-automation:
    runs-on: ubuntu-latest
    steps:
      - uses: WordPress/gutenberg/packages/project-management-automation@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}

```

# API

## Inputs

- `github_token`: Required. GitHub API token to use for making API requests. This should be stored as a secret in the GitHub repository.

## Outputs

_None._

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
