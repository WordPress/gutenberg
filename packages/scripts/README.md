# @wordpress/scripts

A collection of JS scripts for WordPress development.

## Installation

Install the module

```bash
npm install @wordpress/scripts --save-dev
```

## Setup

This is a CLI and exposes a binary called `wp-scripts` so you can call it directly. However this module is designed to be configured using the `scripts` section in the `package.json` file of your project. Example configuration:
```json
{
	"scripts": {
		"test": "wp-scripts",
		"test:help": "wp-scripts --help",
		"test:watch": "wp-scripts --watch"
	}
}
```

This is how you execute those scripts using the presented setup:
* `npm run test` or `npm test` - runs all unit tests.
* `npm run test:help` - prints all available options to configure unit tests runner.
* `npm run test:watch` - runs all unit tests in the watch mode.

## Available Scripts

### `wp-scripts test`

Launches the test runner. It uses [Jest](https://facebook.github.io/jest/) behind the scenes and you are able to utilize all of its [CLI options](https://facebook.github.io/jest/docs/en/cli.html). You can also run `./node_modules/.bin/wp-scripts --help` or `npm run test:help` (if you use `package.json` setup shared above) to view all of the available options.

## Inspiration

This is inspired by [react-scripts](https://www.npmjs.com/package/react-scripts) and [kcd-scripts](https://www.npmjs.com/package/kcd-scripts).

<br/><br/>![Code is Poetry.](https://cldup.com/ZdtsUVg_V3.png)
