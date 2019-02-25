/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

function PostFormatCheck( { disablePostFormats, ...props } ) {
	return ! disablePostFormats &&
		<PostTypeSupportCheck { ...props } supportKeys="post-formats" />;
}

export default withSelect(
	( select ) => {
		// This setting should not live in the block-editor's store.
		const editorSettings = select( 'core/block-editor' ).getEditorSettings();
		return {
			disablePostFormats: editorSettings.disablePostFormats,
		};
	}
)( PostFormatCheck );

