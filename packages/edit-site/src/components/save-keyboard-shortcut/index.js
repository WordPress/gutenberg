/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

const shortcutName = 'core/edit-site/save';

/**
 * Register the save keyboard shortcut in view mode.
 *
 * @return {null} Returns null.
 */
export default function SaveKeyboardShortcut() {
	const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } =
		useSelect( coreStore );
	const { hasNonPostEntityChanges, isPostSavingLocked } =
		useSelect( editorStore );
	const { savePost } = useDispatch( editorStore );
	const { setIsSaveViewOpened } = useDispatch( editSiteStore );
	const { registerShortcut, unregisterShortcut } = useDispatch(
		keyboardShortcutsStore
	);
	useEffect( () => {
		registerShortcut( {
			name: shortcutName,
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );
		return () => {
			unregisterShortcut( shortcutName );
		};
	}, [ registerShortcut, unregisterShortcut ] );

	useShortcut( 'core/edit-site/save', ( event ) => {
		event.preventDefault();
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		const hasDirtyEntities = !! dirtyEntityRecords.length;
		const isSaving = dirtyEntityRecords.some( ( record ) =>
			isSavingEntityRecord( record.kind, record.name, record.key )
		);
		if ( ! hasDirtyEntities || isSaving ) {
			return;
		}
		if ( hasNonPostEntityChanges() ) {
			setIsSaveViewOpened( true );
		} else if ( ! isPostSavingLocked() ) {
			savePost();
		}
	} );

	return null;
}
