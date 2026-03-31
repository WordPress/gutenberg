/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Shortcode', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should convert classic block content with a shortcode', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/freeform',
			attributes: {
				content: '<p>[my_shortcode param="foo"]</p>',
			},
		} );
		await editor.clickBlockToolbarButton( 'Convert to blocks' );

		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Shortcode',
			} )
		).toBeVisible();
	} );

	test( 'should convert shortcode with brackets in quoted attribute values', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/freeform',
			attributes: {
				content:
					'<p>[my_shortcode param="foo" link_text="[Click here]" bar="baz"]</p>',
			},
		} );

		await editor.clickBlockToolbarButton( 'Convert to blocks' );

		// Should produce a single shortcode block, not an HTML block.
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Shortcode',
			} )
		).toBeVisible();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Custom HTML',
			} )
		).toBeHidden();
	} );
} );
