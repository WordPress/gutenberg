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

const clickOnBlockSettingsMenuItem = async ( buttonLabel ) => {
	await expect( page ).toClick( '.editor-block-settings-menu__toggle' );
	const itemButton = ( await page.$x( `//*[contains(@class, "editor-block-settings-menu__popover")]//button[contains(text(), '${ buttonLabel }')]` ) )[ 0 ];
	await itemButton.click();
};

const ANNOTATIONS_SELECTOR = '.annotation-text-e2e-tests';

describe( 'Using Plugins API', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-plugins-api' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-plugins-api' );
	} );

	beforeEach( async () => {
		await newPost();
	} );

	describe( 'Post Status Info', () => {
		it( 'Should render post status info inside Document Setting sidebar', async () => {
			await openDocumentSettingsSidebar();

			const pluginPostStatusInfoText = await page.$eval( '.edit-post-post-status .my-post-status-info-plugin', ( el ) => el.innerText );
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

			const pluginSidebarOpened = await page.$( '.edit-post-sidebar' );
			expect( pluginSidebarOpened ).not.toBeNull();

			await clickOnMoreMenuItem( 'Sidebar title plugin' );

			const pluginSidebarClosed = await page.$( '.edit-post-sidebar' );
			expect( pluginSidebarClosed ).toBeNull();
		} );
	} );

	describe( 'Annotations', () => {
		it( 'Allows a block to be annotated', async () => {
			await page.keyboard.type( 'Title' + '\n' + 'Paragraph to annotate' );
			await clickOnMoreMenuItem( 'Sidebar title plugin' );

			let annotations = await page.$$( ANNOTATIONS_SELECTOR );
			expect( annotations ).toHaveLength( 0 );

			// Click add annotation button.
			const addAnnotationButton = ( await page.$x( "//button[contains(text(), 'Add annotation')]" ) )[ 0 ];
			await addAnnotationButton.click();

			annotations = await page.$$( ANNOTATIONS_SELECTOR );
			expect( annotations ).toHaveLength( 1 );

			const annotation = annotations[ 0 ];

			const text = await page.evaluate( ( el ) => el.innerText, annotation );
			expect( text ).toBe( ' to ' );

			await clickOnBlockSettingsMenuItem( 'Edit as HTML' );

			const htmlContent = await page.$$( '.editor-block-list__block-html-textarea' );
			const html = await page.evaluate( ( el ) => {
				return el.innerHTML;
			}, htmlContent[ 0 ] );

			// There should be no <mark> tags in the raw content.
			expect( html ).toBe( '&lt;p&gt;Paragraph to annotate&lt;/p&gt;' );
		} );
	} );
} );
