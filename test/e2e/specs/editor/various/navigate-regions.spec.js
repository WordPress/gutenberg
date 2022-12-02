/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigate regions', () => {
	test.beforeEach( async ( { admin, page } ) => {
		await admin.createNewPost();
		// POC: Make all text transparent to ignore different font rendering on CI Ubuntu.
		await page.addStyleTag( {
			content: '* { color: rgba(0,0,0,0) !important; }',
		} );
	} );

	test( 'should navigate the editor regions and show the outline focus style', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		// Make sure the Settings sidebar is opened.
		await editor.openDocumentSettingsSidebar();

		// Navigate to the top bar region.
		await page.keyboard.press( 'Control+`' );

		await expect(
			page.locator( '.interface-interface-skeleton' )
		).toHaveClass( /is-focusing-regions/ );

		const editorTopBar = page.locator(
			'role=region[name="Editor top bar"i]'
		);

		await expect( editorTopBar ).toBeFocused();
		await expect( editorTopBar ).toHaveCSS( 'outline-style', 'solid' );
		await expect( editorTopBar ).toHaveCSS( 'outline-width', '4px' );
		await expect( editorTopBar ).toHaveScreenshot( {
			// POC: Hide some elements we're not interested to test for.
			mask: [ editorTopBar.locator( 'role=button' ) ],
		} );

		// Navigate to the content region.
		await page.keyboard.press( 'Control+`' );

		const editorContent = page.locator(
			'role=region[name="Editor content"i]'
		);

		await expect( editorContent ).toBeFocused();
		await expect( editorContent ).toHaveCSS( 'outline-style', 'solid' );
		await expect( editorContent ).toHaveCSS( 'outline-width', '4px' );
		await expect( editorContent ).toHaveScreenshot( {
			// POC: Hide some elements we're not interested to test for.
			mask: [
				editorContent.locator( 'role=textbox' ),
				editorContent.locator( 'role=document' ),
				editorContent.locator( 'role=toolbar' ),
			],
		} );

		// Navigate to the settings region when it's opened.
		await page.keyboard.press( 'Control+`' );

		const editorSettings = page.locator(
			'role=region[name="Editor settings"i]'
		);

		await expect( editorSettings ).toBeFocused();
		await expect( editorSettings ).toHaveCSS( 'outline-style', 'solid' );
		await expect( editorSettings ).toHaveCSS( 'outline-width', '4px' );
		await expect( editorSettings ).toHaveScreenshot();

		// Navigate to the publish region.
		await page.keyboard.press( 'Control+`' );

		const editorPublish = page.locator(
			'role=region[name="Editor publish"i]'
		);
		const editorPublishPanel = page.locator(
			'role=region[name="Editor publish"i] >> .edit-post-layout__toggle-publish-panel'
		);

		await expect( editorPublish ).toBeFocused();
		await expect( editorPublishPanel ).toHaveCSS(
			'outline-style',
			'solid'
		);
		await expect( editorPublishPanel ).toHaveCSS( 'outline-width', '4px' );
		await expect( editorPublishPanel ).toHaveScreenshot( {
			// POC: Hide some elements we're not interested to test for.
			mask: [ editorPublishPanel.locator( 'role=button' ) ],
		} );

		// Navigate to the footer region.
		await page.keyboard.press( 'Control+`' );

		const editorFooter = page.locator(
			'role=region[name="Editor footer"i]'
		);

		await expect( editorFooter ).toBeFocused();
		await expect( editorFooter ).toHaveCSS( 'outline-style', 'solid' );
		await expect( editorFooter ).toHaveCSS( 'outline-width', '4px' );
		await expect( editorFooter ).toHaveScreenshot();

		// Navigate to the Document overview region.
		// Open the Document overview.
		await page.locator( 'role=button[name="Document Overview"i]' ).click();

		await pageUtils.pressKeyTimes( 'Control+`', 2 );

		const editorDocumentOverview = page.locator(
			'role=region[name="Document Overview"i]'
		);

		await expect( editorDocumentOverview ).toBeFocused();
		await expect( editorDocumentOverview ).toHaveCSS(
			'outline-style',
			'solid'
		);
		await expect( editorDocumentOverview ).toHaveCSS(
			'outline-width',
			'4px'
		);
		await expect( editorDocumentOverview ).toHaveScreenshot( {
			// POC: Hide some elements we're not interested to test for.
			mask: [ editorDocumentOverview.locator( 'role=treegrid' ) ],
		} );

		// Close the Document overview.
		await page.locator( 'role=button[name="Document Overview"i]' ).click();

		// Close the settings region.
		await page
			.locator(
				'role=region[name="Editor top bar"i] >> role=button[name="Settings"i]'
			)
			.click();

		// Navigate to the settings region whene it's closed.
		await pageUtils.pressKeyTimes( 'Control+`', 3 );

		const editorSettingsPanel = page.locator(
			'role=region[name="Editor settings"i] >> .edit-post-layout__toggle-sidebar-panel'
		);

		await expect( editorSettings ).toBeFocused();
		await expect( editorSettingsPanel ).toHaveCSS(
			'outline-style',
			'solid'
		);
		await expect( editorSettingsPanel ).toHaveCSS( 'outline-width', '4px' );

		await expect( editorSettingsPanel ).toHaveScreenshot( {
			// POC: Hide some elements we're not interested to test for.
			mask: [ editorSettingsPanel.locator( 'role=button' ) ],
		} );

		// Make sure to leave the Settings sidebar opened.
		await editor.openDocumentSettingsSidebar();
	} );
} );
