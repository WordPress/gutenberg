/**
 * External dependencies
 */
import { castArray, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData, withInstanceId } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';

export function PostAuthorCheck( { user, authors, children } ) {
	const userCanPublishPosts = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );
	authors = castArray( authors );

	if ( ! userCanPublishPosts || authors.length < 2 ) {
		return null;
	}

	return <PostTypeSupportCheck supportKeys="author">{ children }</PostTypeSupportCheck>;
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postType: select( 'core/editor' ).getCurrentPostType(),
			authors: select( 'core' ).getAuthors(),
		};
	} ),
	withAPIData( ( props ) => {
		const { postType, authors } = props;

		return {
			authors,
			user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
		};
	} ),
	withInstanceId,
] )( PostAuthorCheck );
