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

import {
	registerBlockType,
	createBlock,
	setGroupingBlockName,
} from '@wordpress/blocks';

/**
 * External dependencies
 */
import { noop } from 'lodash';

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

		it( 'groups and ungroups multiple blocks of different types via options toolbar', async () => {
			// Creating test blocks
			await insertBlocksOfMultipleTypes();
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			// Group
			await clickBlockToolbarButton( 'More options' );
			const groupButton = await page.waitForXPath( '//button[text()="Group"]' );
			await groupButton.click();

			expect( await getEditedPostContent() ).toMatchSnapshot();

			// UnGroup
			await clickBlockToolbarButton( 'More options' );
			const unGroupButton = await page.waitForXPath( '//button[text()="Ungroup"]' );
			await unGroupButton.click();

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'does not allow ungrouping a group block that has no children', async () => {
			await insertBlock( 'Group' );
			await clickBlockToolbarButton( 'More options' );
			const ungroupButtons = await page.$x( '//button[text()="Ungroup"]' );
			expect( ungroupButtons ).toHaveLength( 0 );
		} );
	} );

	describe( 'Grouping Block availability', () => {
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

		it( 'does not show group transform if Grouping block is disabled', async () => {
			const availableTransforms = await getAvailableBlockTransforms();

			expect(
				availableTransforms
			).not.toContain( 'Group' );
		} );

		it( 'does not show group option in the options toolbar if Grouping block is disabled ', async () => {
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

	describe( 'Registering alternative Blocks to handle Grouping interactions', () => {
		it( 'should use registered grouping block for grouping interactions', async () => {
			registerBlockType( 'test/alternative-group-block', {
				attributes: {
					value: {
						type: 'string',
					},
				},
				transforms: {
					from: [ {
						type: 'block',
						blocks: [ '*' ],
						isMultiBlock: true,
						__experimentalConvert( blocks ) {
							const groupInnerBlocks = blocks.map( ( { name, attributes, innerBlocks } ) => {
								return createBlock( name, attributes, innerBlocks );
							} );

							return createBlock( 'core/alternative-group-block', {}, groupInnerBlocks );
						},
					} ],
				},
				save: noop,
				category: 'common',
				title: 'Alternative Group Block',
			} );
			registerBlockType( 'test/alternative-group-block' );

			// Set custom Block as the Block to use for Grouping
			setGroupingBlockName( 'test/alternative-group-block' );

			// Creating test blocks
			await insertBlocksOfSameType();

			// Multiselect via keyboard.
			await pressKeyWithModifier( 'primary', 'a' );
			await pressKeyWithModifier( 'primary', 'a' );

			await transformBlockTo( 'Alternative Group Block' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );
} );
