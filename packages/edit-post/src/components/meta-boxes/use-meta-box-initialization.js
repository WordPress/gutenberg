import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Initializes WordPress `postboxes` script and the logic for saving meta boxes.
 *
 * @param { boolean } enabled
 */
export const useMetaBoxInitialization = ( enabled ) => {
	const { isEnabledAndEditorReady, hasActiveMetaBoxes } = useSelect(
		( select ) => {
			const { __unstableIsEditorReady } = unlock( select( editorStore ) );
			return {
				isEnabledAndEditorReady: enabled && __unstableIsEditorReady(),
				hasActiveMetaBoxes:
					enabled && select( editPostStore ).hasMetaBoxes(),
			};
		},
		[ enabled ]
	);
	const { updateEditorSettings } = useDispatch( editorStore );
	const { initializeMetaBoxes } = useDispatch( editPostStore );

	// The effect has to rerun when the editor is ready because initializeMetaBoxes
	// will noop until then.
	useEffect( () => {
		if ( isEnabledAndEditorReady ) {
			initializeMetaBoxes();

			// Classic meta box values are saved through a separate
			// admin-ajax submission that the in-editor revisions restore
			// does not drive, so visual revisions would silently leave
			// them untouched. Fall back to the classic revision.php
			// admin screen instead.
			if ( hasActiveMetaBoxes ) {
				updateEditorSettings( { disableVisualRevisions: true } );
			}
		}
	}, [
		isEnabledAndEditorReady,
		initializeMetaBoxes,
		hasActiveMetaBoxes,
		updateEditorSettings,
	] );
};
