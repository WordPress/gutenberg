/**
 * WordPress dependencies
 */
const {
	test,
	expect,
	Admin,
} = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').FrameLocator} FrameLocator
 * @typedef {import('@wordpress/e2e-test-utils-playwright').PageUtils} PageUtils
 * @typedef {import('@wordpress/e2e-test-utils-playwright').RequestUtils} RequestUtils
 * @typedef {import('@wordpress/e2e-test-utils-playwright').Editor} Editor
 */

test.use( {
	widgetsCustomizerPage: async (
		{ admin, page, pageUtils, editor },
		use
	) => {
		await use(
			new WidgetsCustomizerPage( { admin, page, pageUtils, editor } )
		);
	},
} );

test.describe( 'Widgets Customizer', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// TODO: Ideally we can bundle our test theme directly in the repo.
		await requestUtils.activateTheme( 'twentytwenty' );
		await requestUtils.activatePlugin( 'gutenberg-test-widgets' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllWidgets();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-widgets' );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'should add blocks', async ( { page, widgetsCustomizerPage } ) => {
		const previewFrame = widgetsCustomizerPage.previewFrame;

		await widgetsCustomizerPage.visitCustomizerPage();
		await widgetsCustomizerPage.expandWidgetArea( 'Footer #1' );

		await widgetsCustomizerPage.addBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );

		// Expect the paragraph to be found in the preview iframe.
		await expect(
			previewFrame.locator(
				'css=.widget-content p >> text="First Paragraph"'
			)
		).toBeVisible();

		// Clear block selection, so the block toolbar isn't visible.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );

		await widgetsCustomizerPage.addBlock( 'Heading' );
		await page.keyboard.type( 'My Heading' );

		// Expect the heading to be found in the preview iframe.
		await expect(
			previewFrame.locator(
				'css=.widget-content >> role=heading[name="My Heading"]'
			)
		).toBeVisible();

		// Click on the inline appender.
		await page.click(
			'css=.editor-styles-wrapper >> role=button[name="Add block"i]'
		);

		const inlineInserterSearchBox = page.locator(
			'role=searchbox[name="Search"i]'
		);

		await expect( inlineInserterSearchBox ).toBeFocused();

		await page.keyboard.type( 'Search' );

		await page.click( 'role=option[name="Search"i]' );

		await page
			.locator(
				'role=document[name="Block: Search"i] >> role=textbox[name="Label text"i]'
			)
			.focus();

		await page.keyboard.type( 'My ' );

		// Expect the search box to be found in the preview iframe.
		await expect(
			previewFrame.locator(
				'css=.widget-content >> role=searchbox[name="My Search"]'
			)
		).toHaveCount( 1 );
	} );

	test( 'should open the inspector panel', async ( {
		editor,
		page,
		requestUtils,
		widgetsCustomizerPage,
	} ) => {
		const showMoreSettingsButton = page.locator(
			'role=menuitem[name="Show more settings"i]'
		);
		const backButton = page.locator(
			'role=button[name=/Back$/] >> visible=true'
		);
		const inspectorHeading = page.locator(
			'role=heading[name="Customizing ▸ Widgets ▸ Footer #1 Block Settings"i][level=3]'
		);
		const widgetsFooter1Heading = page.locator(
			'role=heading[name="Customizing ▸ Widgets Footer #1"i][level=3]'
		);

		await requestUtils.addWidgetBlock(
			`<!-- wp:paragraph -->\n<p>First Paragraph</p>\n<!-- /wp:paragraph -->`,
			'sidebar-1'
		);

		await widgetsCustomizerPage.visitCustomizerPage();
		await widgetsCustomizerPage.expandWidgetArea( 'Footer #1' );

		await page.focus( 'text=First Paragraph' );
		await editor.clickBlockToolbarButton( 'Options' );

		await showMoreSettingsButton.click();

		// The transition could take more time than 5 seconds.
		await expect( backButton ).toHaveCount( 1, { timeout: 8000 } );
		await expect( backButton ).toBeFocused();

		// Expect the inspector panel to be found.
		await expect( inspectorHeading ).toBeVisible();

		// Expect the block title to be found.
		await expect(
			page.locator( 'role=heading[name="Paragraph"i][level=2]' )
		).toBeVisible();

		// Go back to the widgets editor.
		await backButton.click();
		await expect( widgetsFooter1Heading ).toBeVisible();
		await expect( inspectorHeading ).toBeHidden();

		await editor.clickBlockToolbarButton( 'Options' );
		await showMoreSettingsButton.click();

		// Expect the inspector panel to be found.
		await expect( inspectorHeading ).toBeVisible();

		// Press Escape to close the inspector panel.
		await page.keyboard.press( 'Escape' );

		// Go back to the widgets editor.
		await expect( widgetsFooter1Heading ).toBeVisible();

		await expect( inspectorHeading ).toBeHidden();
	} );

	test( 'should handle the inserter outer section', async ( {
		page,
		widgetsCustomizerPage,
	} ) => {
		await widgetsCustomizerPage.visitCustomizerPage();
		await widgetsCustomizerPage.expandWidgetArea( 'Footer #1' );

		// We need to make some changes for the publish settings to appear.
		await widgetsCustomizerPage.addBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );

		const addBlockButton = page.locator(
			'role=toolbar[name="Document tools"i] >> role=button[name="Add block"i]'
		);
		const inserterHeading = page.locator(
			'role=heading[name="Add a block"i][level=2]'
		);

		// Open the inserter outer section.
		await addBlockButton.click();

		// Expect the inserter outer section to be found.
		await expect( inserterHeading ).toBeVisible();

		// Expect to close the inserter outer section when pressing Escape.
		await page.keyboard.press( 'Escape' );

		// Open the inserter outer section again.
		await addBlockButton.click();

		// Expect the inserter outer section to be found again.
		await expect( inserterHeading ).toBeVisible();

		// Open the Publish Settings.
		await page.click( 'role=button[name="Publish Settings"i]' );

		// Expect the Publish Settings outer section to be found.
		const publishSettings = page.locator(
			'#sub-accordion-section-publish_settings'
		);
		await expect( publishSettings ).toBeVisible();

		// Expect the inserter outer section to be closed.
		await expect( inserterHeading ).toBeHidden();

		// Focus the block and start typing to hide the block toolbar.
		// Shouldn't be needed if we automatically hide the toolbar on blur.
		await page.focus( 'role=document[name="Block: Paragraph"i]' );
		await page.keyboard.type( ' ' );

		// Open the inserter outer section.
		await addBlockButton.click();

		await expect( inserterHeading ).toBeVisible();

		// Expect the Publish Settings section to be closed.
		await expect( publishSettings ).toBeHidden();

		// Back to the widget areas panel.
		await page.click( 'role=button[name=/Back$/] >> visible=true' );

		// Expect the inserter outer section to be closed.
		await expect( inserterHeading ).toBeHidden();
	} );

	test( 'should move focus to the block', async ( {
		page,
		requestUtils,
		widgetsCustomizerPage,
	} ) => {
		await requestUtils.addWidgetBlock(
			`<!-- wp:paragraph -->\n<p>First Paragraph</p>\n<!-- /wp:paragraph -->`,
			'sidebar-1'
		);
		await requestUtils.addWidgetBlock(
			`<!-- wp:heading -->\n<h2 class="wp-block-heading">First Heading</h2>\n<!-- /wp:heading -->`,
			'sidebar-1'
		);

		await widgetsCustomizerPage.visitCustomizerPage();
		await widgetsCustomizerPage.expandWidgetArea( 'Footer #1' );

		// Navigate back to the parent panel.
		await page.click( 'role=button[name=/Back$/] >> visible=true' );

		const previewFrame = widgetsCustomizerPage.previewFrame;

		const paragraphWidget = previewFrame.locator(
			'.widget:has-text("First Paragraph")'
		);

		const editParagraphWidget = paragraphWidget.locator(
			'role=button[name="Click to edit this widget."i]'
		);
		await editParagraphWidget.click();

		const firstParagraphBlock = page.locator(
			'role=document[name="Block: Paragraph"i] >> text="First Paragraph"'
		);
		await expect( firstParagraphBlock ).toBeFocused();

		// Expect to focus on a already focused widget.
		await paragraphWidget.click(); // noop click on the widget text to unfocus the editor and hide toolbar
		await editParagraphWidget.click();
		await expect( firstParagraphBlock ).toBeFocused();

		const headingWidget = previewFrame.locator(
			'.widget:has-text("First Heading")'
		);

		const editHeadingWidget = headingWidget.locator(
			'role=button[name="Click to edit this widget."i]'
		);

		await headingWidget.click(); // noop click on the widget text to unfocus the editor and hide toolbar
		await editHeadingWidget.click();

		const headingBlock = page.locator(
			'role=document[name="Block: Heading"i] >> text="First Heading"'
		);
		await expect( headingBlock ).toBeFocused();
	} );

	test( 'should clear block selection', async ( {
		editor,
		page,
		requestUtils,
		widgetsCustomizerPage,
	} ) => {
		await requestUtils.addWidgetBlock(
			`<!-- wp:paragraph -->\n<p>First Paragraph</p>\n<!-- /wp:paragraph -->`,
			'sidebar-1'
		);

		await widgetsCustomizerPage.visitCustomizerPage();
		await widgetsCustomizerPage.expandWidgetArea( 'Footer #1' );

		const paragraphBlock = page.locator( 'text="First Paragraph"' );
		await paragraphBlock.focus();
		await editor.showBlockToolbar();

		const blockToolbar = page.locator(
			'role=toolbar[name="Block tools"i]'
		);

		// Expect clicking on the section title should clear the selection.
		{
			await page.click(
				'role=heading[name="Customizing ▸ Widgets Footer #1"i][level=3]'
			);
			await expect( blockToolbar ).toBeHidden();

			await paragraphBlock.focus();
			await editor.showBlockToolbar();
		}

		// Expect clicking on the preview iframe should clear the selection.
		{
			await page.click( '#customize-preview' );
			await expect( blockToolbar ).toBeHidden();

			await paragraphBlock.focus();
			await editor.showBlockToolbar();
		}

		// Expect clicking on the empty space at the end of the editor
		// should clear the selection.
		{
			const editorContainer = page.locator(
				'#customize-control-sidebars_widgets-sidebar-1'
			);
			const { x, y, width, height } = await editorContainer.boundingBox();
			// Simulate Clicking on the empty space at the end of the editor.
			await page.mouse.click( x + width / 2, y + height + 10 );
			await expect( blockToolbar ).toBeHidden();
		}
	} );

	test( 'should handle legacy widgets', async ( {
		editor,
		page,
		widgetsCustomizerPage,
		pageUtils,
	} ) => {
		await widgetsCustomizerPage.visitCustomizerPage();
		await widgetsCustomizerPage.expandWidgetArea( 'Footer #1' );

		const legacyWidgetBlock =
			await widgetsCustomizerPage.addBlock( 'Legacy Widget' );
		await page
			.locator( 'role=combobox[name="Legacy widget"i]' )
			.selectOption( 'test_widget' );

		await expect(
			legacyWidgetBlock.locator(
				'role=heading[name="Test Widget"][level=3]'
			)
		).toBeVisible();

		let titleInput = legacyWidgetBlock.locator(
			'role=textbox[name="Title:"i]'
		);

		await titleInput.type( 'Hello Title' );

		// Unfocus the current legacy widget.
		await pageUtils.pressKeys( 'Tab' );

		const previewFrame = widgetsCustomizerPage.previewFrame;
		const legacyWidgetPreviewFrame = page.frameLocator(
			'iframe[title="Legacy Widget Preview"]'
		);

		// Expect the legacy widget to show in the site preview frame.
		await expect(
			previewFrame.locator( 'role=heading[name="Hello Title"]' )
		).toBeVisible();

		// Expect the preview in block to show when unfocusing the legacy widget block.
		await expect(
			legacyWidgetPreviewFrame.locator(
				'role=heading[name="Hello Title"]'
			)
		).toBeVisible();

		await legacyWidgetBlock.focus();
		await editor.showBlockToolbar();

		// Testing removing the block.
		await editor.clickBlockToolbarButton( 'Options' );
		await page.click( 'role=menuitem[name=/Delete/]' );

		// Add it back again using the variant.
		const testWidgetBlock =
			await widgetsCustomizerPage.addBlock( 'Test Widget' );

		titleInput = testWidgetBlock.locator( 'role=textbox[name="Title:"i]' );

		await titleInput.type( 'Hello again!' );
		// Unfocus the current legacy widget.
		await pageUtils.pressKeys( 'Tab' );

		// Expect the preview in block to show when unfocusing the legacy widget block.
		await expect(
			legacyWidgetPreviewFrame.locator(
				'role=heading[name="Hello again!"]'
			)
		).toBeVisible();

		// Wait for publishing to finish.
		await Promise.all( [
			page.waitForResponse( '/wp-admin/admin-ajax.php' ),
			page.click( 'role=button[name="Publish"i]' ),
		] );
		await expect(
			page.locator( 'role=button[name="Published"i]' )
		).toBeDisabled();

		await page.goto( '/' );

		// Expect the saved widgets to show on frontend.
		await expect(
			page.locator( 'role=heading[name="Hello again!"]' )
		).toBeVisible();
	} );

	test( 'should handle esc key events', async ( {
		editor,
		page,
		requestUtils,
		widgetsCustomizerPage,
	} ) => {
		await requestUtils.addWidgetBlock(
			`<!-- wp:paragraph -->\n<p>First Paragraph</p>\n<!-- /wp:paragraph -->`,
			'sidebar-1'
		);

		await widgetsCustomizerPage.visitCustomizerPage();
		await widgetsCustomizerPage.expandWidgetArea( 'Footer #1' );

		const paragraphBlock = page.locator( 'text="First Paragraph"' );
		await paragraphBlock.focus();
		await editor.showBlockToolbar();

		const optionsMenu = page.locator( 'role=menu[name="Options"i]' );

		// Open the more menu dropdown in block toolbar.
		await editor.clickBlockToolbarButton( 'Options' );
		await expect( optionsMenu ).toBeVisible();

		// Expect pressing the Escape key to close the dropdown,
		// but not close the editor.
		await page.keyboard.press( 'Escape' );
		await expect( optionsMenu ).toBeHidden();
		await expect( paragraphBlock ).toBeVisible();

		await paragraphBlock.focus();
	} );

	test( 'should move (inner) blocks to another sidebar', async ( {
		editor,
		page,
		requestUtils,
		widgetsCustomizerPage,
	} ) => {
		await requestUtils.addWidgetBlock(
			`<!-- wp:paragraph -->\n<p>First Paragraph</p>\n<!-- /wp:paragraph -->`,
			'sidebar-1'
		);

		await widgetsCustomizerPage.visitCustomizerPage();
		await widgetsCustomizerPage.expandWidgetArea( 'Footer #1' );

		await page.focus( 'text="First Paragraph"' );
		await editor.clickBlockToolbarButton( 'Options' );
		await page.click( 'role=menuitem[name="Group"i]' );

		// Refocus the paragraph block.
		await page.focus(
			'*role=document[name="Block: Paragraph"i] >> text="First Paragraph"'
		);
		await editor.clickBlockToolbarButton( 'Move to widget area' );

		await page.click( 'role=menuitemradio[name="Footer #2"i]' );

		// Should switch to and expand Footer #2.
		await expect(
			page.locator(
				'role=heading[name="Customizing ▸ Widgets Footer #2"i]'
			)
		).toBeVisible();

		// The paragraph block should be moved to the new sidebar and have focus.
		const movedParagraphBlock = page.locator(
			'*role=document[name="Block: Paragraph"i] >> text="First Paragraph"'
		);
		await expect( movedParagraphBlock ).toBeVisible();
		await expect( movedParagraphBlock ).toBeFocused();
	} );

	test( 'should not render Block Settings sections', async ( {
		page,
		widgetsCustomizerPage,
	} ) => {
		await widgetsCustomizerPage.visitCustomizerPage();

		// We add Block Settings as a section, but it shouldn't display to
		// the user as a section on the main menu. It's simply how we
		// integrate the G sidebar inside the customizer.
		await expect(
			page.locator( 'role=heading[name=/Block Settings/][level=3]' )
		).toBeHidden();
	} );

	test( 'should stay in block settings after making a change in that area', async ( {
		editor,
		page,
		widgetsCustomizerPage,
	} ) => {
		await widgetsCustomizerPage.visitCustomizerPage();
		await widgetsCustomizerPage.expandWidgetArea( 'Footer #1' );

		// Add a block to make the publish button active.
		await widgetsCustomizerPage.addBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );

		// Click Publish
		await Promise.all( [
			page.waitForResponse( '/wp-admin/admin-ajax.php' ),
			page.click( 'role=button[name="Publish"i]' ),
		] );
		// Wait for publishing to finish.
		await expect(
			page.locator( 'role=button[name="Published"i]' )
		).toBeDisabled();

		// Select the paragraph block
		await page.focus( 'role=document[name="Block: Paragraph"i]' );

		// Click the three dots button, then click "Show More Settings".
		await editor.clickBlockToolbarButton( 'Options' );
		await page.click( 'role=menuitem[name="Show more settings"i]' );

		// Change `drop cap` (Any change made in this section is sufficient; not required to be `drop cap`).
		await page.click( 'role=button[name="Typography options"i]' );
		await page.click( 'role=menuitemcheckbox[name="Show Drop cap"i]' );

		await page.click( 'role=checkbox[name="Drop cap"i]' );

		// Now that we've made a change:
		// (1) Publish button should be active
		// (2) We should still be in the "Block Settings" area
		await expect(
			page.locator( 'role=button[name="Publish"i]' )
		).toBeEnabled();

		// This fails on 539cea09 and earlier; we get kicked back to the widgets area.
		// We expect to stay in block settings.
		await expect(
			page.locator(
				'role=heading[name="Customizing ▸ Widgets ▸ Footer #1 Block Settings"i][level=3]'
			)
		).toBeVisible();
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/33832.
	test( 'preserves content in the Custom HTML block', async ( {
		page,
		widgetsCustomizerPage,
	} ) => {
		await widgetsCustomizerPage.visitCustomizerPage();
		await widgetsCustomizerPage.expandWidgetArea( 'Footer #1' );

		await widgetsCustomizerPage.addBlock( 'Custom HTML' );
		const HTMLBlockTextarea = page.locator(
			'role=document[name="Block: Custom HTML"i] >> role=textbox[name="HTML"i]'
		);
		await HTMLBlockTextarea.type( 'hello' );

		// Click Publish
		await Promise.all( [
			page.waitForResponse( '/wp-admin/admin-ajax.php' ),
			page.click( 'role=button[name="Publish"i]' ),
		] );

		// reload
		await widgetsCustomizerPage.visitCustomizerPage();
		await widgetsCustomizerPage.expandWidgetArea( 'Footer #1' );

		await expect( HTMLBlockTextarea ).toHaveText( 'hello' );
	} );
} );

