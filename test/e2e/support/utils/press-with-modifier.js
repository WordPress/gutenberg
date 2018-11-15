/**
 * External dependencies
 */
import { capitalize } from 'lodash';

/**
 * WordPress dependencies
 */
import { modifiers } from '@wordpress/keycodes';

/**
 * Performs a key press with modifier (Shift, Control, Meta, Alt), where each modifier
 * is normalized to platform-specific modifier.
 *
 * @param {string} modifier Modifier key.
 * @param {string} key Key to press while modifier held.
 */
export async function pressWithModifier( modifier, key ) {
	const isAppleOS = () => process.platform === 'darwin';
	const mappedModifiers = modifiers[ modifier ]( isAppleOS );

	await Promise.all(
		mappedModifiers.map( async ( mod ) => {
			const ctrlMapping = mod === 'ctrl' ? 'control' : mod;
			const capitalizedMod = capitalize( ctrlMapping );
			return page.keyboard.down( capitalizedMod );
		} )
	);

	await page.keyboard.press( key );

	await Promise.all(
		mappedModifiers.map( async ( mod ) => {
			const ctrlMapping = mod === 'ctrl' ? 'control' : mod;
			const capitalizedMod = capitalize( ctrlMapping );
			return page.keyboard.up( capitalizedMod );
		} )
	);
}
