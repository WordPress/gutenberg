/**
 * Navigates to the top of the content editor using the keyboard.
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
