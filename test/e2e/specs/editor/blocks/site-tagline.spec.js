const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Tagline block', () => {
	let originalSiteTagline;

	test.beforeAll( async ( { requestUtils } ) => {
		originalSiteTagline = ( await requestUtils.getSiteSettings() )
			.description;
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.updateSiteSettings( {
			description: originalSiteTagline,
		} );
	} );

	test( 'Undoes a run of typing in one step', async ( {
		admin,
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		await requestUtils.updateSiteSettings( {
			description: 'Undo Test Tagline',
		} );
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/site-tagline' } );

		// The block props are spread onto the rich text, so the editable is
		// the block element itself rather than a field within it.
		const textbox = editor.canvas.getByRole( 'document', {
			name: 'Block: Site Tagline',
		} );

		await textbox.click();
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.type( 'abcdef' );
		await expect( textbox ).toHaveText( 'abcdef' );

		// The whole run reverts at once, rather than a character per press.
		await pageUtils.pressKeys( 'primary+z' );
		await expect( textbox ).toHaveText( 'Undo Test Tagline' );
	} );
} );
