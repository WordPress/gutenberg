/**
 * WordPress dependencies
 */
import { KeyboardShortcuts } from '@wordpress/components';
import { rawShortcut } from '@wordpress/keycodes';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

export function SaveShortcut( { onSave } ) {
	return (
		<KeyboardShortcuts
			bindGlobal
			shortcuts={ {
				[ rawShortcut.primary( 's' ) ]: ( event ) => {
					event.preventDefault();
					onSave();
				},
			} }
		/>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { isEditedPostDirty } = select( 'core/editor' );

		return {
			isDirty: isEditedPostDirty(),
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			savePost,
		} = dispatch( 'core/editor' );

		return {
			onSave() {
				// TODO: This should be handled in the `savePost` effect in
				// considering `isSaveable`. See note on `isEditedPostSaveable`
				// selector about dirtiness and meta-boxes.
				//
				// See: `isEditedPostSaveable`
				const { isEditedPostDirty } = select( 'core/editor' );
				if ( ! isEditedPostDirty() ) {
					return;
				}

				savePost();
			},
		};
	} ),
] )( SaveShortcut );
