/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Plugins API', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-plugins-api'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-plugins-api'
		);
	} );

	test.describe( 'Post Status Info', () => {
		test( 'Should render post status info inside Document Setting sidebar', async ( {
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();

			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.locator( '.my-post-status-info-plugin' )
			).toHaveText( 'My post status info' );
		} );
	} );

	test.describe( 'Publish Panel', () => {
		test( 'Should render publish panel inside Pre-publish sidebar', async ( {
			editor,
			page,
		} ) => {
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.fill( 'A post' );

			// Open pre-publish panel.
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Publish' } )
				.click();

			await expect(
				page
					.getByRole( 'region', { name: 'Editor publish' } )
					.getByRole( 'button', { name: 'My pre publish panel' } )
			).toBeVisible();
		} );

		test( 'Should render publish panel inside Post-publish sidebar', async ( {
			editor,
			page,
		} ) => {
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.fill( 'A post' );
			await editor.publishPost();

			await expect(
				page
					.getByRole( 'region', { name: 'Editor publish' } )
					.getByRole( 'button', { name: 'My post publish panel' } )
			).toBeVisible();
		} );
	} );

	test.describe( 'Sidebar', () => {
		test( 'Should open plugins sidebar using More Menu item and render content', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Options' } )
				.click();
			await page
				.getByRole( 'menuitemcheckbox', {
					name: 'Plugin more menu title',
				} )
				.click();

			const settingsSidebar = page.getByRole( 'region', {
				name: 'Editor settings',
			} );

			await expect(
				settingsSidebar.getByRole( 'textbox', {
					name: 'Title',
				} )
			).toBeVisible();
			await expect(
				settingsSidebar.getByRole( 'button', {
					name: 'Reset',
				} )
			).toBeVisible();
		} );

		test( 'Should be pinned by default and can be opened and closed using pinned items', async ( {
			page,
		} ) => {
			const pinnedButton = page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Plugin title' } );
			const pluginField = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'textbox', {
					name: 'Title',
				} );

			await pinnedButton.click();
			await expect( pluginField ).toBeVisible();

			await pinnedButton.click();
			await expect( pluginField ).toBeHidden();
		} );

		test( 'Can be pinned and unpinned', async ( { page } ) => {
			const pinnedButton = page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Plugin title' } );

			await pinnedButton.click();
			await page
				.getByRole( 'button', { name: 'Unpin from toolbar' } )
				.click();

			await expect( pinnedButton ).toBeHidden();

			await page.getByRole( 'button', { name: 'Close plugin' } ).click();
			await page.reload();

			await expect( pinnedButton ).toBeHidden();

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Options' } )
				.click();
			await page
				.getByRole( 'menuitemcheckbox', {
					name: 'Plugin more menu title',
				} )
				.click();
			await page
				.getByRole( 'button', { name: 'Pin to toolbar' } )
				.click();

			await expect( pinnedButton ).toBeVisible();
			await page.reload();
			await expect( pinnedButton ).toBeVisible();
		} );

		test( 'Should close plugins sidebar using More Menu item', async ( {
			page,
		} ) => {
			const options = page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Options' } );
			const moreMenuItem = page.getByRole( 'menuitemcheckbox', {
				name: 'Plugin more menu title',
			} );
			const pluginField = page
				.getByRole( 'region', {
					name: 'Editor settings',
				} )
				.getByRole( 'textbox', {
					name: 'Title',
				} );

			await options.click();
			await moreMenuItem.click();
			await expect( pluginField ).toBeVisible();

			await options.click();
			await moreMenuItem.click();
			await expect( pluginField ).toBeHidden();
		} );

		test( 'Should open plugins sidebar using More Menu item on smaller screens', async ( {
			page,
			pageUtils,
		} ) => {
			await pageUtils.setBrowserViewport( 'medium' );

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Options' } )
				.click();
			await page
				.getByRole( 'menuitemcheckbox', {
					name: 'Plugin more menu title',
				} )
				.click();

			await expect(
				page
					.getByRole( 'region', {
						name: 'Editor settings',
					} )
					.getByRole( 'textbox', {
						name: 'Title',
					} )
			).toBeVisible();

			await pageUtils.setBrowserViewport( 'large' );
		} );
	} );

	test.describe( 'Document Setting Custom Panel', () => {
		test( 'Should render a custom panel inside Document Setting sidebar', async ( {
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();

			await expect(
				page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'button', { name: 'My Custom Panel' } )
			).toBeVisible();
		} );
	} );

	test.describe( 'Preview Menu Item', () => {
		test( 'Should render and interact with PluginPreviewMenuItem', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.locator( '.editor-preview-dropdown__toggle' )
				.click();

			const customPreviewItem = page.getByRole( 'menuitem', {
				name: 'Custom Preview',
			} );

			await expect( customPreviewItem ).toBeVisible();

			await customPreviewItem.click();

			await expect( customPreviewItem ).toBeHidden();
		} );
	} );
} );
