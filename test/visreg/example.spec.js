/**
 * External dependencies
 */
import { test as base, expect } from '@playwright/test';

const PLAYGROUND_URL = 'https://playground.wordpress.net';

const test = base.extend( {
	// Set up the baseURL fixture for the test. This will be the URL of the
	// WordPress instance in Playground.
	baseURL: async ( { context }, use ) => {
		const page = await context.newPage();

		if ( process.env.PR_NUMBER ) {
			// 1. Go to the Gutenberg PR Preview page and submit the PR number.
			await page.goto(
				`${ PLAYGROUND_URL }/gutenberg.html?pr=${ process.env.PR_NUMBER }`
			);
		} else {
			// 1. Go to the WordPress Playground (Gutenberg plugin disabled).
			await page.goto( PLAYGROUND_URL );
		}

		// 2. Wait for WordPress to be fully provisioned.
		await expect(
			page
				.frameLocator( 'iframe#playground-viewport' )
				.frameLocator( 'iframe#wp' )
				.getByRole( 'menuitem', { name: 'My WordPress Website' } )
		).toBeVisible( { timeout: 30_000 } );

		// 3. Get the URL of the iframed WordPress instance.
		const wpURL = await page.evaluate(
			async () => await window.playground.absoluteUrl
		);

		// 4. Set the base URL for the test.
		await use( wpURL );
	},

	// Set up the page fixture for the test. This will be a new page in the same
	// context as the Playground's WordPress instance.
	page: async ( { context }, use ) => {
		const page = await context.newPage();

		await use( page );

		await page.close();
	},
} );

// With Playground, we can spin up a fresh WP for each test (via the baseURL
// fixture above). It means we can run all the tests in the full parallel mode!
test.describe.configure( { mode: 'parallel' } );

/*
 * The tests below are just examples to show how to use the Playwright API to
 * take visual snapshots of the WordPress Editor UI. They are not meant to be a
 * comprehensive test suite.
 */

test( 'WP Editor default view', async ( { page, baseURL } ) => {
	await page.goto( baseURL + '/wp-admin/post-new.php' );
	await page.pause();
	await page
		.getByLabel( 'Welcome to the block editor' )
		.getByLabel( 'Close' )
		.click();

	// Wait for the UI to stabilize. Not ideal, but good enough for the PoC.
	await page.waitForTimeout( 5_000 ); // eslint-disable-line no-restricted-syntax

	await page.keyboard.type( 'Hello, World!' );

	await expect( page ).toHaveScreenshot( { fullPage: true } );
} );

test( 'WP Site Editor "Pages" view', async ( { page, baseURL } ) => {
	await page.goto( baseURL + '/wp-admin/site-editor.php?path=%2Fpage' );

	// Wait for the UI to stabilize. Not ideal, but good enough for the PoC.
	await page.waitForTimeout( 5_000 ); // eslint-disable-line no-restricted-syntax

	await expect( page ).toHaveScreenshot( { fullPage: true } );
} );
