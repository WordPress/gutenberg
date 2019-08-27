/**
 * Navigates to the top of the content editor using the keyboard.
 * @returns {Promise} A promise that's resolved when the browser has finished emulating the keyboard shortcut for focusing the top of the editor, and tabbed to the next focusable element.
 */

/**
 * Internal dependencies
 */
import { pressKeyWithModifier } from './press-key-with-modifier';

export async function navigateToContentEditorTop() {
	// Use 'Ctrl+`' to return to the top of the editor
	await pressKeyWithModifier( 'ctrl', '`' );
	await pressKeyWithModifier( 'ctrl', '`' );

	// Tab into the Title block
	await page.keyboard.press( 'Tab' );
}
