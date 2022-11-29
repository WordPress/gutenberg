/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigate regions', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
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

		await page.keyboard.press( 'Control+`' );

		await expect(
			page.locator( '.interface-interface-skeleton' )
		).toHaveClass( /is-focusing-regions/ );

		// Check the Navigate regions focus style on the editor top bar region.
		const editorTopBar = page.locator(
			'role=region[name="Editor top bar"i]'
		);

		await expect( editorTopBar ).toBeFocused();
		await expect( editorTopBar ).toHaveCSS( 'outline-style', 'solid' );
		await expect( editorTopBar ).toHaveCSS( 'outline-width', '4px' );
		await expect( editorTopBar ).toHaveScreenshot();

		await page.keyboard.press( 'Control+`' );

		// Check the Navigate regions focus style on the editor content region.
		const editorContent = page.locator(
			'role=region[name="Editor content"i]'
		);

		await expect( editorContent ).toBeFocused();
		await expect( editorContent ).toHaveCSS( 'outline-style', 'solid' );
		await expect( editorContent ).toHaveCSS( 'outline-width', '4px' );
		await expect( editorContent ).toHaveScreenshot();

		await page.keyboard.press( 'Control+`' );

		// Check the Navigate regions focus style on the editor settings region.
		const editorSettings = page.locator(
			'role=region[name="Editor settings"i]'
		);

		await expect( editorSettings ).toBeFocused();
		await expect( editorSettings ).toHaveCSS( 'outline-style', 'solid' );
		await expect( editorSettings ).toHaveCSS( 'outline-width', '4px' );
		await expect( editorSettings ).toHaveScreenshot();

		await page.keyboard.press( 'Control+`' );

		// Check the Navigate regions focus style on the editor publish region.
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
		await expect( editorPublishPanel ).toHaveScreenshot();

		await page.keyboard.press( 'Control+`' );

		// Check the Navigate regions focus style on the editor footer region.
		const editorFooter = page.locator(
			'role=region[name="Editor footer"i]'
		);

		await expect( editorFooter ).toBeFocused();
		await expect( editorFooter ).toHaveCSS( 'outline-style', 'solid' );
		await expect( editorFooter ).toHaveCSS( 'outline-width', '4px' );
		await expect( editorFooter ).toHaveScreenshot();

		// Check the Navigate regions focus style on the editor document overview region.
		// Open List view toggle
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
		await expect( editorDocumentOverview ).toHaveScreenshot();
	} );
} );
