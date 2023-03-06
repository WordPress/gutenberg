/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Content-only lock', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should be able to edit the content of blocks with content-only lock', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block in the code editor
		await pageUtils.pressKeyWithModifier( 'secondary', 'M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor
		await page.click( '.editor-post-text-editor' );
		await page.keyboard
			.type( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
        <div class="wp-block-group"><!-- wp:paragraph -->
        <p>Hello</p>
        <!-- /wp:paragraph --></div>
        <!-- /wp:group -->` );
		await pageUtils.pressKeyWithModifier( 'secondary', 'M' );

		await page.click( 'role=document[name="Paragraph block"i]' );
		await page.keyboard.type( ' World' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
