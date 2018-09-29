/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	clickOnMoreMenuItem,
	openDocumentSettingsSidebar,
	newPost,
	openPublishPanel,
	publishPost,
} from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

describe( 'Using Plugins API', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-plugins-api' );
		await newPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-plugins-api' );
	} );

	describe( 'Post Status Info', () => {
		it( 'Should render post status info inside Document Setting sidebar', async () => {
			await openDocumentSettingsSidebar();

			const pluginPostStatusInfoText = await page.$eval( '.edit-post-post-status .my-post-status-info-plugin', ( el ) => el.innerText );
			expect( pluginPostStatusInfoText ).toBe( 'My post status info' );
		} );
	} );

	describe( 'Publish Panel', () => {
		afterEach( async () => {
			// Close Publish panel.
			await page.click( '.editor-post-publish-panel__header button[aria-label="Close panel"]' );
		} );

		it( 'Should render publish panel inside Pre-publish sidebar', async () => {
			// Type something first to activate Publish button.
			await clickBlockAppender();
			await page.keyboard.type( 'First paragraph' );

			await openPublishPanel();

			const pluginPublishPanelText = await page.$eval( '.editor-post-publish-panel .my-publish-panel-plugin__pre', ( el ) => el.innerText );
			expect( pluginPublishPanelText ).toMatch( 'My pre publish panel' );
		} );

		it( 'Should render publish panel inside Post-publish sidebar', async () => {
			await publishPost();

			const pluginPublishPanelText = await page.$eval( '.editor-post-publish-panel .my-publish-panel-plugin__post', ( el ) => el.innerText );
			expect( pluginPublishPanelText ).toMatch( 'My post publish panel' );
		} );
	} );

	describe( 'Sidebar', () => {
		it( 'Should open plugins sidebar using More Menu item and render content', async () => {
			await clickOnMoreMenuItem( 'Sidebar title plugin' );

			const pluginSidebarContent = await page.$eval( '.edit-post-sidebar', ( el ) => el.innerHTML );
			expect( pluginSidebarContent ).toMatchSnapshot();
		} );

		it( 'Should close plugins sidebar using More Menu item', async () => {
			await clickOnMoreMenuItem( 'Sidebar title plugin' );

			const pluginSidebar = await page.$( '.edit-post-sidebar' );
			expect( pluginSidebar ).toBeNull();
		} );
	} );
} );
