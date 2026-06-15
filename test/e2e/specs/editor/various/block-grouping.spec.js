/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {import('@wordpress/e2e-test-utils-playwright').Editor} Editor */

test.use( {
	groupingUtils: async ( { page, editor }, use ) => {
		await use( new GroupingUtils( { page, editor } ) );
	},
} );

test.describe( 'Block Grouping', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'Group creation', () => {
		test( 'creates a group from multiple blocks of the same type via block transforms', async ( {
			editor,
			page,
			pageUtils,
			groupingUtils,
		} ) => {
			await groupingUtils.insertBlocksOfSameType();

			// Multiselect via keyboard.
			await pageUtils.pressKeys( 'primary+a', { times: 2 } );
			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Multiple blocks selected' } )
				.click();
			await page
				.getByRole( 'menu', { name: 'Multiple blocks selected' } )
				.getByRole( 'menuitem', { name: 'Group' } )
				.click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/group',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: 'First Paragraph' },
						},
						{
							name: 'core/paragraph',
							attributes: { content: 'Second Paragraph' },
						},
						{
							name: 'core/paragraph',
							attributes: { content: 'Third Paragraph' },
						},
					],
				},
			] );
		} );

		test( 'creates a group from multiple blocks of different types via block transforms', async ( {
			editor,
			page,
			pageUtils,
			groupingUtils,
		} ) => {
			await groupingUtils.insertBlocksOfMultipleTypes();

			// Multiselect via keyboard.
			await pageUtils.pressKeys( 'primary+a', { times: 2 } );
			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Multiple blocks selected' } )
				.click();
			await page
				.getByRole( 'menu', { name: 'Multiple blocks selected' } )
				.getByRole( 'menuitem', { name: 'Group' } )
				.click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/group',
					innerBlocks: [
						{
							name: 'core/heading',
							attributes: { content: 'Group Heading', level: 2 },
						},
						{
							name: 'core/image',
						},
						{
							name: 'core/paragraph',
							attributes: { content: 'Some paragraph' },
						},
					],
				},
			] );
		} );

		test( 'creates a group from multiple blocks of the same type via options toolbar', async ( {
			editor,
			pageUtils,
			groupingUtils,
		} ) => {
			await groupingUtils.insertBlocksOfSameType();

			// Multiselect via keyboard.
			await pageUtils.pressKeys( 'primary+a', { times: 2 } );
			await editor.clickBlockOptionsMenuItem( 'Group' );
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/group',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: 'First Paragraph' },
						},
						{
							name: 'core/paragraph',
							attributes: { content: 'Second Paragraph' },
						},
						{
							name: 'core/paragraph',
							attributes: { content: 'Third Paragraph' },
						},
					],
				},
			] );
		} );

		test( 'groups and ungroups multiple blocks of different types via options toolbar', async ( {
			editor,
			pageUtils,
			groupingUtils,
		} ) => {
			await groupingUtils.insertBlocksOfMultipleTypes();

			// Multiselect via keyboard.
			await pageUtils.pressKeys( 'primary+a', { times: 2 } );

			await editor.clickBlockOptionsMenuItem( 'Group' );
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/group',
					innerBlocks: [
						{
							name: 'core/heading',
							attributes: { content: 'Group Heading', level: 2 },
						},
						{
							name: 'core/image',
						},
						{
							name: 'core/paragraph',
							attributes: { content: 'Some paragraph' },
						},
					],
				},
			] );

			await editor.clickBlockOptionsMenuItem( 'Ungroup' );
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/heading',
					attributes: { content: 'Group Heading', level: 2 },
				},
				{
					name: 'core/image',
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Some paragraph' },
				},
			] );
		} );

		test( 'does not allow ungrouping a group block that has no children', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'core/group' } );
			await editor.clickBlockToolbarButton( 'Options' );
			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Ungroup' } )
			).toBeHidden();
		} );

		test( 'should group and ungroup a controlled block properly', async ( {
			editor,
			requestUtils,
		} ) => {
			const { id: ref } = await requestUtils.createBlock( {
				title: 'Block',
				status: 'publish',
				content: `<!-- wp:paragraph -->\n<p>Hey!</p>\n<!-- /wp:paragraph -->`,
				wp_pattern_category: [],
			} );

			await editor.insertBlock( {
				name: 'core/block',
				attributes: { ref },
			} );
			await editor.clickBlockOptionsMenuItem( 'Group' );
			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Group',
				} )
			).toContainText( 'Hey!' );

			await editor.clickBlockOptionsMenuItem( 'Ungroup' );
			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Pattern',
				} )
			).toContainText( 'Hey!' );
		} );

		test( 'should group another Group block via options toolbar', async ( {
			page,
			editor,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: '1' },
			} );

			const group = page
				.getByRole( 'menu', { name: 'Options' } )
				.getByRole( 'menuitem', { name: 'Group', exact: true } );

			await editor.clickBlockToolbarButton( 'Options' );
			await group.click();
			await editor.clickBlockToolbarButton( 'Options' );
			await group.click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/group',
					innerBlocks: [
						{
							name: 'core/group',
							innerBlocks: [
								{
									name: 'core/paragraph',
									attributes: { content: '1' },
								},
							],
						},
					],
				},
			] );
		} );
	} );

	test.describe( 'Grouping Block availability', () => {
		test.beforeEach( async ( { page, pageUtils, groupingUtils } ) => {
			// Disable the Group block.
			await page.evaluate( () => {
				window.wp.data
					.dispatch( 'core/edit-post' )
					.hideBlockTypes( [ 'core/group' ] );
			} );

			await groupingUtils.insertBlocksOfMultipleTypes();
			await pageUtils.pressKeys( 'primary+a', { times: 2 } );
		} );

		test.afterEach( async ( { page } ) => {
			// Re-enable the Group block.
			await page.evaluate( () => {
				window.wp.data
					.dispatch( 'core/edit-post' )
					.showBlockTypes( [ 'core/group' ] );
			} );
		} );

		test( 'does not show group transform if Grouping block is disabled', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Multiple blocks selected' } )
				.click();

			await expect(
				page
					.getByRole( 'menu', { name: 'Multiple blocks selected' } )
					.getByRole( 'menuitem', { name: 'Group' } )
			).toBeHidden();
		} );

		test( 'does not show group option in the options toolbar if Grouping block is disabled', async ( {
			page,
			editor,
		} ) => {
			await editor.clickBlockToolbarButton( 'Options' );

			await expect(
				page
					.getByRole( 'menu', { name: 'Options' } )
					.getByRole( 'menuitem', { name: 'Group' } )
			).toBeHidden();
		} );
	} );

	test.describe( 'Preserving selected blocks attributes', () => {
		test( 'preserves width alignment settings of selected blocks', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: { content: 'Heading', level: 2 },
			} );
			const alignOptions = page.getByRole( 'menu', { name: 'Align' } );

			// Full width image.
			await editor.insertBlock( { name: 'core/image' } );
			await editor.clickBlockToolbarButton( 'Align' );
			await alignOptions
				.getByRole( 'menuitemradio', { name: 'Full width' } )
				.click();

			// Wide width image.
			await editor.insertBlock( { name: 'core/image' } );
			await editor.clickBlockToolbarButton( 'Align' );
			await alignOptions
				.getByRole( 'menuitemradio', {
					name: 'Wide width',
				} )
				.click();

			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Some paragraph' },
			} );

			// Select everythinga and group.
			await pageUtils.pressKeys( 'primary+a', { times: 2 } );
			await editor.transformBlockTo( 'core/group' );

			// We expect Group block align setting to match that
			// of the widest of it's "child" innerBlocks
			await editor.clickBlockToolbarButton( 'Align' );
			await expect(
				alignOptions.getByRole( 'menuitemradio', { checked: true } )
			).toHaveText( 'Full width' );
		} );
	} );

	test.describe( 'Registering alternative Blocks to handle Grouping interactions', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-custom-grouping-block'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-custom-grouping-block'
			);
		} );

		test( 'should use registered grouping block for grouping interactions', async ( {
			editor,
			page,
			pageUtils,
			groupingUtils,
		} ) => {
			// Set custom Block as the Block to use for Grouping.
			await page.evaluate( () => {
				window.wp.blocks.setGroupingBlockName(
					'test/alternative-group-block'
				);
			} );

			await groupingUtils.insertBlocksOfSameType();
			await pageUtils.pressKeys( 'primary+a', { times: 2 } );

			// Group - this will use whichever Block is registered as the Grouping Block
			// as opposed to "transformTo()" which uses whatever is passed to it. To
			// ensure this test is meaningful we must rely on what is registered.
			await editor.clickBlockOptionsMenuItem( 'Group' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'test/alternative-group-block',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: 'First Paragraph' },
						},
						{
							name: 'core/paragraph',
							attributes: { content: 'Second Paragraph' },
						},
						{
							name: 'core/paragraph',
							attributes: { content: 'Third Paragraph' },
						},
					],
				},
			] );
		} );
	} );
} );

class GroupingUtils {
	/** @type {import('@playwright/test').Page} */
	#page;
	/** @type {Editor} */
	#editor;

	constructor( { page, editor } ) {
		this.#page = page;
		this.#editor = editor;
	}

	async insertBlocksOfSameType() {
		await test.step(
			'insert blocks of the same type',
			async () => {
				await this.#editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content: 'First Paragraph' },
				} );
				await this.#editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content: 'Second Paragraph' },
				} );
				await this.#editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content: 'Third Paragraph' },
				} );
			},
			{ box: true }
		);
	}

	async insertBlocksOfMultipleTypes() {
		await test.step(
			'insert blocks of multiple types',
			async () => {
				await this.#editor.insertBlock( {
					name: 'core/heading',
					attributes: { content: 'Group Heading', level: 2 },
				} );
				await this.#editor.insertBlock( {
					name: 'core/image',
				} );
				await this.#editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content: 'Some paragraph' },
				} );
			},
			{ box: true }
		);
	}
}
