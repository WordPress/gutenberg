/**
 * WordPress dependencies
 */
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

/**
 * Register the save keyboard shortcut in view mode.
 *
 * @return {null} Returns null.
 */
function KeyboardShortcutsGlobal() {
	const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } =
		useSelect( coreStore );
	const { hasNonPostEntityChanges, isPostSavingLocked } =
		useSelect( editorStore );
	const { savePost } = useDispatch( editorStore );
	const { setIsSaveViewOpened } = useDispatch( editSiteStore );

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

export default KeyboardShortcutsGlobal;
