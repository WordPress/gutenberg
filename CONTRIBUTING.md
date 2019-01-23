# Contributing

Thank you for thinking about contributing to WordPress' Gutenberg project! If you're unsure of anything, know that you're 💯 welcome to submit an issue or pull request on any topic. The worst that can happen is that you'll be politely directed to the best location to ask your question or to change something in your pull request. We appreciate any sort of contribution and don't want a wall of rules to get in the way of that.

As with all WordPress projects, we want to ensure a welcoming environment for everyone. With that in mind, all contributors are expected to follow our [Code of Conduct](/CODE_OF_CONDUCT.md).

Before contributing, we encourage you to review the [Contributor Handbook](https://wordpress.org/gutenberg/handbook/contributors/). If you have any questions, please ask, either in Slack or open an issue in GitHub so we can help clarify.

All WordPress projects are [licensed under the GPLv2+](/LICENSE.md), and all contributions to Gutenberg will be released under the GPLv2+ license. You maintain copyright over any contribution you make, and by submitting a pull request, you are agreeing to release that contribution under the GPLv2+ license.

This document covers the technical details around setup, and submitting your contribution to the Gutenberg project.

## Getting Started

Gutenberg is a Node.js-based project, built primarily in JavaScript.

The easiest way to get started (on MacOS, Linux, or Windows 10 with the Linux Subsystem) is by running the Local Environment setup script, `./bin/setup-local-env.sh`. This will check if you have everything installed and updated, and help you download any extra tools you need.

For another version of Windows, or if you prefer to set things up manually, be sure to have <a href="https://nodejs.org/en/">Node.js installed first</a>. You should be running a Node version matching the [current active LTS release](https://github.com/nodejs/Release#release-schedule) or newer for this plugin to work correctly. You can check your Node.js version by typing `node -v` in the Terminal prompt.

If you have an incompatible version of Node in your development environment, you can use [nvm](https://github.com/creationix/nvm) to change node versions on the command line:

```
npx nvm install
npx nvm use
```

You also should have the latest release of [npm installed][npm]. npm is a separate project from Node.js and is updated frequently. If you've just installed Node.js which includes a version of npm within the installation you most likely will need also to update your npm installation. To update npm, type this into your terminal: `npm install npm@latest -g`

To test the plugin, or to contribute to it, you can clone this repository and build the plugin files using Node. How you do that depends on whether you're developing locally or uploading the plugin to a remote host.

### Local Environment

First, you need a WordPress Environment to run the plugin on. The quickest way to get up and running is to use the provided docker setup. Install [docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose/) by following the most recent instructions on the docker site.

In the folder of your preference, clone this project and enter the working directory:
```bash
git clone git@github.com:WordPress/gutenberg.git
cd gutenberg
```

Then, run a setup script to check if docker and node are configured properly and starts the local WordPress instance. You may need to run this script multiple times if prompted.
```
./bin/setup-local-env.sh
```

**If you're developing themes, or core WordPress functionality alongside Gutenberg**, you can make the WordPress files accessible in `wordpress/` by following these instructions instead:

1. If this is your first time setting up the environment, run `DOCKER_ENV=localwpdev ./bin/setup-local-env.sh` instead of `./bin/setup-local-env.sh`
2. If you've already had the previous environment set up, you need to start fresh, and you can do that by first running `docker-compose down --rmi all`. After that, you can repeat step 1.
3. If you turn off your computer or restart Docker, you can get your local WordPress dev environment back by typing `docker-compose -f docker-compose.yml -f docker-compose-localdev.yml up`. If you just run `docker-compose up`, you will get the vanilla install that doesn't expose the WordPress folder.

**If everything was successful**, you'll see the following ASCII art:
```
Welcome to...

,⁻⁻⁻·       .                 |
|  ،⁓’.   . |---  ,---. ,---. |---. ,---. ,---. ,---.
|   | |   | |     |---' |   | |   | |---' |     |   |
`---' `---' `---’ `---’ '   ` `---' `---’ `     `---|
                                                `---'
```

The WordPress installation should be available at `http://localhost:8888` (**Username**: `admin`, **Password**: `password`).
Inside the "docker" directory, you can use any docker command to interact with your containers. If this port is in use, you can override it in your `docker-compose.override.yml` file. If you're running [e2e tests](/docs/contributors/testing-overview.md#end-to-end-testing), this change will be used correctly.

To bring down this local WordPress instance later run:
```
docker-compose down
```

If you'd like to see your changes reflected in this local WordPress instance, run:
```
npm install
npm run dev
```

Alternatively, you can use your own local WordPress environment and clone this repository right into your `wp-content/plugins` directory.

Next, open a terminal (or if on Windows, a command prompt) and navigate to the repository you cloned. Now type `npm install` to get the dependencies all set up. Then you can type `npm run dev` in your terminal or command prompt to keep the plugin building in the background as you work on it.

### On A Remote Server

Open a terminal (or if on Windows, a command prompt) and navigate to the repository you cloned. Now type `npm install` to get the dependencies all set up. Once that finishes, you can type `npm run build`. You can now upload the entire repository to your `wp-content/plugins` directory on your web server and activate the plugin from the WordPress admin.

You can also type `npm run package-plugin` which will run the two commands above and create a zip file automatically for you which you can use to install Gutenberg through the WordPress admin.

## Workflow

A good workflow for new contributors to follow is listed below:
- Fork Gutenberg repository
- Clone forked repository
- Create a new branch
- Make code changes
- Commit code changes within the newly created branch
- Push branch to forked repository
- Submit Pull Request to Gutenberg repository

Ideally name your branches with prefixes and descriptions, like this: `[type]/[change]`. A good prefix would be:

- `add/` = add a new feature
- `try/` = experimental feature, "tentatively add"
- `update/` = update an existing feature

For example, `add/gallery-block` means you're working on adding a new gallery block.

You can pick among all the <a href="https://github.com/WordPress/gutenberg/issues">tickets</a>, or some of the ones labelled <a href="https://github.com/WordPress/gutenberg/labels/Good%20First%20Issue">Good First Issue</a>.

The workflow is documented in greater detail in the [repository management](/docs/contributors/repository-management.md) document.

## Testing

Gutenberg contains both PHP and JavaScript code and encourages testing and code style linting for both. It also incorporates end-to-end testing using [Google Puppeteer](https://developers.google.com/web/tools/puppeteer/). You can find out more details in [Testing Overview document](/docs/contributors/testing-overview.md).

## Managing Packages

This repository uses [lerna] to manage Gutenberg modules and publish them as packages to [npm]. This enforces certain steps in the workflow which are described in details in [packages](/packages/README.md) documentation.

Maintaining dozens of npm packages is difficult—it can be tough to keep track of changes. That's why we use `CHANGELOG.md` files for each package to simplify the release process. As a contributor you should add an entry to the aforementioned file each time you contribute adding production code as described in [Maintaining Changelogs](/packages/README.md#maintaining-changelogs) section.

## How Can Designers Contribute?

If you'd like to contribute to the design or front-end, feel free to contribute to tickets labelled [Needs Design](https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+label%3A%22Needs+Design%22) or [Needs Design Feedback](https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+label%3A"Needs+Design+Feedback%22). We could use your thoughtful replies, mockups, animatics, sketches, doodles. Proposed changes are best done as minimal and specific iterations on the work that precedes it so we can compare. If you use <a href="https://www.sketchapp.com/">Sketch</a>, you can grab <a href="https://cloudup.com/cMPXM8Va2cy">the source file for the mockups</a> (updated April 6th).

## Contribute to the Documentation

Please see the [Documentation section](/docs/contributors/document.md) of the Contributor Handbook.

Documentation is automatically synced from `master` to the [Gutenberg Handbook](https://wordpress.org/gutenberg/handbook/) every 15 minutes.

### `@wordpress/component`

If you're contributing to the documentation of any component from the `@wordpress/component` package, take a look at its [guidelines for contributing](/packages/components/CONTRIBUTING.md).

## Reporting Security Issues

Please see [SECURITY.md](/SECURITY.md).

## Localizing Gutenberg Plugin

To translate Gutenberg in your locale or language, [select your locale here](https://translate.wordpress.org/projects/wp-plugins/gutenberg) and translate *Development* (which contains the plugin's string) and/or *Development Readme* (please translate what you see in the Details tab of the [plugin page](https://wordpress.org/plugins/gutenberg/)).

A Global Translation Editor (GTE) or Project Translation Editor (PTE) with suitable rights will process your translations in due time.

Language packs are automatically generated once 95% of the plugin's strings are translated and approved for a locale.

The eventual inclusion of Gutenberg into WordPress core means that more than 51% of WordPress installations running a translated WordPress installation will have Gutenberg's translated strings compiled into the core language pack as well.

[lerna]: https://lernajs.io/
[npm]: https://www.npmjs.com/
