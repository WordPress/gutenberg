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
	"test-e2e:watch": "pnpm test-e2e -- --watch",
}
```

### Run all available tests
```bash
pnpm test-e2e
```
### Run all available tests and listen for changes.
```bash
pnpm test-e2e:watch
```

### Run a specific test file
```bash
pnpm test-e2e -- packages/e2e-test/<path_to_test_file>
# Or, in order to watch for changes:
pnpm test-e2e:watch -- packages/e2e-test/<path_to_test_file>
```
### Debugging

Makes e2e tests available to debug in a Chrome Browser.
```bash
pnpm test-e2e:debug
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

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
