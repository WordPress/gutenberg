/**
 * WordPress dependencies
 */
import { withContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

function PostFormatCheck( { disablePostFormats, ...props } ) {
	return ! disablePostFormats &&
		<PostTypeSupportCheck { ...props } supportKeys="post-formats" />;
}

export default withContext( 'editor' )(
	( { disablePostFormats } ) => ( { disablePostFormats } )
)( PostFormatCheck );

