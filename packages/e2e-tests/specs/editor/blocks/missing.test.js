/**
 * WordPress dependencies
 */
import { createNewPost, setPostContent } from '@wordpress/e2e-test-utils';

describe( 'missing block', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should not alert from on* attribute', async () => {
		let hasAlert = false;

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		await setPostContent(
			`<!-- wp:non-existing-block-here --><img src onerror=alert(1)>`
		);

		// Give the browser time to show the alert.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		expect( hasAlert ).toBe( false );
	} );
} );
