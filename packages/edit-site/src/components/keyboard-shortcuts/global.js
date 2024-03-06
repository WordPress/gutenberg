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

function KeyboardShortcutsGlobal() {
	const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } =
		useSelect( coreStore );
	const { hasNonPostEntityChanges } = useSelect( editorStore );
	const { setIsSaveViewOpened } = useDispatch( editSiteStore );

	useShortcut( 'core/edit-site/save', ( event ) => {
		event.preventDefault();

		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		const hasDirtyEntities = !! dirtyEntityRecords.length;
		const isSaving = dirtyEntityRecords.some( ( record ) =>
			isSavingEntityRecord( record.kind, record.name, record.key )
		);
		const _hasNonPostEntityChanges = hasNonPostEntityChanges();
		if ( ! hasDirtyEntities || ! _hasNonPostEntityChanges || isSaving ) {
			return;
		}
		// At this point, we know that there are dirty entities, other than
		// the edited post, and we're not in the process of saving, so open
		// save view.
		setIsSaveViewOpened( true );
	} );

	return null;
}

export default KeyboardShortcutsGlobal;
