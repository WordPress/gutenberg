/**
 * WordPress dependencies
 */
import {
	clickMenuItem,
	insertBlock,
	insertPattern,
	createNewPost,
	clickBlockToolbarButton,
	pressKeyWithModifier,
	getEditedPostContent,
	trashAllPosts,
	visitAdminPage,
	toggleGlobalBlockInserter,
	openDocumentSettingsSidebar,
	saveDraft,
	createReusableBlock,
	canvas,
} from '@wordpress/e2e-test-utils';

const patternBlockNameInputSelector =
	'.patterns-menu-items__convert-modal .components-text-control__input';
const patternBlockInspectorNameSelector =
	'.block-editor-block-inspector h2.block-editor-block-card__title';
const syncToggleSelectorChecked =
	'.patterns-menu-items__convert-modal .components-form-toggle.is-checked';

const clearAllBlocks = async () => {
	// Remove all blocks from the post so that we're working with a clean slate.
	await page.evaluate( () => {
		const blocks = wp.data.select( 'core/block-editor' ).getBlocks();
		const clientIds = blocks.map( ( block ) => block.clientId );
		wp.data.dispatch( 'core/block-editor' ).removeBlocks( clientIds );
	} );
};

describe( 'Pattern blocks', () => {
	afterAll( async () => {
		await trashAllPosts( 'wp_block' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created, inserted, and converted to a regular block.', async () => {
		await createReusableBlock( 'Hello there!', 'Greeting block' );
		await clearAllBlocks();

		// Insert the reusable block we created above.
		await insertPattern( 'Greeting block' );

		// Check that its content is up to date.
		const text = await canvas().$eval(
			'.block-editor-block-list__block[data-type="core/block"] p',
			( element ) => element.innerText
		);
		expect( text ).toMatch( 'Hello there!' );

		await clearAllBlocks();

		// Insert the reusable block we edited above.
		await insertPattern( 'Greeting block' );

		// Convert block to a regular block.
		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Detach' );

		// Check that we have a paragraph block on the page.
		const paragraphBlock = await canvas().$(
			'.block-editor-block-list__block[data-type="core/paragraph"]'
		);
		expect( paragraphBlock ).not.toBeNull();

		// Check that its content is up to date.
		const paragraphContent = await canvas().$eval(
			'.block-editor-block-list__block[data-type="core/paragraph"]',
			( element ) => element.innerText
		);
		expect( paragraphContent ).toMatch( 'Hello there!' );
	} );

	it( 'can be inserted after refresh', async () => {
		await createReusableBlock( 'Awesome Paragraph', 'Awesome block' );

		// Step 2. Create new post.
		await createNewPost();

		// Step 3. Insert the block created in Step 1.
		await insertPattern( 'Awesome block' );

		// Check the title.
		await openDocumentSettingsSidebar();
		const title = await page.$eval(
			patternBlockInspectorNameSelector,
			( element ) => element.textContent
		);
		expect( title ).toBe( 'Awesome block' );
	} );

	it( 'can be created from multiselection and converted back to regular blocks', async () => {
		await createNewPost();

		// Insert a Two paragraphs block.
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Hello there!' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second paragraph' );

		// Select all the blocks.
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		// Convert block to a reusable block.
		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Create pattern' );

		// Set title.
		const nameInput = await page.waitForSelector(
			patternBlockNameInputSelector
		);
		await nameInput.click();
		await page.keyboard.type( 'Multi-selection reusable block' );
		await page.waitForSelector( syncToggleSelectorChecked );
		await page.keyboard.press( 'Enter' );

		// Wait for creation to finish.
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[contains(text(),"pattern created:")]'
		);

		await clearAllBlocks();

		// Insert the reusable block we edited above.
		await insertPattern( 'Multi-selection reusable block' );

		// Convert block to a regular block.
		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Detach' );

		// Check that we have two paragraph blocks on the page.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'will not break the editor if empty', async () => {
		await createReusableBlock(
			'Awesome Paragraph',
			'Random reusable block'
		);
		await clearAllBlocks();
		await insertPattern( 'Random reusable block' );

		await visitAdminPage( 'edit.php', [ 'post_type=wp_block' ] );

		const [ editButton ] = await page.$x(
			`//a[contains(@aria-label, 'Random reusable block')]`
		);
		await editButton.click();

		await page.waitForNavigation();
		await page.waitForSelector( 'iframe[name="editor-canvas"]' );

		// Click the block to give it focus.
		const blockSelector = 'p[data-title="Paragraph"]';
		await canvas().waitForSelector( blockSelector );
		await canvas().click( blockSelector );

		// Delete the block, leaving the reusable block empty.
		await clickBlockToolbarButton( 'Options' );
		const deleteButton = await page.waitForXPath(
			'//button/span[text()="Delete"]'
		);
		deleteButton.click();

		// Wait for the Update button to become enabled.
		const publishButtonSelector = '.editor-post-publish-button__button';
		await page.waitForSelector(
			publishButtonSelector + '[aria-disabled="false"]'
		);

		// Save the reusable block.
		await page.click( publishButtonSelector );
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[text()="Pattern updated."]'
		);

		await createNewPost();

		await toggleGlobalBlockInserter();

		expect( console ).not.toHaveErrored();
	} );

	it( 'Should show a proper message when the reusable block is missing', async () => {
		// Insert a non-existant reusable block.
		await page.evaluate( () => {
			const { createBlock } = window.wp.blocks;
			const { dispatch } = window.wp.data;
			dispatch( 'core/block-editor' ).resetBlocks( [
				createBlock( 'core/block', { ref: 123456 } ),
			] );
		} );

		await canvas().waitForXPath(
			'//*[contains(@class, "block-editor-warning")]/*[text()="Block has been deleted or is unavailable."]'
		);

		// This happens when the 404 is returned.
		expect( console ).toHaveErrored();
	} );

	it( 'should be able to insert a reusable block twice', async () => {
		await createReusableBlock(
			'Awesome Paragraph',
			'Duplicated reusable block'
		);
		await clearAllBlocks();
		await insertPattern( 'Duplicated reusable block' );
		await insertPattern( 'Duplicated reusable block' );
		await saveDraft();
		await page.reload();
		await page.waitForSelector( 'iframe[name="editor-canvas"]' );

		// Wait for the paragraph to be loaded.
		await canvas().waitForSelector(
			'.block-editor-block-list__block[data-type="core/paragraph"]'
		);
		// The first click selects the reusable block wrapper.
		// The second click selects the actual paragraph block.
		await canvas().click( '.wp-block-block' );
		await canvas().focus(
			'.block-editor-block-list__block[data-type="core/paragraph"]'
		);
		await pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' modified' );

		// Wait for async mode to dispatch the update.
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 1000 );

		// Check that the content of the second reusable block has been updated.
		const reusableBlocks = await page.$$( '.wp-block-block' );
		await Promise.all(
			reusableBlocks.map( async ( paragraph ) => {
				const content = await paragraph.$eval(
					'p',
					( element ) => element.textContent
				);
				expect( content ).toEqual( 'Awesome Paragraph modified' );
			} )
		);
	} );

	// Test for regressions of https://github.com/WordPress/gutenberg/issues/27243.
	it( 'should allow a block with styles to be converted to a reusable block', async () => {
		// Insert a quote and reload the page.
		insertBlock( 'Quote' );
		await saveDraft();
		await page.reload();
		await page.waitForSelector( 'iframe[name="editor-canvas"]' );

		// The quote block should have a visible preview in the sidebar for this test to be valid.
		const quoteBlock = await canvas().waitForSelector(
			'.block-editor-block-list__block[aria-label="Block: Quote"]'
		);
		// Select the quote block.
		await quoteBlock.focus();
		await openDocumentSettingsSidebar();
		await page.waitForXPath(
			'//*[@role="region"][@aria-label="Editor settings"]//button[.="Styles"]'
		);

		// Convert to reusable.
		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Create pattern' );
		const nameInput = await page.waitForSelector(
			patternBlockNameInputSelector
		);
		await nameInput.click();
		await page.keyboard.type( 'Block with styles' );
		await page.waitForSelector( syncToggleSelectorChecked );
		await page.keyboard.press( 'Enter' );
		const reusableBlock = await canvas().waitForSelector(
			'.block-editor-block-list__block[aria-label="Block: Pattern"]'
		);
		expect( reusableBlock ).toBeTruthy();
	} );
} );
