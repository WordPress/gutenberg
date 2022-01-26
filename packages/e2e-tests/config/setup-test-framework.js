/**
 * External dependencies
 */
import path from 'path';
import { get } from 'lodash';
import { toMatchInlineSnapshot, toMatchSnapshot } from 'jest-snapshot';

/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	activateTheme,
	clearLocalStorage,
	enablePageDialogAccept,
	isOfflineMode,
	setBrowserViewport,
	trashAllPosts,
	__experimentalSetupRest as setupRest,
} from '@wordpress/e2e-test-utils';

/**
 * Timeout, in seconds, that the test should be allowed to run.
 *
 * @type {string|undefined}
 */
const PUPPETEER_TIMEOUT = process.env.PUPPETEER_TIMEOUT;

/**
 * CPU slowdown factor, as a numeric multiplier.
 *
 * @type {string|undefined}
 */
const THROTTLE_CPU = process.env.THROTTLE_CPU;

/**
 * Network download speed, in bytes per second.
 *
 * @type {string|undefined}
 */
const SLOW_NETWORK = process.env.SLOW_NETWORK;

/**
 * Admin storage state path.
 *
 * @type {string|undefined}
 */
let adminStorageStatePath = process.env.ADMIN_STORAGE_STATE_PATH;
if ( adminStorageStatePath && ! path.isAbsolute( adminStorageStatePath ) ) {
	adminStorageStatePath = path.resolve(
		process.cwd(),
		adminStorageStatePath
	);
}

/**
 * Emulate no internet connection.
 *
 * @type {string|undefined}
 */
const OFFLINE = process.env.OFFLINE;

/**
 * Set of console logging types observed to protect against unexpected yet
 * handled (i.e. not catastrophic) errors or warnings. Each key corresponds
 * to the Puppeteer ConsoleMessage type, its value the corresponding function
 * on the console global object.
 *
 * @type {Object<string,string>}
 */
const OBSERVED_CONSOLE_MESSAGE_TYPES = {
	warning: 'warn',
	error: 'error',
};

/**
 * Array of page event tuples of [ eventName, handler ].
 *
 * @type {Array}
 */
const pageEvents = [];

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 100000 );

// Retry failed tests at most 2 times in CI.
// This enables `flaky-tests-reporter` and `report-flaky-tests` GitHub action
// to mark test as flaky and automatically create a tracking issue about it.
if ( process.env.CI ) {
	jest.retryTimes( 2 );
}

async function setupBrowser() {
	await clearLocalStorage();
	await setBrowserViewport( 'large' );
}

/**
 * Adds an event listener to the page to handle additions of page event
 * handlers, to assure that they are removed at test teardown.
 */
function capturePageEventsForTearDown() {
	page.on( 'newListener', ( eventName, listener ) => {
		pageEvents.push( [ eventName, listener ] );
	} );
}

/**
 * Removes all bound page event handlers.
 */
function removePageEvents() {
	pageEvents.forEach( ( [ eventName, handler ] ) => {
		page.removeListener( eventName, handler );
	} );
}

/**
 * Adds a page event handler to emit uncaught exception to process if one of
 * the observed console logging types is encountered.
 */
function observeConsoleLogging() {
	page.on( 'console', ( message ) => {
		const type = message.type();
		if ( ! OBSERVED_CONSOLE_MESSAGE_TYPES.hasOwnProperty( type ) ) {
			return;
		}

		let text = message.text();

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
		if (
			text.includes( 'A cookie associated with a cross-site resource' )
		) {
			return;
		}

		// Viewing posts on the front end can result in this error, which
		// has nothing to do with Gutenberg.
		if ( text.includes( 'net::ERR_UNKNOWN_URL_SCHEME' ) ) {
			return;
		}

		// Network errors are ignored only if we are intentionally testing
		// offline mode.
		if (
			text.includes( 'net::ERR_INTERNET_DISCONNECTED' ) &&
			isOfflineMode()
		) {
			return;
		}

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

		const logFunction = OBSERVED_CONSOLE_MESSAGE_TYPES[ type ];

		// As of Puppeteer 1.6.1, `message.text()` wrongly returns an object of
		// type JSHandle for error logging, instead of the expected string.
		//
		// See: https://github.com/GoogleChrome/puppeteer/issues/3397
		//
		// The recommendation there to asynchronously resolve the error value
		// upon a console event may be prone to a race condition with the test
		// completion, leaving a possibility of an error not being surfaced
		// correctly. Instead, the logic here synchronously inspects the
		// internal object shape of the JSHandle to find the error text. If it
		// cannot be found, the default text value is used instead.
		text = get(
			message.args(),
			[ 0, '_remoteObject', 'description' ],
			text
		);

		// Disable reason: We intentionally bubble up the console message
		// which, unless the test explicitly anticipates the logging via
		// @wordpress/jest-console matchers, will cause the intended test
		// failure.

		// eslint-disable-next-line no-console
		console[ logFunction ]( text );
	} );
}

/**
 * Simulate slow network or throttled CPU if provided via environment variables.
 */
async function simulateAdverseConditions() {
	if ( ! SLOW_NETWORK && ! OFFLINE && ! THROTTLE_CPU ) {
		return;
	}

	if ( OFFLINE ) {
		await page.setOfflineMode( true );
	}

	if ( SLOW_NETWORK ) {
		// See: https://chromedevtools.github.io/devtools-protocol/tot/Network#method-emulateNetworkConditions
		// The values below simulate fast 3G conditions as per https://github.com/ChromeDevTools/devtools-frontend/blob/80c102878fd97a7a696572054007d40560dcdd21/front_end/sdk/NetworkManager.js#L252-L274
		await page.emulateNetworkConditions( {
			// Download speed (bytes/s)
			download: ( ( 1.6 * 1024 * 1024 ) / 8 ) * 0.9,
			// Upload speed (bytes/s)
			upload: ( ( 750 * 1024 ) / 8 ) * 0.9,
			// Latency (ms)
			latency: 150 * 3.75,
		} );
	}

	if ( THROTTLE_CPU ) {
		// See: https://chromedevtools.github.io/devtools-protocol/tot/Emulation#method-setCPUThrottlingRate
		await page.emulateCPUThrottling( Number( THROTTLE_CPU ) );
	}
}

// Override snapshot matchers to throw errors as soon as possible,
// See https://jestjs.io/docs/expect#bail-out
// This is to fix a bug in Jest that snapshot failures won't trigger `test_fn_failure` events.
expect.extend( {
	toMatchInlineSnapshot( ...args ) {
		this.dontThrow = () => {};

		return toMatchInlineSnapshot.call( this, ...args );
	},
	toMatchSnapshot( ...args ) {
		this.dontThrow = () => {};

		return toMatchSnapshot.call( this, ...args );
	},
} );

// Before every test suite run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
beforeAll( async () => {
	await setupRest( browser, adminStorageStatePath );

	capturePageEventsForTearDown();
	enablePageDialogAccept();
	observeConsoleLogging();
	await simulateAdverseConditions();
	await activateTheme( 'twentytwentyone' );
	await trashAllPosts();
	await trashAllPosts( 'wp_block' );
	await setupBrowser();
	await activatePlugin( 'gutenberg-test-plugin-disables-the-css-animations' );
	await page.emulateMediaFeatures( [
		{ name: 'prefers-reduced-motion', value: 'reduce' },
	] );
} );

afterEach( async () => {
	await setupBrowser();
} );

afterAll( () => {
	removePageEvents();
} );
