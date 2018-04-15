/**
 * WordPress dependencies
 */
import { withEditorSettings } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

function PostFormatCheck( { disablePostFormats, ...props } ) {
	return ! disablePostFormats &&
		<PostTypeSupportCheck { ...props } supportKeys="post-formats" />;
}

export default withEditorSettings(
	( { disablePostFormats } ) => ( { disablePostFormats } )
)( PostFormatCheck );

