/**
 * External dependencies
 */
import { test, expect } from '@playwright/test';

test.use( { baseURL: 'https://playground.wordpress.net' } );

test( 'WP Editor default view', async ( { context, page } ) => {
	if ( process.env.PR_NUMBER ) {
		// 1. Go to the Gutenberg PR Preview page and submit the PR number.
		await page.goto( `/gutenberg.html?pr=${ process.env.PR_NUMBER }` );
	} else {
		// 1. Go to the WordPress Playground (Gutenberg plugin disabled).
		await page.goto( '/' );
	}

	// 2. Get the URL of the iframed WordPress instance so we can strip the
	//    Playground UI off.
	await page.waitForFunction( 'window?.playground?.absoluteUrl' );
	const wpIframeURL = await page.evaluate(
		async () => await window.playground.absoluteUrl
	);

	// 3. Open WordPress in a new page in the same context. We need to keep the
	//    original page open so the Playground instance is not destroyed.
	const wpPage = await context.newPage();

	await wpPage.goto( wpIframeURL + '/wp-admin/post-new.php' );
	await wpPage.getByLabel( 'Close', { exact: true } ).click(); // Close the Welcome Guide.

	// 4. Add an extra wait for the UI to stabilize.
	await wpPage.waitForTimeout( 5_000 );

	// 5. Here, some UI manipulation can be done. For example:
	await wpPage.keyboard.type( 'Hello, World!' );

	// 6. Compare the screenshot of the full page.
	await expect( wpPage ).toHaveScreenshot( { fullPage: true } );
} );
