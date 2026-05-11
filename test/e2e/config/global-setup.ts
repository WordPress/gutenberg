/**
 * External dependencies
 */
import { request } from '@playwright/test';
import type { FullConfig } from '@playwright/test';

/**
 * WordPress dependencies
 */
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { prepareRtcWebSocketProvider } from './rtc-websocket-setup';

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

	// Reset the test environment before running the tests.
	const resetTasks = [
		requestUtils.activateTheme( 'twentytwentyone' ),
		// Disable this test plugin as it's conflicting with some of the tests.
		// We already have reduced motion enabled and Playwright will wait for most of the animations anyway.
		requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		),
		requestUtils.deleteAllPosts(),
		requestUtils.deleteAllBlocks(),
		requestUtils.resetPreferences(),
		...( await prepareRtcWebSocketProvider( requestUtils ) ),
	];

	await Promise.all( resetTasks );

	await requestContext.dispose();
}

export default globalSetup;
