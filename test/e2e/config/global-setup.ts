import path from 'path';
import { request } from '@playwright/test';
import type { FullConfig } from '@playwright/test';
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import { setupRtcWebSocketProvider } from './rtc-websocket-setup';

async function setupSite( baseURL?: string, storageStatePath?: string ) {
	const requestContext = await request.newContext( {
		baseURL,
	} );

	const requestUtils = new RequestUtils( requestContext, {
		baseURL,
		storageStatePath,
	} );

	// Authenticate and save the storageState to disk.
	await requestUtils.setupRest();

	// Reset the test environment before running the tests.
	await Promise.all( [
		requestUtils.activateTheme( 'twentytwentyone' ),
		// Disable this test plugin as it's conflicting with some of the tests.
		// We already have reduced motion enabled and Playwright will wait for most of the animations anyway.
		requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		),
		requestUtils.deleteAllPosts(),
		requestUtils.deleteAllPages(),
		requestUtils.deleteAllBlocks(),
		requestUtils.resetPreferences(),
		setupRtcWebSocketProvider( requestUtils ),
	] );

	await requestContext.dispose();
}

async function globalSetup( config: FullConfig ) {
	const sites = process.env.WP_BASE_URLS?.split( ',' );
	if ( sites ) {
		await Promise.all(
			sites.map( ( site, index ) =>
				setupSite(
					site,
					path.join(
						process.env.WP_ARTIFACTS_PATH!,
						`storage-states/admin-${ index }.json`
					)
				)
			)
		);
		return;
	}

	const { storageState, baseURL } = config.projects[ 0 ].use;
	await setupSite(
		baseURL,
		typeof storageState === 'string' ? storageState : undefined
	);
}

export default globalSetup;
