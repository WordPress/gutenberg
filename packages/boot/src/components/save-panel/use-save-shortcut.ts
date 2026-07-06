/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

const shortcutName = 'core/boot/save';

// The editor store is provided by the classic @wordpress/editor script, which is
// loaded lazily (via the canvas / lazy-editor). Referencing it by name here — rather
// than importing the store descriptor — keeps @wordpress/editor out of boot's eager
// dependency graph so the editor only loads when there is something to edit.
const EDITOR_STORE_NAME = 'core/editor';

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
	const registry = useRegistry();
	const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } =
		useSelect( coreStore );
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
		// The editor store is only registered once the editor has been loaded.
		// When it isn't present there is nothing post-related to save, so fall
		// back to the entity-only save panel.
		const editorSelectors = registry.select( EDITOR_STORE_NAME );
		if ( ! editorSelectors || editorSelectors.hasNonPostEntityChanges() ) {
			openSavePanel();
		} else if ( ! editorSelectors.isPostSavingLocked() ) {
			registry.dispatch( EDITOR_STORE_NAME ).savePost();
		}
	} );
}
