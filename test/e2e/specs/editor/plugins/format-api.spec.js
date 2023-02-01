/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Using Format API', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-format-api' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-format-api' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Clicking the control wraps the selected text properly with HTML code', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'First paragraph' );
		await pageUtils.pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await editor.clickBlockToolbarButton( 'More' );

		// Used a regex to tackle the  in name of menuitem.(Custom Link).
		await page.click( 'role=menuitem[name=/Custom Link/i]' );

		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:paragraph -->
<p>First <a href="https://example.com" class="my-plugin-link">paragraph</a></p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should show unknow formatting button', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '<big>test</big>' },
		} );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p><big>test</big></p>
<!-- /wp:paragraph -->`
		);
		await page.keyboard.press( 'ArrowRight' );
		await editor.clickBlockToolbarButton( 'Clear Unknown Formatting' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>test</p>
<!-- /wp:paragraph -->`
		);
	} );
} );
