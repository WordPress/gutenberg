/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'editableRoot host mode', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'wrapper becomes the editing host for a paragraph with siblings', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'b' },
		} );
		await page.keyboard.press( 'ArrowUp' );

		// Host mode: the selected block has a contentEditable ancestor above it
		// (the canvas wrapper), which does not happen when the block is edited
		// on its own element.
		await expect
			.poll( () =>
				editor.canvas
					.locator( ':root' )
					.evaluate(
						( root ) =>
							!! root.ownerDocument.querySelector(
								'[contenteditable="true"] [data-block]'
							)
					)
			)
			.toBe( true );
	} );

	test( 'a heading (no support) is not hosted', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'b' },
		} );
		await page.keyboard.press( 'ArrowUp' );

		await expect
			.poll( () =>
				editor.canvas
					.locator( ':root' )
					.evaluate(
						( root ) =>
							!! root.ownerDocument.querySelector(
								'[contenteditable="true"] [data-block]'
							)
					)
			)
			.toBe( false );
	} );
} );
