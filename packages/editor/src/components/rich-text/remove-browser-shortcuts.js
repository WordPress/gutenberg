/**
 * External dependencies
 */
import { fromPairs } from 'lodash';

/**
 * WordPress dependencies
 */
import { rawShortcut } from '@wordpress/keycodes';
import { KeyboardShortcuts } from '@wordpress/components';

/**
 * Set of keyboard shortcuts handled internally by RichText.
 *
 * @type {Array}
 */
const HANDLED_SHORTCUTS = [
	rawShortcut.primary( 'z' ),
	rawShortcut.primaryShift( 'z' ),
	rawShortcut.primary( 'y' ),
];

/**
 * An instance of a KeyboardShortcuts element pre-bound for the handled
 * shortcuts. Since shortcuts never change, the element can be considered
 * static, and can be skipped in reconciliation.
 *
 * @type {WPElement}
 */
const SHORTCUTS_ELEMENT = (
	<KeyboardShortcuts
		bindGlobal
		shortcuts={ fromPairs( HANDLED_SHORTCUTS.map( ( shortcut ) => {
			return [ shortcut, ( event ) => event.preventDefault() ];
		} ) ) }
	/>
);

/**
 * Component which registered keyboard event handlers to prevent default
 * behaviors for key combinations otherwise handled internally by RichText.
 *
 * @return {WPElement} WordPress element.
 */
export const RemoveBrowserShortcuts = () => SHORTCUTS_ELEMENT;
