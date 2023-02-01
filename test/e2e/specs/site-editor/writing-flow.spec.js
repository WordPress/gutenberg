/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site editor writing flow', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/41811.
	test( 'allows shift tabbing to the block toolbar from the first block', async ( {
		admin,
		editor,
		page,
		pageUtils,
		siteEditor,
	} ) => {
		// Navigate to a template part with only a couple of blocks.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );
		await siteEditor.enterEditMode();
		// Select the first site title block.
		const siteTitleBlock = editor.canvas.locator(
			'role=document[name="Block: Site Title"i]'
		);
		await expect( siteTitleBlock ).toBeVisible();
		await editor.selectBlocks( siteTitleBlock );

		// Shift tab to the toolbar.
		await pageUtils.pressKeyWithModifier( 'shift', 'Tab' );
		const blockToolbarButton = page.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Site Title"i]'
		);
		await expect( blockToolbarButton ).toBeFocused();
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/41811.
	test( 'allows tabbing to the inspector from the last block', async ( {
		admin,
		editor,
		page,
		pageUtils,
		siteEditor,
	} ) => {
		// Navigate to a template part with only a couple of blocks.
		await admin.visitSiteEditor( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );
		await siteEditor.enterEditMode();
		// Make sure the sidebar is open.
		await editor.openDocumentSettingsSidebar();

		// Select the last site tagline block.
		const siteTaglineBlock = editor.canvas.locator(
			'role=document[name="Block: Site Tagline"i]'
		);
		await expect( siteTaglineBlock ).toBeVisible();
		await editor.selectBlocks( siteTaglineBlock );

		// Tab to the inspector, tabbing three times to go past the two resize handles.
		await pageUtils.pressKeyTimes( 'Tab', 3 );
		const inspectorTemplateTab = page.locator(
			'role=region[name="Editor settings"i] >> role=button[name="Template"i]'
		);
		await expect( inspectorTemplateTab ).toBeFocused();
	} );
} );
