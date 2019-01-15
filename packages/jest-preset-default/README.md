# Jest Preset Default

Default [Jest](https://jestjs.io/) preset for WordPress development.

## Installation

Install the module

```bash
npm install @wordpress/jest-preset-default --save-dev
```

## Setup

### Via `jest.config.json` or `jest` field in `package.json`

```json
{
  "preset": "@wordpress/jest-preset-default"
}
```

### Usage

#### Brief explanations of options included

* `moduleNameMapper` - all `css` and `scss` files containing CSS styles will be stubbed out.
* `modulePaths` - the root dir of the project is used as a location to search when resolving modules.
* `setupFiles` - runs code before each test which sets up global variables required in the testing environment.
* `setupTestFrameworkScriptFile` - runs code which adds improved support for `Console` object and `React` components to the testing framework before each test.
* `testMatch`- includes `/test/` subfolder in the glob patterns Jest uses to detect test files. It detects only test files containing `.js` extension.
* `timers` - use of [fake timers](https://jestjs.io/docs/en/timer-mocks.html) for functions such as `setTimeout` is enabled.
* `transform` - adds support for [PEG.js]( https://github.com/pegjs/pegjs#javascript-api) transformed necessary for WordPress blocks. It also keeps the default [babel-jest](https://github.com/facebook/jest/tree/master/packages/babel-jest) transformer.
* `verbose` - each individual test won't be reported during the run.

#### Overriding `setupTestFrameworkScriptFile`

It is also possible to override the script that runs some code to configure or set up the testing framework before each test. To do so you will need to create `setup-test-framework.js` inside your project with the following content:

```js
// You can still load the default script provided by this setup
import '@wordpress/jest-preset-default';

// Your code goes here
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
