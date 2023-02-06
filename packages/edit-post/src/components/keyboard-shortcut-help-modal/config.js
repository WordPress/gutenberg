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
		keyCombination: { character: '[[' },
		description: __( 'Insert a link to a post or page' ),
	},
	{
		keyCombination: { modifier: 'primary', character: 'u' },
		description: __( 'Underline the selected text.' ),
	},
	{
		keyCombination: { modifier: 'access', character: 'd' },
		description: __( 'Strikethrough the selected text.' ),
	},
	{
		keyCombination: { modifier: 'access', character: 'x' },
		description: __( 'Make the selected text inline code.' ),
	},
	{
		keyCombination: { modifier: 'access', character: '0' },
		description: __( 'Convert the current heading to a paragraph.' ),
	},
	{
		keyCombination: { modifier: 'access', character: '1-6' },
		description: __(
			'Convert the current paragraph or heading to a heading of level 1 to 6.'
		),
	},
];
