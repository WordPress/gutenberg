import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Checks whether any meta box is incompatible with real-time collaboration.
 *
 * Compatibility belongs to the meta box, not to the location it is shown in.
 * The compatibility flag is stored under the location the meta box was
 * registered in. When a user moves the meta box to another location, it is
 * listed a second time under the new location, without the flag. A meta box
 * is therefore compatible when any entry with its id has the flag.
 *
 * @param {Array} metaBoxes Meta boxes from all locations.
 *
 * @return {boolean} Whether at least one meta box is incompatible.
 */
function hasIncompatibleMetaBox( metaBoxes ) {
	const compatibleIds = new Set();

	for ( const metaBox of metaBoxes ) {
		if ( metaBox.__rtc_compatible ) {
			compatibleIds.add( metaBox.id );
		}
	}

	return metaBoxes.some( ( metaBox ) => ! compatibleIds.has( metaBox.id ) );
}

/**
 * Initializes WordPress `postboxes` script and the logic for saving meta boxes.
 *
 * @param { boolean } enabled
 */
export const useMetaBoxInitialization = ( enabled ) => {
	const {
		isEnabledAndEditorReady,
		isCollaborationEnabled,
		hasIncompatibleMetaBoxes,
		hasActiveMetaBoxes,
	} = useSelect(
		( select ) => {
			const {
				__unstableIsEditorReady,
				isCollaborationEnabledForCurrentPost,
			} = unlock( select( editorStore ) );
			return {
				isEnabledAndEditorReady: enabled && __unstableIsEditorReady(),
				isCollaborationEnabled: isCollaborationEnabledForCurrentPost(),
				hasIncompatibleMetaBoxes: enabled
					? hasIncompatibleMetaBox(
							select( editPostStore ).getAllMetaBoxes()
						)
					: false,
				hasActiveMetaBoxes:
					enabled && select( editPostStore ).hasMetaBoxes(),
			};
		},
		[ enabled ]
	);
	const { setCollaborationSupported } = unlock( useDispatch( coreStore ) );
	const { updateEditorSettings } = useDispatch( editorStore );
	const { initializeMetaBoxes } = useDispatch( editPostStore );

	// The effect has to rerun when the editor is ready because initializeMetaBoxes
	// will noop until then.
	useEffect( () => {
		if ( isEnabledAndEditorReady ) {
			initializeMetaBoxes();

			// Disable real-time collaboration when incompatible meta boxes are detected.
			if ( isCollaborationEnabled && hasIncompatibleMetaBoxes ) {
				setCollaborationSupported( false );
			}

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
		isCollaborationEnabled,
		setCollaborationSupported,
		hasIncompatibleMetaBoxes,
		hasActiveMetaBoxes,
		updateEditorSettings,
	] );
};
