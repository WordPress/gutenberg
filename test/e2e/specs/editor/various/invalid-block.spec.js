const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Invalid blocks', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should show an invalid block message with clickable options', async ( {
		editor,
		page,
	} ) => {
		// Create an empty paragraph with the focus in the block.
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'hello' );

		// Change to HTML mode and close the options.
		await editor.clickBlockOptionsMenuItem( 'Edit as HTML' );

		// Focus on the textarea and enter an invalid paragraph. Markup typed
		// by the user is only accepted when it matches exactly; it is not
		// regenerated behind their back.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.getByRole( 'textbox' )
			.fill( '<p>invalid paragraph' );

		// Takes the focus away from the block so the invalid warning is triggered.
		await editor.saveDraft();

		// Click on the 'three-dots' menu toggle.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.getByRole( 'button', { name: 'More options' } )
			.click();

		await page
			.getByRole( 'menu', { name: 'More options' } )
			.getByRole( 'menuitem', { name: 'Resolve' } )
			.click();

		// Check we get the resolve modal with the appropriate contents.
		await expect(
			page
				.getByRole( 'dialog', { name: 'Resolve Block' } )
				.locator( '.block-editor-block-compare__html' )
		).toHaveText( [ '<p>invalid paragraph', '<p>invalid paragraph</p>' ] );
	} );

	test( 'should regenerate stored malformed HTML which preserves content', async ( {
		editor,
	} ) => {
		// The malformed paragraph can be regenerated from the block's
		// attributes without losing content (validation Level 3), so the
		// stored content is loaded as a regular block rather than an invalid
		// one, and its markup is fixed on save.
		await editor.setContent( `
			<!-- wp:paragraph -->
			<p>invalid paragraph
			<!-- /wp:paragraph -->
		` );

		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await expect( block ).toBeVisible();
		await expect(
			block.getByRole( 'button', { name: 'Attempt recovery' } )
		).toBeHidden();

		const content = await editor.getEditedPostContent();
		expect( content ).toContain( '<p>invalid paragraph</p>' );
	} );

	test( 'should show an invalid block message when regenerating would lose content', async ( {
		editor,
	} ) => {
		// The heading block sources its content from heading tags, so the
		// text in the paragraph cannot be regenerated from attributes.
		await editor.setContent( `
			<!-- wp:heading -->
			<p class="wp-block-heading">Some content</p>
			<!-- /wp:heading -->
		` );

		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Heading' } )
				.getByRole( 'button', { name: 'Attempt recovery' } )
		).toBeVisible();

		// The original markup is preserved untouched.
		const content = await editor.getEditedPostContent();
		expect( content ).toContain(
			'<p class="wp-block-heading">Some content</p>'
		);
	} );

	test( 'should not execute on* attributes when regenerating a block', async ( {
		editor,
		page,
	} ) => {
		let hasAlert = false;

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		await editor.setContent( `
			<!-- wp:paragraph -->
			<p>aaaa <img src onerror=alert(1)></x dde></x>1
			<!-- /wp:paragraph -->
		` );

		// The block is regenerated from its attributes (Level 3) instead of
		// being flagged as invalid. Rich text neutralizes `on*` attributes
		// while the content is rendered in the editor, so the handler must
		// not run.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toBeVisible();
		await expect( editor.canvas.locator( '[onerror]' ) ).toHaveCount( 0 );

		expect( hasAlert ).toBe( false );
	} );

	test( 'should not trigger malicious script tags when using a shortcode block', async ( {
		editor,
		page,
	} ) => {
		let hasAlert = false;

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		await editor.setContent( `
			<!-- wp:shortcode -->
			<animate onbegin=alert(1) attributeName=x dur=1s><script>alert("EVIL");</script><style>@keyframes x{}</style><a style="animation-name:x" onanimationstart="alert(2)"></a>
			<!-- /wp:shortcode -->
		` );

		// Give the browser time to show the alert.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Shortcode' } )
		).toBeVisible();

		expect( hasAlert ).toBe( false );
	} );
} );
