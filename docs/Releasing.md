# Making a release

The `bundle` directory contains the production version of the project's Javascript. This is what the WordPress apps use to avoid having to build Gutenberg.

You can rebuild those files at any time by running

```
yarn bundle
```

This is useful in case you want to test some changes in the apps before pushing a new version.

The recommended method is that you bump the version when you do that. To publish a new version of gutenberg-mobile you just need to run:

```
yarn version [--patch|--minor|--major]
```

If you don't specify any arguments, it will ask for a specific version string, but the simplest method for most cases is to use `--patch`. This command will take care of:

- Bumping the version in `package.json`
- Running `yarn bundle` and adding the changed files to the commit
- Creating a commit with these changes
- Creating a `vX.Y.Z` tag pointing to this commit

After checking that everything looks good, you just need to push the changes:

```
git push --tags
```