class WidgetsCustomizerPage {
	/**
	 * @param {Object}    config
	 * @param {Admin}     config.admin
	 * @param {Page}      config.page
	 * @param {PageUtils} config.pageUtils
	 * @param {Editor}    config.editor
	 */
	constructor( { admin, page, pageUtils, editor } ) {
		this.admin = admin;
		this.page = page;
		this.pageUtils = pageUtils;
		this.editor = editor;

		/** @type {FrameLocator} */
		this.previewFrame = this.page
			.frameLocator( 'iframe[title="Site Preview"]' )
			// There could be two preview frames at the same time while updating.
			// We only care about the latest (last) one.
			.last();
	}

	async visitCustomizerPage() {
		await this.admin.visitAdminPage( 'customize.php' );

		// Disable welcome guide.
		await this.editor.setPreferences( 'core/customize-widgets', {
			welcomeGuide: false,
		} );
	}

	/**
	 * @param {string} widgetAreaName The Widget Area's name to expand on.
	 */
	async expandWidgetArea( widgetAreaName ) {
		await this.page.click( 'role=heading[name=/Widgets/i][level=3]' );

		await this.page.click(
			`role=heading[name=/${ widgetAreaName }/i][level=3]`
		);
	}

	/**
	 * @param {string} blockName The block to be added.
	 */
	async addBlock( blockName ) {
		await this.page.click(
			'role=toolbar[name="Document tools"i] >> role=button[name="Add block"i]'
		);

		const searchBox = this.page.locator( 'role=searchbox[name="Search"i]' );

		// Clear the input.
		await searchBox.evaluate( ( node ) => {
			if ( node.value ) {
				node.value = '';
			}
		} );

		await searchBox.type( blockName );

		await this.page.click( `role=option[name="${ blockName }"]` );

		const addedBlock = this.page.locator(
			'role=document >> css=.is-selected[data-block]'
		);
		await addedBlock.focus();

		const blockId = await addedBlock.getAttribute( 'data-block' );
		const stableSelector = `[data-block="${ blockId }"]`;

		return this.page.locator( stableSelector );
	}
}
