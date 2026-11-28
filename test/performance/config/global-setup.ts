import { request } from '@playwright/test';
import type { FullConfig } from '@playwright/test';
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

async function globalSetup( config: FullConfig ) {
	const { storageState, baseURL } = config.projects[ 0 ].use;
	const storageStatePath =
		typeof storageState === 'string' ? storageState : undefined;

	const requestContext = await request.newContext( {
		baseURL,
	} );

	const requestUtils = new RequestUtils( requestContext, {
		storageStatePath,
	} );

	// Authenticate and save the storageState to disk.
	await requestUtils.setupRest();

	// Switch the theme before sending any other request. WordPress saves the
	// parent theme and the active theme one after the other, so a request
	// that arrives in between loads a mix of the old and new themes.
	await requestUtils.activateTheme( 'twentytwentyone' );

	// Reset the test environment before running the tests.
	await Promise.all( [
		// Disable this test plugin as it's conflicting with some of the tests.
		// We already have reduced motion enabled and Playwright will wait for most of the animations anyway.
		requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		),
		requestUtils.deleteAllPosts(),
		requestUtils.deleteAllPages(),
		requestUtils.deleteAllBlocks(),
		requestUtils.resetPreferences(),
	] );

	await requestContext.dispose();
}

export default globalSetup;
