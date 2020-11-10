/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { createAtom } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { shortcutsByNameAtom, shortcutNamesAtom } from './atoms';

/** @typedef {import('@wordpress/keycodes').WPKeycodeModifier} WPKeycodeModifier */

/**
 * Keyboard key combination.
 *
 * @typedef {Object} WPShortcutKeyCombination
 *
 * @property {string}                      character Character.
 * @property {WPKeycodeModifier|undefined} modifier  Modifier.
 */

/**
 * Configuration of a registered keyboard shortcut.
 *
 * @typedef {Object} WPShortcutConfig
 *
 * @property {string}                     name           Shortcut name.
 * @property {string}                     category       Shortcut category.
 * @property {string}                     description    Shortcut description.
 * @property {WPShortcutKeyCombination}   keyCombination Shortcut key combination.
 * @property {WPShortcutKeyCombination[]} [aliases]      Shortcut aliases.
 */

/**
 * Returns an action object used to register a new keyboard shortcut.
 *
 * @param {Function}         get          get atom value.
 * @param {Function}         set          set atom value.
 * @param {Object}           atomRegistry atom registry.
 * @param {WPShortcutConfig} config       Shortcut config.
 */
export const registerShortcut = ( get, set, atomRegistry ) => ( config ) => {
	const shortcutByNames = get( shortcutsByNameAtom );
	const existingAtom = shortcutByNames[ config.name ];
	if ( ! existingAtom ) {
		const shortcutNames = get( shortcutNamesAtom );
		set( shortcutNamesAtom, [ ...shortcutNames, config.name ] );
	} else {
		atomRegistry.deleteAtom( existingAtom );
	}
	const newAtomCreator = createAtom( config );
	// This registers the atom in the registry (we might want a dedicated function?)
	atomRegistry.getAtom( newAtomCreator );
	set( shortcutsByNameAtom, {
		...shortcutByNames,
		[ config.name ]: newAtomCreator,
	} );
};

/**
 * Returns an action object used to unregister a keyboard shortcut.
 *
 * @param {Function} get          get atom value.
 * @param {Function} set          set atom value.
 * @param {Object}   atomRegistry atom registry.
 * @param {string}   name         Shortcut name.
 */
export const unregisterShortcut = ( get, set, atomRegistry ) => ( name ) => {
	const shortcutNames = get( shortcutNamesAtom );
	set(
		shortcutNamesAtom,
		shortcutNames.filter( ( n ) => n !== name )
	);
	const shortcutByNames = get( shortcutsByNameAtom );
	set( shortcutsByNameAtom, omit( shortcutByNames, [ name ] ) );
	atomRegistry.deleteAtom( shortcutByNames[ name ] );
};
