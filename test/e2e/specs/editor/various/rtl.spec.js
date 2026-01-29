/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Avoid using three, as it looks too much like two with some fonts.
const ARABIC_ZERO = '٠';
const ARABIC_ONE = '١';
const ARABIC_TWO = '٢';

test.describe( 'RTL', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-activate-rtl'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-activate-rtl'
		);
	} );

	test( 'should arrow navigate', async ( { editor, page } ) => {
		await page.keyboard.press( 'Enter' );

		// We need at least three characters as arrow navigation *from* the
		// edges might be handled differently.
		await page.keyboard.type( ARABIC_ONE );
		await page.keyboard.type( ARABIC_TWO );
		await page.keyboard.press( 'ArrowRight' );
		// This is the important key press: arrow nav *from* the middle.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( ARABIC_ZERO );

		// Expect: ARABIC_ZERO + ARABIC_ONE + ARABIC_TWO (<p>٠١٢</p>).
		// N.b.: HTML is LTR, so direction will be reversed!

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>٠١٢</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should split', async ( { editor, page } ) => {
		await page.keyboard.press( 'Enter' );

		await page.keyboard.type( ARABIC_ZERO );
		await page.keyboard.type( ARABIC_ONE );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>٠</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>١</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should merge backward', async ( { editor, page } ) => {
		await page.keyboard.press( 'Enter' );

		await page.keyboard.type( ARABIC_ZERO );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ARABIC_ONE );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Backspace' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>٠١</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should merge forward', async ( { editor, page } ) => {
		await page.keyboard.press( 'Enter' );

		await page.keyboard.type( ARABIC_ZERO );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ARABIC_ONE );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Delete' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>٠١</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should arrow navigate between blocks', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );

		await page.keyboard.type( ARABIC_ZERO );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ARABIC_ONE );
		await page.keyboard.press( 'Shift+Enter' );
		await page.keyboard.type( ARABIC_TWO );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );

		// Move to the previous block with two lines in the current block.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Shift+Enter' );
		await page.keyboard.type( ARABIC_ONE );

		// Move to the next block with two lines in the current block.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( ARABIC_ZERO );
		await page.keyboard.press( 'Shift+Enter' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>٠<br>١</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>٠<br>١<br>٢</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should navigate inline boundaries', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( ARABIC_ONE );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( ARABIC_TWO );

		// Insert a character at each boundary position.
		for ( let i = 4; i > 0; i-- ) {
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.type( ARABIC_ZERO );

			expect( await editor.getEditedPostContent() ).toMatchSnapshot();

			await page.keyboard.press( 'Backspace' );
		}
	} );
} );
