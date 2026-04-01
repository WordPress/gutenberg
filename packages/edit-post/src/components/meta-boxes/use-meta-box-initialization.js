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
		hasMetaBoxes,
		allMetaBoxes,
		rtcCompatibleIds,
	} = useSelect(
		( select ) => ( {
			isEnabledAndEditorReady:
				enabled && select( editorStore ).__unstableIsEditorReady(),
			isCollaborationEnabled:
				select( editorStore ).isCollaborationEnabledForCurrentPost(),
			hasMetaBoxes: enabled
				? select( editPostStore ).hasMetaBoxes()
				: false,
			allMetaBoxes: enabled
				? select( editPostStore ).getAllMetaBoxes()
				: [],
			rtcCompatibleIds:
				select( editPostStore ).getRtcCompatibleMetaBoxIds(),
		} ),
		[ enabled ]
	);
	const { setCollaborationSupported } = unlock( useDispatch( coreStore ) );

	const { initializeMetaBoxes } = useDispatch( editPostStore );

	// The effect has to rerun when the editor is ready because initializeMetaBoxes
	// will noop until then.
	useEffect( () => {
		if ( isEnabledAndEditorReady ) {
			initializeMetaBoxes();

			// Disable real-time collaboration when legacy meta boxes are detected.
			// Meta boxes marked with __rtc_compatible_meta_box on the server
			// have their IDs stored via setRtcCompatibleMetaBoxIds().
			if ( isCollaborationEnabled ) {
				const hasIncompatibleMetaBoxes = allMetaBoxes.some(
					( metaBox ) => ! rtcCompatibleIds.includes( metaBox.id )
				);

				if ( hasIncompatibleMetaBoxes ) {
					setCollaborationSupported( false );
				}
			}
		}
	}, [
		isEnabledAndEditorReady,
		initializeMetaBoxes,
		isCollaborationEnabled,
		setCollaborationSupported,
		hasMetaBoxes,
		allMetaBoxes,
		rtcCompatibleIds,
	] );
};
