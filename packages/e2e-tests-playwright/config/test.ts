/**
 * External dependencies
 */
import { test as base, expect, selectors } from '@playwright/test';
import type { Page, ConsoleMessage } from '@playwright/test';
import { selectorScript } from 'role-selector/playwright-test';

/**
 * WordPress dependencies
 */
import { TestUtils } from '@wordpress/e2e-test-utils-playwright';

// Register role selector.
selectors.register( 'role', selectorScript, { contentScript: true } );

let globalPage: Page | null = null;

/**
 * Set of console logging types observed to protect against unexpected yet
 * handled (i.e. not catastrophic) errors or warnings. Each key corresponds
 * to the Playwright ConsoleMessage type, its value the corresponding function
 * on the console global object.
 */
const OBSERVED_CONSOLE_MESSAGE_TYPES = [ 'warn', 'error' ] as const;

/**
 * Adds a page event handler to emit uncaught exception to process if one of
 * the observed console logging types is encountered.
 *
 * @param  message The console message.
 */
function observeConsoleLogging( message: ConsoleMessage ) {
	const type = message.type();
	if (
		! OBSERVED_CONSOLE_MESSAGE_TYPES.includes(
			type as typeof OBSERVED_CONSOLE_MESSAGE_TYPES[ number ]
		)
	) {
		return;
	}

	const text = message.text();

	// An exception is made for _blanket_ deprecation warnings: Those
	// which log regardless of whether a deprecated feature is in use.
	if ( text.includes( 'This is a global warning' ) ) {
		return;
	}

	// A chrome advisory warning about SameSite cookies is informational
	// about future changes, tracked separately for improvement in core.
	//
	// See: https://core.trac.wordpress.org/ticket/37000
	// See: https://www.chromestatus.com/feature/5088147346030592
	// See: https://www.chromestatus.com/feature/5633521622188032
	if ( text.includes( 'A cookie associated with a cross-site resource' ) ) {
		return;
	}

	// Viewing posts on the front end can result in this error, which
	// has nothing to do with Gutenberg.
	if ( text.includes( 'net::ERR_UNKNOWN_URL_SCHEME' ) ) {
		return;
	}

	// TODO: Not implemented yet.
	// Network errors are ignored only if we are intentionally testing
	// offline mode.
	// if (
	// 	text.includes( 'net::ERR_INTERNET_DISCONNECTED' ) &&
	// 	isOfflineMode()
	// ) {
	// 	return;
	// }

	// As of WordPress 5.3.2 in Chrome 79, navigating to the block editor
	// (Posts > Add New) will display a console warning about
	// non - unique IDs.
	// See: https://core.trac.wordpress.org/ticket/23165
	if ( text.includes( 'elements with non-unique id #_wpnonce' ) ) {
		return;
	}

	// Ignore all JQMIGRATE (jQuery migrate) deprecation warnings.
	if ( text.includes( 'JQMIGRATE' ) ) {
		return;
	}

	const logFunction = type as typeof OBSERVED_CONSOLE_MESSAGE_TYPES[ number ];

	// Disable reason: We intentionally bubble up the console message
	// which, unless the test explicitly anticipates the logging via
	// @wordpress/jest-console matchers, will cause the intended test
	// failure.

	// eslint-disable-next-line no-console
	console[ logFunction ]( text );
}

const test = base.extend< {
	testUtils: TestUtils;
} >( {
	page: async ( { browser }, use ) => {
		if ( ! globalPage || globalPage.isClosed() ) {
			globalPage = await browser.newPage( {
				reducedMotion: 'reduce',
				strictSelectors: true,
			} );

			globalPage.on( 'console', observeConsoleLogging );
		}

		await use( globalPage );
	},
	testUtils: async ( { browser, page }, use ) => {
		await use( new TestUtils( browser, page ) );
	},
} );

test.afterEach( async ( { page } ) => {
	// Clear local storage after each test.
	await page.evaluate( () => {
		window.localStorage.clear();
	} );
} );

export { test, expect };
