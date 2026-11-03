import { useEffect } from '@wordpress/element';
import {
	useShortcut,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

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
	const registry = useRegistry();
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
		/*
		 * The editor store is only there once the editor has loaded. It is
		 * looked up by name so that boot does not load the editor for it.
		 * Without an editor, there is no post to save on its own, so every
		 * change goes through the save panel.
		 */
		const editorSelectors = registry.select( 'core/editor' ) as
			| {
					hasNonPostEntityChanges: () => boolean;
					isPostSavingLocked: () => boolean;
			  }
			| undefined;
		if ( ! editorSelectors || editorSelectors.hasNonPostEntityChanges() ) {
			openSavePanel();
		} else if ( ! editorSelectors.isPostSavingLocked() ) {
			registry.dispatch( 'core/editor' ).savePost();
		}
	} );
}
