/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	clickBlockAppender,
	clickBlockToolbarButton,
	clickOnMoreMenuItem,
	createNewPost,
	deactivatePlugin,
	openDocumentSettingsSidebar,
	openPublishPanel,
	publishPost,
	setBrowserViewport,
} from '@wordpress/e2e-test-utils';

describe( 'Using Plugins API', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-plugins-api' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-plugins-api' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	describe( 'Post Status Info', () => {
		it( 'Should render post status info inside Document Setting sidebar', async () => {
			await openDocumentSettingsSidebar();

			const pluginPostStatusInfoText = await page.$eval(
				'.edit-post-post-status .my-post-status-info-plugin',
				( el ) => el.innerText
			);
			expect( pluginPostStatusInfoText ).toBe( 'My post status info' );
		} );
	} );

	describe( 'Publish Panel', () => {
		beforeEach( async () => {
			// Type something first to activate Publish button.
			await clickBlockAppender();
			await page.keyboard.type( 'First paragraph' );
		} );

		it( 'Should render publish panel inside Pre-publish sidebar', async () => {
			await openPublishPanel();

			const pluginPublishPanelText = await page.$eval(
				'.editor-post-publish-panel .my-publish-panel-plugin__pre',
				( el ) => el.innerText
			);
			expect( pluginPublishPanelText ).toMatch( 'My pre publish panel' );
		} );

		it( 'Should render publish panel inside Post-publish sidebar', async () => {
			await publishPost();
			const pluginPublishPanel = await page.waitForSelector(
				'.editor-post-publish-panel .my-publish-panel-plugin__post'
			);
			const pluginPublishPanelText = await pluginPublishPanel.evaluate(
				( node ) => node.innerText
			);
			expect( pluginPublishPanelText ).toMatch( 'My post publish panel' );
		} );
	} );

	describe( 'Sidebar', () => {
		const SIDEBAR_PINNED_ITEM_BUTTON =
			'.interface-pinned-items button[aria-label="Plugin sidebar title"]';
		const SIDEBAR_PANEL_SELECTOR = '.sidebar-title-plugin-panel';
		it( 'Should open plugins sidebar using More Menu item and render content', async () => {
			await clickOnMoreMenuItem( 'Plugin sidebar more menu title' );

			const pluginSidebarContent = await page.$eval(
				'.edit-post-sidebar',
				( el ) => el.innerHTML
			);
			expect( pluginSidebarContent ).toMatchSnapshot();
		} );

		it( 'Should be pinned by default and can be opened and closed using pinned items', async () => {
			const sidebarPinnedItem = await page.$(
				SIDEBAR_PINNED_ITEM_BUTTON
			);
			expect( sidebarPinnedItem ).not.toBeNull();
			await sidebarPinnedItem.click();
			expect( await page.$( SIDEBAR_PANEL_SELECTOR ) ).not.toBeNull();
			await sidebarPinnedItem.click();
			expect( await page.$( SIDEBAR_PANEL_SELECTOR ) ).toBeNull();
		} );

		it( 'Can be pinned and unpinned', async () => {
			await ( await page.$( SIDEBAR_PINNED_ITEM_BUTTON ) ).click();
			const unpinButton = await page.$(
				'button[aria-label="Unpin from toolbar"]'
			);
			await unpinButton.click();
			expect( await page.$( SIDEBAR_PINNED_ITEM_BUTTON ) ).toBeNull();
			await page.click(
				'.interface-complementary-area-header button[aria-label="Close plugin"]'
			);
			await page.reload();
			await page.waitForSelector( '.edit-post-layout' );
			expect( await page.$( SIDEBAR_PINNED_ITEM_BUTTON ) ).toBeNull();
			await clickOnMoreMenuItem( 'Plugin sidebar more menu title' );
			await page.click( 'button[aria-label="Pin to toolbar"]' );
			expect( await page.$( SIDEBAR_PINNED_ITEM_BUTTON ) ).not.toBeNull();
			await page.reload();
			await page.waitForSelector( '.edit-post-layout' );
			expect( await page.$( SIDEBAR_PINNED_ITEM_BUTTON ) ).not.toBeNull();
		} );

		it( 'Should close plugins sidebar using More Menu item', async () => {
			await clickOnMoreMenuItem( 'Plugin sidebar more menu title' );

			const pluginSidebarOpened = await page.$( '.edit-post-sidebar' );
			expect( pluginSidebarOpened ).not.toBeNull();

			await clickOnMoreMenuItem( 'Plugin sidebar more menu title' );

			const pluginSidebarClosed = await page.$( '.edit-post-sidebar' );
			expect( pluginSidebarClosed ).toBeNull();
		} );

		describe( 'Medium screen', () => {
			beforeAll( async () => {
				await setBrowserViewport( 'medium' );
			} );

			afterAll( async () => {
				await setBrowserViewport( 'large' );
			} );

			it( 'Should open plugins sidebar using More Menu item and render content', async () => {
				await clickOnMoreMenuItem( 'Plugin sidebar more menu title' );

				const pluginSidebarContent = await page.$eval(
					'.edit-post-sidebar',
					( el ) => el.innerHTML
				);
				expect( pluginSidebarContent ).toMatchSnapshot();
			} );
		} );
	} );

	describe( 'Document Setting Custom Panel', () => {
		it( 'Should render a custom panel inside Document Setting sidebar', async () => {
			await openDocumentSettingsSidebar();
			const pluginDocumentSettingsText = await page.$eval(
				'.edit-post-sidebar .my-document-setting-plugin',
				( el ) => el.innerText
			);
			expect( pluginDocumentSettingsText ).toMatchSnapshot();
		} );
	} );

	describe( 'Block Settings Menu Item', () => {
		it( 'Should render a new item', async () => {
			await clickBlockToolbarButton( 'My new plugin' );

			expect( console ).toHaveLoggedWith( 'Block clicked' );
		} );
	} );
} );
