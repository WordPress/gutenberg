# Contributing

## Installing & Building the Plugin

Gutenberg is a Node-based project, built primarily in JavaScript. Be sure to have <a href="https://nodejs.org/en/">Node installed first</a>. If you already have Node installed, make sure it's version 6.10.3 or higher for this plugin to work correctly. You can check your Node version by typing `node -v` in the Terminal prompt.

To test the plugin, or to contribute to it, you can clone this repository and build the plugin files using Node. How you do that depends on whether you're developing locally or uploading the plugin to a remote host.

### On A Remote Server

Open a terminal (or if on Windows, a command prompt) and navigate to the repository you cloned. Now type `npm install` to get the dependencies all set up. Once that finishes, you can type `npm run build`. You can now upload the entire repository to your `wp-content/plugins` directory on your webserver and activate the plugin from the WordPress admin. You'll get a separate WordPress menu item called Gutenberg.

You can also type `npm run package-plugin` which will run the two commands above and create a zip file automatically for you which you can use to install Gutenberg through the WordPress admin.

### On a Local WordPress Environment

If you have a local WordPress environment, you can clone this repository right into your `wp-content/plugins` directory. `npm install` will get the dependencies set up. Then you can type `npm run dev` in your terminal or command prompt to keep the plugin building in the background as you work on it.

Some good options for a local WordPress development environment include <a href="https://varyingvagrantvagrants.org/">VVV</a> and <a href="https://www.mamp.info/">Mamp</a>.

## Workflow

A good workflow is to work directly in this repo, branch off `master`, and submit your changes as a pull request.

Ideally name your branches with prefixes and descriptions, like this: `[type]/[change]`. A good prefix would be:

- `add/` = add a new feature
- `try/` = experimental feature, "tentatively add"
- `update/` = update an existing feature

For example, `add/gallery-block` means you're working on adding a new gallery block. 

You can pick among all the <a href="https://github.com/WordPress/gutenberg/issues">tickets</a>, or some of the ones labelled <a href="https://github.com/WordPress/gutenberg/labels/Good%20First%20Task">Good First Task</a>.

## Testing

Gutenberg contains both PHP and JavaScript code, and encourages testing and code style linting for both.

### JavaScript Testing

Tests for JavaScript use [Mocha](https://mochajs.org/) as the test runner and [Chai BDD](http://chaijs.com/api/bdd/) as an assertion library (with a [small variation](https://github.com/prodatakey/dirty-chai) on assertion properties). If needed, you can also use [Sinon](http://sinonjs.org/) for mocking and [Enzyme](https://github.com/airbnb/enzyme) for React component testing.

Assuming you've followed the instructions above to install Node and project dependencies, tests can be run from the command-line with NPM:

```
npm test
```

To run unit tests only, use `npm run test-unit` instead.

Code style in JavaScript is enforced using [ESLint](http://eslint.org/). The above `npm test` will execute both unit tests and code linting. Code linting can be verified independently by running `npm run lint`.

### PHP Testing

Tests for PHP use [PHPUnit](https://phpunit.de/) as the testing framework. Before starting, you should install PHPUnit and have a copy of [WordPress Develop](https://github.com/WordPress/wordpress-develop) available. If the Gutenberg plugin is installed in the context of a WordPress Develop site, you can run `phpunit` directly from the command-line. Otherwise, you will need to specify the path to WordPress Develop's test directory as an environment variable:

```
WP_TESTS_DIR=/path/to/wordpress-develop/tests/phpunit phpunit
```

Code style in PHP is enforced using [PHP_CodeSniffer](https://github.com/squizlabs/PHP_CodeSniffer). It is recommended that you install PHP_CodeSniffer and the WordPress-specific code standard ruleset using [Composer](https://getcomposer.org/). With Composer installed, run `composer install` from the project directory to install dependencies, then `composer run-script lint` to verify PHP code standards.

## How Designers Can Contribute

If you'd like to contribute to the design or front-end, feel free to contribute to tickets labelled <a href="https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+label%3ADesign">Design</a>. We could use your thoughtful replies, mockups, animatics, sketches, doodles. Proposed changes are best done as minimal and specific iterations on the work that precedes it so we can compare. If you use <a href="https://www.sketchapp.com/">Sketch</a>, you can grab <a href="https://cloudup.com/cMPXM8Va2cy">the source file for the mockups</a> (updated April 6th).
