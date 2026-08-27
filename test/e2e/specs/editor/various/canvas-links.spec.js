const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Links in the editor canvas', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'shows a popover instead of navigating the canvas away', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent(
			`<!-- wp:html -->
<div>Have questions? <a href="https://wordpress.org/support/" target="_self"><strong>Contact Us</strong></a></div>
<!-- /wp:html -->`
		);

		await editor.canvas.getByRole( 'link', { name: 'Contact Us' } ).click();

		const popover = page.locator(
			'.block-editor-intercepted-link-popover'
		);
		const link = popover.getByRole( 'link', {
			name: 'wordpress.org/support',
		} );
		await expect( link ).toHaveAttribute(
			'href',
			'https://wordpress.org/support/'
		);
		await expect( link ).toHaveAttribute( 'target', '_blank' );

		// The canvas is still the editor, and the editor is still operational.
		await expect(
			editor.canvas.locator( '[data-type="core/html"]' )
		).toBeVisible();

		// Escape dismisses the popover and returns focus to the link.
		await page.keyboard.press( 'Escape' );
		await expect( popover ).toBeHidden();
	} );

	test( 'leaves links that open in a new tab alone', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent(
			`<!-- wp:html -->
<div><a href="/" target="_blank" rel="noreferrer noopener">Contact Us</a></div>
<!-- /wp:html -->`
		);

		const newTabPromise = page.context().waitForEvent( 'page' );
		await editor.canvas.getByRole( 'link', { name: 'Contact Us' } ).click();

		const newTab = await newTabPromise;
		expect( newTab.url() ).toBe( 'http://localhost:8889/' );
		await newTab.close();

		await expect(
			page.locator( '.block-editor-intercepted-link-popover' )
		).toBeHidden();
	} );

	test( 'shows a popover for links inside the Custom HTML preview', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent(
			`<!-- wp:html -->
<div><a href="https://wordpress.org/support/">Contact Us</a></div>
<!-- /wp:html -->`
		);

		await editor.canvas.locator( '[data-type="core/html"]' ).click();
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Edit code' } )
			.click();

		// The preview renders the content in a sandboxed iframe, which the
		// canvas' own click handling cannot reach.
		const preview = page.frameLocator(
			'.block-library-html__preview iframe'
		);
		await preview.getByRole( 'link', { name: 'Contact Us' } ).click();

		const popover = page.locator(
			'.block-editor-intercepted-link-popover'
		);
		const link = popover.getByRole( 'link', {
			name: 'wordpress.org/support',
		} );
		await expect( link ).toHaveAttribute(
			'href',
			'https://wordpress.org/support/'
		);
		await expect( link ).toHaveAttribute( 'target', '_blank' );

		// The preview still shows the sandboxed content, not the linked page.
		await expect(
			preview.getByRole( 'link', { name: 'Contact Us' } )
		).toBeVisible();
	} );
} );
