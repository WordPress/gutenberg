/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	saveDraft,
} from '@wordpress/e2e-test-utils';

describe( 'Nonce', () => {
	// While using beforeEach/afterEach is suboptimal for multiple tests, they
	// are used here to ensure that the nonce plugin doesn't interfere with API
	// calls made in global before/after calls, which may perform API requests.
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-plugin-nonce' );
	} );
	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-nonce' );
	} );

	it( 'should refresh when expired', async () => {
		await createNewPost();
		await page.keyboard.press( 'Enter' );
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 5000 );
		await page.keyboard.type( 'test' );
		// `saveDraft` waits for saving to be successful, so this test would
		// timeout if it's not.
		await saveDraft();
		// We expect a 403 status once.
		expect( console ).toHaveErrored();
	} );
} );
