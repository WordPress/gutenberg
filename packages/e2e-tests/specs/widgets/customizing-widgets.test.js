/**
 * WordPress dependencies
 */
import {
	__experimentalActivatePlugin as activatePlugin,
	activateTheme,
	__experimentalDeactivatePlugin as deactivatePlugin,
	visitAdminPage,
	showBlockToolbar,
	clickBlockToolbarButton,
	deleteAllWidgets,
	createURL,
	openTypographyToolsPanelMenu,
} from '@wordpress/e2e-test-utils';

/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { find, findAll } from 'puppeteer-testing-library';

describe( 'Widgets Customizer', () => {
	beforeEach( async () => {
		await deleteAllWidgets();
		await visitAdminPage( 'customize.php' );

		// Disable welcome guide if it is enabled.
		const isWelcomeGuideActive = await page.evaluate( () =>
			wp.data
				.select( 'core/interface' )
				.isFeatureActive( 'core/customize-widgets', 'welcomeGuide' )
		);
		if ( isWelcomeGuideActive ) {
			await page.evaluate( () =>
				wp.data
					.dispatch( 'core/interface' )
					.toggleFeature( 'core/customize-widgets', 'welcomeGuide' )
			);
		}
	} );

	beforeAll( async () => {
		// TODO: Ideally we can bundle our test theme directly in the repo.
		await activateTheme( 'twentytwenty' );
		await deactivatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
		// Disable the transition timing function to make it "snap".
		// We can't disable all the transitions yet because of #32024.
		await page.evaluateOnNewDocument( () => {
			const style = document.createElement( 'style' );
			style.innerHTML = `
				* {
					transition-timing-function: step-start !important;
					animation-timing-function: step-start !important;
				}
			`;
			window.addEventListener( 'DOMContentLoaded', () => {
				document.head.appendChild( style );
			} );
		} );
		await activatePlugin( 'gutenberg-test-widgets' );
	} );

	afterAll( async () => {
		await activatePlugin(
			'gutenberg-test-plugin-disables-the-css-animations'
		);
		await deactivatePlugin( 'gutenberg-test-widgets' );
		await activateTheme( 'twentytwentyone' );
	} );

	it( 'should add blocks', async () => {
		const widgetsPanel = await find( {
			role: 'heading',
			name: /Widgets/,
			level: 3,
		} );
		await widgetsPanel.click();

		const footer1Section = await find( {
			role: 'heading',
			name: /Footer #1/,
			level: 3,
		} );
		await footer1Section.click();

		await addBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );

		await waitForPreviewIframe();

		await addBlock( 'Heading' );
		await page.keyboard.type( 'My Heading' );

		const inlineAddBlockButton = await find( {
			role: 'combobox',
			name: 'Add block',
			haspopup: 'menu',
		} );
		await inlineAddBlockButton.click();

		const inlineInserterSearchBox = await find( {
			role: 'searchbox',
			name: 'Search for blocks and patterns',
		} );

		await expect( inlineInserterSearchBox ).toHaveFocus();

		await page.keyboard.type( 'Search' );

		const searchOption = await find( {
			role: 'option',
			name: 'Search',
		} );
		await searchOption.click();

		const addedSearchBlock = await find( {
			role: 'document',
			name: 'Block: Search',
		} );

		const searchTitle = await find(
			{
				role: 'textbox',
				name: 'Label text',
			},
			{ root: addedSearchBlock }
		);
		await searchTitle.focus();

		await page.keyboard.type( 'My ' );

		await waitForPreviewIframe();

		const findOptions = {
			root: await find( {
				name: 'Site Preview',
				selector: 'iframe',
			} ),
		};

		// Expect the paragraph to be found in the preview iframe.
		await expect( {
			text: 'First Paragraph',
			selector: '.widget-content p',
		} ).toBeFound( findOptions );

		// Expect the heading to be found in the preview iframe.
		await expect( {
			role: 'heading',
			name: 'My Heading',
			selector: '.widget-content *',
		} ).toBeFound( findOptions );

		// Expect the search box to be found in the preview iframe.
		await expect( {
			role: 'searchbox',
			name: 'My Search',
			selector: '.widget-content *',
		} ).toBeFound( findOptions );
	} );

	it( 'should open the inspector panel', async () => {
		const widgetsPanel = await find( {
			role: 'heading',
			name: /Widgets/,
			level: 3,
		} );
		await widgetsPanel.click();

		const footer1Section = await find( {
			role: 'heading',
			name: /Footer #1/,
			level: 3,
		} );
		await footer1Section.click();

		await addBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );

		await showBlockToolbar();
		await clickBlockToolbarButton( 'Options' );
		let showMoreSettingsButton = await find( {
			role: 'menuitem',
			name: 'Show more settings',
		} );
		await showMoreSettingsButton.click();

		const backButton = await find( {
			role: 'button',
			name: /Back/,
			focused: true,
		} );
		await expect( backButton ).toHaveFocus();

		// Expect the inspector panel to be found.
		let inspectorHeading = await find( {
			role: 'heading',
			name: 'Customizing ▸ Widgets ▸ Footer #1 Block Settings',
			level: 3,
		} );

		// Expect the block title to be found.
		await expect( {
			role: 'heading',
			name: 'Paragraph',
			level: 2,
		} ).toBeFound();

		await backButton.click();

		// Go back to the widgets editor.
		await find( {
			role: 'heading',
			name: 'Customizing ▸ Widgets Footer #1',
			level: 3,
		} );

		await expect( inspectorHeading ).not.toBeVisible();

		await clickBlockToolbarButton( 'Options' );
		showMoreSettingsButton = await find( {
			role: 'menuitem',
			name: 'Show more settings',
		} );
		await showMoreSettingsButton.click();

		// Expect the inspector panel to be found.
		inspectorHeading = await find( {
			role: 'heading',
			name: 'Customizing ▸ Widgets ▸ Footer #1 Block Settings',
			level: 3,
		} );

		// Press Escape to close the inspector panel.
		await page.keyboard.press( 'Escape' );

		// Go back to the widgets editor.
		await expect( {
			role: 'heading',
			name: 'Customizing ▸ Widgets Footer #1',
			level: 3,
		} ).toBeFound();

		await expect( inspectorHeading ).not.toBeVisible();
	} );

	it( 'should handle the inserter outer section', async () => {
		const widgetsPanel = await find( {
			role: 'heading',
			name: /Widgets/,
			level: 3,
		} );
		await widgetsPanel.click();

		const footer1Section = await find( {
			role: 'heading',
			name: /^Footer #1/,
			level: 3,
		} );
		await footer1Section.click();

		// We need to make some changes for the publish settings to appear.
		await addBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );

		await waitForPreviewIframe();

		const documentTools = await find( {
			role: 'toolbar',
			name: 'Document tools',
		} );

		// Open the inserter outer section.
		const addBlockButton = await find(
			{
				role: 'button',
				name: 'Add block',
			},
			{ root: documentTools }
		);
		await addBlockButton.click();

		// Expect the inserter outer section to be found.
		await expect( {
			role: 'heading',
			name: 'Add a block',
			level: 2,
		} ).toBeFound();

		// Expect to close the inserter outer section when pressing Escape.
		await page.keyboard.press( 'Escape' );

		// Open the inserter outer section again.
		await addBlockButton.click();

		// Expect the inserter outer section to be found again.
		const inserterHeading = await find( {
			role: 'heading',
			name: 'Add a block',
			level: 2,
		} );

		// Open the Publish Settings.
		const publishSettingsButton = await find( {
			role: 'button',
			name: 'Publish Settings',
		} );
		await publishSettingsButton.click();

		// Expect the Publish Settings outer section to be found.
		const publishSettings = await find( {
			selector: '#sub-accordion-section-publish_settings',
		} );

		// Expect the inserter outer section to be closed.
		await expect( inserterHeading ).not.toBeVisible();

		// Focus the block and start typing to hide the block toolbar.
		// Shouldn't be needed if we automatically hide the toolbar on blur.
		const paragraphBlock = await find( {
			role: 'document',
			name: 'Paragraph block',
		} );
		await paragraphBlock.focus();
		await page.keyboard.type( ' ' );

		// Open the inserter outer section.
		await addBlockButton.click();

		await expect( {
			role: 'heading',
			name: 'Add a block',
			level: 2,
		} ).toBeFound();

		// Expect the Publish Settings section to be closed.
		await expect( publishSettings ).not.toBeVisible();

		// Back to the widget areas panel.
		const backButton = await find( {
			role: 'button',
			name: /Back/,
		} );
		await backButton.click();

		// Expect the inserter outer section to be closed.
		await expect( {
			role: 'heading',
			name: 'Add a block',
			level: 2,
		} ).not.toBeFound();
	} );

	it( 'should move focus to the block', async () => {
		const widgetsPanel = await find( {
			role: 'heading',
			name: /Widgets/,
			level: 3,
		} );
		await widgetsPanel.click();

		const footer1Section = await find( {
			role: 'heading',
			name: /^Footer #1/,
			level: 3,
		} );
		await footer1Section.click();

		await addBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );

		await waitForPreviewIframe();

		await addBlock( 'Heading' );
		await page.keyboard.type( 'First Heading' );

		// Navigate back to the parent panel.
		const backButton = await find( { role: 'button', name: /Back/ } );
		await backButton.click();

		await waitForPreviewIframe();

		const iframe = await find( {
			name: 'Site Preview',
			selector: 'iframe',
		} );

		const paragraphWidget = await find(
			{
				text: /First Paragraph/,
				selector: '.widget',
			},
			{
				root: iframe,
			}
		);

		const editParagraphWidget = await find(
			{
				role: 'button',
				name: 'Click to edit this widget.',
			},
			{
				root: paragraphWidget,
			}
		);
		await editParagraphWidget.click();

		const firstParagraphBlock = await find( {
			role: 'document',
			name: 'Paragraph block',
			text: 'First Paragraph',
		} );
		await expect( firstParagraphBlock ).toHaveFocus();

		// Expect to focus on a already focused widget.
		await editParagraphWidget.click();
		await expect( firstParagraphBlock ).toHaveFocus();

		const headingWidget = await find(
			{
				text: /First Heading/,
				selector: '.widget',
			},
			{
				root: iframe,
			}
		);

		const editHeadingWidget = await find(
			{
				role: 'button',
				name: 'Click to edit this widget.',
			},
			{
				root: headingWidget,
			}
		);
		await editHeadingWidget.click();

		const headingBlock = await find( {
			role: 'document',
			name: 'Block: Heading',
			text: 'First Heading',
		} );
		await expect( headingBlock ).toHaveFocus();
	} );

	it( 'should clear block selection', async () => {
		const widgetsPanel = await find( {
			role: 'heading',
			name: /Widgets/,
			level: 3,
		} );
		await widgetsPanel.click();

		const footer1Section = await find( {
			role: 'heading',
			name: /^Footer #1/,
			level: 3,
		} );
		await footer1Section.click();

		const paragraphBlock = await addBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );
		await showBlockToolbar();

		const sectionHeading = await find( {
			role: 'heading',
			name: 'Customizing ▸ Widgets Footer #1',
			level: 3,
		} );
		await sectionHeading.click();

		// Expect clicking on the section title should clear the selection.
		await expect( {
			role: 'toolbar',
			name: 'Block tools',
		} ).not.toBeFound();

		await paragraphBlock.focus();
		await showBlockToolbar();

		const preview = await page.$( '#customize-preview' );
		await preview.click();

		// Expect clicking on the preview iframe should clear the selection.
		await expect( {
			role: 'toolbar',
			name: 'Block tools',
		} ).not.toBeFound();

		await paragraphBlock.focus();
		await showBlockToolbar();

		const editorContainer = await page.$(
			'#customize-control-sidebars_widgets-sidebar-1'
		);
		const { x, y, width, height } = await editorContainer.boundingBox();
		// Simulate Clicking on the empty space at the end of the editor.
		await page.mouse.click( x + width / 2, y + height + 10 );

		// Expect clicking on the empty space at the end of the editor
		// should clear the selection.
		await expect( {
			role: 'toolbar',
			name: 'Block tools',
		} ).not.toBeFound();
	} );

	it( 'should handle legacy widgets', async () => {
		const widgetsPanel = await find( {
			role: 'heading',
			name: /Widgets/,
			level: 3,
		} );
		await widgetsPanel.click();

		const footer1Section = await find( {
			role: 'heading',
			name: /^Footer #1/,
			level: 3,
		} );
		await footer1Section.click();

		const legacyWidgetBlock = await addBlock( 'Legacy Widget' );
		const selectLegacyWidgets = await find( {
			role: 'combobox',
			name: 'Select a legacy widget to display:',
		} );
		await selectLegacyWidgets.select( 'test_widget' );

		await expect( {
			role: 'heading',
			name: 'Test Widget',
			level: 3,
		} ).toBeFound( { root: legacyWidgetBlock } );

		let titleInput = await find(
			{
				role: 'textbox',
				name: 'Title:',
			},
			{
				root: legacyWidgetBlock,
			}
		);

		await titleInput.type( 'Hello Title' );

		// Unfocus the current legacy widget.
		await page.keyboard.press( 'Tab' );

		// Disable reason: Sometimes the preview just doesn't fully load,
		// it's the only way I know for now to ensure that the iframe is ready.
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 2000 );
		await waitForPreviewIframe();

		// Expect the legacy widget to show in the site preview frame.
		await expect( {
			role: 'heading',
			name: 'Hello Title',
		} ).toBeFound( {
			root: await find( {
				name: 'Site Preview',
				selector: 'iframe',
			} ),
		} );

		// Expect the preview in block to show when unfocusing the legacy widget block.
		await expect( {
			role: 'heading',
			name: 'Hello Title',
		} ).toBeFound( {
			root: await find( {
				selector: 'iframe',
				name: 'Legacy Widget Preview',
			} ),
		} );

		await legacyWidgetBlock.focus();
		await showBlockToolbar();

		// Testing removing the block.
		await clickBlockToolbarButton( 'Options' );
		const removeBlockButton = await find( {
			role: 'menuitem',
			name: /Remove Legacy Widget/,
		} );
		await removeBlockButton.click();

		// Add it back again using the variant.
		const testWidgetBlock = await addBlock( 'Test Widget' );

		titleInput = await find(
			{
				role: 'textbox',
				name: 'Title:',
			},
			{
				root: testWidgetBlock,
			}
		);

		await titleInput.type( 'Hello again!' );
		// Unfocus the current legacy widget.
		await page.keyboard.press( 'Tab' );

		// Expect the preview in block to show when unfocusing the legacy widget block.
		await expect( {
			role: 'heading',
			name: 'Hello again!',
		} ).toBeFound( {
			root: await find( {
				selector: 'iframe',
				name: 'Legacy Widget Preview',
			} ),
		} );

		const publishButton = await find( {
			role: 'button',
			name: 'Publish',
		} );
		await publishButton.click();

		// Wait for publishing to finish.
		await page.waitForResponse( createURL( '/wp-admin/admin-ajax.php' ) );
		await expect( publishButton ).toMatchQuery( {
			disabled: true,
		} );

		await page.goto( createURL( '/' ) );

		// Expect the saved widgets to show on frontend.
		await expect( {
			role: 'heading',
			name: 'Hello again!',
		} ).toBeFound();
	} );

	it( 'should handle esc key events', async () => {
		const widgetsPanel = await find( {
			role: 'heading',
			name: /Widgets/,
			level: 3,
		} );
		await widgetsPanel.click();

		const footer1Section = await find( {
			role: 'heading',
			name: /^Footer #1/,
			level: 3,
		} );
		await footer1Section.click();

		const paragraphBlock = await addBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );
		await showBlockToolbar();

		// Open the more menu dropdown in block toolbar.
		await clickBlockToolbarButton( 'Options' );
		await expect( {
			role: 'menu',
			name: 'Options',
		} ).toBeFound();

		// Expect pressing the Escape key to close the dropdown,
		// but not close the editor.
		await page.keyboard.press( 'Escape' );
		await expect( {
			role: 'menu',
			name: 'Options',
		} ).not.toBeFound();
		await expect( paragraphBlock ).toBeVisible();

		await paragraphBlock.focus();

		// Expect pressing the Escape key to enter navigation mode,
		// but not close the editor.
		await page.keyboard.press( 'Escape' );
		await expect( {
			text: /^You are currently in navigation mode\./,
			selector: '*[aria-live="polite"][aria-relevant="additions text"]',
		} ).toBeFound();
		await expect( paragraphBlock ).toBeVisible();
	} );

	it( 'should move (inner) blocks to another sidebar', async () => {
		const widgetsPanel = await find( {
			role: 'heading',
			name: /Widgets/,
			level: 3,
		} );
		await widgetsPanel.click();

		const footer1Section = await find( {
			role: 'heading',
			name: /Footer #1/,
			level: 3,
		} );
		await footer1Section.click();

		await addBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );

		await showBlockToolbar();
		await clickBlockToolbarButton( 'Options' );
		const groupButton = await find( {
			role: 'menuitem',
			name: 'Group',
		} );
		await groupButton.click();

		// Refocus the paragraph block.
		const paragraphBlock = await find( {
			role: 'document',
			name: 'Paragraph block',
			value: 'First Paragraph',
		} );
		await paragraphBlock.focus();
		await showBlockToolbar();
		await clickBlockToolbarButton( 'Move to widget area' );

		const footer2Option = await find( {
			role: 'menuitemradio',
			name: 'Footer #2',
		} );
		await footer2Option.click();

		// Should switch to and expand Footer #2.
		await expect( {
			role: 'heading',
			name: 'Customizing ▸ Widgets Footer #2',
		} ).toBeFound();

		// The paragraph block should be moved to the new sidebar and have focus.
		const movedParagraphBlockQuery = {
			role: 'document',
			name: 'Paragraph block',
			value: 'First Paragraph',
		};
		await expect( movedParagraphBlockQuery ).toBeFound();
		const movedParagraphBlock = await find( movedParagraphBlockQuery );
		await expect( movedParagraphBlock ).toHaveFocus();
	} );

	it( 'should not render Block Settings sections', async () => {
		// We add Block Settings as a section, but it shouldn't display to
		// the user as a section on the main menu. It's simply how we
		// integrate the G sidebar inside the customizer.
		const findAllBlockSettingsHeader = findAll(
			{
				role: 'heading',
				name: /Block Settings/,
				level: 3,
			},
			{ timeout: 0 }
		);
		await expect( findAllBlockSettingsHeader ).toThrowQueryEmptyError();
	} );

	it( 'should stay in block settings after making a change in that area', async () => {
		// Open footer block widgets
		const widgetsPanel = await find( {
			role: 'heading',
			name: /Widgets/,
			level: 3,
		} );
		await widgetsPanel.click();

		const footer1Section = await find( {
			role: 'heading',
			name: /^Footer #1/,
			level: 3,
		} );
		await footer1Section.click();

		// Add a block to make the publish button active.
		await addBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );

		await waitForPreviewIframe();

		// Click Publish.
		const publishButton = await find( {
			role: 'button',
			name: 'Publish',
		} );
		await publishButton.click();

		// Wait for publishing to finish.
		await page.waitForResponse( createURL( '/wp-admin/admin-ajax.php' ) );
		await expect( publishButton ).toMatchQuery( {
			disabled: true,
		} );

		// Select the paragraph block.
		const paragraphBlock = await find( {
			role: 'document',
			name: 'Paragraph block',
		} );
		await paragraphBlock.focus();

		// Click the three dots button, then click "Show More Settings".
		await showBlockToolbar();
		await clickBlockToolbarButton( 'Options' );
		const showMoreSettingsButton = await find( {
			role: 'menuitem',
			name: 'Show more settings',
		} );
		await showMoreSettingsButton.click();

		// Change `drop cap` (Any change made in this section is sufficient; not required to be `drop cap`).
		await openTypographyToolsPanelMenu();
		await page.click( 'button[aria-label="Show Drop cap"]' );

		const [ dropCapToggle ] = await page.$x(
			"//label[contains(text(), 'Drop cap')]"
		);
		await dropCapToggle.click();

		// Now that we've made a change:
		// (1) Publish button should be active
		// (2) We should still be in the "Block Settings" area.
		await find( {
			role: 'button',
			name: 'Publish',
		} );

		// This fails on 539cea09 and earlier; we get kicked back to the widgets area.
		// We expect to stay in block settings.
		await find( {
			role: 'heading',
			name: 'Customizing ▸ Widgets ▸ Footer #1 Block Settings',
			level: 3,
		} );
	} );
} );

