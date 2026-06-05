/**
 * External dependencies
 */
import { defineConfig, type PlaywrightTestConfig } from '@playwright/test';

/**
 * Internal dependencies
 */
import baseConfig from './playwright.config';

if ( process.env.CI && process.env.GUTENBERG_RTC_TEST_WS_ALLOW_CI !== '1' ) {
	throw new Error(
		'RTC WebSocket e2e tests are local-only. They are intentionally disabled in CI.'
	);
}

const wsPort = process.env.GUTENBERG_RTC_TEST_WS_PORT || '18991';
process.env.GUTENBERG_RTC_TEST_WS_PORT = wsPort;
process.env.GUTENBERG_RTC_TEST_WS_PROVIDER = '1';
process.env.GUTENBERG_RTC_TEST_WS_URL =
	process.env.GUTENBERG_RTC_TEST_WS_URL || `ws://127.0.0.1:${ wsPort }`;

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
	( ignore ) => ignore !== '**/specs/editor/collaboration/websocket-only/**'
);

const config = defineConfig( {
	...baseConfig,
	// Run the shared RTC specs plus anything WebSocket-specific under
	// `websocket-only/`, with the test WebSocket provider activated by
	// globalSetup. Specs that exercise HTTP-polling-specific semantics
	// (connection limits, wp-sync polling responses, document-size
	// errors that surface via the polling pipeline) live under
	// `http-only/` and are excluded here.
	testMatch: '**/specs/editor/collaboration/**/collaboration-*.spec.ts',
	testIgnore: [ ...testIgnore, '**/specs/editor/collaboration/http-only/**' ],
	webServer: [
		...baseWebServer,
		{
			command: `exec node ./bin/rtc-test-ws-sync-server.mjs --port ${ wsPort }`,
			reuseExistingServer:
				process.env.GUTENBERG_RTC_TEST_WS_REUSE_SERVER === '1',
			stderr: 'pipe',
			stdout: 'pipe',
			url: `http://127.0.0.1:${ wsPort }/health`,
		},
	],
} );

export default config;
