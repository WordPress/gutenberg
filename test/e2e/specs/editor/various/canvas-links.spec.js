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
			'.block-editor-iframe__intercepted-link-popover'
		);
		await expect(
			popover.getByText( 'Links are disabled in the editor.' )
		).toBeVisible();

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
			page.locator( '.block-editor-iframe__intercepted-link-popover' )
		).toBeHidden();
	} );
} );
