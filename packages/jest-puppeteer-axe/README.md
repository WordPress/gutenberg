# Jest Puppeteer Axe

[Axe](https://www.deque.com/axe/) (the Accessibility Engine) API integration with [Jest](https://jestjs.io/) and [Puppeteer](https://pptr.dev/).

Defines Jest async matcher to check whether a given Puppeteer's page instance passes [Axe](https://www.deque.com/axe/) accessibility tests.

## Installation

Install the module

```bash
npm install @wordpress/jest-puppeteer-axe --save-dev
```

### Setup

The simplest setup is to use Jest's `setupTestFrameworkScriptFile` config option:

```js
"jest": {
  "setupTestFrameworkScriptFile": "./node_modules/@wordpress/jest-puppeteer-axe/build/index.js"
},
```

If your project already has a script file which sets up the test framework, you will need the following import statement:

```js
import '@wordpress/jest-puppeteer-axe';
```

## Usage

In your Jest test suite add the following code to the test's body:

```js
test( 'checks the test page with Axe', async () => {
	// First, run some code which loads the content of the page.
	loadTestPage();
	
	await expect( page ).toPassAxeTests();
} );
```

It is also possible to pass optional Axe API options to perform customized check:
- `include` - CSS selector to to add the list of elements to include in analysis.
- `exclude` - CSS selector to to add the list of elements to exclude from analysis.

```js
test( 'checks the test component with Axe excluding some button', async () => {

	// First, run some code which loads the content of the page.
	loadPageWithTestComponent();
	
	await expect( page ).toPassAxeTests( {
		include: '.test-component',
		exclude: '.some-button',
	} );
} );
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
