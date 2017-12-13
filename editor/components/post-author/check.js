/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData, withInstanceId } from '@wordpress/components';
import { compose } from '@wordpress/element';

export function PostAuthorCheck( { user, users, children } ) {
	const authors = filter( users.data, ( { capabilities } ) => capabilities.level_1 );
	const userCaps = user.data ?
		{ ...user.data.capabilities, ...user.data.post_type_capabilities } :
		{ publish_posts: false };

	if ( ! userCaps.publish_posts || authors.length < 2 ) {
		return null;
	}

	return children;
}

const applyWithAPIData = withAPIData( () => {
	const postTypeSlug = window._wpGutenbergPost.type;

	return {
		users: '/wp/v2/users?context=edit&per_page=100',
		user: `/wp/v2/users/me?post_type=${ postTypeSlug }&context=edit`,
	};
} );

export default compose( [
	applyWithAPIData,
	withInstanceId,
] )( PostAuthorCheck );
