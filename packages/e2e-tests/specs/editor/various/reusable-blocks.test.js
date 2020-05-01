/**
 * WordPress dependencies
 */
import {
	insertBlock,
	createNewPost,
	visitAdminPage,
	clickBlockToolbarButton,
	pressKeyWithModifier,
	searchForBlock,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

function waitForAndAcceptDialog() {
	return new Promise( ( resolve ) => {
		page.once( 'dialog', () => resolve() );
	} );
}

async function removeReusableBlocks() {
	await visitAdminPage( 'edit.php', 'post_type=wp_block' );

	// select all reusable blocks
	await page.waitForSelector( '#cb-select-all-1' );
	const checkall = await page.$( '#cb-select-all-1' );
	await checkall.click();

	// select "Move to trash" option
	await page.waitForSelector( '#bulk-action-selector-top' );
	await page.select( '#bulk-action-selector-top', 'trash' );

	// click apply button
	await page.waitForSelector( '#doaction' );
	const applyButton = await page.$( '#doaction' );
	await applyButton.click();
}

const createReusableBlockWithSingleBlock = async ( blockName ) => {
	// Insert a paragraph block
	await insertBlock( 'Paragraph' );
	await page.keyboard.type( 'Hello there!' );
	await clickBlockToolbarButton( 'More options' );
	const convertButton = await page.waitForXPath(
		'//button[text()="Add to Reusable blocks"]'
	);
	await convertButton.click();
	// Wait for creation to finish
	await page.waitForXPath(
		'//*[contains(@class, "components-snackbar")]/*[text()="Block created."]'
	);

	if ( blockName ) {
		// Select all of the text in the title field.
		await pressKeyWithModifier( 'primary', 'a' );
		// Give the reusable block a title
		await page.keyboard.type( blockName );
	}

	// Save the reusable block
	const [ saveButton ] = await page.$x( '//button[text()="Save"]' );
	await saveButton.click();
	// Wait for saving to finish
	await page.waitForXPath( '//button[text()="Edit"]' );
};

const createReusableBlockWithMultipleBlocks = async ( blockName ) => {
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
	const convertButton = await page.waitForXPath(
		'//button[text()="Add to Reusable blocks"]'
	);
	await convertButton.click();

	// Wait for creation to finish
	await page.waitForXPath(
		'//*[contains(@class, "components-snackbar")]/*[text()="Block created."]'
	);

	// Select all of the text in the title field.
	await pressKeyWithModifier( 'primary', 'a' );

	// Give the reusable block a title
	await page.keyboard.type( blockName );

	// Save the reusable block
	const [ saveButton ] = await page.$x( '//button[text()="Save"]' );
	await saveButton.click();

	// Wait for saving to finish
	await page.waitForXPath( '//button[text()="Edit"]' );
};

const clearEditor = async () => {
	await page.evaluate( () => {
		const blocks = wp.data.select( 'core/block-editor' ).getBlocks();
		const clientIds = blocks.map( ( block ) => block.clientId );
		wp.data.dispatch( 'core/block-editor' ).removeBlocks( clientIds );
	} );
};

describe( 'Reusable blocks', () => {
	beforeAll( async () => {
		await removeReusableBlocks();
		await createNewPost();
	} );

	beforeEach( async () => {
		// Remove all blocks from the post so that we're working with a clean slate
		await clearEditor();
	} );

	it( 'can be created', async () => {
		const blockName = 'Test block';
		await createReusableBlockWithSingleBlock( blockName );

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
		expect( title ).toBe( blockName );
	} );

	it( 'can be created with no title', async () => {
		await createReusableBlockWithSingleBlock();

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
		// Step 1. Create block

		const blockName = 'Will be edited';
		await createReusableBlockWithSingleBlock( blockName );
		await clearEditor();

		// Step 2. Insert and edit it.

		// Insert the reusable block we created above
		await insertBlock( blockName );
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

		// Step 3. Check

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
		// Step 1. Create a new reusable block
		const blockName = `I am alive`;
		await createReusableBlockWithSingleBlock( blockName );

		// Step 2. Refresh page by creating a new post.

		await createNewPost();

		// Step 3. Insert the block created in Step 1.

		await insertBlock( blockName );

		// Step 4. Check

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
		expect( title ).toBe( blockName );
	} );

	it( 'can be converted to a regular block', async () => {
		const blockName = 'Will be converted';
		await createReusableBlockWithSingleBlock( blockName );
		await clearEditor();

		// Insert block
		await insertBlock( blockName );

		// Convert block to a regular block
		await clickBlockToolbarButton( 'More options' );
		const convertButton = await page.waitForXPath(
			'//button[text()="Convert to Regular Block"]'
		);
		await convertButton.click();

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
		expect( text ).toMatch( 'Hello there!' );
	} );

	it( 'can be deleted', async () => {
		const blockName = 'Good bye';
		await createReusableBlockWithSingleBlock( blockName );
		await clearEditor();

		// Insert the reusable block we edited above
		await insertBlock( blockName );

		// Delete the block and accept the confirmation dialog
		await clickBlockToolbarButton( 'More options' );
		const deleteButton = await page.waitForXPath(
			'//button[text()="Remove from Reusable blocks"]'
		);
		await Promise.all( [ waitForAndAcceptDialog(), deleteButton.click() ] );

		// Wait for deletion to finish
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[text()="Block deleted."]'
		);

		// Check that we have an empty post again
		expect( await getEditedPostContent() ).toBe( '' );

		// Search for the block in the inserter
		await searchForBlock( blockName );

		// Check that we couldn't find it
		const items = await page.$$(
			`.block-editor-block-types-list__item[aria-label="${ blockName }"]`
		);
		expect( items ).toHaveLength( 0 );
	} );

	it( 'can be created from multiselection', async () => {
		const blockName = 'Multi-selection reusable block';
		await createReusableBlockWithMultipleBlocks( blockName );

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
		expect( title ).toBe( blockName );
	} );

	it( 'multi-selection reusable block can be converted back to regular blocks', async () => {
		const blockName = 'All for one. One for all';
		await createReusableBlockWithMultipleBlocks( blockName );
		await clearEditor();

		// Insert the reusable block we edited above
		await insertBlock( blockName );

		// Convert block to a regular block
		await clickBlockToolbarButton( 'More options' );
		const convertButton = await page.waitForXPath(
			'//button[text()="Convert to Regular Block"]'
		);
		await convertButton.click();

		// Check that we have two paragraph blocks on the page
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
