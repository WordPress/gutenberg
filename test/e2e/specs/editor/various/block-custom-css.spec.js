const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block custom CSS', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme(
			'gutenberg-test-themes/style-variations'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deleteAllPosts(),
		] );
	} );

	test( 'overrides block style variation styles in the editor and on the front end', async ( {
		editor,
		page,
	} ) => {
		// The theme's "Block Style Variation A" sets `border: 1px dotted` on
		// the Group block. The block's custom CSS contests both properties;
		// both rulesets have equal (0-1-0) specificity, so the custom CSS
		// must win via cascade order.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				className:
					'custom-css-test-group is-style-block-style-variation-a',
				style: {
					css: 'border-style: double;border-width: 6px;',
				},
				layout: { type: 'constrained' },
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Group with custom CSS' },
				},
			],
		} );

		const editorGroup = editor.canvas.locator( '.custom-css-test-group' );
		await expect( editorGroup ).toHaveCSS( 'border-style', 'double' );
		await expect( editorGroup ).toHaveCSS( 'border-width', '6px' );

		// Switch to another block style variation. Updating a style override
		// re-registers it after the custom CSS override, so this guards
		// against the variation styles jumping ahead in the cascade.
		// See https://github.com/WordPress/gutenberg/pull/80340.
		await page.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const [ group ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).updateBlockAttributes(
				group.clientId,
				{
					className:
						'custom-css-test-group is-style-block-style-variation-b',
				}
			);
		} );

		// Variation B sets `border: 2px dashed`; custom CSS must still win.
		await expect( editorGroup ).toHaveCSS( 'border-style', 'double' );
		await expect( editorGroup ).toHaveCSS( 'border-width', '6px' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const frontendGroup = page.locator( '.custom-css-test-group' );
		await expect( frontendGroup ).toHaveCSS( 'border-style', 'double' );
		await expect( frontendGroup ).toHaveCSS( 'border-width', '6px' );
	} );
} );
