/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Settings sidebar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.describe( 'Template tab', () => {
		test( 'should open template tab by default if no block is selected', async ( {
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();

			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tab', { selected: true } )
			).toHaveText( 'Template' );
		} );

		test( `should show the currently selected template's title and description`, async ( {
			admin,
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();

			const settingsSideber = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			const templateTitle = settingsSideber.locator(
				'.editor-post-card-panel__title'
			);

			await expect( templateTitle ).toHaveText( 'Index' );
			await expect( settingsSideber ).toContainText(
				'Used as a fallback template for all pages when a more specific template is not defined.'
			);

			await admin.visitSiteEditor( {
				postId: 'emptytheme//singular',
				postType: 'wp_template',
				canvas: 'edit',
			} );

			await expect( templateTitle ).toHaveText( 'Single Entries' );
			await expect( settingsSideber ).toContainText(
				'Displays any single entry, such as a post or a page. This template will serve as a fallback when a more specific template (e.g. Single Post, Page, or Attachment) cannot be found.'
			);
		} );
	} );

	test.describe( 'Block tab', () => {
		test( 'should open block tab by default if a block is selected', async ( {
			editor,
			page,
		} ) => {
			await editor.selectBlocks(
				editor.canvas.getByRole( 'document', { name: 'Block' } ).first()
			);
			await editor.openDocumentSettingsSidebar();

			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tab', { selected: true } )
			).toHaveText( 'Block' );
		} );
	} );

	test.describe( 'Tab switch based on selection', () => {
		test( 'should switch to block tab if we select a block, when Template is selected', async ( {
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();

			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tab', { selected: true } )
			).toHaveText( 'Template' );

			// By inserting the block is also selected.
			await editor.insertBlock( { name: 'core/heading' } );

			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tab', { selected: true } )
			).toHaveText( 'Block' );
		} );

		test( 'should switch to Template tab when a block was selected and we select the Template', async ( {
			editor,
			page,
		} ) => {
			await editor.selectBlocks(
				editor.canvas.getByRole( 'document', { name: 'Block' } ).first()
			);
			await editor.openDocumentSettingsSidebar();

			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tab', { selected: true } )
			).toHaveText( 'Block' );

			await page.evaluate( () => {
				window.wp.data
					.dispatch( 'core/block-editor' )
					.clearSelectedBlock();
			} );

			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'tab', { selected: true } )
			).toHaveText( 'Template' );
		} );
	} );
} );
