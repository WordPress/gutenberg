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
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-nonce' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-nonce' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should refresh when expired', async () => {
		await page.keyboard.press( 'Enter' );
		// eslint-disable-next-line no-restricted-syntax
		await page.waitFor( 5000 );
		await page.keyboard.type( 'test' );
		// `saveDraft` waits for saving to be successful, so this test would
		// timeout if it's not.
		await saveDraft();
		// We expect a 403 status once.
		expect( console ).toHaveErrored();
	} );
} );
