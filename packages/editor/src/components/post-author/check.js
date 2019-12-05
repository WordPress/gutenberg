/**
 * WordPress dependencies
 */
import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

export function PostAuthorCheck( { hasAssignAuthorAction, authors, children } ) {
	if ( ! hasAssignAuthorAction || authors.length < 2 ) {
		return null;
	}

	return <PostTypeSupportCheck supportKeys="author">{ children }</PostTypeSupportCheck>;
}

export default compose( [
	withSelect( ( select ) => {
		const postId = select( 'core/editor' ).getCurrentPostId();
		return {
			hasAssignAuthorAction: select( 'core' ).canUser( 'assign-author', 'posts', postId ),
			postType: select( 'core/editor' ).getCurrentPostType(),
			authors: select( 'core' ).getAuthors(),
		};
	} ),
	withInstanceId,
] )( PostAuthorCheck );
