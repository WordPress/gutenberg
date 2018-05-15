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
	( select ) => ( {
		disablePostFormats: select( 'core/editor' ).getEditorSettings(),
	} )
)( PostFormatCheck );

