# Git Workflow

This documentation is intended to help you get started using git with Gutenberg. Git is a powerful source code management tool; to learn git deeply, check out the [Pro Git book](https://git-scm.com/book/en/v2) available free online under CC BY-NC-SA 3.0 license.

If you are unfamiliar with using git, it is worthwhile to explore and play with it. Try out the [git tutorial](https://git-scm.com/docs/gittutorial) as well as the [git user manual](https://git-scm.com/docs/user-manual) for help getting started.

The Gutenberg project follows a standard pull request process for contributions. See GitHub's documentation for [additional details about pull requests](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests).

## Overview

An overview of the process for contributors is:

-   Fork the Gutenberg repository.
-   Clone the forked repository.
-   Create a new branch.
-   Make code changes.
-   Confirm tests pass.
-   Commit the code changes within the newly created branch.
-   Push the branch to the forked repository.
-   Submit a pull request to the Gutenberg repository.

See the [repository management document](/docs/contributors/repository-management.md) for additional information on how the Gutenberg project uses GitHub.

## Git Workflow Walkthrough

The workflow for code and documentation is the same, since both are managed in GitHub. You can watch a [video walk-through of contributing documentation](https://wordpress.tv/2020/09/02/marcus-kazmierczak-contribute-developer-documentation-to-gutenberg/) and the accompanying [slides for contributing to Gutenberg](https://mkaz.blog/wordpress/contribute-documentation-to-gutenberg/).

Here is a visual overview of the Git workflow:

![Visual Overview of Git Workflow](https://developer.wordpress.org/files/2020/09/git-workflow.png)

**Step 1**: Go to the Gutenberg repository on GitHub and click Fork. This creates a copy of the main Gutenberg repository to your account.

![Screenshot showing fork button on GitHub](https://developer.wordpress.org/files/2020/09/gutenberg-fork.png)

**Step 2**: Clone your forked repository locally. It is located at: `https://github.com/YOUR-USER-NAME/gutenberg`. Cloning copies all the files to your computer. Open a terminal and run:

```bash
git clone https://github.com/YOUR-USER-NAME/gutenberg
```

This will create a directory called `gutenberg` with all the files for the project. It might take a couple of minutes because it is downloading the entire history of the Gutenberg project.

**Step 3**: Create a branch for your change (see below for branch naming). For this example, the branch name is the complete string: `update/my-branch`

```bash
git switch -c update/my-branch
```

**Step 4**: Make the code changes. Build, confirm, and test your change thoroughly. See [coding guidelines](/docs/contributors/code/coding-guidelines.md) and [testing overview](/docs/contributors/code/testing-overview.md) for guidance.

**Step 5**: Commit your change with a [good commit message](https://make.wordpress.org/core/handbook/best-practices/commit-messages/). This will commit your change to your local copy of the repository.

```bash
git commit -m "Your Good Commit Message" path/to/FILE
```

**Step 6**: Push your change up to GitHub. The change will be pushed to your fork of the repository on the GitHub

```bash
git push -u origin update/my-branch
```

**Step 7**: Go to your forked repository on GitHub -- it will automatically detect the change and give you a link to create a pull request.

![Screenshot showing pull request link](https://developer.wordpress.org/files/2020/09/pull-request-create.png)

**Step 8**: Create the pull request. This will create the request on the WordPress Gutenberg repository to integrate the change from your forked repository.

**Step 9**: Keep up with new activity on the pull request. If any additional changes or updates are requested, then make the changes locally and push them up, following Steps 4-6.

Do not make a new pull request for updates; by pushing your change to your repository it will update the same PR. In this sense, the PR is a pointer on the WordPress Gutenberg repository to your copy. So when you update your copy, the PR is also updated.

That’s it! Once approved and merged, your change will be incorporated into the main repository. 🎉

## Branch Naming

You should name your branches using a prefixes and short description, like this: `[type]/[change]`.

Suggested prefixes:

-   `add/` = add a new feature
-   `try/` = experimental feature, "tentatively add"
-   `update/` = update an existing feature
-   `remove/` = remove an existing feature
-   `fix/` = fix an existing issue

For example, `add/gallery-block` means you're working on adding a new gallery block.

## Keeping Your Branch Up To Date

When many different people are working on a project simultaneously, pull requests can go stale quickly. A "stale" pull request is one that is no longer up to date with the main line of development, and it needs to be updated before it can be merged into the project.

There are two ways to do this: merging and rebasing. In Gutenberg, the recommendation is to rebase. Rebasing means rewriting your changes as if they're happening on top of the main line of development. This ensures the commit history is always clean and linear. Rebasing can be performed as many times as needed while you're working on a pull request. **Do share your work early on** by opening a pull request and keeping your history rebase as you progress.

The main line of development is known as the `trunk` branch. If you have a pull-request branch that cannot be merged into `trunk` due to a conflict (this can happen for long-running pull requests), then in the course of rebasing you'll have to manually resolve any conflicts in your local copy. Learn more in [section _Perform a rebase_](https://github.com/edx/edx-platform/wiki/How-to-Rebase-a-Pull-Request#perform-a-rebase) of _How to Rebase a Pull Request_.

Once you have resolved any conflicts locally you can update the pull request with `git push --force-with-lease`. Using the `--force-with-lease` parameter is important to guarantee that you don't accidentally overwrite someone else's work.

To sum it up, you need to fetch any new changes in the repository, rebase your branch on top of `trunk`, and push the result back to the repository. These are the corresponding commands:

```sh
git fetch
git rebase trunk
git push --force-with-lease origin your-branch-name
```

## Keeping Your Fork Up To Date

Working on pull request starts with forking the Gutenberg repository, your separate working copy. Which can easily go out of sync as new pull requests are merged into the main repository. Here your working repository is a `fork` and the main Gutenberg repository is `upstream`. When working on new pull request you should always update your fork before you do `git checkout -b my-new-branch` to work on a feature or fix.

You will need to add an `upstream` remote in order to keep your fork updated.

```sh
git remote add upstream https://github.com/WordPress/gutenberg.git
git remote -v
origin	git@github.com:your-account/gutenberg.git (fetch)
origin	git@github.com:your-account/gutenberg.git (push)
upstream	https://github.com/WordPress/gutenberg.git (fetch)
upstream	https://github.com/WordPress/gutenberg.git (push)
```

To sync your fork, you first need to fetch the upstream changes and merge them into your local copy:

```sh
git fetch upstream
git checkout trunk
git merge upstream/trunk
```

Once your local copy is updated, push your changes to update your fork on GitHub:

```
git push
```

The above commands will update your `trunk` branch from _upstream_. To update any other branch replace `trunk` with the respective branch name.

## Miscellaneous

### Git Archeology

When looking for a commit that introduced a specific change, it might be helpful to ignore revisions that only contain styling or formatting changes.

Fortunately, newer versions of `git` gained the ability to skip commits in history:

```
git blame --ignore-rev f63053cace3c02e284f00918e1854284c85b9132 -L 66,73 packages/api-fetch/src/middlewares/media-upload.js
```

All styling and formatting revisions are tracked using the `.git-blame-ignore-revs` file in the Gutenberg repository. You can use this file to ignore them all at once:

```
git blame --ignore-revs-file .git-blame-ignore-revs -L 66,73 packages/api-fetch/src/middlewares/media-upload.js
```
