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
	it( 'should refresh when expired', async () => {
		// This test avoids using `beforeAll` and `afterAll` as that
		// interferes with the `rest` and `batch` e2e test utils.
		await activatePlugin( 'gutenberg-test-plugin-nonce' );
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
		await deactivatePlugin( 'gutenberg-test-plugin-nonce' );
	} );
} );
