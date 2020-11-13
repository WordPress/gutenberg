/**
 * External dependencies
 */
import { omit } from 'lodash';

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
 * @param {Function} get          Atom resover.
 * @param {Function} set          Atom updater.
 * @param {Object}   atomRegistry Atom Regstry.
 * @param {WPShortcutConfig} config  Shortcut config.
 */
export const registerShortcut = ( get, set, atomRegistry ) => ( config ) => {
	const shortcutNames = get( shortcutNamesAtom );
	const hasShortcut = shortcutNames.includes( config.name );
	if ( ! hasShortcut ) {
		set( shortcutNamesAtom, [ ...shortcutNames, config.name ] );
	}
	const shortcutsByName = get( shortcutsByNameAtom );
	atomRegistry.getAtom( shortcutsByNameAtom ).set( {
		...shortcutsByName,
		[ config.name ]: config,
	} );
	/* set( shortcutsByName, {
		...shortcutsByName,
		[ config.name ]: config,
	} ); */
};

/**
 * Returns an action object used to unregister a keyboard shortcut.
 *
 * @param {Function} get          get atom value.
 * @param {Function} set          set atom value.
 * @param {string}   name         Shortcut name.
 */
export const unregisterShortcut = ( get, set ) => ( name ) => {
	const shortcutNames = get( shortcutNamesAtom );
	set(
		shortcutNamesAtom,
		shortcutNames.filter( ( n ) => n !== name )
	);
	const shortcutByNames = get( shortcutsByNameAtom );
	set( shortcutsByNameAtom, omit( shortcutByNames, [ name ] ) );

	// The atom will remain in the family atoms
	// We need to build a way to remove it automatically once the parent atom changes.
	// atomRegistry.deleteAtom( shortcutByNames[ name ] );
};
