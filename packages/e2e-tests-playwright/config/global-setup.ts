/**
 * External dependencies
 */
import { chromium } from '@playwright/test';

/**
 * WordPress dependencies
 */
import { TestUtils } from '@wordpress/e2e-test-utils-playwright';

export default async function setup() {
	const browser = await chromium.launch();
	const context = await browser.newContext( {
		reducedMotion: 'reduce',
	} );
	const page = await context.newPage();
	const testUtils = new TestUtils( page );

	await testUtils.activateTheme( 'twentytwentyone' );
	await testUtils.deleteAllPosts();
	await testUtils.deleteAllBlocks();

	await browser.close();
}
