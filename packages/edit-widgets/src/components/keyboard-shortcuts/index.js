/**
 * External dependencies
 */
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editWidgetsStore } from '../../store';

let selectedClientId;

function KeyboardShortcuts() {
	const { redo, undo } = useDispatch( 'core' );
	const { saveEditedWidgetAreas } = useDispatch( editWidgetsStore );

	// Shortcuts Logic
	const { rootBlocksClientIds } = useSelect( ( select ) => {
		const {
			getBlockOrder,
			getBlockParentsByBlockName,
			getSelectedBlockClientId,
		} = select( blockEditorStore );
		const newSelectedClientId = getSelectedBlockClientId();
		if ( newSelectedClientId && newSelectedClientId !== selectedClientId ) {
			selectedClientId = newSelectedClientId;
		}
		const [ selectedParentClientId ] = getBlockParentsByBlockName(
			selectedClientId,
			'core/widget-area'
		);
		return {
			rootBlocksClientIds: getBlockOrder( selectedParentClientId ),
		};
	}, [] );
	const { multiSelect } = useDispatch( blockEditorStore );

	useShortcut(
		'core/edit-widgets/undo',
		( event ) => {
			undo();
			event.preventDefault();
		},
		{ bindGlobal: true }
	);

	useShortcut(
		'core/edit-widgets/redo',
		( event ) => {
			redo();
			event.preventDefault();
		},
		{ bindGlobal: true }
	);

	useShortcut(
		'core/edit-widgets/save',
		( event ) => {
			event.preventDefault();
			saveEditedWidgetAreas();
		},
		{ bindGlobal: true }
	);

	useShortcut(
		'core/edit-widgets/select-all',
		useCallback(
			( event ) => {
				event.preventDefault();
				multiSelect(
					first( rootBlocksClientIds ),
					last( rootBlocksClientIds )
				);
			},
			[ rootBlocksClientIds, multiSelect ]
		)
	);

	return null;
}

function KeyboardShortcutsRegister() {
	// Registering the shortcuts
	const { registerShortcut, unregisterShortcut } = useDispatch(
		keyboardShortcutsStore
	);

	useEffect( () => {
		unregisterShortcut( 'core/block-editor/select-all' );

		registerShortcut( {
			name: 'core/edit-widgets/undo',
			category: 'global',
			description: __( 'Undo your last changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/edit-widgets/redo',
			category: 'global',
			description: __( 'Redo your last undo.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/edit-widgets/save',
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );

		registerShortcut( {
			name: 'core/edit-widgets/select-all',
			category: 'selection',
			description: __(
				'Select all text when typing. Press again to select all blocks.'
			),
			keyCombination: {
				modifier: 'primary',
				character: 'a',
			},
		} );
	}, [ registerShortcut ] );

	return null;
}

KeyboardShortcuts.Register = KeyboardShortcutsRegister;
export default KeyboardShortcuts;
