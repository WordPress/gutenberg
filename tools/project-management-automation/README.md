# Gutenberg project management automation

This is a [GitHub Action](https://help.github.com/en/categories/automating-your-workflow-with-github-actions) which contains various automation to assist with managing the Gutenberg GitHub repository:

- [First Time Contributor Label](https://github.com/WordPress/gutenberg/tree/HEAD/tools/project-management-automation/src/tasks/first-time-contributor-label): Adds the "First Time Contributor" label to pull requests opened by contributors that have not previously made a contribution.
- [First Time Contributor Account Link](https://github.com/WordPress/gutenberg/tree/HEAD/tools/project-management-automation/src/tasks/first-time-contributor-account-link): Prompts the user to link their GitHub account to their WordPress.org profile if necessary for release notes credit.
- [Add Milestone](https://github.com/WordPress/gutenberg/tree/HEAD/tools/project-management-automation/src/tasks/add-milestone): Assigns the plugin release milestone to a pull request once it is merged.
- [Assign Fixed Issues](https://github.com/WordPress/gutenberg/tree/HEAD/tools/project-management-automation/src/tasks/assign-fixed-issues): Adds assignee for issues which are marked to be "Fixed" by a pull request, and adds the "In Progress" label.

## Usage

The `pull-request-automation` workflow runs it after installing the dependencies:

```yaml
- uses: ./tools/project-management-automation
  with:
      github_token: ${{ secrets.GITHUB_TOKEN }}
```

It runs straight from the TypeScript sources: the `node24` runtime strips the types on the fly, so there is no build step. Relative imports must carry their `.ts` extension, and the syntax must be erasable.

## API

### Inputs

- `github_token`: Required. GitHub API token to use for making API requests. This should be stored as a secret in the GitHub repository.

### Outputs

Each is empty unless the event it belongs to produced it, so a consumer should check before using one.

- `welcome-prompt`: Message welcoming a first-time contributor. Set when a pull request is opened by someone whose first it is.
- `first-time-contributor-prompt`: Message asking a first-time contributor to link their WordPress.org profile. Set on a push that merged their first pull request, and only when no profile was found for them.
- `first-time-contributor-pr-number`: Pull request the account link prompt belongs to. Set alongside `first-time-contributor-prompt`, since a push payload carries no pull request number of its own.
