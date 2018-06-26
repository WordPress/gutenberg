# Contributing

## Workflow

A good workflow is to work directly in this repo, branch off `master`, and submit your changes as a pull request.

Ideally name your branches with prefixes and descriptions, like this: `[type]/[change]`. A good prefix would be:

- `add/` = add a new feature
- `try/` = experimental feature, "tentatively add"
- `update/` = update an existing feature

For example, `add/foo-module` means you're working on adding a new foo module.

You can pick among all the <a href="https://github.com/WordPress/packages/issues">issues</a>, or some of the ones labelled <a href="https://github.com/WordPress/packages/labels/Good%20First%20Issue">Good First Issue</a>.

## Developing

Be sure to have [Node.js](https://nodejs.org/en/) installed first. You should be running a Node.js version matching the [current active LTS release](https://github.com/nodejs/Release#release-schedule) or newer. You can check this with `node -v`.

Make sure that npm is installed with version >= `5.0.0` using `npm -v`.

### Setup

```sh
$ git clone https://github.com/WordPress/packages.git
$ cd packages
$ npm install
```

### Testing

In order to run the tests:

```sh
$ npm test

# If you want to watch for changes
$ npm run test:watch

# If you want to check code coverage
$ npm run test:coverage
```

## Releasing

This repository uses [lerna](https://lernajs.io) to manage and release the packages. Lerna automatically releases all the outdated packages. To check which packages are outdated and will be released, type `npm run publish:check`.

If you have the ability to publish packages, you _must_ have [2FA enabled](https://docs.npmjs.com/getting-started/using-two-factor-authentication) on your npmjs.com account.

### Before releasing

Confirm that you're logged into npm, by running `npm whoami`. If you're not logged in, run `npm adduser` to login.

If you're publishing a new package, ensure that its `package.json` file contains the correct `publishConfig` settings:

```json
	"publishConfig": {
		"access": "public"
	}
```

### Development release

Run the following command to release a dev version of the outdated packages, replacing "123456" with your 2FA code. Make sure you're using a freshly generated 2FA code, rather than one that's about to timeout. This is a little cumbersome, but helps to prevent the release process from dying mid-deploy.

```bash
NPM_CONFIG_OTP=123456 npm run publish:dev
```

Lerna will ask you which version number you want to choose for each package. For a `dev` release, you'll more likely want to choose the "prerelease" option. Repeat the same for all the outdated packages and confirm your version updates.

Lerna will then publish to `npm`, commit the `package.json` changes and create the git tags.

### Production release

To release a production version for the outdated packages, run the following command, replacing "123456" with your (freshly generated, as above) 2FA code:

```bash
NPM_CONFIG_OTP=123456 npm run publish:prod
```

Choose the correct version (minor, major or patch) and confirm your choices and let Lerna do its magic.
