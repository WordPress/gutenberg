import type { WPKeycodeModifier } from '@wordpress/keycodes';

/**
 * Keyboard key combination.
 */
export interface ShortcutKeyCombination {
	character: string;
	modifier: WPKeycodeModifier | undefined;
}

/**
 * Configuration of a registered keyboard shortcut.
 */
export interface ShortcutConfig {
	name: string;
	category: string;
	description: string;
	keyCombination: ShortcutKeyCombination;
	aliases?: ShortcutKeyCombination[];
}

export type ShortcutAction =
	| ReturnType< typeof registerShortcut >
	| ReturnType< typeof unregisterShortcut >;

/**
 * Returns an action object used to register a new keyboard shortcut.
 *
 * @param {ShortcutConfig} config Shortcut config.
 *
 * @example
 *
 *```js
 * import { useEffect } from 'react';
 * import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
 * import { useSelect, useDispatch } from '@wordpress/data';
 * import { __ } from '@wordpress/i18n';
 *
 * const ExampleComponent = () => {
 *     const { registerShortcut } = useDispatch( keyboardShortcutsStore );
 *
 *     useEffect( () => {
 *         registerShortcut( {
 *             name: 'custom/my-custom-shortcut',
 *             category: 'my-category',
 *             description: __( 'My custom shortcut' ),
 *             keyCombination: {
 *                 modifier: 'primary',
 *                 character: 'j',
 *             },
 *         } );
 *     }, [] );
 *
 *     const shortcut = useSelect(
 *         ( select ) =>
 *             select( keyboardShortcutsStore ).getShortcutKeyCombination(
 *                 'custom/my-custom-shortcut'
 *             ),
 *         []
 *     );
 *
 *     return shortcut ? (
 *         <p>{ __( 'Shortcut is registered.' ) }</p>
 *     ) : (
 *         <p>{ __( 'Shortcut is not registered.' ) }</p>
 *     );
 * };
 *```
 * @return {Object} action.
 */
export function registerShortcut( {
	name,
	category,
	description,
	keyCombination,
	aliases,
}: ShortcutConfig ) {
	return {
		type: 'REGISTER_SHORTCUT' as const,
		name,
		category,
		keyCombination,
		aliases,
		description,
	};
}

/**
 * Returns an action object used to unregister a keyboard shortcut.
 *
 * @param {string} name Shortcut name.
 *
 * @example
 *
 *```js
 * import { useEffect } from 'react';
 * import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
 * import { useSelect, useDispatch } from '@wordpress/data';
 * import { __ } from '@wordpress/i18n';
 *
 * const ExampleComponent = () => {
 *     const { unregisterShortcut } = useDispatch( keyboardShortcutsStore );
 *
 *     useEffect( () => {
 *         unregisterShortcut( 'core/editor/next-region' );
 *     }, [] );
 *
 *     const shortcut = useSelect(
 *         ( select ) =>
 *             select( keyboardShortcutsStore ).getShortcutKeyCombination(
 *                 'core/editor/next-region'
 *             ),
 *         []
 *     );
 *
 *     return shortcut ? (
 *         <p>{ __( 'Shortcut is not unregistered.' ) }</p>
 *     ) : (
 *         <p>{ __( 'Shortcut is unregistered.' ) }</p>
 *     );
 * };
 *```
 * @return {Object} action.
 */
export function unregisterShortcut( name: string ) {
	return {
		type: 'UNREGISTER_SHORTCUT' as const,
		name,
	};
}
