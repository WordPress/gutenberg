/**
 * External dependencies
 */
import { defineConfig } from '@playwright/test';

/**
 * Internal dependencies
 */
import baseConfig from './playwright.config';

// Activates the long-polling transport plugin in globalSetup (see
// test/e2e/config/rtc-transport-setup.ts).
process.env.GUTENBERG_RTC_TEST_LONG_POLLING = '1';

const baseTestIgnore: Array< string | RegExp > = [];
if ( Array.isArray( baseConfig.testIgnore ) ) {
	baseTestIgnore.push( ...baseConfig.testIgnore );
} else if ( baseConfig.testIgnore ) {
	baseTestIgnore.push( baseConfig.testIgnore );
}
const testIgnore = baseTestIgnore.filter(
	( ignore ) =>
		ignore !== '**/specs/editor/collaboration/long-polling-only/**'
);

const config = defineConfig( {
	...baseConfig,
	// Run the shared RTC specs plus anything long-polling-specific under
	// `long-polling-only/`, with the HTTP long-polling transport selected by
	// the plugin activated in globalSetup. Specs that exercise
	// HTTP-polling-specific semantics live under `http-only/` and specs for
	// other transports under `websocket-only/` and `php-websocket-only/`;
	// all are excluded here.
	testMatch: '**/specs/editor/collaboration/**/collaboration-*.spec.ts',
	testIgnore: [ ...testIgnore, '**/specs/editor/collaboration/http-only/**' ],
} );

export default config;
