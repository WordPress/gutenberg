# E2E Tests

End-To-End (E2E) tests for WordPress.

## Installation

Install the module

```bash
npm install @wordpress/e2e-tests --save-dev
```

## Running tests

The following commands are available on the Gutenberg repo:

```json
{
	"test-e2e": "wp-scripts test-e2e --config packages/e2e-tests/jest.config.js",
	"test-e2e:debug": "wp-scripts --inspect-brk test-e2e --config packages/e2e-tests/jest.config.js --puppeteer-devtools",
	"test-e2e:watch": "npm run test-e2e -- --watch"
}
```

### Run all available tests

```bash
npm run test-e2e
```

### Run all available tests and listen for changes.

```bash
npm run test-e2e:watch
```

### Run a specific test file

```bash
npm run test-e2e -- packages/e2e-test/<path_to_test_file>
# Or, in order to watch for changes:
npm run test-e2e:watch -- packages/e2e-test/<path_to_test_file>
```

### Debugging

Makes e2e tests available to debug in a Chrome Browser.

```bash
npm run test-e2e:debug
```

After running the command, tests will be available for debugging in Chrome by going to chrome://inspect/#devices and clicking `inspect` under the path to `/test-e2e.js`.

#### Debugging in `vscode`

Debugging in a Chrome browser can be replaced with `vscode`'s debugger by adding the following configuration to `.vscode/launch.json`:

```json
{
	"type": "node",
	"request": "launch",
	"name": "Debug current e2e test",
	"program": "${workspaceFolder}/node_modules/@wordpress/scripts/bin/wp-scripts.js",
	"args": [
		"test-e2e",
		"--config=${workspaceFolder}/packages/e2e-tests/jest.config.js",
		"--verbose=true",
		"--runInBand",
		"--watch",
		"${file}"
	],
	"console": "integratedTerminal",
	"internalConsoleOptions": "neverOpen",
	"trace": "all"
}
```

This will run jest, targetting the spec file currently open in the editor. `vscode`'s debugger can now be used to add breakpoints and inspect tests as you would in Chrome DevTools.

**Note**: This package requires Node.js 12.0.0 or later. It is not compatible with older versions.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
