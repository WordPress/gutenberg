/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation colors', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// We want emptytheme because it doesn't have any styles.
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllMenus(),
			requestUtils.deleteAllPages(),
		] );
	} );

	test.beforeEach( async ( { admin, editor, requestUtils } ) => {
		const { id: pageId } = await requestUtils.createPage( {
			title: 'Test Page',
			status: 'publish',
		} );

		const { id: menuId } = await requestUtils.createNavigationMenu( {
			title: 'Colored menu',
			content: `<!-- wp:navigation-submenu {"label":"Custom Link","type":"custom","url":"https://wordpress.org","kind":"custom"} --><!-- wp:navigation-link {"label":"Submenu Link","type":"custom","url":"https://wordpress.org","kind":"custom"} /--><!-- /wp:navigation-submenu --><!-- wp:navigation-link {"label":"Page Link","type":"page","id": ${ pageId },"url":"http://localhost:8889/?page_id=${ pageId }","kind":"post-type"} /-->`,
			attributes: { openSubmenusOnClick: true },
		} );

		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: {
				ref: menuId,
			},
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllMenus(),
			requestUtils.deleteAllPages(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
		] );
	} );

	test.use( {
		colorControl: async ( { admin, editor, page, pageUtils }, use ) => {
			await use( new ColorControl( { admin, editor, page, pageUtils } ) );
		},
	} );

	test( 'All navigation links should default to the body color and submenus and mobile overlay should default to a white background with black text', async ( {
		editor,
		page,
		colorControl,
	} ) => {
		const expectedNavigationColors = {
			textColor: colorControl.black,
			backgroundColor: colorControl.transparent, // There should be no background color set even though the body background is black.
			submenuTextColor: colorControl.black,
			submenuBackgroundColor: colorControl.white,
		};

		await colorControl.testEditorColors( expectedNavigationColors );

		// Check the colors of the links on the frontend.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await colorControl.testFrontendColors( expectedNavigationColors );
	} );

	test( 'Top level navigation links inherit the text color from the theme/group but do not apply to the submenu or overlay text', async ( {
		page,
		editor,
		colorControl,
	} ) => {
		// Set the text and background styles for the group. The text color should apply to the top level links but not the submenu or overlay.
		// We wrap the nav block inside a group block.
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Group' } ).click();

		// In the sidebar inspector we add a link color and link hover color to the group block.
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'tab', { name: 'Styles' } ).click();
		await page.getByRole( 'button', { name: 'Text' } ).click();
		await page
			.getByRole( 'option', { name: 'Color: White' } )
			.click( { force: true } );

		await page
			.getByRole( 'button', { name: 'Background', exact: true } )
			.click();
		await page
			.getByRole( 'option', { name: 'Color: Black' } )
			.click( { force: true } );

		// Close the sidebar so our selectors don't accidentally select the sidebar links instead of the editor canvas.
		await page
			.getByRole( 'button', { name: 'Close Settings' } )
			.click( { force: true } );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.click();

		const expectedNavigationColors = {
			textColor: colorControl.white,
			backgroundColor: colorControl.transparent, // There should be no background color set even though the body background is black.
			submenuTextColor: colorControl.black,
			submenuBackgroundColor: colorControl.white,
		};

		await colorControl.testEditorColors( expectedNavigationColors );

		// Check the colors of the links on the frontend.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await colorControl.testFrontendColors( expectedNavigationColors );
	} );

	test( 'Navigation text does not inherit the link color from the theme/group', async ( {
		page,
		editor,
		colorControl,
	} ) => {
		// Wrap the nav block inside a group block.
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Group' } ).click();

		// In the sidebar inspector we add a link color and link hover color to the group block.
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'tab', { name: 'Styles' } ).click();
		await page.getByRole( 'button', { name: 'Color options' } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show Link' } )
			.click();
		await page.getByRole( 'tab', { name: 'Styles' } ).click();
		await page.getByRole( 'button', { name: 'Link', exact: true } ).click();
		// rga(207, 46 ,46) is the color of the "vivid red" color preset.
		await page
			.getByRole( 'option', { name: 'Color: Vivid red' } )
			.click( { force: true } );
		await page.getByRole( 'tab', { name: 'Hover' } ).click();
		// rgb(155, 81, 224) is the color of the "vivid purple" color preset.
		await page
			.getByRole( 'option', { name: 'Color: Vivid purple' } )
			.click( { force: true } );

		// Close the sidebar so our selectors don't accidentally select the sidebar links instead of the editor canvas.
		await page
			.getByRole( 'button', { name: 'Close Settings' } )
			.click( { force: true } );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.click();

		const expectedNavigationColors = {
			textColor: colorControl.black,
			backgroundColor: colorControl.transparent,
			submenuTextColor: colorControl.black,
			submenuBackgroundColor: colorControl.white,
		};

		await colorControl.testEditorColors( expectedNavigationColors );

		// Check the colors of the links on the frontend.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await colorControl.testFrontendColors( expectedNavigationColors );
	} );

	test( 'The navigation text color should apply to all navigation links including submenu and overlay text', async ( {
		page,
		editor,
		colorControl,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		// In the inspector sidebar, we change the nav block colors.
		await page.getByRole( 'tab', { name: 'Styles' } ).click();
		// Pale pink for the text color.
		await page.getByRole( 'button', { name: 'Text', exact: true } ).click();
		// 247, 141, 167 is the color of the "Pale pink" color preset.
		const palePink = 'rgb(247, 141, 167)';
		await page
			.getByRole( 'option', { name: 'Color: Pale pink' } )
			.click( { force: true } );

		// Close the sidebar so our selectors don't accidentally select the sidebar links instead of the editor canvas.
		await page
			.getByRole( 'button', { name: 'Close Settings' } )
			.click( { force: true } );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.click();

		const expectedNavigationColors = {
			textColor: palePink,
			backgroundColor: colorControl.transparent, // There should be no background color set.
			submenuTextColor: palePink,
			submenuBackgroundColor: colorControl.white,
		};

		await colorControl.testEditorColors( expectedNavigationColors );

		// Check the colors of the links on the frontend.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await colorControl.testFrontendColors( expectedNavigationColors );
	} );

	test( 'The navigation background color should apply to all navigation links including submenu and overlay backgrounds', async ( {
		page,
		editor,
		colorControl,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		// In the inspector sidebar, we change the nav block colors.
		await page.getByRole( 'tab', { name: 'Styles' } ).click();
		// Pale pink for the text color.
		await page
			.getByRole( 'button', { name: 'Background', exact: true } )
			.click();
		// 142, 209, 252 is the color of the "Pale cyan blue" color preset.
		const paleCyan = 'rgb(142, 209, 252)';
		await page
			.getByRole( 'option', { name: 'Color: Pale cyan blue' } )
			.click( { force: true } );

		// Close the sidebar so our selectors don't accidentally select the sidebar links instead of the editor canvas.
		await page
			.getByRole( 'button', { name: 'Close Settings' } )
			.click( { force: true } );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.click();

		// The navigation background, submenu background and overlay background should all be paleCyan.
		const expectedNavigationColors = {
			textColor: colorControl.black,
			backgroundColor: paleCyan,
			submenuTextColor: colorControl.black,
			submenuBackgroundColor: paleCyan,
		};

		await colorControl.testEditorColors( expectedNavigationColors );

		// Check the colors of the links on the frontend.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await colorControl.testFrontendColors( expectedNavigationColors );
	} );

	test( 'As a user I expect my navigation to use the colors I selected for it', async ( {
		editor,
		page,
		colorControl,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		// In the inspector sidebar, we change the nav block colors.
		await page.getByRole( 'tab', { name: 'Styles' } ).click();
		// Pale pink for the text color.
		await page.getByRole( 'button', { name: 'Text', exact: true } ).click();
		// 247, 141, 167 is the color of the "Pale pink" color preset.
		const palePink = 'rgb(247, 141, 167)';
		await page
			.getByRole( 'option', { name: 'Color: Pale pink' } )
			.click( { force: true } );
		// Pale cyan blue for the background color.
		await page
			.getByRole( 'button', { name: 'Background', exact: true } )
			.click();
		// 142, 209, 252 is the color of the "Pale cyan blue" color preset.
		const paleCyan = 'rgb(142, 209, 252)';
		await page
			.getByRole( 'option', { name: 'Color: Pale cyan blue' } )
			.click( { force: true } );
		// Cyan bluish gray for the submenu and overlay text color.
		await page
			.getByRole( 'button', { name: 'Submenu & overlay text' } )
			.click();
		// 171, 184, 195 is the color of the "Cyan bluish gray" color preset.
		const cyanBluishGray = 'rgb(171, 184, 195)';
		await page
			.getByRole( 'option', { name: 'Color: Cyan bluish gray' } )
			.click( { force: true } );
		// Luminous vivid amber for the submenu and overlay background color.
		await page
			.getByRole( 'button', { name: 'Submenu & overlay background' } )
			.click();
		// 252, 185, 0 is the color of the "Luminous vivid amber" color preset.
		const vividAmber = 'rgb(252, 185, 0)';
		await page
			.getByRole( 'option', { name: 'Color: Luminous vivid amber' } )
			.click( { force: true } );

		// Close the sidebar so our selectors don't accidentally select the sidebar links instead of the editor canvas.
		await page
			.getByRole( 'button', { name: 'Close Settings' } )
			.click( { force: true } );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.click();

		const expectedNavigationColors = {
			textColor: palePink,
			backgroundColor: paleCyan, // There should be no background color set.
			submenuTextColor: cyanBluishGray,
			submenuBackgroundColor: vividAmber,
		};

		await colorControl.testEditorColors( expectedNavigationColors );

		// Check the colors of the links on the frontend.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await colorControl.testFrontendColors( expectedNavigationColors );
	} );
} );

class ColorControl {
	constructor( { admin, editor, page, pageUtils } ) {
		this.admin = admin;
		this.editor = editor;
		this.page = page;
		this.pageUtils = pageUtils;

		// Colors for readability.
		this.black = 'rgb(0, 0, 0)';
		this.white = 'rgb(255, 255, 255)';
		// If there is no background color set, it will not have any background, which computes to 'rgab(0, 0, 0, 0)'.
		this.transparent = 'rgba(0, 0, 0, 0)';
	}

	async testEditorColors( {
		textColor,
		backgroundColor,
		submenuTextColor,
		submenuBackgroundColor,
	} ) {
		// Editor elements.
		const customLink = this.editor.canvas
			.locator( 'a' )
			.filter( { hasText: 'Custom Link' } );
		const pageLink = this.editor.canvas
			.locator( 'a' )
			.filter( { hasText: 'Page Link' } );

		await expect( customLink ).toHaveCSS( 'color', textColor );
		await expect( pageLink ).toHaveCSS( 'color', textColor );
		// Navigation background.
		const navigationWrapper = this.editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		await expect( navigationWrapper ).toHaveCSS(
			'background-color',
			backgroundColor
		);

		await customLink.click();

		// Submenu elements.
		const submenuWrapper = this.editor.canvas
			.getByRole( 'document', { name: 'Block: Custom Link' } )
			.filter( { hasText: 'Submenu Link' } );
		const submenuLink = submenuWrapper
			.locator( 'a' )
			.filter( { hasText: 'Submenu Link' } );

		// Submenu link color.
		await expect( submenuLink ).toHaveCSS( 'color', submenuTextColor );

		// Submenu background color.
		await expect( submenuWrapper ).toHaveCSS(
			'background-color',
			submenuBackgroundColor
		);

		// Switch to mobile view for the rest of the editor color tests.
		// Focus the navigation block.
		await this.editor.canvas
			.getByRole( 'document', { name: 'Block: Navigation' } )
			.click();
		await this.editor.openDocumentSettingsSidebar();
		// Switch to settings tab.
		await this.page.getByRole( 'tab', { name: 'Settings' } ).click();
		// Set it to always be the mobile view, but don't save this setting so we can still check all the frontend colors.
		await this.page.getByRole( 'radio', { name: 'Always' } ).click();
		await this.editor.canvas
			.getByRole( 'button', { name: 'Open menu' } )
			.click();

		// Move the mouse to avoid accidentally triggering hover
		// state on the links once the overlay opens.
		await this.page.mouse.move( 1000, 1000 );

		const overlay = this.editor.canvas
			.locator( '.wp-block-navigation__responsive-container' )
			.filter( { hasText: 'Submenu Link' } );

		// All of the mobile menu navigation links should be the same color as the submenuTextColor.
		await expect( customLink ).toHaveCSS( 'color', submenuTextColor );
		await expect( submenuLink ).toHaveCSS( 'color', submenuTextColor );
		await expect( pageLink ).toHaveCSS( 'color', submenuTextColor );

		// The mobile menu background should be the same color as the submenu background.
		await expect( overlay ).toHaveCSS(
			'background-color',
			submenuBackgroundColor
		);

		// Set the mobile view option back to mobile
		await this.page.getByRole( 'radio', { name: 'Mobile' } ).click();
	}

	async testFrontendColors( {
		textColor,
		backgroundColor,
		submenuTextColor,
		submenuBackgroundColor,
	} ) {
		// Top level link elements.
		const customLink = this.page
			.locator( 'a' )
			.filter( { hasText: 'Custom Link' } );
		const pageLink = this.page
			.locator( 'a' )
			.filter( { hasText: 'Page Link' } );

		// Top level link colors.
		await expect( customLink ).toHaveCSS( 'color', textColor );
		await expect( pageLink ).toHaveCSS( 'color', textColor );

		// Navigation background.
		const menuWrapperFront = this.page
			.getByRole( 'navigation', { name: 'Colored menu' } )
			.getByRole( 'list' );
		await expect( menuWrapperFront ).toHaveCSS(
			'background-color',
			backgroundColor
		);

		await customLink.hover();

		// Submenu elements.
		const submenuLink = this.page
			.locator( 'a' )
			.filter( { hasText: 'Submenu Link' } );
		const submenuWrapper = this.page
			.locator( '.wp-block-navigation__submenu-container' )
			.filter( { has: submenuLink } );

		// Submenu link color.
		await expect( submenuLink ).toHaveCSS( 'color', submenuTextColor );

		// Submenu background color.
		await expect( submenuWrapper ).toHaveCSS(
			'background-color',
			submenuBackgroundColor
		);

		// Open the frontend overlay so we can test the colors.
		await this.pageUtils.setBrowserViewport( { width: 599, height: 700 } );
		await this.page.getByRole( 'button', { name: 'Open menu' } ).click();

		// All of the mobile menu navigation links should be the same color as the submenuTextColor.
		await expect( customLink ).toHaveCSS( 'color', submenuTextColor );
		await expect( submenuLink ).toHaveCSS( 'color', submenuTextColor );
		await expect( pageLink ).toHaveCSS( 'color', submenuTextColor );

		const overlayFront = this.page
			.locator( '.wp-block-navigation__responsive-container' )
			.filter( { hasText: 'Submenu Link' } );

		// The mobile menu background should be the same color as the submenu background.
		await expect( overlayFront ).toHaveCSS(
			'background-color',
			submenuBackgroundColor
		);

		// We need to reset the overlay to the default viewport if something runs after these tests.
		await this.pageUtils.setBrowserViewport( 'large' );
	}
}
