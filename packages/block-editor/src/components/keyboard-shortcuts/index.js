/**
 * External dependencies
 */
import { first, last } from 'lodash';
/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
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
	const { clientIds, rootBlocksClientIds, rootClientId } = useSelect(
		( select ) => {
			const {
				getSelectedBlockClientIds,
				getBlockOrder,
				getBlockRootClientId,
			} = select( blockEditorStore );
			const selectedClientIds = getSelectedBlockClientIds();
			const [ firstClientId ] = selectedClientIds;
			return {
				clientIds: selectedClientIds,
				rootBlocksClientIds: getBlockOrder(),
				rootClientId: getBlockRootClientId( firstClientId ),
			};
		},
		[]
	);

	const {
		duplicateBlocks,
		removeBlocks,
		insertAfterBlock,
		insertBeforeBlock,
		multiSelect,
		clearSelectedBlock,
		moveBlocksUp,
		moveBlocksDown,
	} = useDispatch( blockEditorStore );

	// Moves selected block/blocks up
	useShortcut(
		'core/block-editor/move-up',
		( event ) => {
			event.preventDefault();
			moveBlocksUp( clientIds, rootClientId );
		},
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	// Moves selected block/blocks up
	useShortcut(
		'core/block-editor/move-down',
		( event ) => {
			event.preventDefault();
			moveBlocksDown( clientIds, rootClientId );
		},
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	// Prevents bookmark all Tabs shortcut in Chrome when devtools are closed.
	// Prevents reposition Chrome devtools pane shortcut when devtools are open.
	useShortcut(
		'core/block-editor/duplicate',
		( event ) => {
			event.preventDefault();
			duplicateBlocks( clientIds );
		},
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	// Does not clash with any known browser/native shortcuts, but preventDefault
	// is used to prevent any obscure unknown shortcuts from triggering.
	useShortcut(
		'core/block-editor/remove',
		( event ) => {
			event.preventDefault();
			removeBlocks( clientIds );
		},
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	// Does not clash with any known browser/native shortcuts, but preventDefault
	// is used to prevent any obscure unknown shortcuts from triggering.
	useShortcut(
		'core/block-editor/insert-after',
		( event ) => {
			event.preventDefault();
			insertAfterBlock( last( clientIds ) );
		},
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	// Prevent 'view recently closed tabs' in Opera using preventDefault.
	useShortcut(
		'core/block-editor/insert-before',
		( event ) => {
			event.preventDefault();
			insertBeforeBlock( first( clientIds ) );
		},
		{ bindGlobal: true, isDisabled: clientIds.length === 0 }
	);

	useShortcut(
		'core/block-editor/delete-multi-selection',
		( event ) => {
			event.preventDefault();
			removeBlocks( clientIds );
		},
		{ isDisabled: clientIds.length < 2 }
	);

	useShortcut( 'core/block-editor/select-all', ( event ) => {
		event.preventDefault();
		multiSelect(
			first( rootBlocksClientIds ),
			last( rootBlocksClientIds )
		);
	} );

	useShortcut(
		'core/block-editor/unselect',
		( event ) => {
			event.preventDefault();
			clearSelectedBlock();
			event.target.ownerDocument.defaultView
				.getSelection()
				.removeAllRanges();
		},
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
