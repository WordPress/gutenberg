/**
 * External dependencies
 */
import { capitalize } from 'lodash';

/**
 * WordPress dependencies
 */
import { modifiers, SHIFT, ALT, CTRL } from '@wordpress/keycodes';

/**
 * Performs a key press with modifier (Shift, Control, Meta, Alt), where each modifier
 * is normalized to platform-specific modifier.
 *
 * @param {string} modifier Modifier key.
 * @param {string} key Key to press while modifier held.
 */
export async function pressKeyWithModifier( modifier, key ) {
	const isAppleOS = () => process.platform === 'darwin';
	const overWrittenModifiers = {
		...modifiers,
		shiftAlt: ( _isApple ) => _isApple() ? [ SHIFT, ALT ] : [ SHIFT, CTRL ],
	};
	const mappedModifiers = overWrittenModifiers[ modifier ]( isAppleOS );
	const ctrlSwap = ( mod ) => mod === CTRL ? 'control' : mod;

	await Promise.all(
		mappedModifiers.map( async ( mod ) => {
			const capitalizedMod = capitalize( ctrlSwap( mod ) );
			return page.keyboard.down( capitalizedMod );
		} )
	);

	await page.keyboard.press( key );

	await Promise.all(
		mappedModifiers.map( async ( mod ) => {
			const capitalizedMod = capitalize( ctrlSwap( mod ) );
			return page.keyboard.up( capitalizedMod );
		} )
	);
}
