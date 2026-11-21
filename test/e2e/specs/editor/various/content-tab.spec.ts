import { test, expect } from '@wordpress/e2e-test-utils-playwright';

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

const LIST_CONTENT = `<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>First item</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`;

test.describe( 'Content tab', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'highlights the block on the canvas while its Content tab item is hovered', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( PATTERN_CONTENT );
		// Selecting a block inside the pattern puts the inspector into the
		// section block's Content / List View tab UI.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.click();
		await editor.openDocumentSettingsSidebar();

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

	test( 'selects the block without switching tabs when a parent provides its List View', async ( {
		editor,
		page,
	} ) => {
		// Converting a Custom HTML block to an unsynced pattern leaves the
		// nested List in Content, but its List View belongs to the HTML block.
		await editor.setContent( `<!-- wp:html {"metadata":{"patternName":"core/block/test-content-tab","name":"HTML List Pattern"}} -->
${ LIST_CONTENT }
<!-- /wp:html -->` );
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Custom HTML',
			} )
		);
		await editor.openDocumentSettingsSidebar();

		const blockSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const contentTab = blockSettings.getByRole( 'tab', {
			name: 'Content',
		} );
		const listItem = blockSettings
			.getByRole( 'tabpanel', { name: 'Content' } )
			.getByRole( 'button', { name: 'List', exact: true } );

		await expect(
			blockSettings.getByRole( 'tab', { name: 'List View' } )
		).toBeVisible();
		await expect( contentTab ).toHaveAttribute( 'aria-selected', 'true' );
		// Only the block icon is shown, without a navigation chevron.
		await expect( listItem.locator( 'svg' ) ).toHaveCount( 1 );

		await listItem.click();

		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: List',
				exact: true,
			} )
		).toHaveClass( /is-selected/ );
		await expect( contentTab ).toHaveAttribute( 'aria-selected', 'true' );
	} );

	test( 'opens the block’s List View when no ancestor provides one', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( `<!-- wp:group {"metadata":{"patternName":"core/block/test-content-tab","name":"List Pattern"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group">${ LIST_CONTENT }</div>
<!-- /wp:group -->` );
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Group' } )
		);
		await editor.openDocumentSettingsSidebar();

		const blockSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const listItem = blockSettings
			.getByRole( 'tabpanel', { name: 'Content' } )
			.getByRole( 'button', { name: 'List', exact: true } );

		// Both the block icon and navigation chevron are shown.
		await expect( listItem.locator( 'svg' ) ).toHaveCount( 2 );

		await listItem.click();

		await expect(
			blockSettings.getByRole( 'tab', { name: 'List View' } )
		).toHaveAttribute( 'aria-selected', 'true' );
		await expect(
			blockSettings
				.getByRole( 'tabpanel', { name: 'List View' } )
				.getByRole( 'link', { name: 'First item', exact: true } )
		).toBeVisible();
	} );
} );
