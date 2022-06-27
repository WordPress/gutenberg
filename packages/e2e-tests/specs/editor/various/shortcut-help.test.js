/**
 * WordPress dependencies
 */
import {
	createNewPost,
	clickOnMoreMenuItem,
	clickOnCloseModalButton,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'keyboard shortcut help modal', () => {
	beforeAll( async () => {
		await createNewPost();
	} );

	it( 'displays the shortcut help modal when opened using the menu item in the more menu', async () => {
		await clickOnMoreMenuItem( 'Keyboard shortcuts' );
		const shortcutHelpModalElements = await page.$$(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		expect( shortcutHelpModalElements ).toHaveLength( 1 );
	} );

	// Added this test to ensure scrolling does not break in some browsers.
	it( 'should contain tabindex on ul elements for better browser support', async () => {
		// Open modal.
		await clickOnMoreMenuItem( 'Keyboard shortcuts' );
		const shortcutHelpModalElements = await page.$$(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		await expect( shortcutHelpModalElements ).toHaveLength( 1 );

		// Try to find tabindex of 0 on ul element.
		const findTabIndex = await page.evaluate(
			() =>
				document
					.querySelector(
						'ul.edit-post-keyboard-shortcut-help-modal__shortcut-list'
					)
					.getAttribute( 'tabindex' ) === '0'
		);
		await expect( findTabIndex ).toBe( true );
	} );

	it( 'closes the shortcut help modal when the close icon is clicked', async () => {
		await clickOnCloseModalButton();
		const shortcutHelpModalElements = await page.$$(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		expect( shortcutHelpModalElements ).toHaveLength( 0 );
	} );

	it( 'displays the shortcut help modal when opened using the shortcut key (access+h)', async () => {
		await pressKeyWithModifier( 'access', 'h' );
		const shortcutHelpModalElements = await page.$$(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		expect( shortcutHelpModalElements ).toHaveLength( 1 );
	} );

	it( 'closes the shortcut help modal when the shortcut key (access+h) is pressed again', async () => {
		await pressKeyWithModifier( 'access', 'h' );
		const shortcutHelpModalElements = await page.$$(
			'.edit-post-keyboard-shortcut-help-modal'
		);
		expect( shortcutHelpModalElements ).toHaveLength( 0 );
	} );
} );
