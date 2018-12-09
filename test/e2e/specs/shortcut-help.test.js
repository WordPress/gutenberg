/**
 * Node dependencies
 */
import AxePuppeteer from 'axe-puppeteer';

/**
 * Internal dependencies
 */
import {
	newPost,
	clickOnMoreMenuItem,
	clickOnCloseModalButton,
	pressWithModifier,
	logA11yResults,
} from '../support/utils';

describe( 'keyboard shortcut help modal', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'displays the shortcut help modal when opened using the menu item in the more menu', async () => {
		await clickOnMoreMenuItem( 'Keyboard Shortcuts' );
		const shortcutHelpModalElements = await page.$$( '.edit-post-keyboard-shortcut-help' );
		expect( shortcutHelpModalElements ).toHaveLength( 1 );
	} );

	it( 'closes the shortcut help modal when the close icon is clicked', async () => {
		await clickOnCloseModalButton();
		const shortcutHelpModalElements = await page.$$( '.edit-post-keyboard-shortcut-help' );
		expect( shortcutHelpModalElements ).toHaveLength( 0 );
	} );

	it( 'displays the shortcut help modal when opened using the shortcut key (access+h)', async () => {
		await pressWithModifier( 'access', 'h' );
		const shortcutHelpModalElements = await page.$$( '.edit-post-keyboard-shortcut-help' );
		expect( shortcutHelpModalElements ).toHaveLength( 1 );

		const axe = new AxePuppeteer( page );
		axe.include( '.edit-post-keyboard-shortcut-help' );
		logA11yResults( await axe.analyze() );
	} );

	it( 'closes the shortcut help modal when the shortcut key (access+h) is pressed again', async () => {
		await pressWithModifier( 'access', 'h' );
		const shortcutHelpModalElements = await page.$$( '.edit-post-keyboard-shortcut-help' );
		expect( shortcutHelpModalElements ).toHaveLength( 0 );
	} );
} );
