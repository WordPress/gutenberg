/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

export default function PostExcerptCheck( props ) {
	deprecated( 'PostExcerptCheck', {
		since: '6.1',
		alternative: '<PostTypeSupportCheck supportKeys="excerpt">',
	} );
	return <PostTypeSupportCheck { ...props } supportKeys="excerpt" />;
}
