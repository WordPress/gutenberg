# Jest Puppeteer Axe

[Axe](https://www.deque.com/axe/) (the Accessibility Engine) API integration with [Jest](https://jestjs.io/) and [Puppeteer](https://pptr.dev/).

Defines Jest async matcher to check whether a given Puppeteer's page instance passes [Axe](https://www.deque.com/axe/) accessibility tests.

## Installation

Install the module

```bash
npm install @wordpress/jest-puppeteer-axe --save-dev
```

### Setup

The simplest setup is to use Jest's `setupFilesAfterEnv` config option:

```js
"jest": {
  "setupFilesAfterEnv": [
    "@wordpress/jest-puppeteer-axe"
  ]
},
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

It is also possible to pass optional params which allow Axe API to perform customized checks:
- `include` - CSS selector(s) to to add the list of elements to include in analysis.
- `exclude` - CSS selector(s) to to add the list of elements to exclude from analysis.
- `disabledRules` - the list of [Axe rules](https://github.com/dequelabs/axe-core/blob/master/doc/rule-descriptions.md) to skip from verification.
- `options` - a flexible way to configure how Axe run operates. See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#options-parameter) for information on the object structure.
- `config` - Axe configuration object. See [axe-core API documentation](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure) for documentation on the object structure.

```js
test( 'checks the test component with Axe excluding some button', async () => {

	// First, run some code which loads the content of the page.
	loadPageWithTestComponent();
	
	await expect( page ).toPassAxeTests( {
		include: '.test-component',
		exclude: '.some-button',
		disabledRules: [ 'aria-allowed-role' ],
		options: { iframes: false },
		config: { reporter: 'raw' },
	} );
} );
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
