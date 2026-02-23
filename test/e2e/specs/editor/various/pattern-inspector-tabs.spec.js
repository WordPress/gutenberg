/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * A minimal unsynced pattern containing:
 *   - a Heading          (non-list-view content block)
 *   - a Buttons block    (list-view content block, with two Button children)
 *   - a Paragraph        (non-list-view content block)
 *
 * The outer group's `patternName` metadata marks it as a section block so
 * content-only editing is active by default in the post editor.
 */
const PATTERN_CONTENT = `<!-- wp:group {"metadata":{"patternName":"core/block/test-inspector-tabs","name":"Inspector Tabs Test Pattern"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:heading -->
<h2 class="wp-block-heading">Test Heading</h2>
<!-- /wp:heading -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Button One</a></div>
<!-- /wp:button -->

<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Button Two</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

<!-- wp:paragraph -->
<p>Test Paragraph</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

test.describe( 'Pattern inspector tabs', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.setContent( PATTERN_CONTENT );
		// Click the Heading to select a block within the pattern. Because the
		// outer group has a patternName, the block editor enters content-only
		// mode and the inspector switches to the pattern's Content / List View
		// tab UI (rendered for the section block, not the Heading itself).
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.click();
		await editor.openDocumentSettingsSidebar();
	} );

	// -------------------------------------------------------------------------
	// Regression: inspector tab resets from List View → Content
	// -------------------------------------------------------------------------

	test( 'resets inspector tab to Content when selecting a non-list-view content block', async ( {
		editor,
		page,
	} ) => {
		const blockSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// Click the Buttons item in the inspector Content tab to switch to
		// List View.
		await blockSettings
			.getByRole( 'tabpanel', { name: 'Content' } )
			.getByRole( 'button', { name: 'Buttons' } )
			.click();

		await expect(
			blockSettings.getByRole( 'tab', {
				name: 'List View',
				selected: true,
			} )
		).toBeVisible();

		const editorCanvasBody = editor.canvas.locator( 'body' );
		// Focuses the editor canvas body. In the editor the click doesn’t have
		// to be on the element itself – just somewhere that won’t focus a block.
		await editorCanvasBody.click();

		// Clicking the Heading on the canvas should reset back to Content.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.click();

		await expect(
			blockSettings.getByRole( 'tab', {
				name: 'Content',
				selected: true,
			} )
		).toBeVisible();
	} );

	// -------------------------------------------------------------------------
	// Regression: manually clicking the List View tab is not immediately undone
	// -------------------------------------------------------------------------

	test( 'keeps List View tab selected after manually clicking it', async ( {
		page,
	} ) => {
		const blockSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await blockSettings.getByRole( 'tab', { name: 'List View' } ).click();

		await expect(
			blockSettings.getByRole( 'tab', {
				name: 'List View',
				selected: true,
			} )
		).toBeVisible();
	} );

	// -------------------------------------------------------------------------
	// Three-way sync: canvas click on a list child
	// -------------------------------------------------------------------------

	test( 'auto-switches inspector to List View when a list child is clicked on the canvas', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const blockSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// Open the sidebar list view (Document Overview) so we can verify that
		// context also reflects the selection.
		await pageUtils.pressKeys( 'access+o' );

		const docOverview = page.getByRole( 'region', {
			name: 'Document Overview',
		} );

		// Click Button One directly on the canvas using the block's document
		// wrapper — the same pattern used throughout Gutenberg e2e tests.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Button', exact: true } )
			.filter( { hasText: 'Button One' } )
			.click();

		// The inspector should auto-switch to the List View tab because Button
		// One is a child of a list-view-enabled content block (Buttons).
		await expect(
			blockSettings.getByRole( 'tab', {
				name: 'List View',
				selected: true,
			} )
		).toBeVisible();

		// The selected row in the Document Overview should be Button One's row.
		// Note: aria-selected is on the <td> (gridcell), not the <tr> (row);
		// the row itself gets the is-selected CSS class.
		await expect(
			docOverview.getByRole( 'row', { name: /Button One/ } )
		).toHaveClass( /is-selected/ );
	} );

	// -------------------------------------------------------------------------
	// Three-way sync: sidebar list view click on a list child
	// -------------------------------------------------------------------------

	test( 'auto-switches inspector to List View when a list child is selected via the sidebar list view', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const blockSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// Open the sidebar list view.
		await pageUtils.pressKeys( 'access+o' );

		const docOverview = page.getByRole( 'region', {
			name: 'Document Overview',
		} );

		// Expand the Buttons block row to reveal its children.
		await docOverview
			.getByRole( 'gridcell', { name: 'Buttons', exact: true } )
			.getByTestId( 'list-view-expander' )
			.click( { force: true } );

		// Click Button One in the sidebar list view.
		await docOverview
			.getByRole( 'gridcell', { name: /Button One/ } )
			.click();

		// Inspector should auto-switch to the List View tab.
		await expect(
			blockSettings.getByRole( 'tab', {
				name: 'List View',
				selected: true,
			} )
		).toBeVisible();

		// The Button One row in the Document Overview should remain selected.
		// Note: aria-selected is on the <td> (gridcell), not the <tr> (row);
		// the row itself gets the is-selected CSS class.
		await expect(
			docOverview.getByRole( 'row', { name: /Button One/ } )
		).toHaveClass( /is-selected/ );

		// Button One should also be selected on the canvas.
		// Note: after a sidebar click, the canvas iframe is unfocused so
		// toBeFocused() would return "inactive". Check the selection class
		// on the block wrapper instead.
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Button', exact: true } )
				.filter( { hasText: 'Button One' } )
		).toHaveClass( /is-selected/ );
	} );

	// -------------------------------------------------------------------------
	// Three-way sync: inspector list view click on a list child
	// -------------------------------------------------------------------------

	test( 'selects a list child via the inspector list view and syncs to canvas and sidebar', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const blockSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// Switch to List View by clicking the Buttons item in the content list.
		await blockSettings
			.getByRole( 'tabpanel', { name: 'Content' } )
			.getByRole( 'button', { name: 'Buttons' } )
			.click();

		const listViewPanel = blockSettings.getByRole( 'tabpanel', {
			name: 'List View',
		} );

		await expect( listViewPanel ).toBeVisible();

		// Open the sidebar list view so we can verify it syncs too.
		await pageUtils.pressKeys( 'access+o' );

		const docOverview = page.getByRole( 'region', {
			name: 'Document Overview',
		} );

		// Click Button Two in the inspector list view panel.
		await listViewPanel
			.getByRole( 'gridcell', { name: /Button Two/ } )
			.click();

		// Button Two's row in the Document Overview should now be selected.
		// Note: aria-selected is on the <td> (gridcell), not the <tr> (row);
		// the row itself gets the is-selected CSS class.
		await expect(
			docOverview.getByRole( 'row', { name: /Button Two/ } )
		).toHaveClass( /is-selected/ );

		// Button Two should be selected on the canvas.
		// Note: after an inspector click, the canvas iframe is unfocused so
		// toBeFocused() would return "inactive". Check the selection class
		// on the block wrapper instead.
		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Button', exact: true } )
				.filter( { hasText: 'Button Two' } )
		).toHaveClass( /is-selected/ );
	} );
} );
