/**
 * WordPress dependencies
 */
import { displayShortcutList } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

const {
	// Cmd+<key> on a mac, Ctrl+<key> elsewhere
	primary,
	// Shift+Cmd+<key> on a mac, Ctrl+Shift+<key> elsewhere
	primaryShift,
	// Shift+Alt+Cmd+<key> on a mac, Ctrl+Shift+Akt+<key> elsewhere
	secondary,
	// Ctrl+Alt+<key> on a mac, Shift+Alt+<key> elsewhere
	access,
	ctrl,
	ctrlShift,
	shiftAlt,
} = displayShortcutList;

const globalShortcuts = {
	title: __( 'Global shortcuts' ),
	shortcuts: [
		{
			keyCombination: access( 'h' ),
			description: __( 'Display this help.' ),
		},
		{
			keyCombination: primary( 's' ),
			description: __( 'Save your changes.' ),
		},
		{
			keyCombination: primary( 'z' ),
			description: __( 'Undo your last changes.' ),
		},
		{
			keyCombination: primaryShift( 'z' ),
			description: __( 'Redo your last undo.' ),
		},
		{
			keyCombination: primaryShift( ',' ),
			description: __( 'Show or hide the settings sidebar.' ),
		},
		{
			keyCombination: ctrl( '`' ),
			description: __( 'Navigate to a the next part of the editor.' ),
		},
		{
			keyCombination: ctrlShift( '`' ),
			description: __( 'Navigate to the previous part of the editor.' ),
		},
		{
			keyCombination: shiftAlt( 'n' ),
			description: __( 'Navigate to a the next part of the editor (alternative).' ),
		},
		{
			keyCombination: shiftAlt( 'p' ),
			description: __( 'Navigate to the previous part of the editor (alternative).' ),
		},
		{
			keyCombination: secondary( 'm' ),
			description: __( 'Switch between Visual Editor and Code Editor.' ),
		},
	],
};

const selectionShortcuts = {
	title: __( 'Selection shortcuts' ),
	shortcuts: [
		{
			keyCombination: primary( 'a' ),
			description: __( 'Select all text when typing. Press again to select all blocks.' ),
		},
		{
			keyCombination: 'Esc',
			description: __( 'Clear selection.' ),
		},
	],
};

const blockShortcuts = {
	title: __( 'Block shortcuts' ),
	shortcuts: [
		{
			keyCombination: primaryShift( 'd' ),
			description: __( 'Duplicate the selected block(s).' ),
		},
		{
			keyCombination: '/',
			description: __( `Change the block type after adding a new paragraph.` ),
		},
	],
};

const textFormattingShortcuts = {
	title: __( 'Text formatting' ),
	shortcuts: [
		{
			keyCombination: primary( 'b' ),
			description: __( 'Make the selected text bold.' ),
		},
		{
			keyCombination: primary( 'i' ),
			description: __( 'Make the selected text italic.' ),
		},
		{
			keyCombination: primary( 'u' ),
			description: __( 'Underline the selected text.' ),
		},
		{
			keyCombination: primary( 'k' ),
			description: __( 'Convert the selected text into a link.' ),
		},
		{
			keyCombination: access( 's' ),
			description: __( 'Remove a link.' ),
		},
		{
			keyCombination: access( 'd' ),
			description: __( 'Add a strikethrough to the selected text.' ),
		},
		{
			keyCombination: access( 'x' ),
			description: __( 'Display the selected text in a monospaced font.' ),
		},
	],
};

export default [
	globalShortcuts,
	selectionShortcuts,
	blockShortcuts,
	textFormattingShortcuts,
];
