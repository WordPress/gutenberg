/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Initializes WordPress `postboxes` script and the logic for saving meta boxes.
 *
 * @param { boolean } enabled
 */
export const useMetaBoxInitialization = ( enabled ) => {
	const {
		isEnabledAndEditorReady,
		isCollaborationEnabled,
		currentPostType,
		currentPostId,
	} = useSelect(
		( select ) => ( {
			isEnabledAndEditorReady:
				enabled && select( editorStore ).__unstableIsEditorReady(),
			isCollaborationEnabled:
				select( editorStore ).isCollaborationEnabledForCurrentPost(),
			currentPostType: select( editorStore ).getCurrentPostType(),
			currentPostId: select( editorStore ).getCurrentPostId(),
		} ),
		[ enabled ]
	);
	const { disableCollaboration } = unlock( useDispatch( coreStore ) );

	const { initializeMetaBoxes } = useDispatch( editPostStore );
	// The effect has to rerun when the editor is ready because initializeMetaBoxes
	// will noop until then.
	useEffect( () => {
		if ( isEnabledAndEditorReady ) {
			initializeMetaBoxes();

			// Disable real-time collaboration when non-compatible meta boxes are detected.
			if ( isCollaborationEnabled ) {
				disableCollaboration();
			}
		}
	}, [
		isEnabledAndEditorReady,
		initializeMetaBoxes,
		isCollaborationEnabled,
		disableCollaboration,
		currentPostType,
		currentPostId,
	] );
};
