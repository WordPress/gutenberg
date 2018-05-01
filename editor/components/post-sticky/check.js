/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

export function PostStickyCheck( { post, postType, children } ) {
	if (
		postType !== 'post' ||
		! get( post, [ '_links', 'wp:action-sticky' ], false )
	) {
		return null;
	}

	return children;
}

export default compose( [
	withSelect( ( select ) => {
		return {
			post: select( 'core/editor' ).getCurrentPost(),
			postType: select( 'core/editor' ).getCurrentPostType(),
		};
	} ),
] )( PostStickyCheck );
