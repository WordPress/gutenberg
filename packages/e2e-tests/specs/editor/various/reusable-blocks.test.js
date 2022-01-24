/**
 * WordPress dependencies
 */
import {
	clickMenuItem,
	insertBlock,
	insertReusableBlock,
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
	publishPost,
} from '@wordpress/e2e-test-utils';

const reusableBlockNameInputSelector =
	'.reusable-blocks-menu-items__convert-modal .components-text-control__input';
const reusableBlockInspectorNameInputSelector =
	'.block-editor-block-inspector .components-text-control__input';

const saveAll = async () => {
	const publishButtonSelector =
		'.editor-post-publish-button__button.has-changes-dot';
	// Wait for the Publish button to become enabled in case the editor is autosaving ATM:
	const publishButton = await page.waitForSelector(
		publishButtonSelector + '[aria-disabled="false"]'
	);
	await publishButton.click();

	const saveButtonSelector =
		'button.editor-entities-saved-states__save-button';
	const saveButton = await page.waitForSelector( saveButtonSelector );
	await saveButton.click();
};

const saveAllButDontPublish = async () => {
	await saveAll();

	// no need to publish the post.
	const cancelPublish = await page.waitForSelector(
		'.editor-post-publish-panel__header-cancel-button button'
	);
	await cancelPublish.click();
};

const clearAllBlocks = async () => {
	// Remove all blocks from the post so that we're working with a clean slate
	await page.evaluate( () => {
		const blocks = wp.data.select( 'core/block-editor' ).getBlocks();
		const clientIds = blocks.map( ( block ) => block.clientId );
		wp.data.dispatch( 'core/block-editor' ).removeBlocks( clientIds );
	} );
};

