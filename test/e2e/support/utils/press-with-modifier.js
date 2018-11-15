/**
 * External dependencies
 */
import { capitalize, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { rawShortcut } from '@wordpress/keycodes';

/**
 * Performs a key press with modifier (Shift, Control, Meta, Alt), where each modifier
 * is normalized to platform-specific modifier.
 *
 * @param {string} modifier Modifier key.
 * @param {string} key Key to press while modifier held.
 */
export async function pressWithModifier( modifier, key ) {
	const isAppleOS = () => process.platform === 'darwin';
	const rawModifier = rawShortcut[ modifier ]( '', isAppleOS ).split( '+' );

	await Promise.all(
		castArray( rawModifier ).map( async ( item ) => page.keyboard.down( capitalize( item ) ) )
	);

	await page.keyboard.press( key );

	await Promise.all(
		castArray( rawModifier ).map( async ( item ) => page.keyboard.up( capitalize( item ) ) )
	);
}
