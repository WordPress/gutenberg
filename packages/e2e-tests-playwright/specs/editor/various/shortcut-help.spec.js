/**
 * Internal dependencies
 */
const { test, expect } = require( '../../../config/test' );

test.describe( 'keyboard shortcut help modal', () => {
	test( 'displays the shortcut help modal when opened using the menu item in the more menu', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.createNewPost();

		await pageUtils.clickOnMoreMenuItem( 'Keyboard shortcuts' );

		const shortcutHelpModalElements = await page.locator(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		await expect( shortcutHelpModalElements ).toBeVisible();
	} );

	test( 'closes the shortcut help modal when the close icon is clicked', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.createNewPost();

		await pageUtils.clickOnMoreMenuItem( 'Keyboard shortcuts' );

		await pageUtils.clickOnCloseModalButton();
		const shortcutHelpModalElements = await page.locator(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		await expect( shortcutHelpModalElements ).toBeHidden();
	} );

	test( 'displays the shortcut help modal when opened using the shortcut key (access+h)', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.createNewPost();

		await page.keyboard.press( 'Control+Alt+h' );
		const shortcutHelpModalElements = await page.locator(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		await expect( shortcutHelpModalElements ).toBeVisible();
	} );

	test( 'closes the shortcut help modal when the shortcut key (access+h) is pressed again', async ( {
		page,
		pageUtils,
	} ) => {
		await pageUtils.createNewPost();

		await page.keyboard.press( 'Control+Alt+h' );
		await page.keyboard.press( 'Control+Alt+h' );

		const shortcutHelpModalElements = await page.locator(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		await expect( shortcutHelpModalElements ).toBeHidden();
	} );
} );
