/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

/**
 * Initializes WordPress `postboxes` script and the logic for saving meta boxes.
 *
 * @param { boolean } enabled
 */
export const useMetaBoxInitialization = ( enabled ) => {
	const isEnabledAndEditorReady = useSelect(
		( select ) =>
			enabled && select( editorStore ).__unstableIsEditorReady(),
		[ enabled ]
	);
	const { initializeMetaBoxes } = useDispatch( editPostStore );
	// The effect has to rerun when the editor is ready because initializeMetaBoxes
	// will noop until then.
	useEffect( () => {
		if ( isEnabledAndEditorReady ) {
			initializeMetaBoxes();
		}
	}, [ isEnabledAndEditorReady, initializeMetaBoxes ] );
};