/**
 * Wait when there's only one preview iframe.
 * There could be a 2 iframes when it's changing from no widgets to
 * adding a first widget to the sidebar,
 */
async function waitForPreviewIframe() {
	await page.waitForFunction(
		() =>
			document.querySelectorAll( '[name^="customize-preview-"]' )
				.length === 1
	);
}

async function addBlock( blockName ) {
	const addBlockButton = await find(
		{
			role: 'button',
			name: 'Add block',
		},
		{
			root: await find( {
				role: 'toolbar',
				name: 'Document tools',
			} ),
		}
	);
	await addBlockButton.click();

	const searchBox = await find( {
		role: 'searchbox',
		name: 'Search for blocks and patterns',
	} );

	// Clear the input.
	await searchBox.evaluate( ( node ) => {
		if ( node.value ) {
			node.value = '';
		}
	} );

	// Click something so that the block toolbar, which sometimes obscures
	// buttons in the inserter, goes away.
	await searchBox.click();

	await searchBox.type( blockName );

	// TODO - remove this timeout when the test plugin for disabling CSS
	// animations in tests works properly.
	//
	// This waits for the inserter panel animation to finish before
	// attempting to insert a block. If the panel is still animating
	// puppeteer can click on the wrong block.
	//
	// eslint-disable-next-line no-restricted-syntax
	await page.waitForTimeout( 300 );

	const blockOption = await find( {
		role: 'option',
		name: blockName,
	} );
	await blockOption.click();

	const addedBlock = await find( {
		role: 'document',
		selector: '.is-selected[data-block]',
	} );
	await addedBlock.focus();

	return addedBlock;
}
