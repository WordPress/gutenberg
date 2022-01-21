# Testing Overview

Gutenberg contains both PHP and JavaScript code, and encourages testing and code style linting for both.

## Why test?

Aside from the joy testing will bring to your life, tests are important not only because they help to ensure that our application behaves as it should, but also because they provide concise examples of how to use a piece of code.

Tests are also part of our code base, which means we apply to them the same standards we apply to all our application code.

As with all code, tests have to be maintained. Writing tests for the sake of having a test isn't the goal – rather we should try to strike the right balance between covering expected and unexpected behaviours, speedy execution and code maintenance.

When writing tests consider the following:

-   What behaviour(s) are we testing?
-   What errors are likely to occur when we run this code?
-   Does the test test what we think it is testing? Or are we introducing false positives/negatives?
-   Is it readable? Will other contributors be able to understand how our code behaves by looking at its corresponding test?

## JavaScript Testing

Tests for JavaScript use [Jest](https://jestjs.io/) as the test runner and its API for [globals](https://jestjs.io/docs/en/api.html) (`describe`, `test`, `beforeEach` and so on) [assertions](https://jestjs.io/docs/en/expect.html), [mocks](https://jestjs.io/docs/en/mock-functions.html), [spies](https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname) and [mock functions](https://jestjs.io/docs/en/mock-function-api.html). If needed, you can also use [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) for React component testing.

_It should be noted that in the past, React components were unit tested with [Enzyme](https://github.com/airbnb/enzyme). However, React Testing Library (RTL) should be used for new tests instead, and over time old tests should be refactored to use RTL too (typically when working on code that touches an old test)._

Assuming you've followed the [instructions](/docs/contributors/code/getting-started-with-code-contribution.md) to install Node and project dependencies, tests can be run from the command-line with NPM:

```
pnpm test
```

Linting is static code analysis used to enforce coding standards and to avoid potential errors. This project uses [ESLint](http://eslint.org/) and [TypeScript's JavaScript type-checking](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html) to capture these issues. While the above `pnpm test` will execute both unit tests and code linting, code linting can be verified independently by running `pnpm lint`. Some JavaScript issues can be fixed automatically by running `pnpm lint-js:fix`.

To improve your developer workflow, you should setup an editor linting integration. See the [getting started documentation](/docs/contributors/code/getting-started-with-code-contribution.md) for additional information.

To run unit tests only, without the linter, use `pnpm test-unit` instead.

### Folder structure

Keep your tests in a `test` folder in your working directory. The test file should have the same name as the test subject file.

```
+-- test
|   +-- bar.js
+-- bar.js
```

Only test files (with at least one test case) should live directly under `/test`. If you need to add external mocks or fixtures, place them in a sub folder, for example:

-   `test/mocks/[file-name].js`
-   `test/fixtures/[file-name].js`

### Importing tests

Given the previous folder structure, try to use relative paths when importing of the **code you're testing**, as opposed to using project paths.

**Good**

`import { bar } from '../bar';`

**Not so good**

`import { bar } from 'components/foo/bar';`

It will make your life easier should you decide to relocate your code to another position in the application directory.

### Describing tests

Use a `describe` block to group test cases. Each test case should ideally describe one behaviour only.

In test cases, try to describe in plain words the expected behaviour. For UI components, this might entail describing expected behaviour from a user perspective rather than explaining code internals.

**Good**

```javascript
describe( 'CheckboxWithLabel', () => {
    test( 'checking checkbox should disable the form submit button', () => {
        ...
    } );
} );
```

**Not so good**

```javascript
describe( 'CheckboxWithLabel', () => {
    test( 'checking checkbox should set this.state.disableButton to `true`', () => {
        ...
    } );
} );
```

### Setup and Teardown methods

The Jest API includes some nifty [setup and teardown methods](https://jestjs.io/docs/en/setup-teardown.html) that allow you to perform tasks _before_ and _after_ each or all of your tests, or tests within a specific `describe` block.

These methods can handle asynchronous code to allow setup that you normally cannot do inline. As with [individual test cases](https://jestjs.io/docs/en/asynchronous.html#promises), you can return a Promise and Jest will wait for it to resolve:

```javascript
// one-time setup for *all* tests
beforeAll( () =>
	someAsyncAction().then( ( resp ) => {
		window.someGlobal = resp;
	} )
);

// one-time teardown for *all* tests
afterAll( () => {
	window.someGlobal = null;
} );
```

`afterEach` and `afterAll` provide a perfect (and preferred) way to 'clean up' after our tests, for example, by resetting state data.

Avoid placing clean up code after assertions since, if any of those tests fail, the clean up won't take place and may cause failures in unrelated tests.

### Mocking dependencies

#### Dependency injection

Passing dependencies to a function as arguments can often make your code simpler to test. Where possible, avoid referencing dependencies in a higher scope.

**Not so good**

```javascript
import VALID_VALUES_LIST from './constants';

function isValueValid( value ) {
	return VALID_VALUES_LIST.includes( value );
}
```

Here we'd have to import and use a value from `VALID_VALUES_LIST` in order to pass:

`expect( isValueValid( VALID_VALUES_LIST[ 0 ] ) ).toBe( true );`

The above assertion is testing two behaviours: 1) that the function can detect an item in a list, and 2) that it can detect an item in `VALID_VALUES_LIST`.

But what if we don't care what's stored in `VALID_VALUES_LIST`, or if the list is fetched via an HTTP request, and we only want to test whether `isValueValid` can detect an item in a list?

**Good**

```javascript
function isValueValid( value, validValuesList = [] ) {
	return validValuesList.includes( value );
}
```

Because we're passing the list as an argument, we can pass mock `validValuesList` values in our tests and, as a bonus, test a few more scenarios:

`expect( isValueValid( 'hulk', [ 'batman', 'superman' ] ) ).toBe( false );`

`expect( isValueValid( 'hulk', null ) ).toBe( false );`

`expect( isValueValid( 'hulk', [] ) ).toBe( false );`

`expect( isValueValid( 'hulk', [ 'iron man', 'hulk' ] ) ).toBe( true );`

#### Imported dependencies

Often our code will use methods and properties from imported external and internal libraries in multiple places, which makes passing around arguments messy and impracticable. For these cases `jest.mock` offers a neat way to stub these dependencies.

For instance, lets assume we have `config` module to control a great deal of functionality via feature flags.

```javascript
// bilbo.js
import config from 'config';
export const isBilboVisible = () =>
	config.isEnabled( 'the-ring' ) ? false : true;
```

To test the behaviour under each condition, we stub the config object and use a jest mocking function to control the return value of `isEnabled`.

```javascript
// test/bilbo.js
import { isEnabled } from 'config';
import { isBilboVisible } from '../bilbo';

jest.mock( 'config', () => ( {
	// bilbo is visible by default
	isEnabled: jest.fn( () => false ),
} ) );

describe( 'The bilbo module', () => {
	test( 'bilbo should be visible by default', () => {
		expect( isBilboVisible() ).toBe( true );
	} );

	test( 'bilbo should be invisible when the `the-ring` config feature flag is enabled', () => {
		isEnabled.mockImplementationOnce( ( name ) => name === 'the-ring' );
		expect( isBilboVisible() ).toBe( false );
	} );
} );
```

### Testing globals

We can use [Jest spies](https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname) to test code that calls global methods.

```javascript
import { myModuleFunctionThatOpensANewWindow } from '../my-module';

describe( 'my module', () => {
	beforeAll( () => {
		jest.spyOn( global, 'open' ).mockImplementation( () => true );
	} );

	test( 'something', () => {
		myModuleFunctionThatOpensANewWindow();
		expect( global.open ).toHaveBeenCalled();
	} );
} );
```

### Snapshot testing

This is an overview of [snapshot testing] and how to best leverage snapshot tests.

#### TL;DR Broken snapshots

When a snapshot test fails, it just means that a component's rendering has changed. If that was unintended, then the snapshot test just prevented a bug 😊

However, if the change was intentional, follow these steps to update the snapshot. Run the following to update the snapshots:

```sh
# --testPathPattern is optional but will be much faster by only running matching tests
pnpm test-unit -- --updateSnapshot --testPathPattern path/to/tests
```

1. Review the diff and ensure the changes are expected and intentional.
2. Commit.

#### What are snapshots?

Snapshots are just a representation of some data structure generated by tests. Snapshots are stored in files and committed alongside the tests. When the tests are run, the data structure generated is compared with the snapshot on file.

It's very easy to make a snapshot:

```js
test( 'foobar test', () => {
	const foobar = { foo: 'bar' };

	expect( foobar ).toMatchSnapshot();
} );
```

This is the produced snapshot:

```js
exports[ `test foobar test 1` ] = `
  Object {
    "foo": "bar",
  }
`;
```

You should never create or modify a snapshot directly, they are generated and updated by tests.

#### Advantages

-   Trivial and concise to add tests.
-   Protect against unintentional changes.
-   Simple to work with.
-   Reveal internal structures without running the application.

#### Disadvantages

-   Not expressive.
-   Only catch issues when changes are introduced.
-   Are problematic for anything non-deterministic.

#### Use cases

Snapshot are mostly targeted at component testing. They make us conscious of changes to a component's structure which makes them _ideal_ for refactoring. If a snapshot is kept up to date over the course of a series of commits, the snapshot diffs record the evolution of a component's structure. Pretty cool 😎

```jsx
import { render, screen } from '@testing-library/react';
import SolarSystem from 'solar-system';

describe( 'SolarSystem', () => {
	test( 'should render', () => {
		const { container } = render( <SolarSystem /> );

		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should contain mars if planets is true', () => {
		const { container } = render( <SolarSystem planets /> );

		expect( container.firstChild ).toMatchSnapshot();
		expect( screen.getByText( /mars/i ) ).toBeInTheDocument();
	} );
} );
```

Reducer tests are also a great fit for snapshots. They are often large, complex data structures that shouldn't change unexpectedly, exactly what snapshots excel at!

#### Working with snapshots

You might be blindsided by CI tests failing when snapshots don't match. You'll need to [update snapshots] if the changes are expected. The quick and dirty solution is to invoke Jest with `--updateSnapshot`. That can be done as follows:

```sh
pnpm test-unit -- --updateSnapshot --testPathPattern path/to/tests
```

`--testPathPattern` is not required, but specifying a path will speed things up by running a subset of tests.

It's a great idea to keep `pnpm test-unit:watch` running in the background as you work. Jest will run only the relevant tests for changed files, and when snapshot tests fail, just hit `u` to update a snapshot!

#### Pain points

Non-deterministic tests may not make consistent snapshots, so beware. When working with anything random, time-based, or otherwise non-deterministic, snapshots will be problematic.

Connected components are tricky to work with. To snapshot a connected component you'll probably want to export the unconnected component:

```js
// my-component.js
export { MyComponent };
export default connect( mapStateToProps )( MyComponent );

// test/my-component.js
import { MyComponent } from '..';
// run those MyComponent tests…
```

The connected props will need to be manually provided. This is a good opportunity to audit the connected state.

#### Best practices

If you're starting a refactor, snapshots are quite nice, you can add them as the first commit on a branch and watch as they evolve.

Snapshots themselves don't express anything about what we expect. Snapshots are best used in conjunction with other tests that describe our expectations, like in the example above:

```jsx
test( 'should contain mars if planets is true', () => {
	const { container } = render( <SolarSystem planets /> );

	// Snapshot will catch unintended changes
	expect( container.firstChild ).toMatchSnapshot();

	// This is what we actually expect to find in our test
	expect( screen.getByText( /mars/i ) ).toBeInTheDocument();
} );
```

Another good technique is to use the `toMatchDiffSnapshot` function (provided by the [`snapshot-diff` package](https://github.com/jest-community/snapshot-diff)), which allows to snapshot only the difference between two different states of the DOM. This approach is useful to test the effects of a prop change on the resulting DOM while generating a much smaller snapshot, like in this example:

```jsx
test( 'should render a darker background when isShady is true', () => {
	const { container } = render( <CardBody>Body</CardBody> );
	const { container: containerShady } = render(
		<CardBody isShady>Body</CardBody>
	);
	expect( container ).toMatchDiffSnapshot( containerShady );
} );
```

Similarly, the `toMatchStyleDiffSnapshot` function allows to snapshot only the difference between the _styles_ associated to two different states of a component, like in this example:

```jsx
test( 'should render margin', () => {
	const { container: spacer } = render( <Spacer /> );
	const { container: spacerWithMargin } = render( <Spacer margin={ 5 } /> );
	expect( spacerWithMargin.firstChild ).toMatchStyleDiffSnapshot(
		spacer.firstChild
	);
} );
```

#### Troubleshooting

Sometimes we need to mock refs for some stories which use them. Check the following documents to learn more:

-   Why we need to use [Mocking Refs for Snapshot Testing](https://reactjs.org/blog/2016/11/16/react-v15.4.0.html#mocking-refs-for-snapshot-testing) with React.

In that case, you might see test failures and `TypeError` reported by Jest in the lines which try to access a property from `ref.current`.

### Debugging Jest unit tests

Running `pnpm test-unit:debug` will start the tests in debug mode so a [node inspector client](https://nodejs.org/en/docs/guides/debugging-getting-started/#inspector-clients) can connect to the process and inspect the execution. Instructions for using Google Chrome or Visual Studio Code as an inspector client can be found in the [wp-scripts documentation](/packages/scripts/README.md#debugging-jest-unit-tests).

## Native mobile testing

Part of the unit-tests suite is a set of Jest tests run exercise native-mobile codepaths, developed in React Native. Since those tests run on Node, they can be launched locally on your development machine without the need for specific native Android or iOS dev tools or SDKs. It also means that they can be debugged using typical dev tools. Read on for instructions how to debug.

### Debugging the native mobile unit tests

To locally run the tests in debug mode, follow these steps:

0. Make sure you have ran `npm ci` to install all the packages
1. Run `pnpm native test:debug` inside the Gutenberg root folder, on the CLI. Node is now waiting for the debugger to connect.
2. Open `chrome://inspect` in Chrome
3. Under the "Remote Target" section, look for a `../../node_modules/.bin/jest` target and click on the "inspect" link. That will open a new window with the Chrome DevTools debugger attached to the process and stopped at the beginning of the `jest.js` file. Alternatively, if the targets are not visible, click on the `Open dedicated DevTools for Node` link in the same page.
4. You can place breakpoints or `debugger;` statements throughout the code, including the tests code, to stop and inspect
5. Click on the "Play" button to resume execution
6. Enjoy debugging the native mobile unit tests!

### Native mobile end-to-end tests

Contributors to Gutenberg will note that PRs include continuous integration E2E tests running the native mobile E2E tests on Android and iOS. For troubleshooting failed tests, check our guide on [native mobile tests in continuous integration](/docs/contributors/code/react-native/integration-test-guide.md). More information on running these tests locally can be found in [here](/packages/react-native-editor/__device-tests__/README.md).

### Native mobile integration tests

There is an ongoing effort to add integration tests to the native mobile project using the [`react-native-testing-library`](https://testing-library.com/docs/react-native-testing-library/intro/) library. A guide to writing integration tests can be found [here](/docs/contributors/code/react-native/integration-test-guide.md).

## End-to-end Testing

End-to-end tests use [Puppeteer](https://github.com/puppeteer/puppeteer) as a headless Chromium driver, and are otherwise still run by a [Jest](https://jestjs.io/) test runner.

### Using wp-env

If you're using the built-in [local environment](/docs/contributors/code/getting-started-with-code-contribution.md#local-environment), you can run the e2e tests locally using this command:

```bash
pnpm test-e2e
```

or interactively

```bash
pnpm test-e2e:watch
```

Sometimes it's useful to observe the browser while running tests. Then, use this command:

```bash
pnpm test-e2e:watch -- --puppeteer-interactive
```

You can control the speed of execution with `--puppeteer-slowmo`:

```bash
pnpm test-e2e:watch -- --puppeteer-interactive --puppeteer-slowmo=200
```

You can additionally have the devtools automatically open for interactive debugging in the browser:

```bash
pnpm test-e2e:watch -- --puppeteer-devtools
```

### Using alternate environment

If using a different setup than `wp-env`, you first need to symlink the e2e test plugins to your test site, from your site's plugins directory run:

```bash
ln -s gutenberg/packages/e2e-tests/plugins/* .
```

Then to run the tests, specify the base URL, username, and passwords for your site. For example, if your test site is at `http://wp.test`, use:

```bash
WP_BASE_URL=http://wp.test pnpm test-e2e -- --wordpress-username=admin --wordpress-password=password
```

### Scenario Testing

If you find that end-to-end tests pass when run locally, but fail in GitHub Actions, you may be able to isolate a CPU- or network-bound race condition by simulating a slow CPU or network:

```
THROTTLE_CPU=4 pnpm test-e2e
```

`THROTTLE_CPU` is a slowdown factor (in this example, a 4x slowdown multiplier)

See [Chrome docs: setCPUThrottlingRate](https://chromedevtools.github.io/devtools-protocol/tot/Emulation#method-setCPUThrottlingRate)

```
SLOW_NETWORK=true pnpm test-e2e
```

`SLOW_NETWORK` emulates a network speed equivalent to "Fast 3G" in the Chrome devtools.

See [Chrome docs: emulateNetworkConditions](https://chromedevtools.github.io/devtools-protocol/tot/Network#method-emulateNetworkConditions) and [NetworkManager.js](https://github.com/ChromeDevTools/devtools-frontend/blob/80c102878fd97a7a696572054007d40560dcdd21/front_end/sdk/NetworkManager.js#L252-L274)

```
OFFLINE=true pnpm test-e2e
```

`OFFLINE` emulates network disconnection.

See [Chrome docs: emulateNetworkConditions](https://chromedevtools.github.io/devtools-protocol/tot/Network#method-emulateNetworkConditions)

### Core Block Testing

Every core block is required to have at least one set of fixture files for its main save function and one for each deprecation. These fixtures test the parsing and serialization of the block. See [the integration tests fixtures readme](https://github.com/wordpress/gutenberg/blob/HEAD/test/integration/fixtures/blocks/README.md) for more information and instructions.

### Flaky Tests

A test is considered to be **flaky** when it can pass and fail across multiple retry attempts without any code changes. We auto retry failed tests at most **twice** on CI to detect and report them to GitHub issues automatically under the [`[Type] Flaky Test`](https://github.com/WordPress/gutenberg/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22%5BType%5D+Flaky+Test%22) label via [`report-flaky-tests`](https://github.com/WordPress/gutenberg/blob/trunk/.github/report-flaky-tests/index.js) GitHub action. Note that a test that failed three times in a row is not counted as a flaky test and will not be reported to an issue.

## PHP Testing

Tests for PHP use [PHPUnit](https://phpunit.de/) as the testing framework. If you're using the built-in [local environment](/docs/contributors/code/getting-started-with-code-contribution.md#local-environment), you can run the PHP tests locally using this command:

```bash
pnpm test-php
```

To re-run tests automatically when files change (similar to Jest), run:

```
pnpm test-php:watch
```

_Note: The phpunit commands require `wp-env` to be running and composer dependencies to be installed. The package script will start wp-env for you if it is not already running._

In other environments, run `composer run test` and `composer run test:watch`.

Code style in PHP is enforced using [PHP_CodeSniffer](https://github.com/squizlabs/PHP_CodeSniffer). It is recommended that you install PHP_CodeSniffer and the [WordPress Coding Standards for PHP_CodeSniffer](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#installation) ruleset using [Composer](https://getcomposer.org/). With Composer installed, run `composer install` from the project directory to install dependencies. The above `pnpm test-php` will execute both unit tests and code linting. Code linting can be verified independently by running `pnpm lint-php`.

To run unit tests only, without the linter, use `pnpm test-unit-php` instead.

[snapshot testing]: https://jestjs.io/docs/en/snapshot-testing.html
[update snapshots]: https://jestjs.io/docs/en/snapshot-testing.html#updating-snapshots

## Performance Testing

To ensure that the editor stays performant as we add features, we monitor the impact pull requests and releases can have on some key metrics:

-   The time it takes to load the editor.
-   The time it takes for the browser to respond when typing.
-   The time it takes to select a block.

Performance tests are end-to-end tests running the editor and capturing these measures. To run the tests, make sure you have an e2e testing environment ready and run the following command:

```
pnpm test-performance
```

This gives you the result for the current branch/code on the running environment.

In addition to that, you can also compare the metrics across branches (or tags or commits) by running the following command `./bin/plugin/cli.js perf [branches]`, example:

```
./bin/plugin/cli.js perf trunk v8.1.0 v8.0.0
```

Finally, you can pass an additional `--tests-branch` argument to specify which branch's performance test files you'd like to run. This is particularly useful when modifying/extending the perf tests:

```
./bin/plugin/cli.js perf trunk v8.1.0 v8.0.0 --tests-branch add/perf-tests-coverage
```

**Note** This command needs may take some time to perform the benchmark. While running make sure to avoid using your computer or have a lot of background process to minimize external factors that can impact the results across branches.
