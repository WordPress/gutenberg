/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
	{
		keyCombination: { character: '[[' },
		description: __( 'Insert a link to a post or page' ),
	},
];
