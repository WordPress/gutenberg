# Contributing

## Getting Started

Gutenberg is a Node.js-based project, built primarily in JavaScript. Be sure to have <a href="https://nodejs.org/en/">Node.js installed first</a>. You should be running a Node version matching the [current active LTS release](https://github.com/nodejs/Release#release-schedule) or newer for this plugin to work correctly. You can check your Node.js version by typing `node -v` in the Terminal prompt.

You should also have the latest release of <a href="https://npmjs.org">npm installed</a>, npm is a separate project from Node.js and is updated frequently. If you've just installed Node.js which includes a version of npm within the installation you most likely will need to also update your npm install. To update npm, type this into your terminal: `npm install npm@latest -g`

To test the plugin, or to contribute to it, you can clone this repository and build the plugin files using Node. How you do that depends on whether you're developing locally or uploading the plugin to a remote host.

### Local Environment

First, you need a WordPress Environment to run the plugin on. The quickest way to get up and running is to use the provided docker setup. Just install [docker](https://www.docker.com/) on your machine and run `./bin/setup-local-env.sh`.

The WordPress installation should be available at `http://localhost:8888` (username: `admin`, password: `password`).
Inside the "docker" directory, you can use any docker command to interact with your containers.

Alternatively, you can use your own local WordPress environment and clone this repository right into your `wp-content/plugins` directory.

Next, open a terminal (or if on Windows, a command prompt) and navigate to the repository you cloned. Now type `npm install` to get the dependencies all set up. Then you can type `npm run dev` in your terminal or command prompt to keep the plugin building in the background as you work on it.

### On A Remote Server

Open a terminal (or if on Windows, a command prompt) and navigate to the repository you cloned. Now type `npm install` to get the dependencies all set up. Once that finishes, you can type `npm run build`. You can now upload the entire repository to your `wp-content/plugins` directory on your webserver and activate the plugin from the WordPress admin.

You can also type `npm run package-plugin` which will run the two commands above and create a zip file automatically for you which you can use to install Gutenberg through the WordPress admin.

## Workflow

A good workflow is to work directly in this repo, branch off `master`, and submit your changes as a pull request.

Ideally name your branches with prefixes and descriptions, like this: `[type]/[change]`. A good prefix would be:

- `add/` = add a new feature
- `try/` = experimental feature, "tentatively add"
- `update/` = update an existing feature

For example, `add/gallery-block` means you're working on adding a new gallery block.

You can pick among all the <a href="https://github.com/WordPress/gutenberg/issues">tickets</a>, or some of the ones labelled <a href="https://github.com/WordPress/gutenberg/labels/Good%20First%20Issue">Good First Issue</a>.

## Testing

Gutenberg contains both PHP and JavaScript code, and encourages testing and code style linting for both.

### JavaScript Testing

Tests for JavaScript use [Jest](http://facebook.github.io/jest/) as the test runner. If needed, you can also use [Enzyme](https://github.com/airbnb/enzyme) for React component testing.

Assuming you've followed the instructions above to install Node and project dependencies, tests can be run from the command-line with NPM:

```
npm test
```

To run unit tests only, use `npm run test-unit` instead.

Code style in JavaScript is enforced using [ESLint](http://eslint.org/). The above `npm test` will execute both unit tests and code linting. Code linting can be verified independently by running `npm run lint`.

### End to end Testing (integration tests)

If you're using the built-in local environment above, you can run the e2e tests locally using this command:

```bash
npm run test-e2e
```

or interactively

```bash
npm run test-e2e:watch
```

If you're using another local environment setup, you can still run the e2e tests by overriding the base URL and the default WP username/password used in the tests like so:

```bash
cypress_base_url=http://my-custom-basee-url cypress_username=myusername cypress_password=mypassword npm run test-e2e
```


### PHP Testing

Tests for PHP use [PHPUnit](https://phpunit.de/) as the testing framework. Before starting, you should install PHPUnit and have a copy of [WordPress Develop](https://github.com/WordPress/wordpress-develop) available and setup a [`wp-tests-config.php`](https://make.wordpress.org/core/handbook/testing/automated-testing/phpunit/#setup) file. If the Gutenberg plugin is installed in the context of a WordPress Develop site, you can run `phpunit` directly from the command-line. Otherwise, you will need to specify the path to WordPress Develop's test directory as an environment variable:

```
WP_TESTS_DIR=/path/to/wordpress-develop/tests/phpunit phpunit
```

Code style in PHP is enforced using [PHP_CodeSniffer](https://github.com/squizlabs/PHP_CodeSniffer). It is recommended that you install PHP_CodeSniffer and the [WordPress Coding Standards for PHP_CodeSniffer](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#installation) ruleset using [Composer](https://getcomposer.org/). With Composer installed, run `composer install` from the project directory to install dependencies, then `composer run-script lint` to verify PHP code standards.

### Code Coverage

Code coverage is measured for each PR using the
[codecov.io](https://codecov.io/gh/WordPress/gutenberg)
tool.
[Code coverage](https://en.wikipedia.org/wiki/Code_coverage)
is a way of measuring the amount of code covered by the tests in the test suite of a project.  In Gutenberg, it is currently measured for JavaScript code only.

### How Designers Can Contribute

If you'd like to contribute to the design or front-end, feel free to contribute to tickets labelled <a href="https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+label%3ADesign">Design</a>. We could use your thoughtful replies, mockups, animatics, sketches, doodles. Proposed changes are best done as minimal and specific iterations on the work that precedes it so we can compare. If you use <a href="https://www.sketchapp.com/">Sketch</a>, you can grab <a href="https://cloudup.com/cMPXM8Va2cy">the source file for the mockups</a> (updated April 6th).

### Contribute to the Documentation

Dcoumentation is automatically synced from master to the [Gutenberg Documentation Website](https://wordpress.org/gutenberg/handbook/) every 15 minutes.

To add a new documentation page, you'll have to create a markdown file in the [docs](https://github.com/WordPress/gutenberg/tree/master/docs) folder and at an item to the [manifest file](https://github.com/WordPress/gutenberg/blob/master/docs/manifest.json).
