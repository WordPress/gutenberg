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
	const page = await browser.newPage( {
		reducedMotion: 'reduce',
	} );
	const testUtils = new TestUtils( browser, page );

	await testUtils.activateTheme( 'twentytwentyone' );
	await testUtils.deleteAllPosts();
	await testUtils.deleteAllBlocks();

	await browser.close();
}
