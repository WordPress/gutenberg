/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { SIDEBAR_BLOCK } from '../sidebar/constants';
import { STORE_NAME } from '../../store/constants';

function KeyboardShortcuts( { openEntitiesSavedStates } ) {
	const {
		__experimentalGetDirtyEntityRecords,
		isSavingEntityRecord,
	} = useSelect( coreStore );
	const isListViewOpen = useSelect(
		( select ) => select( editSiteStore ).isListViewOpened(),
		[]
	);
	const isBlockInspectorOpen = useSelect(
		( select ) =>
			select( interfaceStore ).getActiveComplementaryArea(
				editSiteStore.name
			) === SIDEBAR_BLOCK,
		[]
	);
	const { redo, undo } = useDispatch( coreStore );
	const { setIsListViewOpened } = useDispatch( editSiteStore );
	const { enableComplementaryArea, disableComplementaryArea } = useDispatch(
		interfaceStore
	);

	useShortcut( 'core/edit-site/save', ( event ) => {
		event.preventDefault();

		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		const isDirty = !! dirtyEntityRecords.length;
		const isSaving = dirtyEntityRecords.some( ( record ) =>
			isSavingEntityRecord( record.kind, record.name, record.key )
		);

		if ( ! isSaving && isDirty ) {
			openEntitiesSavedStates();
		}
	} );

	useShortcut( 'core/edit-site/undo', ( event ) => {
		undo();
		event.preventDefault();
	} );

	useShortcut( 'core/edit-site/redo', ( event ) => {
		redo();
		event.preventDefault();
	} );

	useShortcut( 'core/edit-site/toggle-list-view', () => {
		setIsListViewOpened( ! isListViewOpen );
	} );

	useShortcut( 'core/edit-site/toggle-block-settings-sidebar', ( event ) => {
		// This shortcut has no known clashes, but use preventDefault to prevent any
		// obscure shortcuts from triggering.
		event.preventDefault();

		if ( isBlockInspectorOpen ) {
			disableComplementaryArea( STORE_NAME );
		} else {
			enableComplementaryArea( STORE_NAME, SIDEBAR_BLOCK );
		}
	} );

	return null;
}

function KeyboardShortcutsRegister() {
	// Registering the shortcuts
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	useEffect( () => {
		registerShortcut( {
			name: 'core/edit-site/save',
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/undo',
			category: 'global',
			description: __( 'Undo your last changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/redo',
			category: 'global',
			description: __( 'Redo your last undo.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/toggle-list-view',
			category: 'global',
			description: __( 'Open the block list view.' ),
			keyCombination: {
				modifier: 'access',
				character: 'o',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/toggle-block-settings-sidebar',
			category: 'global',
			description: __( 'Show or hide the block settings sidebar.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: ',',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/keyboard-shortcuts',
			category: 'main',
			description: __( 'Display these keyboard shortcuts.' ),
			keyCombination: {
				modifier: 'access',
				character: 'h',
			},
		} );

		registerShortcut( {
			name: 'core/edit-site/next-region',
			category: 'global',
			description: __( 'Navigate to the next part of the editor.' ),
			keyCombination: {
				modifier: 'ctrl',
				character: '`',
			},
			aliases: [
				{
					modifier: 'access',
					character: 'n',
				},
			],
		} );

		registerShortcut( {
			name: 'core/edit-site/previous-region',
			category: 'global',
			description: __( 'Navigate to the previous part of the editor.' ),
			keyCombination: {
				modifier: 'ctrlShift',
				character: '`',
			},
			aliases: [
				{
					modifier: 'access',
					character: 'p',
				},
			],
		} );
	}, [ registerShortcut ] );

	return null;
}

KeyboardShortcuts.Register = KeyboardShortcutsRegister;
export default KeyboardShortcuts;
