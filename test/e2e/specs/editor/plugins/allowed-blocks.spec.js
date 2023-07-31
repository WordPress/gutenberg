/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Allowed Blocks Filter', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-allowed-blocks' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-allowed-blocks' );
	} );

	test( 'should restrict the allowed blocks in the inserter', async ( {
		page,
	} ) => {
		// The paragraph block is available.
		await page.click( 'role=button[name="Toggle block inserter"i]' );

		await page.type(
			'role=searchbox[name="Search for blocks and patterns"i]',
			'Paragraph'
		);

		expect( 'role=option[name="Paragraph"i]' ).not.toBeNull();

		// The gallery block is not available.
		await page.click(
			'role=searchbox[name="Search for blocks and patterns"i]',
			{ clickCount: 3 }
		);
		await page.keyboard.press( 'Backspace' );

		await page.type(
			'role=searchbox[name="Search for blocks and patterns"i]',
			'Gallery'
		);

		const galleryBlockButton = page.locator(
			`//button//span[contains(text(), 'Gallery')]`
		)[ 0 ];
		expect( galleryBlockButton ).toBeUndefined();
	} );

	test( 'should remove not allowed blocks from the block manager', async ( {
		page,
	} ) => {
		await page.click( 'role=button[name="Options"i]' );

		await page.click( 'role=menuitem[name="Preferences"i]' );

		await page.click( 'role=tab[name="Blocks"i]' );

		const BLOCK_LABEL_SELECTOR =
			'.edit-post-block-manager__checklist-item .components-checkbox-control__label';
		const blocks = await page.evaluate( ( selector ) => {
			return Array.from( document.querySelectorAll( selector ) )
				.map( ( element ) => ( element.innerText || '' ).trim() )
				.sort();
		}, BLOCK_LABEL_SELECTOR );
		expect( blocks ).toEqual( [ 'Image', 'Paragraph' ] );
	} );
} );