describe( 'Reusable blocks', () => {
	afterAll( async () => {
		await trashAllPosts( 'wp_block' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created, inserted, edited and converted to a regular block.', async () => {
		await createReusableBlock( 'Hello there!', 'Greeting block' );
		await clearAllBlocks();

		// Insert the reusable block we created above
		await insertReusableBlock( 'Greeting block' );

		// Change the block's title
		await openDocumentSettingsSidebar();
		const nameInput = await page.waitForSelector(
			reusableBlockInspectorNameInputSelector
		);
		await nameInput.click();
		await pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.type( 'Surprised greeting block' );

		// Quickly focus the paragraph block
		await page.click(
			'.block-editor-block-list__block[data-type="core/block"] p'
		);
		await page.keyboard.press( 'Escape' ); // Enter navigation mode
		await page.keyboard.press( 'Enter' ); // Enter edit mode

		// Change the block's content
		await page.keyboard.type( 'Oh! ' );

		// Save the reusable block
		await saveAllButDontPublish();

		// Check that its content is up to date
		const text = await page.$eval(
			'.block-editor-block-list__block[data-type="core/block"] p',
			( element ) => element.innerText
		);
		expect( text ).toMatch( 'Oh! Hello there!' );

		await clearAllBlocks();

		// Insert the reusable block we edited above
		await insertReusableBlock( 'Surprised greeting block' );

		// Convert block to a regular block
		await clickBlockToolbarButton( 'Convert to regular blocks' );

		// Check that we have a paragraph block on the page
		const paragraphBlock = await page.$(
			'.block-editor-block-list__block[data-type="core/paragraph"]'
		);
		expect( paragraphBlock ).not.toBeNull();

		// Check that its content is up to date
		const paragraphContent = await page.$eval(
			'.block-editor-block-list__block[data-type="core/paragraph"]',
			( element ) => element.innerText
		);
		expect( paragraphContent ).toMatch( 'Oh! Hello there!' );
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/33072.
	it( 'can be saved when modified inside of a published post', async () => {
		await createReusableBlock(
			'Guten Berg!',
			'Alternative greeting block'
		);

		// Make sure the reusable block has loaded properly before attempting to publish the post.
		await page.waitForSelector( 'p[aria-label="Paragraph block"]' );

		await publishPost();

		// Close publish panel.
		const closePublishPanelSelector =
			'.editor-post-publish-panel__header button[aria-label="Close panel"]';
		await page.waitForSelector( closePublishPanelSelector );
		await page.click( closePublishPanelSelector );

		await page.waitForSelector( 'p[aria-label="Paragraph block"]' );
		await page.focus( 'p[aria-label="Paragraph block"]' );

		// Change the block's content
		await page.keyboard.type( 'Einen ' );

		// Save the reusable block and update the post
		await saveAll();

		// Check that its content is up to date
		const paragraphContent = await page.$eval(
			'p[aria-label="Paragraph block"]',
			( element ) => element.innerText
		);
		expect( paragraphContent ).toMatch( 'Einen Guten Berg!' );
	} );

	it( 'can be inserted after refresh', async () => {
		await createReusableBlock( 'Awesome Paragraph', 'Awesome block' );

		// Step 2. Create new post.
		await createNewPost();

		// Step 3. Insert the block created in Step 1.
		await insertReusableBlock( 'Awesome block' );

		// Check the title.
		await openDocumentSettingsSidebar();
		const title = await page.$eval(
			reusableBlockInspectorNameInputSelector,
			( element ) => element.value
		);
		expect( title ).toBe( 'Awesome block' );
	} );

	it( 'can be created from multiselection and converted back to regular blocks', async () => {
		await createNewPost();

		// Insert a Two paragraphs block
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Hello there!' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second paragraph' );

		// Select all the blocks
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		// Convert block to a reusable block
		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Add to Reusable blocks' );

		// Set title
		const nameInput = await page.waitForSelector(
			reusableBlockNameInputSelector
		);
		await nameInput.click();
		await page.keyboard.type( 'Multi-selection reusable block' );
		await page.keyboard.press( 'Enter' );

		// Wait for creation to finish
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[text()="Reusable block created."]'
		);

		await clearAllBlocks();

		// Insert the reusable block we edited above
		await insertReusableBlock( 'Multi-selection reusable block' );

		// Convert block to a regular block
		await clickBlockToolbarButton( 'Convert to regular blocks' );

		// Check that we have two paragraph blocks on the page
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'will not break the editor if empty', async () => {
		await createReusableBlock(
			'Awesome Paragraph',
			'Random reusable block'
		);
		await clearAllBlocks();
		await insertReusableBlock( 'Random reusable block' );

		await visitAdminPage( 'edit.php', [ 'post_type=wp_block' ] );

		const [ editButton ] = await page.$x(
			`//a[contains(@aria-label, 'Random reusable block')]`
		);
		await editButton.click();

		await page.waitForNavigation();

		// Click the block to give it focus
		const blockSelector = 'p[data-title="Paragraph"]';
		await page.waitForSelector( blockSelector );
		await page.click( blockSelector );

		// Delete the block, leaving the reusable block empty
		await clickBlockToolbarButton( 'Options' );
		const deleteButton = await page.waitForXPath(
			'//button/span[text()="Remove Paragraph"]'
		);
		deleteButton.click();

		// Wait for the Update button to become enabled
		const publishButtonSelector = '.editor-post-publish-button__button';
		await page.waitForSelector(
			publishButtonSelector + '[aria-disabled="false"]'
		);

		// Save the reusable block
		await page.click( publishButtonSelector );
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[text()="Reusable block updated."]'
		);

		await createNewPost();

		await toggleGlobalBlockInserter();

		expect( console ).not.toHaveErrored();
	} );

	it( 'Should show a proper message when the reusable block is missing', async () => {
		// Insert a non-existant reusable block
		await page.evaluate( () => {
			const { createBlock } = window.wp.blocks;
			const { dispatch } = window.wp.data;
			dispatch( 'core/block-editor' ).resetBlocks( [
				createBlock( 'core/block', { ref: 123456 } ),
			] );
		} );

		await page.waitForXPath(
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
		await insertReusableBlock( 'Duplicated reusable block' );
		await insertReusableBlock( 'Duplicated reusable block' );
		await saveDraft();
		await page.reload();

		// Wait for the paragraph to be loaded.
		await page.waitForSelector(
			'.block-editor-block-list__block[data-type="core/paragraph"]'
		);
		// The first click selects the reusable block wrapper.
		// The second click selects the actual paragraph block.
		await page.click( '.wp-block-block' );
		await page.focus(
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

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/26421.
	it( 'allows conversion back to blocks when the reusable block has unsaved edits', async () => {
		await createReusableBlock( '1', 'Edited block' );

		// Make an edit to the reusable block and assert that there's only a
		// paragraph in a reusable block.
		await page.waitForSelector( 'p[aria-label="Paragraph block"]' );
		await page.click( 'p[aria-label="Paragraph block"]' );
		await page.keyboard.type( '2' );
		const selector =
			'//div[@aria-label="Block: Reusable block"]//p[@aria-label="Paragraph block"][.="12"]';
		const reusableBlockWithParagraph = await page.$x( selector );
		expect( reusableBlockWithParagraph ).toBeTruthy();

		// Convert back to regular blocks.
		await clickBlockToolbarButton( 'Select Reusable block' );
		await clickBlockToolbarButton( 'Convert to regular blocks' );
		await page.waitForXPath( selector, {
			hidden: true,
		} );

		// Check that there's only a paragraph.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	// Test for regressions of https://github.com/WordPress/gutenberg/issues/27243.
	it( 'should allow a block with styles to be converted to a reusable block', async () => {
		// Insert a quote and reload the page.
		insertBlock( 'Quote' );
		await saveDraft();
		await page.reload();

		// The quote block should have a visible preview in the sidebar for this test to be valid.
		const quoteBlock = await page.waitForSelector(
			'.block-editor-block-list__block[aria-label="Block: Quote"]'
		);
		await quoteBlock.click();
		await openDocumentSettingsSidebar();
		await page.waitForXPath(
			'//*[@role="region"][@aria-label="Editor settings"]//button[.="Styles"]'
		);

		// Convert to reusable.
		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Add to Reusable blocks' );
		const nameInput = await page.waitForSelector(
			reusableBlockNameInputSelector
		);
		await nameInput.click();
		await page.keyboard.type( 'Block with styles' );
		await page.keyboard.press( 'Enter' );
		const reusableBlock = await page.waitForSelector(
			'.block-editor-block-list__block[aria-label="Block: Reusable block"]'
		);
		expect( reusableBlock ).toBeTruthy();
	} );
} );
