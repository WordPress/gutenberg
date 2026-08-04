/**
 * Transport-selection globalSetup pieces for the RTC transport suites.
 *
 * The long-polling and PHP WebSocket suites each activate a tiny e2e plugin
 * that filters `wp_collaboration_transport` (and, for WebSocket, the
 * `wp_sync_websocket_url`). Activated by playwright.rtc-long-polling.config.ts
 * and playwright.rtc-php-websocket.config.ts via env vars. When a suite is
 * inactive its plugin is deactivated so a stale activation from a previous
 * run doesn't bleed into other suites.
 */

/**
 * WordPress dependencies
 */
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

const LONG_POLLING_PLUGIN = 'gutenberg-test-plugin-rtc-long-polling-transport';
const PHP_WEBSOCKET_PLUGIN =
	'gutenberg-test-plugin-rtc-php-websocket-transport';

/**
 * Activate/deactivate the long-polling transport plugin for a globalSetup run.
 *
 * @param requestUtils RequestUtils instance for plugin activation calls.
 */
export async function setupRtcLongPollingTransport(
	requestUtils: RequestUtils
): Promise< void > {
	if ( process.env.GUTENBERG_RTC_TEST_LONG_POLLING === '1' ) {
		await requestUtils.activatePlugin( LONG_POLLING_PLUGIN );
		return;
	}

	await requestUtils.deactivatePlugin( LONG_POLLING_PLUGIN );
}

/**
 * Activate/deactivate the PHP WebSocket transport plugin for a globalSetup run.
 *
 * @param requestUtils RequestUtils instance for plugin activation calls.
 */
export async function setupRtcPhpWebSocketTransport(
	requestUtils: RequestUtils
): Promise< void > {
	if ( process.env.GUTENBERG_RTC_TEST_PHP_WS === '1' ) {
		await requestUtils.activatePlugin( PHP_WEBSOCKET_PLUGIN );
		return;
	}

	await requestUtils.deactivatePlugin( PHP_WEBSOCKET_PLUGIN );
}
