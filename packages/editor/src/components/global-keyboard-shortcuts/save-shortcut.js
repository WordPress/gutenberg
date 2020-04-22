/**
 * WordPress dependencies
 */
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch, useSelect } from '@wordpress/data';

function SaveShortcut() {
	const { savePost } = useDispatch( 'core/editor' );
	const isEditedPostDirty = useSelect(
		( select ) => select( 'core/editor' ).isEditedPostDirty,
		[]
	);

	useShortcut(
		'core/editor/save',
		( event ) => {
			event.preventDefault();

			// TODO: This should be handled in the `savePost` effect in
			// considering `isSaveable`. See note on `isEditedPostSaveable`
			// selector about dirtiness and meta-boxes.
			//
			// See: `isEditedPostSaveable`
			if ( ! isEditedPostDirty() ) {
				return;
			}

			savePost();
		},
		{ bindGlobal: true }
	);

	return null;
}

export default SaveShortcut;
