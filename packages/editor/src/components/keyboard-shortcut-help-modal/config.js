/**
 * WordPress dependencies
 */
import { displayShortcut } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

const globalShortcuts = {
	title: __( 'Global shortcuts' ),
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
	shortcuts: [
		{
			key: displayShortcut.primary( 'a' ),
			description: __( 'Select all.' ),
		},
		{
			key: 'Esc',
			description: __( 'Clear selection.' ),
		},
	],
};

const blockShortcuts = {
	title: __( 'Block shortcuts' ),
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
	shortcuts: [
		{
			key: '/',
			description: __( 'Search for and change the type of block.' ),
		},
	],
};

const textFormattingShortcuts = {
	title: __( 'Text formatting' ),
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
			key: displayShortcut.primary( 'u' ),
			description: __( 'Underline the selected text.' ),
		},
		{
			key: displayShortcut.access( 'x' ),
			description: __( 'Display the selected text in a monospaced font suitable for code.' ),
		},
		{
			key: displayShortcut.primary( 'k' ),
			description: __( 'Convert the selected text into a link' ),
		},
		{
			key: displayShortcut.access( 's' ),
			description: __( 'Remove a link' ),
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
