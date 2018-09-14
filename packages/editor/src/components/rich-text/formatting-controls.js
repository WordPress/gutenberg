/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';

export const FORMATTING_CONTROLS = [
	{
		icon: 'editor-bold',
		title: __( 'Bold' ),
		shortcut: displayShortcut.primary( 'b' ),
		format: 'bold',
		selector: 'strong',
	},
	{
		icon: 'editor-italic',
		title: __( 'Italic' ),
		shortcut: displayShortcut.primary( 'i' ),
		format: 'italic',
		selector: 'em',
	},
	{
		icon: 'admin-links',
		title: __( 'Link' ),
		shortcut: displayShortcut.primary( 'k' ),
		activeShortcut: displayShortcut.access( 's' ),
		format: 'link',
		selector: 'a',
	},
	{
		icon: 'editor-strikethrough',
		title: __( 'Strikethrough' ),
		shortcut: displayShortcut.access( 'd' ),
		format: 'strikethrough',
		selector: 'del',
	},
];
