/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Platform-specific modifier for the access key chord.
 *
 * @see pressWithModifier
 *
 * @type {string}
 */
export const ACCESS_MODIFIER_KEYS =
  process.platform === 'darwin' ? [ 'Control', 'Alt' ] : [ 'Shift', 'Alt' ];

/**
 * Performs a key press with modifier (Shift, Control, Meta, Mod), where "Mod"
 * is normalized to platform-specific modifier (Meta in MacOS, else Control).
 *
 * @param {string|Array} modifiers Modifier key or array of modifier keys.
 * @param {string} key      	   Key to press while modifier held.
 */
export async function pressWithModifier( modifiers, key ) {
	const modifierKeys = castArray( modifiers );

	await Promise.all(
		modifierKeys.map( async ( modifier ) => page.keyboard.down( modifier ) )
	);

	await page.keyboard.press( key );

	await Promise.all(
		modifierKeys.map( async ( modifier ) => page.keyboard.up( modifier ) )
	);
}
