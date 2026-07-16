/**
 * WordPress dependencies
 */
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

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const frontendGroup = page.locator( '.custom-css-test-group' );
		await expect( frontendGroup ).toHaveCSS( 'border-style', 'double' );
		await expect( frontendGroup ).toHaveCSS( 'border-width', '6px' );
	} );

	test( 'applies custom CSS on the front end when no block style variations are used', async ( {
		editor,
		page,
	} ) => {
		// Guards the `block-style-variation-styles` handle dependency: custom
		// CSS must still print when that handle was never populated on the page.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				className: 'custom-css-test-group',
				style: {
					css: 'border-style: dashed;',
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

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const frontendGroup = page.locator( '.custom-css-test-group' );
		await expect( frontendGroup ).toHaveCSS( 'border-style', 'dashed' );
	} );
} );
