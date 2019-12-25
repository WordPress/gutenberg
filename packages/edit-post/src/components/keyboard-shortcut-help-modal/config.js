/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const mainShortcuts = [
	{
		keyCombination: { modifier: 'access', character: 'h' },
		description: __( 'Display these keyboard shortcuts.' ),
	},
];

export const globalShortcuts = [
	'core/editor/save',
	'core/editor/undo',
	'core/editor/redo',
	'core/edit-post/toggle-sidebar',
	{
		keyCombination: { modifier: 'access', character: 'o' },
		description: __( 'Open the block navigation menu.' ),
	},
	'core/edit-post/next-region',
	'core/edit-post/previous-region',
	{
		keyCombination: { modifier: 'alt', character: 'F10' },
		description: __( 'Navigate to the nearest toolbar.' ),
	},
	'core/edit-post/toggle-mode',
];

export const textFormattingShortcuts = [
	{
		keyCombination: { modifier: 'primary', character: 'b' },
		description: __( 'Make the selected text bold.' ),
	},
	{
		keyCombination: { modifier: 'primary', character: 'i' },
		description: __( 'Make the selected text italic.' ),
	},
	{
		keyCombination: { modifier: 'primary', character: 'k' },
		description: __( 'Convert the selected text into a link.' ),
	},
	{
		keyCombination: { modifier: 'primaryShift', character: 'k' },
		description: __( 'Remove a link.' ),
	},
	{
		keyCombination: { modifier: 'primary', character: 'u' },
		description: __( 'Underline the selected text.' ),
	},
];
