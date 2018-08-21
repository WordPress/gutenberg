/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';

export const DEFAULT_CONTROLS = [ 'bold', 'italic', 'strikethrough', 'link', 'code' ];

export const FORMATTING_CONTROLS = [
	{
		icon: 'editor-bold',
		title: __( 'Bold' ),
		shortcut: displayShortcut.primary( 'b' ),
		format: 'bold',
	},
	{
		icon: 'editor-italic',
		title: __( 'Italic' ),
		shortcut: displayShortcut.primary( 'i' ),
		format: 'italic',
	},
	{
		icon: 'admin-links',
		title: __( 'Link' ),
		shortcut: displayShortcut.primary( 'k' ),
		format: 'link',
	},
	{
		icon: 'editor-strikethrough',
		title: __( 'Strikethrough' ),
		shortcut: displayShortcut.access( 'd' ),
		format: 'strikethrough',
	},
];
