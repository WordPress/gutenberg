/**
 * WordPress dependencies
 */
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
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
	const { isEnabledAndEditorReady, isCollaborationEnabled, hasMetaBoxes } =
		useSelect(
			( select ) => ( {
				isEnabledAndEditorReady:
					enabled && select( editorStore ).__unstableIsEditorReady(),
				isCollaborationEnabled:
					select(
						editorStore
					).isCollaborationEnabledForCurrentPost(),
				hasMetaBoxes: enabled
					? select( editPostStore ).hasMetaBoxes()
					: false,
			} ),
			[ enabled ]
		);

	// Read allMetaBoxes via the registry instead of useSelect to avoid
	// referential instability from getAllMetaBoxes() returning a new array.
	const registry = useRegistry();
	const { setCollaborationSupported } = unlock( useDispatch( coreStore ) );

	const { initializeMetaBoxes } = useDispatch( editPostStore );

	// The effect has to rerun when the editor is ready because initializeMetaBoxes
	// will noop until then.
	useEffect( () => {
		if ( isEnabledAndEditorReady ) {
			initializeMetaBoxes();

			// Disable real-time collaboration when legacy meta boxes are detected.
			// Meta boxes marked with __rtc_compatible_meta_box on the server
			// will have rtcCompatible set to true in the store.
			if ( isCollaborationEnabled ) {
				const allMetaBoxes = registry
					.select( editPostStore )
					.getAllMetaBoxes();

				const hasIncompatibleMetaBoxes = allMetaBoxes.some(
					( metaBox ) => ! metaBox.rtcCompatible
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
		registry,
	] );
};
