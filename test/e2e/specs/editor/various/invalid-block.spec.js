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

		// Focus on the textarea and enter an invalid paragraph.
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

	test( 'should strip potentially malicious on* attributes', async ( {
		editor,
		page,
	} ) => {
		let hasAlert = false;
		let error = '';
		let warning = '';

		page.on( 'dialog', () => {
			hasAlert = true;
		} );

		page.on( 'console', ( msg ) => {
			if ( msg.type() === 'error' ) {
				error = msg.text();
			}

			if ( msg.type() === 'warning' ) {
				warning = msg.text();
			}
		} );

		await editor.setContent( `
			<!-- wp:paragraph -->
			<p>aaaa <img src onerror=alert(1)></x dde></x>1
			<!-- /wp:paragraph -->
		` );

		// Give the browser time to show the alert.
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.getByRole( 'button', { name: 'Attempt recovery' } )
		).toBeVisible();

		expect( hasAlert ).toBe( false );
		expect( error ).toContain(
			'Block validation: Block validation failed'
		);
		expect( warning ).toContain(
			'Block validation: Malformed HTML detected'
		);
	} );

	test( 'should keep attributes a block does not know', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( `<!-- wp:paragraph {"style":{"color":{"text":"#000000"}}} -->
<p class="has-text-color" style="color:#000000" data-note="tip" aria-label="Tip">Hello</p>
<!-- /wp:paragraph -->` );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const [ block ] = await editor.getBlocks( { full: true } );
		expect( block.isValid ).toBe( true );
		expect( block.attributes ).toEqual( {
			content: 'Hello',
			dropCap: false,
			style: { color: { text: '#000000' } },
			htmlAttributes: {
				'data-note': 'tip',
				'aria-label': 'Tip',
			},
		} );
		await expect( paragraph ).toHaveAttribute( 'data-note', 'tip' );

		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' world' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph {"style":{"color":{"text":"#000000"}}} -->
<p class="has-text-color" style="color:#000000" data-note="tip" aria-label="Tip">Hello world</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should not keep event handlers or styles a block does not know', async ( {
		editor,
	} ) => {
		await editor.setContent( `<!-- wp:paragraph -->
<p data-note="tip" onclick="alert(1)">Hello</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p data-note="tip" style="background-color:#fffbe6">Hello</p>
<!-- /wp:paragraph -->` );

		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.getByRole( 'button', { name: 'Attempt recovery' } )
		).toHaveCount( 2 );
		const blocks = await editor.getBlocks( { full: true } );
		expect( blocks.map( ( block ) => block.isValid ) ).toEqual( [
			false,
			false,
		] );
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
