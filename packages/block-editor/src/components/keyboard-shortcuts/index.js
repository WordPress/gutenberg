/**
 * External dependencies
 */
import { first, last } from 'lodash';
/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function KeyboardShortcuts() {
	// Shortcuts Logic
	const { clientIds, rootClientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientIds, getBlockRootClientId } = select(
			blockEditorStore
		);
		const selectedClientIds = getSelectedBlockClientIds();
		const [ firstClientId ] = selectedClientIds;
		return {
			clientIds: selectedClientIds,
			rootClientId: getBlockRootClientId( firstClientId ),
		};
	}, [] );

	const {
		duplicateBlocks,
		removeBlocks,
		insertAfterBlock,
		insertBeforeBlock,
		clearSelectedBlock,
		moveBlocksUp,
		moveBlocksDown,
	} = useDispatch( blockEditorStore );

	// Moves selected block/blocks up
	useShortcut(
		'core/block-editor/move-up',
		useCallback(
			( event ) => {
				event.preventDefault();
				moveBlocksUp( clientIds, rootClientId );
			},
			[ clientIds, moveBlocksUp ]
		),
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	// Moves selected block/blocks up
	useShortcut(
		'core/block-editor/move-down',
		useCallback(
			( event ) => {
				event.preventDefault();
				moveBlocksDown( clientIds, rootClientId );
			},
			[ clientIds, moveBlocksDown ]
		),
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	// Prevents bookmark all Tabs shortcut in Chrome when devtools are closed.
	// Prevents reposition Chrome devtools pane shortcut when devtools are open.
	useShortcut(
		'core/block-editor/duplicate',
		useCallback(
			( event ) => {
				event.preventDefault();
				duplicateBlocks( clientIds );
			},
			[ clientIds, duplicateBlocks ]
		),
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	// Does not clash with any known browser/native shortcuts, but preventDefault
	// is used to prevent any obscure unknown shortcuts from triggering.
	useShortcut(
		'core/block-editor/remove',
		useCallback(
			( event ) => {
				event.preventDefault();
				removeBlocks( clientIds );
			},
			[ clientIds, removeBlocks ]
		),
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	// Does not clash with any known browser/native shortcuts, but preventDefault
	// is used to prevent any obscure unknown shortcuts from triggering.
	useShortcut(
		'core/block-editor/insert-after',
		useCallback(
			( event ) => {
				event.preventDefault();
				insertAfterBlock( last( clientIds ) );
			},
			[ clientIds, insertAfterBlock ]
		),
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	// Prevent 'view recently closed tabs' in Opera using preventDefault.
	useShortcut(
		'core/block-editor/insert-before',
		useCallback(
			( event ) => {
				event.preventDefault();
				insertBeforeBlock( first( clientIds ) );
			},
			[ clientIds, insertBeforeBlock ]
		),
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	useShortcut(
		'core/block-editor/delete-multi-selection',
		useCallback(
			( event ) => {
				event.preventDefault();
				removeBlocks( clientIds );
			},
			[ clientIds, removeBlocks ]
		),
		{ isDisabled: clientIds.length < 2 }
	);

	useShortcut(
		'core/block-editor/unselect',
		useCallback(
			( event ) => {
				event.preventDefault();
				clearSelectedBlock();
				event.target.ownerDocument.defaultView
					.getSelection()
					.removeAllRanges();
			},
			[ clientIds, clearSelectedBlock ]
		),
		{ isDisabled: clientIds.length < 2 }
	);

	return null;
}

function KeyboardShortcutsRegister() {
	// Registering the shortcuts
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	useEffect( () => {
		registerShortcut( {
			name: 'core/block-editor/duplicate',
			category: 'block',
			description: __( 'Duplicate the selected block(s).' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: 'd',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/remove',
			category: 'block',
			description: __( 'Remove the selected block(s).' ),
			keyCombination: {
				modifier: 'access',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/insert-before',
			category: 'block',
			description: __(
				'Insert a new block before the selected block(s).'
			),
			keyCombination: {
				modifier: 'primaryAlt',
				character: 't',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/insert-after',
			category: 'block',
			description: __(
				'Insert a new block after the selected block(s).'
			),
			keyCombination: {
				modifier: 'primaryAlt',
				character: 'y',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/delete-multi-selection',
			category: 'block',
			description: __( 'Remove multiple selected blocks.' ),
			keyCombination: {
				character: 'del',
			},
			aliases: [
				{
					character: 'backspace',
				},
			],
		} );

		registerShortcut( {
			name: 'core/block-editor/select-all',
			category: 'selection',
			description: __(
				'Select all text when typing. Press again to select all blocks.'
			),
			keyCombination: {
				modifier: 'primary',
				character: 'a',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/unselect',
			category: 'selection',
			description: __( 'Clear selection.' ),
			keyCombination: {
				character: 'escape',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/focus-toolbar',
			category: 'global',
			description: __( 'Navigate to the nearest toolbar.' ),
			keyCombination: {
				modifier: 'alt',
				character: 'F10',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/move-up',
			category: 'block',
			description: __( 'Move the selected block(s) up.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 't',
			},
		} );

		registerShortcut( {
			name: 'core/block-editor/move-down',
			category: 'block',
			description: __( 'Move the selected block(s) down.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'y',
			},
		} );
	}, [ registerShortcut ] );

	return null;
}

KeyboardShortcuts.Register = KeyboardShortcutsRegister;

export default KeyboardShortcuts;
