/**
 * External dependencies
 */
import path from 'node:path';
import { request } from '@playwright/test';
import type { FullConfig } from '@playwright/test';
import { build as esbuildBuild } from 'esbuild';

/**
 * WordPress dependencies
 */
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

async function buildTestWebSocketProvider() {
	const pluginDir = path.resolve(
		__dirname,
		'../../../packages/e2e-tests/plugins/rtc-websocket-provider'
	);
	await esbuildBuild( {
		entryPoints: [ path.join( pluginDir, 'src/index.js' ) ],
		outfile: path.join( pluginDir, 'build/index.js' ),
		bundle: true,
		format: 'iife',
		target: 'es2020',
		alias: { yjs: path.join( pluginDir, 'src/yjs-external.js' ) },
		logLevel: 'warning',
	} );
}

async function resetTestWebSocketSyncServer() {
	const wsUrl =
		process.env.GUTENBERG_RTC_TEST_WS_URL ||
		`ws://127.0.0.1:${ process.env.GUTENBERG_RTC_TEST_WS_PORT || '18991' }`;
	const resetUrl = new URL( wsUrl );
	resetUrl.protocol = resetUrl.protocol === 'wss:' ? 'https:' : 'http:';
	resetUrl.pathname = '/reset';
	resetUrl.search = '';
	resetUrl.hash = '';

	let lastError: unknown;
	for ( let attempts = 0; attempts < 20; attempts++ ) {
		try {
			const response = await fetch( resetUrl, { method: 'POST' } );
			if ( response.ok || response.status === 204 ) {
				return;
			}
			lastError = new Error(
				`WebSocket sync server reset failed with HTTP ${ response.status }`
			);
		} catch ( error ) {
			lastError = error;
		}

		await new Promise( ( resolve ) => setTimeout( resolve, 250 ) );
	}

	throw lastError;
}

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
	];

	const useTestWebSocketProvider =
		process.env.GUTENBERG_RTC_TEST_WS_PROVIDER === '1';

	if ( useTestWebSocketProvider ) {
		await buildTestWebSocketProvider();

		if ( process.env.GUTENBERG_RTC_TEST_WS_SKIP_RESET !== '1' ) {
			resetTasks.push( resetTestWebSocketSyncServer() );
		}

		resetTasks.push(
			requestUtils.activatePlugin(
				'gutenberg-test-plugin-rtc-websocket-provider'
			)
		);
	} else {
		resetTasks.push(
			requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-rtc-websocket-provider'
			)
		);
	}

	await Promise.all( resetTasks );

	await requestContext.dispose();
}

export default globalSetup;
