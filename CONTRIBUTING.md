# Contributing

## Workflow

A good workflow is to work directly in this repo, branch off `master`, and submit your changes as a pull request.

Ideally name your branches with prefixes and descriptions, like this: `[type]/[change]`. A good prefix would be:

- `add/` = add a new feature
- `try/` = experimental feature, "tentatively add"
- `update/` = update an existing feature

For example, `add/foo-module` means you're working on adding a new foo module.

You can pick among all the <a href="https://github.com/WordPress/packages/issues">tickets</a>, or some of the ones labelled <a href="https://github.com/WordPress/packages/labels/Good%20First%20Task">Good First Task</a>.


## Releasing

This repository uses [lerna](https://lernajs.io) to manage and release the packages. Lerna automatically releases all the outdated packages. To check which packages are outdated and will be released, type `lerna updated`.

### Development release

Run the following command to release a dev version of the outdated packages:

```bash
npm run publish:dev
```

Lerna will ask you which version number you want to choose for each package. For a `dev` release, you'll more likely want to choose the "prerelease" option. Repeat the same for all the outdated packages and confirm your version updates.

Lerna will then publish to `npm`, commit the `package.json` changes and create the git tags.

### Production release

To release a production version for the outdated packages, run the following command

```bash
npm run publish:prod
```

Choose the correct version (minor, major or patch) and confirm your choices and let Lerna do its magic.
