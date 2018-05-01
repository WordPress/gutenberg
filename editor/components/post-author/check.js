/**
 * External dependencies
 */
import { filter, get } from 'lodash';

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

export function PostAuthorCheck( { user, users, children } ) {
	const authors = filter( users.data, ( { capabilities } ) => get( capabilities, [ 'level_1' ], false ) );
	const userCanPublishPosts = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );

	if ( ! userCanPublishPosts || authors.length < 2 ) {
		return null;
	}

	return <PostTypeSupportCheck supportKeys="author">{ children }</PostTypeSupportCheck>;
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postType: select( 'core/editor' ).getCurrentPostType(),
		};
	} ),
	withAPIData( ( props ) => {
		const { postType } = props;

		return {
			users: '/wp/v2/users?context=edit&per_page=100',
			user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
		};
	} ),
	withInstanceId,
] )( PostAuthorCheck );
