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
	getAllBlocks,
	getAvailableBlockTransforms,
} from '@wordpress/e2e-test-utils';

async function insertBlocksOfSameType() {
	await insertBlock( 'Paragraph' );
	await page.keyboard.type( 'First Paragraph' );

	await insertBlock( 'Paragraph' );
	await page.keyboard.type( 'Second Paragraph' );

	await insertBlock( 'Paragraph' );
	await page.keyboard.type( 'Third Paragraph' );
}

async function insertBlocksOfMultipleTypes() {
	await insertBlock( 'Heading' );
	await page.keyboard.type( 'Group Heading' );

	await insertBlock( 'Image' );

	await insertBlock( 'Paragraph' );
	await page.keyboard.type( 'Some paragraph' );
}

describe( 'Block Grouping', () => {
	beforeEach( async () => {
		// Posts are auto-removed at the end of each test run
		await createNewPost();
	} );

	describe( 'Group creation', () => {
		it( 'creates a group from multiple blocks of the same type via block transforms', async () => {
			// Creating test blocks
			await insertBlocksOfSameType();

			// Multiselect via keyboard.
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			await transformBlockTo( 'Group' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'creates a group from multiple blocks of different types via block transforms', async () => {
			// Creating test blocks
			await insertBlocksOfMultipleTypes();

			// Multiselect via keyboard.
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			await transformBlockTo( 'Group' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'creates a group from multiple blocks of the same type via options toolbar', async () => {
			// Creating test blocks
			await insertBlocksOfSameType();

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
			await insertBlocksOfMultipleTypes();

			// Multiselect via keyboard.
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			await clickBlockToolbarButton( 'More options' );

			const groupButton = await page.waitForXPath( '//button[text()="Group"]' );
			await groupButton.click();

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'Ungrouping', () => {
		it( 'ungroups an existing group via options menu', async () => {
			// Create a Group
			await insertBlocksOfMultipleTypes();
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );
			await transformBlockTo( 'Group' );

			await clickBlockToolbarButton( 'More options' );

			const unGroupButton = await page.waitForXPath( '//button[text()="Ungroup"]' );

			await unGroupButton.click();

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'Keyboard shortcuts', () => {
		it( 'groups and ungroups using keyboard shortcuts', async () => {
			let allBlocks;

			await insertBlocksOfMultipleTypes();
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			// Group
			await pressKeyWithModifier( 'primaryAlt', 'g' );

			allBlocks = await getAllBlocks();

			expect( allBlocks[ 0 ].name ).toBe( 'core/group' );
			expect( await getEditedPostContent() ).toMatchSnapshot();

			// Ungroup (Primary, Shift, Alt)
			await pressKeyWithModifier( 'secondary', 'g' );

			allBlocks = await getAllBlocks();

			expect( allBlocks[ 0 ].name ).not.toBe( 'core/group' );
			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	describe( 'Container Block availability', () => {
		beforeEach( async () => {
			// Disable the Group block
			await page.evaluate( () => {
				const { dispatch } = wp.data;
				dispatch( 'core/edit-post' ).hideBlockTypes( [ 'core/group' ] );
			} );

			// Create a Group
			await insertBlocksOfMultipleTypes();
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );
		} );

		afterAll( async () => {
			// Re-enable the Group block
			await page.evaluate( () => {
				const { dispatch } = wp.data;
				dispatch( 'core/edit-post' ).showBlockTypes( [ 'core/group' ] );
			} );
		} );

		it( 'does not show group transform if container block is disabled', async () => {
			const availableTransforms = await getAvailableBlockTransforms();

			expect(
				availableTransforms
			).not.toContain( 'Group' );
		} );

		it( 'does not show group option in the options toolbar if container block is disabled ', async () => {
			await clickBlockToolbarButton( 'More options' );

			const blockOptionsDropdownHTML = await page.evaluate( () => document.querySelector( '.block-editor-block-settings-menu__content' ).innerHTML );

			expect( blockOptionsDropdownHTML ).not.toContain( 'Group' );
		} );
	} );

	describe( 'Preserving selected blocks attributes', () => {
		it( 'preserves width alignment settings of selected blocks', async () => {
			await insertBlock( 'Heading' );
			await page.keyboard.type( 'Group Heading' );

			// Full width image
			await insertBlock( 'Image' );
			await clickBlockToolbarButton( 'Full width' );

			// Wide width image)
			await insertBlock( 'Image' );
			await clickBlockToolbarButton( 'Wide width' );

			await insertBlock( 'Paragraph' );
			await page.keyboard.type( 'Some paragraph' );

			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			await transformBlockTo( 'Group' );

			const allBlocks = await getAllBlocks();

			// We expect Group block align setting to match that
			// of the widest of it's "child" innerBlocks
			expect( allBlocks[ 0 ].attributes.align ).toBe( 'full' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );
} );
