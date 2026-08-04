/**
 * External dependencies
 */
import { defineConfig, type PlaywrightTestConfig } from '@playwright/test';

/**
 * Internal dependencies
 */
import baseConfig from './playwright.config';

const wsPort = process.env.GUTENBERG_RTC_PHP_WS_PORT || '18992';
process.env.GUTENBERG_RTC_PHP_WS_PORT = wsPort;

// Activates the PHP WebSocket transport plugin in globalSetup (see
// test/e2e/config/rtc-transport-setup.ts).
process.env.GUTENBERG_RTC_TEST_PHP_WS = '1';

type ArrayElement< T > = T extends Array< infer Item > ? Item : T;
type WebServerConfig = ArrayElement<
	Exclude< PlaywrightTestConfig[ 'webServer' ], undefined >
>;

const baseWebServer: WebServerConfig[] = [];
if ( Array.isArray( baseConfig.webServer ) ) {
	baseWebServer.push( ...baseConfig.webServer );
} else if ( baseConfig.webServer ) {
	baseWebServer.push( baseConfig.webServer );
}

const baseTestIgnore: Array< string | RegExp > = [];
if ( Array.isArray( baseConfig.testIgnore ) ) {
	baseTestIgnore.push( ...baseConfig.testIgnore );
} else if ( baseConfig.testIgnore ) {
	baseTestIgnore.push( baseConfig.testIgnore );
}
const testIgnore = baseTestIgnore.filter(
	( ignore ) =>
		ignore !== '**/specs/editor/collaboration/php-websocket-only/**'
);

const config = defineConfig( {
	...baseConfig,
	// Run the shared RTC specs plus anything specific to the PHP WebSocket
	// transport under `php-websocket-only/`. Specs that exercise
	// HTTP-polling-specific semantics live under `http-only/` and specs for
	// other transports under `websocket-only/` and `long-polling-only/`;
	// all are excluded here.
	testMatch: '**/specs/editor/collaboration/**/collaboration-*.spec.ts',
	testIgnore: [ ...testIgnore, '**/specs/editor/collaboration/http-only/**' ],
	webServer: [
		...baseWebServer,
		{
			// Starts `wp collaboration sync-server` inside the wp-env tests
			// environment with the WebSocket port published to the host.
			command: `exec node ./bin/rtc-php-ws-sync-server.mjs --port ${ wsPort }`,
			reuseExistingServer:
				process.env.GUTENBERG_RTC_PHP_WS_REUSE_SERVER === '1',
			stderr: 'pipe',
			stdout: 'pipe',
			timeout: 180_000,
			url: `http://127.0.0.1:${ wsPort }/health`,
		},
	],
} );

export default config;
