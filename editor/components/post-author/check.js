/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData, withInstanceId } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../post-type-support-check';
import { getCurrentPostType } from '../../store/selectors';

export function PostAuthorCheck( { user, users, children } ) {
	const authors = filter( users.data, ( { capabilities } ) => capabilities.level_1 );
	const userCanPublishPosts = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );

	if ( ! userCanPublishPosts || authors.length < 2 ) {
		return null;
	}

	return <PostTypeSupportCheck supportKeys="author">{ children }</PostTypeSupportCheck>;
}

const applyConnect = connect(
	( state ) => {
		return {
			postType: getCurrentPostType( state ),
		};
	},
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postType } = props;

	return {
		users: '/wp/v2/users?context=edit&per_page=100',
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
	withInstanceId,
] )( PostAuthorCheck );
