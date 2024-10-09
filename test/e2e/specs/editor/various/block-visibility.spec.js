/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	BlockVisibilityUtils: async ( { page }, use ) => {
		await use( new BlockVisibilityUtils( { page } ) );
	},
} );

test.describe( 'Block Visibility', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { page } ) => {
		// Re-enable all blocks.
		await page.evaluate( () => {
			const blockTypes = window.wp.data
				.select( 'core/blocks' )
				.getBlockTypes();
			window.wp.data
				.dispatch( 'core/edit-post' )
				.showBlockTypes( blockTypes );
		} );
	} );

	test( 'should hide/show the block', async ( {
		page,
		BlockVisibilityUtils,
	} ) => {
		// Hide heading block.
		await BlockVisibilityUtils.openBlockVisibilityManager();
		await page
			.getByRole( 'region', { name: 'Available block types' } )
			.getByRole( 'checkbox', { name: 'Heading' } )
			.uncheck();
		await page
			.getByRole( 'dialog', {
				name: 'Preferences',
			} )
			.getByRole( 'button', { name: 'Close' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();
		await page
			.getByRole( 'region', { name: 'Block Library' } )
			.getByRole( 'searchbox', {
				name: 'Search',
			} )
			.fill( 'Heading' );

		await expect(
			page
				.getByRole( 'tabpanel', { name: 'Blocks' } )
				.getByRole( 'option', { name: 'Heading' } ),
			'Heading block should not be visible'
		).toBeHidden();

		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		// Show heading block again.
		await BlockVisibilityUtils.openBlockVisibilityManager();

		await expect(
			page
				.getByRole( 'region', { name: 'Available block types' } )
				.getByRole( 'checkbox', { name: 'Heading' } ),
			'Heading block should be unchecked'
		).not.toBeChecked();

		await page
			.getByRole( 'region', { name: 'Available block types' } )
			.getByRole( 'checkbox', { name: 'Heading' } )
			.check();
		await page
			.getByRole( 'dialog', {
				name: 'Preferences',
			} )
			.getByRole( 'button', { name: 'Close' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();
		await page
			.getByRole( 'region', { name: 'Block Library' } )
			.getByRole( 'searchbox', {
				name: 'Search',
			} )
			.fill( 'Heading' );

		await expect(
			page
				.getByRole( 'tabpanel', { name: 'Blocks' } )
				.getByRole( 'option', { name: 'Heading' } ),
			'Heading block should be visible'
		).toBeVisible();
	} );

	test( 'should hide/show all blocks in a category at once', async ( {
		page,
		BlockVisibilityUtils,
	} ) => {
		// Hide Media category blocks.
		await BlockVisibilityUtils.openBlockVisibilityManager();
		await page
			.getByRole( 'region', { name: 'Available block types' } )
			.getByRole( 'checkbox', { name: 'Media', exact: true } )
			.uncheck();
		await page
			.getByRole( 'dialog', {
				name: 'Preferences',
			} )
			.getByRole( 'button', { name: 'Close' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		await expect(
			page
				.getByRole( 'tabpanel', { name: 'Blocks' } )
				.getByRole( 'heading', { name: 'Media' } ),
			'Media category should not be visible'
		).toBeHidden();

		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		// Show Media category blocks again.
		await BlockVisibilityUtils.openBlockVisibilityManager();

		await expect(
			page
				.getByRole( 'region', { name: 'Available block types' } )
				.getByRole( 'checkbox', { name: 'Media', exact: true } ),
			'Media category should be unchecked'
		).not.toBeChecked();

		await page
			.getByRole( 'region', { name: 'Available block types' } )
			.getByRole( 'checkbox', { name: 'Media', exact: true } )
			.check();
		await page
			.getByRole( 'dialog', {
				name: 'Preferences',
			} )
			.getByRole( 'button', { name: 'Close' } )
			.click();
		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		await expect(
			page
				.getByRole( 'tabpanel', { name: 'Blocks' } )
				.getByRole( 'heading', { name: 'Media' } ),
			'Media category should be visible'
		).toBeVisible();
	} );

	test( 'should search for blocks by keyword', async ( {
		page,
		BlockVisibilityUtils,
	} ) => {
		await BlockVisibilityUtils.openBlockVisibilityManager();
		await page
			.getByRole( 'searchbox', {
				name: 'Search for a block',
			} )
			.fill( 'verse' );
		const blockCategories = page
			.getByRole( 'region', {
				name: 'Available block types',
			} )
			.getByRole( 'group' );

		await expect(
			blockCategories,
			'Only one category should be visible'
		).toHaveCount( 1 );

		await expect(
			blockCategories.first().getByRole( 'checkbox', { name: 'Text' } ),
			'Text category should be visible'
		).toBeVisible();

		const textCategoryBlocksList = blockCategories
			.first()
			.getByRole( 'list' );

		await expect(
			textCategoryBlocksList.getByRole( 'checkbox' ),
			'Only one block should be visible'
		).toHaveCount( 1 );

		await expect(
			textCategoryBlocksList.getByRole( 'checkbox', { name: 'Verse' } ),
			'Verse block should be visible'
		).toBeVisible();
	} );

	test( 'should reset hidden blocks', async ( {
		page,
		BlockVisibilityUtils,
	} ) => {
		await BlockVisibilityUtils.openBlockVisibilityManager();

		// Hide Heading and List blocks.
		await page
			.getByRole( 'region', { name: 'Available block types' } )
			.getByRole( 'checkbox', { name: 'Heading' } )
			.uncheck();
		await page
			.getByRole( 'region', { name: 'Available block types' } )
			.getByRole( 'checkbox', { name: 'List', exact: true } )
			.uncheck();

		// Reset hidden blocks.
		await page.getByRole( 'button', { name: 'Reset' } ).click();

		await expect(
			page
				.getByRole( 'region', { name: 'Available block types' } )
				.getByRole( 'checkbox', { name: 'Heading' } ),
			'Heading block should be checked'
		).toBeChecked();
		await expect(
			page
				.getByRole( 'region', { name: 'Available block types' } )
				.getByRole( 'checkbox', { name: 'List', exact: true } ),
			'List block should be checked'
		).toBeChecked();
	} );
} );

class BlockVisibilityUtils {
	constructor( { page, admin, requestUtils } ) {
		this.page = page;
		this.admin = admin;
		this.requestUtils = requestUtils;
	}
	async openBlockVisibilityManager() {
		await this.page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await this.page
			.getByRole( 'menuitem', { name: 'Preferences' } )
			.click();
		await this.page.getByRole( 'tab', { name: 'Blocks' } ).click();
	}
}
