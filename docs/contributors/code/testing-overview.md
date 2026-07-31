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

## JavaScript testing

Tests for JavaScript use [Vitest](https://vitest.dev/) for assertions,
mocks, spies, and test lifecycle APIs. Vitest globals are disabled. Import the
APIs used by each test from `vitest`. React component tests continue to use
[React Testing Library](https://testing-library.com/docs/react-testing-library/intro).

_It should be noted that in the past, React components were unit tested with [Enzyme](https://github.com/airbnb/enzyme). However, React Testing Library (RTL) is now used for all existing and new tests instead._

Assuming you've followed the [instructions](/docs/contributors/code/getting-started-with-code-contribution.md) to install Node and project dependencies, tests can be run from the command-line with NPM:

```
npm test
```

Linting is static code analysis used to enforce coding standards and to avoid potential errors. This project uses [ESLint](https://eslint.org/) and [TypeScript's JavaScript type-checking](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html) to capture these issues. While the above `npm test` will execute both unit tests and code linting, code linting can be verified independently by running `npm run lint`. Some JavaScript issues can be fixed automatically by running `npm run lint:js:fix`.

To improve your developer workflow, you should setup an editor linting integration. See the [getting started documentation](/docs/contributors/code/getting-started-with-code-contribution.md) for additional information.

To run unit tests only, without the linter, use `npm run test:unit`. Pass a file
or directory to run a focused subset:

```sh
npm run test:unit -- packages/components/src/button/test
```

### Browser Mode

Node.js is the default test environment. Use `*.jsdom.test.*` for component
tests that need a DOM and React Testing Library. Use
[Vitest Browser Mode](https://vitest.dev/guide/browser/) when behavior depends
on a real browser, such as native focus, keyboard or pointer events, portals,
layout, real CSS, or browser APIs.

Keep Browser Mode tests beside the component and opt in with a
`*.browser.test.js`, `*.browser.test.jsx`, `*.browser.test.ts`, or
`*.browser.test.tsx` filename. The suffix selects the Browser project
automatically; do not add the test to a central list or move it to a separate
test tree. Browser tests can use `vitest-browser-react` for rendering and
`vitest/browser` for locators and user interactions.

Browser coverage is intentionally adopted incrementally. Existing jsdom tests
do not need to move unless real-browser behavior materially improves what the
test verifies.

### Folder structure

Keep your tests in a `test` folder in your working directory. The test file should have the same name as the test subject file.

Use `*.jsdom.test.*` for DOM structure, semantics, events, state, and other
behavior that does not depend on browser rendering. Use `*.browser.test.*` for
generated or computed styles, cascade, responsive behavior, layout, geometry,
rendered visibility, animation, scrolling, observers, and media queries.
Browser Mode loads real CSS and uses browser APIs. Keep deterministic browser
API mocks local to nonvisual tests and restore them afterwards. Leave
Node-compatible test names without an environment suffix. The filename selects
the Vitest project.

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
import { describe, test } from 'vitest';

describe( 'CheckboxWithLabel', () => {
    test( 'checking checkbox should disable the form submit button', () => {
        ...
    } );
} );
```

**Not so good**

```javascript
import { describe, test } from 'vitest';

describe( 'CheckboxWithLabel', () => {
    test( 'checking checkbox should set this.state.disableButton to `true`', () => {
        ...
    } );
} );
```

### Setup and teardown methods

Vitest includes [setup and teardown methods](https://vitest.dev/api/#setup-and-teardown)
that run before or after each test, file, or `describe` block.

These methods support asynchronous code. Return a Promise and Vitest will wait
for it to resolve:

```javascript
import { afterAll, beforeAll } from 'vitest';

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

Often our code will use methods and properties from imported external and
internal libraries in multiple places, which makes passing around arguments
messy and impracticable. For these cases `vi.mock` can stub the dependency.

For instance, lets assume we have `config` module to control a great deal of functionality via feature flags.

```javascript
// bilbo.js
import config from 'config';
export const isBilboVisible = () =>
	config.isEnabled( 'the-ring' ) ? false : true;
```

To test the behaviour under each condition, stub the config object and use a
Vitest mock function to control the return value of `isEnabled`.

```javascript
// test/bilbo.js
import { describe, expect, test, vi } from 'vitest';
import { isEnabled } from 'config';
import { isBilboVisible } from '../bilbo';

vi.mock( 'config', () => ( {
	// bilbo is visible by default
	isEnabled: vi.fn( () => false ),
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

Use [Vitest spies](https://vitest.dev/api/vi.html#vi-spyon) to test code that
calls global methods.

```javascript
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { myModuleFunctionThatOpensANewWindow } from '../my-module';

describe( 'my module', () => {
	beforeAll( () => {
		vi.spyOn( global, 'open' ).mockImplementation( () => true );
	} );

	test( 'something', () => {
		myModuleFunctionThatOpensANewWindow();
		expect( global.open ).toHaveBeenCalled();
	} );
} );
```

### User interactions

Simulating user interactions is a great way to **write tests from the user's perspective**, and therefore avoid testing implementation details.

When writing tests with Testing Library, there are two main alternatives for simulating user interactions:

1. The [`fireEvent`](https://testing-library.com/docs/dom-testing-library/api-events/#fireevent) API, a utility for firing DOM events part of the Testing Library core API.
2. The [`user-event`](https://testing-library.com/docs/user-event/intro/) library, a companion library to Testing Library that simulates user interactions by dispatching the events that would happen if the interaction took place in a browser.

The built-in `fireEvent` is a utility for dispatching DOM events. It dispatches exactly the events that are described in the test spec - even if those exact events never had been dispatched in a real interaction in a browser.

On the other hand, the `user-event` library exposes higher-level methods (e.g. `type`, `selectOptions`, `clear`, `doubleClick`...), that dispatch events like they would happen if a user interacted with the document, and take care of any react-specific quirks.

For the above reasons, **the `user-event` library is recommended when writing tests for user interactions**.

**Not so good**: using `fireEvent` to dispatch DOM events.

```javascript
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';

test( 'fires onChange when a new value is typed', () => {
	const spyOnChange = vi.fn();

	// A component with one `input` and one `select`.
	render( <MyComponent onChange={ spyOnChange } /> );

	const input = screen.getByRole( 'textbox' );
	input.focus();
	// No clicks, no key events.
	fireEvent.change( input, { target: { value: 62 } } );

	// The `onChange` callback gets called once with '62' as the argument.
	expect( spyOnChange ).toHaveBeenCalledTimes( 1 );

	const select = screen.getByRole( 'listbox' );
	select.focus();
	// No pointer events dispatched.
	fireEvent.change( select, { target: { value: 'optionValue' } } );

	// ...
```

**Good**: using `user-event` to simulate user events.

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

test( 'fires onChange when a new value is typed', async () => {
	const user = userEvent.setup();

	const spyOnChange = vi.fn();

	// A component with one `input` and one `select`.
	render( <MyComponent onChange={ spyOnChange } /> );

	const input = screen.getByRole( 'textbox' );
	// Focus the element, select and delete all its contents.
	await user.clear( input );
	// Click the element, type each character separately (generating keydown,
	// keypress and keyup events).
	await user.type( input, '62' );

	// The `onChange` callback gets called 3 times with the following arguments:
	// - 1: clear ('')
	// - 2: '6'
	// - 3: '62'
	expect( spyOnChange ).toHaveBeenCalledTimes( 3 );

	const select = screen.getByRole( 'listbox' );
	// Dispatches events for focus, pointer, mouse, click and change.
	await user.selectOptions( select, [ 'optionValue' ] );

	// ...
} );
```

### Integration testing for block UI

Integration testing is defined as a type of testing where different parts are tested as a group. In this case, the parts that we want to test are the different components that are required to be rendered for a specific block or editor logic. In the end, they are very similar to unit tests as they are run with the same command using Vitest. The main difference is that for the integration tests the blocks are run within a [`special instance of the block editor`](https://github.com/WordPress/gutenberg/blob/trunk/test/integration/helpers/integration-test-editor.jsx#L60).

The advantage of this approach is that the bulk of a block editor's functionality (block toolbar and inspector panel interactions, etc.) can be tested without having to fire up the full e2e test framework. This means the tests can run much faster and more reliably. It is suggested that as much of a block's UI functionality as possible is covered with integration tests, with e2e tests used for interactions that require a full browser environment, eg. file uploads, drag and drop, etc.

[`The Cover block`](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/cover/test/edit.browser.test.js) is an example of a block that uses this level of testing to provide coverage for a large percentage of the editor interactions.

To set up a test file for integration tests:

```js
import { initializeEditor } from 'test/integration/helpers/integration-test-editor';

async function setup( attributes ) {
	const testBlock = { name: 'core/cover', attributes };
	return initializeEditor( testBlock );
}
```

The `initializeEditor` function returns the output of the `@testing-library/react` `render` method. It will also accept an array of block metadata objects, allowing you to set up the editor with multiple blocks.

The integration test editor module also exports a `selectBlock` which can be used to select the block to be tested by the aria-label on the block wrapper, eg. "Block: Cover".

### Snapshot testing

This is an overview of [snapshot testing] and how to best leverage snapshot tests.

#### TL;DR Broken snapshots

When a snapshot test fails, it just means that a component's rendering has changed. If that was unintended, then the snapshot test just prevented a bug 😊

However, if the change was intentional, follow these steps to update the snapshot. Run the following to update the snapshots:

```sh
# --testPathPatterns is optional but will be much faster by only running matching tests
npm run test:unit -- --updateSnapshot --testPathPatterns path/to/tests

# Update snapshot for e2e tests
npm run test:e2e -- --update-snapshots path/to/spec
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

		expect( container ).toMatchSnapshot();
	} );

	test( 'should contain mars if planets is true', () => {
		const { container } = render( <SolarSystem planets /> );

		expect( container ).toMatchSnapshot();
		expect( screen.getByText( /mars/i ) ).toBeInTheDocument();
	} );
} );
```

Reducer tests are also a great fit for snapshots. They are often large, complex data structures that shouldn't change unexpectedly, exactly what snapshots excel at!

#### Working with snapshots

CI fails when snapshots do not match. Review each change and, when the new
output is intentional, update the focused snapshot with Vitest:

```sh
npm run test:unit -- path/to/tests --update
```

Keep `npm run test:unit:watch` running in the background while you work.
Vitest reruns affected tests and supports pressing `u` to update a failed
snapshot.

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
	expect( container ).toMatchSnapshot();

	// This is what we actually expect to find in our test
	expect( screen.getByText( /mars/i ) ).toBeInTheDocument();
} );
```

Another good technique is to use Gutenberg's `toMatchDiffSnapshot` matcher,
which snapshots only the difference between two states of the DOM. This is
useful for testing the effect of a prop change while producing a smaller
snapshot:

```jsx
test( 'should render a darker background when isShady is true', () => {
	const { container } = render( <CardBody>Body</CardBody> );
	const { container: containerShady } = render(
		<CardBody isShady>Body</CardBody>
	);
	expect( container ).toMatchDiffSnapshot( containerShady );
} );
```

Test rendered style behavior in Browser Mode with a narrow computed-style or behavior assertion. This verifies the browser result instead of a serialized representation of generated styles:

```jsx
test( 'should render margin', () => {
	render( <Spacer data-testid="spacer" margin={ 5 } /> );
	expect( getComputedStyle( screen.getByTestId( 'spacer' ) ).marginTop ).toBe(
		'20px'
	);
} );
```

#### Troubleshooting

Sometimes we need to mock refs for some stories which use them. Check the following documents to learn more:

-   Why we need to use [Mocking Refs for Snapshot Testing](https://reactjs.org/blog/2016/11/16/react-v15.4.0.html#mocking-refs-for-snapshot-testing) with React.

In that case, you might see test failures and `TypeError` messages on lines
that access a property from `ref.current`.

### Debugging Vitest unit tests

Running `npm run test:unit:debug` will start the tests in debug mode so a [node inspector client](https://nodejs.org/en/learn/getting-started/debugging#inspector-clients) can connect to the process and inspect the execution. Instructions for using Google Chrome or Visual Studio Code as an inspector client can be found in the [wp-scripts documentation](/packages/scripts/README.md#debugging-tests).

## End-to-end testing

End-to-end tests use [Playwright](https://playwright.dev/) as the testing framework. See the dedicated [End-to-End Testing guide](/docs/contributors/code/e2e/README.md) for best practices and detailed instructions.

### Using wp-env

If you're using the built-in [local environment](/docs/contributors/code/getting-started-with-code-contribution.md#local-environment), you can run the e2e tests locally using this command:

```bash
npm run test:e2e
```

or interactively

```bash
npm run test:e2e -- --ui
```

### Scenario testing

If you find that end-to-end tests pass when run locally, but fail in GitHub Actions, you may be able to isolate a CPU- or network-bound race condition by simulating a slow CPU or network:

```bash
THROTTLE_CPU=4 npm run test:e2e
```

`THROTTLE_CPU` is a slowdown factor (in this example, a 4x slowdown multiplier)

See [Chrome docs: setCPUThrottlingRate](https://chromedevtools.github.io/devtools-protocol/tot/Emulation#method-setCPUThrottlingRate)

```
SLOW_NETWORK=true npm run test:e2e
```

`SLOW_NETWORK` emulates a network speed equivalent to "Fast 3G" in the Chrome devtools.

See [Chrome docs: emulateNetworkConditions](https://chromedevtools.github.io/devtools-protocol/tot/Network#method-emulateNetworkConditions) and [NetworkManager.js](https://github.com/ChromeDevTools/devtools-frontend/blob/80c102878fd97a7a696572054007d40560dcdd21/front_end/sdk/NetworkManager.js#L252-L274)

```
OFFLINE=true npm run test:e2e
```

`OFFLINE` emulates network disconnection.

See [Chrome docs: emulateNetworkConditions](https://chromedevtools.github.io/devtools-protocol/tot/Network#method-emulateNetworkConditions)

### Core block testing

Every core block is required to have at least one set of fixture files for its main save function and one for each deprecation. These fixtures test the parsing and serialization of the block. See [the integration tests fixtures readme](https://github.com/wordpress/gutenberg/blob/HEAD/test/integration/fixtures/blocks/README.md) for more information and instructions.

### Flaky tests

A test is considered to be **flaky** when it can pass and fail across multiple retry attempts without any code changes. We auto retry failed tests at most **twice** on CI to detect them, and report them, together with their errors, as a single comment on the pull request via the [`report-flaky-tests`](https://github.com/WordPress/gutenberg/tree/trunk/packages/report-flaky-tests) GitHub action. Note that a test that failed three times in a row is not counted as a flaky test and will not be reported, and that flaky tests are only reported on pull requests.

## PHP testing

Tests for PHP use [PHPUnit](https://phpunit.de/) as the testing framework. If you're using the built-in [local environment](/docs/contributors/code/getting-started-with-code-contribution.md#local-environment), you can run the PHP tests locally using this command:

```bash
npm run test:php
```

To re-run tests automatically when files change, run:

```
npm run test:php:watch
```

_Note: The phpunit commands require `wp-env` to be running and composer dependencies to be installed. The package script will start wp-env for you if it is not already running._

In other environments, run `composer run test` and `composer run test:watch`.

Code style in PHP is enforced using [PHP_CodeSniffer](https://github.com/PHPCSStandards/PHP_CodeSniffer). It is recommended that you install PHP_CodeSniffer and the [WordPress Coding Standards for PHP_CodeSniffer](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#installation) ruleset using [Composer](https://getcomposer.org/). With Composer installed, run `composer install` from the project directory to install dependencies. The above `npm run test:php` will execute both unit tests and code linting. Code linting can be verified independently by running `npm run lint:php`.

To run unit tests only, without the linter, use `npm run test:unit:php` instead.

### Testing Prefixed Functions

Gutenberg's build system automatically prefixes PHP functions with `gutenberg_` to avoid conflicts with WordPress Core. When writing tests for block functions, you must test the **built (prefixed) versions** of functions, not the source versions.

If the tests are backported to WordPress Core, then they must be updated to test the non-prefixed functions.

#### Writing Tests for Prefixed Functions & Classes

Always test the built (prefixed) function names and class names in your PHPUnit tests:

```php
// phpunit/blocks/my-block-test.php
class My_Block_Test extends WP_UnitTestCase {
    public function test_my_function() {
        // Test the built function (with gutenberg_ prefix)
        $result = gutenberg_block_core_my_block_render_function( $args );
        $this->assertEquals( $expected, $result );
    }

    public function test_my_class() {
        // Test the built class (with _Gutenberg suffix)
        $handler = new WP_Example_Block_Handler_Gutenberg();
        $result = $handler->process( $input );
        $this->assertEquals( $expected, $result );
    }
}
```

For more detailed information about the build system and function prefixing, see the [Build System: Function Prefixing and Block Loading](/docs/contributors/code/build-system-function-prefixing.md) documentation.

[snapshot testing]: https://vitest.dev/guide/snapshot.html
[update snapshots]: https://vitest.dev/guide/snapshot.html#updating-snapshots

## Performance testing

To ensure that the editor stays performant as we add features, we monitor the impact pull requests and releases can have on some key metrics including:

-   The time it takes to load the editor.
-   The time it takes for the browser to respond when typing.
-   The time it takes to select a block.

Performance tests are end-to-end tests running the editor and capturing these measures. Make sure you have an e2e testing environment ready.

To set up the e2e testing environment, checkout the Gutenberg repository and switch to the branch that you would like to test. Run the following command to prepare the environment.

```
nvm use && npm install
npm run build
```

To run the tests run the following command:

```
npm run test:performance
```

This gives you the result for the current branch/code on the running environment.

In addition to that, you can also compare the metrics across branches (or tags or commits) by running the following command `npm exec release-cli -- perf [branches]`, example:

```
npm exec release-cli -- perf trunk v8.1.0 v8.0.0
```

Finally, you can pass an additional `--tests-branch` argument to specify which branch's performance test files you'd like to run. This is particularly useful when modifying/extending the perf tests:

```
npm exec release-cli -- perf trunk v8.1.0 v8.0.0 --tests-branch add/perf-tests-coverage
```

**Note** This command needs may take some time to perform the benchmark. While running make sure to avoid using your computer or have a lot of background process to minimize external factors that can impact the results across branches.
