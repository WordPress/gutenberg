/**
 * WordPress dependencies
 */
import { displayShortcut } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

const globalShortcuts = {
	title: __( 'Global shortcuts' ),
	description: __( 'Use these shortcuts anywhere.' ),
	shortcuts: [
		{
			key: displayShortcut.primary( '?' ),
			description: __( 'Display this help.' ),
		},
		{
			key: displayShortcut.primary( 's' ),
			description: __( 'Save your changes.' ),
		},
		{
			key: displayShortcut.primary( ',' ),
			description: __( 'Show or hide the settings sidebar.' ),
		},
		{
			key: displayShortcut.primary( 'z' ),
			description: __( 'Undo your last changes.' ),
		},
		{
			key: displayShortcut.primaryShift( 'z' ),
			description: __( 'Redo your last undo.' ),
		},
		{
			key: displayShortcut.secondary( 'm' ),
			description: __( 'Switch between Visual Editor and Code Editor.' ),
		},
	],
};

const selectionShortcuts = {
	title: __( 'Selection shortcuts' ),
	description: __( 'Shortcuts for selecting either text or blocks.' ),
	shortcuts: [
		{
			key: displayShortcut.primary( 'a' ),
			description: __( 'Select all.' ),
		},
		{
			key: 'escape',
			description: __( 'Clear selection.' ),
		},
	],
};

const blockShortcuts = {
	title: __( 'Block shortcuts' ),
	description: __( 'Common shortcuts for use while editing blocks.' ),
	shortcuts: [
		{
			key: displayShortcut.primary( 'del' ),
			description: __( 'Delete the select block(s).' ),
		},
		{
			key: displayShortcut.primary( 'd' ),
			description: __( 'Duplicate the select block(s).' ),
		},
	],
};

const slashInserterShortcuts = {
	title: __( 'Slash inserter' ),
	description: __( 'When adding a new block using the keyboard, use the slash inserter to quickly change the type of block.' ),
	shortcuts: [
		{
			key: '/',
			description: __( 'Search for and change the type of block.' ),
		},
	],
};

const textFormattingShortcuts = {
	title: __( 'Text formatting' ),
	description: __( 'Change the appearance of text.' ),
	shortcuts: [
		{
			key: displayShortcut.primary( 'b' ),
			description: __( 'Make the selected text bold.' ),
		},
		{
			key: displayShortcut.primary( 'i' ),
			description: __( 'Make the selected text italic.' ),
		},
		{
			key: displayShortcut.access( 'd' ),
			description: __( 'Add a strikethrough to the selected text.' ),
		},
		{
			key: displayShortcut.primary( 'k' ),
			description: __( 'Convert the selected text into a link' ),
		},
	],
};

export {
	globalShortcuts,
	selectionShortcuts,
	blockShortcuts,
	slashInserterShortcuts,
	textFormattingShortcuts,
};
