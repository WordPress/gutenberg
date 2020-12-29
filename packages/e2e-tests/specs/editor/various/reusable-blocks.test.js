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
} from '@wordpress/e2e-test-utils';

describe( 'Reusable blocks', () => {
	beforeAll( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await trashAllPosts( 'wp_block' );
	} );

	beforeEach( async () => {
		// Remove all blocks from the post so that we're working with a clean slate
		await page.evaluate( () => {
			const blocks = wp.data.select( 'core/block-editor' ).getBlocks();
			const clientIds = blocks.map( ( block ) => block.clientId );
			wp.data.dispatch( 'core/block-editor' ).removeBlocks( clientIds );
		} );
	} );

	it( 'can be created', async () => {
		// Insert a paragraph block
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Hello there!' );

		await clickBlockToolbarButton( 'More options' );
		await clickMenuItem( 'Add to Reusable blocks' );

		// Wait for creation to finish
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[text()="Block created."]'
		);
		await page.waitForXPath(
			'//*[@class="block-library-block__reusable-block-container"]'
		);

		// Select all of the text in the title field.
		await pressKeyWithModifier( 'primary', 'a' );

		// Give the reusable block a title
		await page.keyboard.type( 'Greeting block' );

		// Save the reusable block
		const [ saveButton ] = await page.$x( '//button[text()="Save"]' );
		await saveButton.click();

		// Wait for saving to finish
		await page.waitForXPath( '//button[text()="Edit"]' );

		// Check that we have a reusable block on the page
		const block = await page.$(
			'.block-editor-block-list__block[data-type="core/block"]'
		);
		expect( block ).not.toBeNull();

		// Check that its title is displayed
		const title = await page.$eval(
			'.reusable-block-edit-panel__info',
			( element ) => element.innerText
		);
		expect( title ).toBe( 'Greeting block' );
	} );

	it( 'can be created with no title', async () => {
		// Insert a paragraph block
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Hello there!' );

		await clickBlockToolbarButton( 'More options' );
		await clickMenuItem( 'Add to Reusable blocks' );

		// Wait for creation to finish
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[text()="Block created."]'
		);
		await page.waitForXPath(
			'//*[@class="block-library-block__reusable-block-container"]'
		);

		// Save the reusable block
		const [ saveButton ] = await page.$x( '//button[text()="Save"]' );
		await saveButton.click();

		// Wait for saving to finish
		await page.waitForXPath( '//button[text()="Edit"]' );

		// Check that we have a reusable block on the page
		const block = await page.$(
			'.block-editor-block-list__block[data-type="core/block"]'
		);
		expect( block ).not.toBeNull();

		// Check that it is untitled
		const title = await page.$eval(
			'.reusable-block-edit-panel__info',
			( element ) => element.innerText
		);
		expect( title ).toBe( 'Untitled Reusable Block' );
	} );

	it( 'can be inserted and edited', async () => {
		// Insert the reusable block we created above
		await insertReusableBlock( 'Greeting block' );

		// Put the reusable block in edit mode
		const editButton = await page.waitForXPath(
			'//button[text()="Edit" and not(@disabled)]'
		);
		await editButton.click();

		// Change the block's title
		await page.keyboard.type( 'Surprised greeting block' );

		// Tab three times to navigate to the block's content
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );

		// Quickly focus the paragraph block
		await page.keyboard.press( 'Escape' ); // Enter navigation mode
		await page.keyboard.press( 'Enter' ); // Enter edit mode

		// Change the block's content
		await page.keyboard.type( 'Oh! ' );

		// Save the reusable block
		const [ saveButton ] = await page.$x( '//button[text()="Save"]' );
		await saveButton.click();

		// Wait for saving to finish
		await page.waitForXPath( '//button[text()="Edit"]' );

		// Check that we have a reusable block on the page
		const block = await page.$(
			'.block-editor-block-list__block[data-type="core/block"]'
		);
		expect( block ).not.toBeNull();

		// Check that its title is displayed
		const title = await page.$eval(
			'.reusable-block-edit-panel__info',
			( element ) => element.innerText
		);
		expect( title ).toBe( 'Surprised greeting block' );

		// Check that its content is up to date
		const text = await page.$eval(
			'.block-editor-block-list__block[data-type="core/block"] p',
			( element ) => element.innerText
		);
		expect( text ).toMatch( 'Oh! Hello there!' );
	} );

	it( 'can be inserted after refresh', async () => {
		// Step 1. Insert a paragraph block

		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Awesome Paragraph' );

		await clickBlockToolbarButton( 'More options' );
		await clickMenuItem( 'Add to Reusable blocks' );

		// Wait for creation to finish
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[text()="Block created."]'
		);
		await page.waitForXPath(
			'//*[@class="block-library-block__reusable-block-container"]'
		);

		// Select all of the text in the title field.
		await pressKeyWithModifier( 'primary', 'a' );

		// Give the reusable block a title
		await page.keyboard.type( 'Awesome block' );

		// Save the reusable block
		const [ saveButton ] = await page.$x( '//button[text()="Save"]' );
		await saveButton.click();

		// Step 2. Create new post.

		await createNewPost();

		// Step 3. Insert the block created in Step 1.

		await insertReusableBlock( 'Awesome block' );

		// Check that we have a reusable block on the page
		const block = await page.$(
			'.block-editor-block-list__block[data-type="core/block"]'
		);
		expect( block ).not.toBeNull();

		// Check that its title is displayed
		const title = await page.$eval(
			'.reusable-block-edit-panel__info',
			( element ) => element.innerText
		);
		expect( title ).toBe( 'Awesome block' );
	} );

	it( 'can be converted to a regular block', async () => {
		// Insert the reusable block we edited above
		await insertReusableBlock( 'Surprised greeting block' );

		// Convert block to a regular block
		await clickBlockToolbarButton( 'Convert to regular blocks', 'content' );

		// Check that we have a paragraph block on the page
		const block = await page.$(
			'.block-editor-block-list__block[data-type="core/paragraph"]'
		);
		expect( block ).not.toBeNull();

		// Check that its content is up to date
		const text = await page.$eval(
			'.block-editor-block-list__block[data-type="core/paragraph"]',
			( element ) => element.innerText
		);
		expect( text ).toMatch( 'Oh! Hello there!' );
	} );

	it( 'can be created from multiselection', async () => {
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
		await clickBlockToolbarButton( 'More options' );
		await clickMenuItem( 'Add to Reusable blocks' );

		// Wait for creation to finish
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[text()="Block created."]'
		);
		await page.waitForXPath(
			'//*[@class="block-library-block__reusable-block-container"]'
		);

		// Select all of the text in the title field.
		await pressKeyWithModifier( 'primary', 'a' );

		// Give the reusable block a title
		await page.keyboard.type( 'Multi-selection reusable block' );

		// Save the reusable block
		const [ saveButton ] = await page.$x( '//button[text()="Save"]' );
		await saveButton.click();

		// Wait for saving to finish
		await page.waitForXPath( '//button[text()="Edit"]' );

		// Check that we have a reusable block on the page
		const block = await page.$(
			'.block-editor-block-list__block[data-type="core/block"]'
		);
		expect( block ).not.toBeNull();

		// Check that its title is displayed
		const title = await page.$eval(
			'.reusable-block-edit-panel__info',
			( element ) => element.innerText
		);
		expect( title ).toBe( 'Multi-selection reusable block' );
	} );

	it( 'multi-selection reusable block can be converted back to regular blocks', async () => {
		// Insert the reusable block we edited above
		await insertReusableBlock( 'Multi-selection reusable block' );

		// Convert block to a regular block
		await clickBlockToolbarButton( 'Convert to regular blocks', 'content' );

		// Check that we have two paragraph blocks on the page
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'will not break the editor if empty', async () => {
		await insertReusableBlock( 'Awesome block' );

		await visitAdminPage( 'edit.php', [ 'post_type=wp_block' ] );

		const [ editButton ] = await page.$x(
			`//a[contains(@aria-label, 'Awesome block')]`
		);
		await editButton.click();

		await page.waitForNavigation();

		// Click the block to give it focus
		const blockSelector = 'p[data-title="Paragraph"]';
		await page.waitForSelector( blockSelector );
		await page.click( blockSelector );

		// Delete the block, leaving the reusable block empty
		await clickBlockToolbarButton( 'More options' );
		const deleteButton = await page.waitForXPath(
			'//button/span[text()="Remove block"]'
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
			'//*[contains(@class, "components-snackbar")]/*[text()="Reusable Block updated."]'
		);

		await createNewPost();

		await toggleGlobalBlockInserter();

		expect( console ).not.toHaveErrored();
	} );
} );
