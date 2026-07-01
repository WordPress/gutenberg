/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'HTML block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by typing "/html"', async ( { editor, page } ) => {
		// Create a Custom HTML block with the slash shortcut.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '/html' );
		await expect(
			page.locator( 'role=option[name="Custom HTML"i][selected]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await editor.canvas
			.getByRole( 'button', { name: 'Edit HTML' } )
			.click();
		await page.getByRole( 'dialog' ).getByRole( 'textbox' ).click();
		await page.keyboard.type( '<p>Pythagorean theorem: ' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type(
			'<var>a</var><sup>2</sup> + <var>b</var><sup>2</sup> = <var>c</var><sup>2</sup> </p>'
		);
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Update' } )
			.click();
		// Check the content.
		const content = await editor.getEditedPostContent();
		expect( content ).toBe(
			`<!-- wp:html -->
<p>Pythagorean theorem: 
<var>a</var><sup>2</sup> + <var>b</var><sup>2</sup> = <var>c</var><sup>2</sup> </p>
<!-- /wp:html -->`
		);
	} );

	test( 'should not encode <', async ( { editor, page } ) => {
		// Create a Custom HTML block with the slash shortcut.
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '/html' );
		await expect(
			page.locator( 'role=option[name="Custom HTML"i][selected]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await editor.canvas
			.getByRole( 'button', { name: 'Edit HTML' } )
			.click();
		await page.getByRole( 'dialog' ).getByRole( 'textbox' ).click();
		await page.keyboard.type( '1 < 2' );
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Update' } )
			.click();
		await editor.publishPost();
		await page.reload();
		await expect(
			editor.canvas.locator( '[data-type="core/html"]' )
		).toContainText( '1 < 2' );
	} );

	test( 'supports editable inner blocks within static HTML', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent(
			`<!-- wp:html -->
<div class="banner"><h1>Static heading</h1><!-- wp:paragraph -->
<p>Editable paragraph</p>
<!-- /wp:paragraph --><footer>Static footer</footer></div>
<!-- /wp:html -->`
		);

		// The inner paragraph renders at its position within the static
		// markup and is editable in place.
		const paragraph = editor.canvas.locator(
			'role=document[name="Block: Paragraph"i]'
		);
		await expect( paragraph ).toBeVisible();
		await paragraph.click();
		await expect( paragraph ).toBeFocused();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' updated' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:html -->
<div class="banner"><h1>Static heading</h1><!-- wp:paragraph -->
<p>Editable paragraph updated</p>
<!-- /wp:paragraph --><footer>Static footer</footer></div>
<!-- /wp:html -->`
		);

		// The inner block is locked: the options menu offers no removal and
		// the toolbar offers no movers.
		await editor.clickBlockToolbarButton( 'Options' );
		const optionsMenu = page.getByRole( 'menu', { name: 'Options' } );
		await expect( optionsMenu ).toBeVisible();
		await expect(
			optionsMenu.getByRole( 'menuitem', { name: 'Delete' } )
		).toBeHidden();
		await page.keyboard.press( 'Escape' );
		await expect(
			page.locator(
				'role=toolbar[name="Block tools"i] >> role=button[name="Move up"i]'
			)
		).toBeHidden();
	} );
} );
