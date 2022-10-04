/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	clickBlockToolbarButton,
	clickMenuItem,
	createNewPost,
	getCurrentPostContent,
	switchEditorModeTo,
	pressKeyTimes,
	pressKeyWithModifier,
	openTypographyToolsPanelMenu,
} from '@wordpress/e2e-test-utils';

describe( 'Editing modes (visual/HTML)', () => {
	beforeEach( async () => {
		await createNewPost();
		await clickBlockAppender();
		await page.keyboard.type( 'Hello world!' );
	} );

	it( 'should switch between visual and HTML modes', async () => {
		// This block should be in "visual" mode by default.
		let visualBlock = await page.$$(
			'.block-editor-block-list__layout .block-editor-block-list__block.rich-text'
		);
		expect( visualBlock ).toHaveLength( 1 );

		// Change editing mode from "Visual" to "HTML".
		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Edit as HTML' );

		// Wait for the block to be converted to HTML editing mode.
		const htmlBlock = await page.$$(
			'.block-editor-block-list__layout .block-editor-block-list__block .block-editor-block-list__block-html-textarea'
		);
		expect( htmlBlock ).toHaveLength( 1 );

		// Change editing mode from "HTML" back to "Visual".
		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Edit visually' );

		// This block should be in "visual" mode by default.
		visualBlock = await page.$$(
			'.block-editor-block-list__layout .block-editor-block-list__block.rich-text'
		);
		expect( visualBlock ).toHaveLength( 1 );
	} );

	it( 'should display sidebar in HTML mode', async () => {
		// Change editing mode from "Visual" to "HTML".
		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Edit as HTML' );

		// The `drop cap` toggle for the paragraph block should appear, even in
		// HTML editing mode.
		await openTypographyToolsPanelMenu();
		await page.click( 'button[aria-label="Show Drop cap"]' );

		const dropCapToggle = await page.$x(
			"//label[contains(text(), 'Drop cap')]"
		);

		expect( dropCapToggle ).toHaveLength( 1 );
	} );

	it( 'should update HTML in HTML mode when sidebar is used', async () => {
		// Change editing mode from "Visual" to "HTML".
		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Edit as HTML' );

		// Make sure the paragraph content is rendered as expected.
		let htmlBlockContent = await page.$eval(
			'.block-editor-block-list__layout .block-editor-block-list__block .block-editor-block-list__block-html-textarea',
			( node ) => node.textContent
		);
		expect( htmlBlockContent ).toEqual( '<p>Hello world!</p>' );

		// Change the `drop cap` using the sidebar.
		await openTypographyToolsPanelMenu();
		await page.click( 'button[aria-label="Show Drop cap"]' );

		const [ dropCapToggle ] = await page.$x(
			"//label[contains(text(), 'Drop cap')]"
		);
		await dropCapToggle.click();

		// Make sure the HTML content updated.
		htmlBlockContent = await page.$eval(
			'.block-editor-block-list__layout .block-editor-block-list__block .block-editor-block-list__block-html-textarea',
			( node ) => node.textContent
		);
		expect( htmlBlockContent ).toEqual(
			'<p class="has-drop-cap">Hello world!</p>'
		);
	} );

	it( 'the code editor should unselect blocks and disable the inserter', async () => {
		// The paragraph block should be selected.
		const title = await page.$eval(
			'.block-editor-block-card__title',
			( element ) => element.innerText
		);
		expect( title ).toBe( 'Paragraph' );

		// The Block inspector should be active.
		let blockInspectorTab = await page.$(
			'.edit-post-sidebar__panel-tab.is-active[data-label="Block"]'
		);
		expect( blockInspectorTab ).not.toBeNull();

		await switchEditorModeTo( 'Code' );

		// The Block inspector should not be active anymore.
		blockInspectorTab = await page.$(
			'.edit-post-sidebar__panel-tab.is-active[data-label="Block"]'
		);
		expect( blockInspectorTab ).toBeNull();

		// No block is selected.
		await page.click( '.edit-post-sidebar__panel-tab[data-label="Block"]' );
		const noBlocksElement = await page.$(
			'.block-editor-block-inspector__no-blocks'
		);
		expect( noBlocksElement ).not.toBeNull();

		// The inserter is disabled.
		const disabledInserter = await page.$(
			'.edit-post-header-toolbar__inserter-toggle:disabled, .edit-post-header-toolbar__inserter-toggle[aria-disabled="true"]'
		);
		expect( disabledInserter ).not.toBeNull();
	} );

	// Test for regressions of https://github.com/WordPress/gutenberg/issues/24054.
	it( 'saves content when using the shortcut in the Code Editor', async () => {
		await switchEditorModeTo( 'Code' );

		const textContent = await page.evaluate(
			() => document.querySelector( '.editor-post-text-editor' ).value
		);
		const editPosition = textContent.indexOf( 'Hello' );

		// Replace the word 'Hello' with 'Hi'.
		await page.click( '.editor-post-title__input' );
		await page.keyboard.press( 'Tab' );
		await pressKeyTimes( 'ArrowRight', editPosition );
		await pressKeyTimes( 'Delete', 5 );
		await page.keyboard.type( 'Hi' );

		// Save the post using the shortcut.
		await pressKeyWithModifier( 'primary', 's' );
		await page.waitForSelector( '.editor-post-saved-state.is-saved' );

		await switchEditorModeTo( 'Visual' );

		expect( await getCurrentPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>Hi world!</p>
		<!-- /wp:paragraph -->"
	` );
	} );
} );
