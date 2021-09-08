/**
 * WordPress dependencies
 */
import { newPost, setPostContent } from '../../support/utils';

describe( 'missing block', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'should strip potentially malicious on* attributes', async () => {
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

	it( 'hould strip potentially malicious script tags', async () => {
		let hasAlert = false;

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		await setPostContent(
			`<!-- wp:non-existing-block-here --><script>alert("EVIL");</script>`
		);

		// Give the browser time to show the alert.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		expect( hasAlert ).toBe( false );
	} );
} );
