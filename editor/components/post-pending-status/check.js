/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

export function PostPendingStatusCheck( { isPublished, children, user } ) {
	const userCanPublishPosts = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );

	if ( isPublished || ! userCanPublishPosts ) {
		return null;
	}

	return children;
}

export default compose(
	withSelect( ( select ) => {
		const { isCurrentPostPublished, getCurrentPostType } = select( 'core/editor' );
		return {
			isPublished: isCurrentPostPublished(),
			postType: getCurrentPostType(),
		};
	} ),
	withAPIData( ( props ) => {
		const { postType } = props;

		return {
			user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
		};
	} )
)( PostPendingStatusCheck );
