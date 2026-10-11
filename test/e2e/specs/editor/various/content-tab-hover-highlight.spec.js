const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * A pattern whose outer group carries `patternName` metadata, which puts the
 * editor into content-only mode and gives the inspector its Content tab.
 */
const PATTERN_CONTENT = `<!-- wp:group {"metadata":{"patternName":"core/block/test-hover-highlight","name":"Hover Highlight Test Pattern"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:heading -->
<h2 class="wp-block-heading">Test Heading</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Test Paragraph</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

test.describe( 'Content tab hover highlight', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.setContent( PATTERN_CONTENT );
		// Selecting a block inside the pattern puts the inspector into the
		// section block's Content / List View tab UI.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.click();
		await editor.openDocumentSettingsSidebar();
	} );

	test( 'highlights the block on the canvas while its Content tab item is hovered', async ( {
		editor,
		page,
	} ) => {
		const blockSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const paragraphOnCanvas = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const paragraphItem = blockSettings
			.getByRole( 'tabpanel', { name: 'Content' } )
			.getByRole( 'button', { name: 'Paragraph' } );

		await expect( paragraphOnCanvas ).not.toHaveClass( /is-highlighted/ );

		await paragraphItem.hover();

		await expect( paragraphOnCanvas ).toHaveClass( /is-highlighted/ );

		// Moving the pointer off the item drops the highlight again.
		await page.mouse.move( 0, 0 );

		await expect( paragraphOnCanvas ).not.toHaveClass( /is-highlighted/ );
	} );
} );
