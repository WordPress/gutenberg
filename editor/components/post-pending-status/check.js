/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { isCurrentPostPublished, getCurrentPostType } from '../../store/selectors';

export function PostPendingStatusCheck( { isPublished, children, user } ) {
	const userCanPublishPosts = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );

	if ( isPublished || ! userCanPublishPosts ) {
		return null;
	}

	return children;
}

const applyConnect = connect(
	( state ) => ( {
		isPublished: isCurrentPostPublished( state ),
		postType: getCurrentPostType( state ),
	} ),
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postType } = props;

	return {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	};
} );

export default compose(
	applyConnect,
	applyWithAPIData
)( PostPendingStatusCheck );
