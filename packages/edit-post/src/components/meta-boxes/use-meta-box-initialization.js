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
		hasIncompatibleMetaBoxes,
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
					? select( editPostStore )
							.getAllMetaBoxes()
							.some( ( metaBox ) => ! metaBox.__rtc_compatible )
					: false,
			};
		},
		[ enabled ]
	);
	const { setCollaborationSupported } = unlock( useDispatch( coreStore ) );
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
		}
	}, [
		isEnabledAndEditorReady,
		initializeMetaBoxes,
		isCollaborationEnabled,
		setCollaborationSupported,
		hasIncompatibleMetaBoxes,
	] );
};
