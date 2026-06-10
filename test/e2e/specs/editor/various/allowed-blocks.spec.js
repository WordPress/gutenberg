/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	allowedBlocksUtil: async ( { page, editor }, use ) => {
		await use( new AllowedBlocksUtil( { page, editor } ) );
	},
} );

test.describe( 'Allowed Blocks UI', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'deselecting all blocks should set `allowedBlocks` to empty array', async ( {
		admin,
		editor,
		allowedBlocksUtil,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/group' } );
		const modal = await allowedBlocksUtil.openModal();

		const selectAll = modal.getByRole( 'checkbox', { name: 'Select all' } );
		await selectAll.uncheck();
		await modal.getByRole( 'button', { name: 'Apply' } ).click();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { attributes: { allowedBlocks: [] } } ] );
	} );

	test( 'selecting all blocks should set `allowedBlocks` to `undefined`', async ( {
		admin,
		editor,
		allowedBlocksUtil,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/group' } );
		const modal = await allowedBlocksUtil.openModal();
		const selectAll = modal.getByRole( 'checkbox', { name: 'Select all' } );
		await selectAll.uncheck();
		await selectAll.check();
		await modal.getByRole( 'button', { name: 'Apply' } ).click();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { attributes: {} } ] );
	} );

	test( 'filtering should work', async ( {
		admin,
		editor,
		allowedBlocksUtil,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/group' } );
		const modal = await allowedBlocksUtil.openModal();
		const search = modal.getByRole( 'searchbox', {
			name: 'Search for a block',
		} );
		await search.fill( 'Media & Text' );
		const resultsRegion = modal.getByRole( 'region', {
			name: 'Available block types',
		} );
		await expect(
			resultsRegion.getByRole( 'checkbox', { name: 'Media & Text' } )
		).toBeVisible();
		// Two checkboxes should be visible: "Media" category and "Media & Text" block.
		await expect( resultsRegion.getByRole( 'checkbox' ) ).toHaveCount( 2 );
	} );

	test( 'selected block should be set to `allowedBlocks`', async ( {
		admin,
		editor,
		allowedBlocksUtil,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/group' } );
		const modal = await allowedBlocksUtil.openModal();
		const selectAll = modal.getByRole( 'checkbox', { name: 'Select all' } );
		await selectAll.uncheck();
		const search = modal.getByRole( 'searchbox', {
			name: 'Search for a block',
		} );
		await search.fill( 'Media & Text' );
		const resultsRegion = modal.getByRole( 'region', {
			name: 'Available block types',
		} );
		await resultsRegion
			.getByRole( 'checkbox', { name: 'Media & Text' } )
			.check();
		await modal.getByRole( 'button', { name: 'Apply' } ).click();
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ attributes: { allowedBlocks: [ 'core/media-text' ] } },
			] );
	} );
} );

class AllowedBlocksUtil {
	constructor( { page, editor } ) {
		this.editor = editor;
		this.page = page;
	}

	async openModal() {
		await this.editor.openDocumentSettingsSidebar();
		// Expand Advanced if collapsed
		const advancedButton = this.page.getByRole( 'button', {
			name: 'Advanced',
		} );
		const isAdvancedPanelOpen =
			await advancedButton.getAttribute( 'aria-expanded' );
		if ( isAdvancedPanelOpen === 'false' ) {
			await advancedButton.click();
		}
		await this.page.getByRole( 'button', { name: 'Manage' } ).click();
		const modal = this.page.getByRole( 'dialog', {
			name: 'Allowed blocks',
		} );
		await expect( modal ).toBeVisible();
		return modal;
	}
}
