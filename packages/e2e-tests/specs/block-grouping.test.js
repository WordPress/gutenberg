/**
 * WordPress dependencies
 */
import {
	insertBlock,
	createNewPost,
	clickBlockToolbarButton,
	pressKeyWithModifier,
	getEditedPostContent,
	transformBlockTo,
} from '@wordpress/e2e-test-utils';

describe( 'Block Grouping', () => {
	beforeAll( async () => {
		await createNewPost();
	} );

	beforeEach( async () => {
		// Remove all blocks from the post so that we're working with a clean slate
		await page.evaluate( () => {
			const blocks = wp.data.select( 'core/editor' ).getBlocks();
			const clientIds = blocks.map( ( block ) => block.clientId );
			wp.data.dispatch( 'core/editor' ).removeBlocks( clientIds );
		} );
	} );

	it( 'creates a group from multiple blocks of the same type via block transforms', async () => {
		// Creating test blocks
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'First Paragraph' );

		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Second Paragraph' );

		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Third Paragraph' );

		// Multiselect via keyboard.
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		await transformBlockTo( 'Group' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'creates a group from multiple blocks of different types via block transforms', async () => {
		// Creating test blocks
		await insertBlock( 'Heading' );
		await page.keyboard.type( 'Group Heading' );

		await insertBlock( 'Image' );

		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Some paragraph' );

		// Multiselect via keyboard.
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		await transformBlockTo( 'Group' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'creates a group from multiple blocks of the same type via options toolbar', async () => {
		// Creating test blocks
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'First Options Paragraph' );

		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Second Options  Paragraph' );

		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Third Options  Paragraph' );

		// Multiselect via keyboard.
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		await clickBlockToolbarButton( 'More options' );

		const groupButton = await page.waitForXPath( '//button[text()="Group"]' );
		await groupButton.click();

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'creates a group from multiple blocks of different types via options toolbar', async () => {
		// Creating test blocks
		await insertBlock( 'Heading' );
		await page.keyboard.type( 'Group Heading' );

		await insertBlock( 'Image' );

		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Some paragraph' );

		// Multiselect via keyboard.
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		await clickBlockToolbarButton( 'More options' );

		const groupButton = await page.waitForXPath( '//button[text()="Group"]' );
		await groupButton.click();

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
