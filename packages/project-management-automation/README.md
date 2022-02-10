# Gutenberg project management automation

This is a [GitHub Action](https://help.github.com/en/categories/automating-your-workflow-with-github-actions) which contains various automation to assist with managing the Gutenberg GitHub repository:

-   [First Time Contributor](https://github.com/WordPress/gutenberg/tree/HEAD/packages/project-management-automation/lib/tasks/first-time-contributor): Adds the "First Time Contributor" label to pull requests merged on behalf of contributors that have not previously made a contribution, and prompts the user to link their GitHub account to their WordPress.org profile if necessary for release notes credit.
-   [Add Milestone](https://github.com/WordPress/gutenberg/tree/HEAD/packages/project-management-automation/lib/tasks/add-milestone): Assigns the plugin release milestone to a pull request once it is merged.
-   [Assign Fixed Issues](https://github.com/WordPress/gutenberg/tree/HEAD/packages/project-management-automation/lib/tasks/assign-fixed-issues): Adds assignee for issues which are marked to be "Fixed" by a pull request, and adds the "In Progress" label.

# Installation and usage

To use the action, include it in your workflow configuration file:

```yaml
on: pull_request
jobs:
    pull-request-automation:
        runs-on: ubuntu-latest
        steps:
            - uses: WordPress/gutenberg/packages/project-management-automation@trunk
              with:
                  github_token: ${{ secrets.GITHUB_TOKEN }}
```

# API

## Inputs

-   `github_token`: Required. GitHub API token to use for making API requests. This should be stored as a secret in the GitHub repository.

## Outputs

_None._

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
