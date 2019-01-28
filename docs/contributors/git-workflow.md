# Git Workflow

## Keeping Your Branch Up To Date

When many different people are working on a project simultaneously, pull requests can go stale quickly. A "stale" pull request is one that is no longer up to date with the main line of development, and it needs to be updated before it can be merged into the project.

While it is tempting to merge from `master` into your branch frequently, this leads to a messy history because each merge creates a merge commit. When working by yourself, it is best to use `git pull --rebase master`, but if you're pushing to a shared repo, it is best to not do any merging or rebasing until the feature is ready for testing, and then do a [rebase](https://github.com/edx/edx-platform/wiki/How-to-Rebase-a-Pull-Request) at the very end. This is one reason why it is important to open pull requests whenever you have working code.

If you have a Pull Request branch that cannot be merged into `master` due to a conflict (this can happen for long-running Pull Request discussions), it's still best to rebase the branch (rather than merge) and resolve any conflicts on your local copy. 

Once you have resolved any conflicts locally you can update the Pull Request with `git push --force-with-lease`. 

This is how you can bring your branch up to date with the latest changes from `master` branch:

```sh
git fetch
git rebase origin/master
git push --force-with-lease -u origin you-branch-name
```
