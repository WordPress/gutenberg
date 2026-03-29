/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as keyboardShortcutsStore,
	// @ts-expect-error - No types available yet.
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

const shortcutName = 'core/boot/save';

/**
 * Register the save keyboard shortcut in view mode.
 *
 * @param param0               Object containing the function to open the save panel.
 * @param param0.openSavePanel Function to open the save panel.
 */
export default function useSaveShortcut( {
	openSavePanel,
}: {
	openSavePanel: () => void;
} ) {
	const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } =
		useSelect( coreStore );
	const { hasNonPostEntityChanges, isPostSavingLocked } =
		useSelect( editorStore );
	const { savePost } = useDispatch( editorStore );
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

	useShortcut( shortcutName, ( event: Event ) => {
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
			openSavePanel();
		} else if ( ! isPostSavingLocked() ) {
			savePost();
		}
	} );
}
