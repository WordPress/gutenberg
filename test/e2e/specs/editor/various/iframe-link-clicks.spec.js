const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

function getCanvasHash( page ) {
	return page.evaluate(
		() =>
			document.querySelector( 'iframe[name="editor-canvas"]' )
				.contentWindow.location.hash
	);
}

test.describe( 'Iframe link clicks', () => {
	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();
		await page.evaluate( () => {
			const { createElement: el } = window.wp.element;
			const { useBlockProps } = window.wp.blockEditor;
			const registerLinkBlock = ( name, onClick ) =>
				window.wp.blocks.registerBlockType( name, {
					apiVersion: 3,
					title: name,
					category: 'text',
					edit: function Edit() {
						return el(
							'div',
							useBlockProps(),
							el( 'a', { href: '#target', onClick }, 'Link' )
						);
					},
					save: () => null,
				} );
			registerLinkBlock( 'test/fragment-link' );
			registerLinkBlock( 'test/prevented-fragment-link', ( event ) =>
				event.preventDefault()
			);
		} );
	} );

	test( 'should navigate to the fragment of a link', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'test/fragment-link' } );
		await editor.canvas.getByRole( 'link', { name: 'Link' } ).click();

		await expect.poll( () => getCanvasHash( page ) ).toBe( '#target' );
	} );

	// Rich text prevents the click on a footnote marker to select it, so the
	// canvas has to navigate before that.
	test( 'should navigate to the footnote of a marker', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'paragraph' );
		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Footnote")' ).click();
		await page.keyboard.type( 'footnote' );

		const id = await editor.canvas
			.locator( ':root' )
			.evaluate( () => document.activeElement.id );
		await editor.canvas.locator( `a[href="#${ id }"]` ).click();

		await expect.poll( () => getCanvasHash( page ) ).toBe( `#${ id }` );
	} );

	test( 'should not navigate when a block prevented the click', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'test/prevented-fragment-link' } );
		await editor.canvas.getByRole( 'link', { name: 'Link' } ).click();

		expect( await getCanvasHash( page ) ).toBe( '' );
	} );
} );
