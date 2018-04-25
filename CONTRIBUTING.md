# Contributing

## Getting Started

Gutenberg is a Node.js-based project, built primarily in JavaScript.

The easiest way to get started is by running the Local Environment setup script, `./bin/setup-local-env.sh`. This will check if you have everything installed and updated, and help you download any extra tools you need.

If you prefer to set things up manually, be sure to have <a href="https://nodejs.org/en/">Node.js installed first</a>. You should be running a Node version matching the [current active LTS release](https://github.com/nodejs/Release#release-schedule) or newer for this plugin to work correctly. You can check your Node.js version by typing `node -v` in the Terminal prompt.

You should also have the latest release of <a href="https://npmjs.org">npm installed</a>, npm is a separate project from Node.js and is updated frequently. If you've just installed Node.js which includes a version of npm within the installation you most likely will need to also update your npm install. To update npm, type this into your terminal: `npm install npm@latest -g`

To test the plugin, or to contribute to it, you can clone this repository and build the plugin files using Node. How you do that depends on whether you're developing locally or uploading the plugin to a remote host.

### Local Environment

First, you need a WordPress Environment to run the plugin on. The quickest way to get up and running is to use the provided docker setup. Just install [docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose/) on your machine and run `./bin/setup-local-env.sh`.

The WordPress installation should be available at `http://localhost:8888` (username: `admin`, password: `password`).
Inside the "docker" directory, you can use any docker command to interact with your containers. If this port is in use, you can override it in your `docker-compose.override.yml` file. If you're running [e2e tests](https://wordpress.org/gutenberg/handbook/reference/testing-overview/#end-to-end-testing), this change will be used correctly.

Alternatively, you can use your own local WordPress environment and clone this repository right into your `wp-content/plugins` directory.

Next, open a terminal (or if on Windows, a command prompt) and navigate to the repository you cloned. Now type `npm install` to get the dependencies all set up. Then you can type `npm run dev` in your terminal or command prompt to keep the plugin building in the background as you work on it.

### On A Remote Server

Open a terminal (or if on Windows, a command prompt) and navigate to the repository you cloned. Now type `npm install` to get the dependencies all set up. Once that finishes, you can type `npm run build`. You can now upload the entire repository to your `wp-content/plugins` directory on your webserver and activate the plugin from the WordPress admin.

You can also type `npm run package-plugin` which will run the two commands above and create a zip file automatically for you which you can use to install Gutenberg through the WordPress admin.

## Workflow

A good workflow for new contributors to follow is listed below:
- Fork Gutenberg repository
- Clone forked repository
- Create new branch
- Make code changes
- Commit code changes within newly created branch
- Push branch to forked repository
- Submit Pull Request to Gutenberg repository

Ideally name your branches with prefixes and descriptions, like this: `[type]/[change]`. A good prefix would be:

- `add/` = add a new feature
- `try/` = experimental feature, "tentatively add"
- `update/` = update an existing feature

For example, `add/gallery-block` means you're working on adding a new gallery block.

You can pick among all the <a href="https://github.com/WordPress/gutenberg/issues">tickets</a>, or some of the ones labelled <a href="https://github.com/WordPress/gutenberg/labels/Good%20First%20Issue">Good First Issue</a>.

The workflow is documented in greater detail in the [repository management](./docs/repository-management.md) document.

## Testing

Gutenberg contains both PHP and JavaScript code, and encourages testing and code style linting for both. It also incorporates end-to-end testing using [Google Puppeteer](https://developers.google.com/web/tools/puppeteer/). You can find out more details in [Testing Overview document](./docs/reference/testing-overview.md).

## How Designers Can Contribute

If you'd like to contribute to the design or front-end, feel free to contribute to tickets labelled <a href="https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+label%3ADesign">Design</a>. We could use your thoughtful replies, mockups, animatics, sketches, doodles. Proposed changes are best done as minimal and specific iterations on the work that precedes it so we can compare. If you use <a href="https://www.sketchapp.com/">Sketch</a>, you can grab <a href="https://cloudup.com/cMPXM8Va2cy">the source file for the mockups</a> (updated April 6th).

## Contribute to the Documentation

Documentation is automatically synced from master to the [Gutenberg Documentation Website](https://wordpress.org/gutenberg/handbook/) every 15 minutes.

To add a new documentation page, you'll have to create a Markdown file in the [docs](https://github.com/WordPress/gutenberg/tree/master/docs) folder and add an item to the [manifest file](https://github.com/WordPress/gutenberg/blob/master/docs/manifest.json).

## Reporting Security Issues

Please see [SECURITY.md](./SECURITY.md).

## Localizing Gutenberg Plugin

To translate Gutenburg in your locale or language, [select your locale here](https://translate.wordpress.org/projects/wp-plugins/gutenberg) and translate *Development* (which contains the plugin's string) and/or *Development Readme* (please translate what you see in the Details tab of the [plugin page](https://wordpress.org/plugins/gutenberg/)).

A Global Translation Editor (GTE) or Project Translation Editor (PTE) with suitable rights will process your translations in due time.

Language packs are automatically generated once 95% of the plugin's strings are translated and approved for a locale.

The eventual inclusion of Gutenburg into WordPress core means that more than 51% of WordPress installations running a translated WordPress installation will have Gutenburg's translated strings compiled into the core language pack as well.
