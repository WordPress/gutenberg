/**
 * External dependencies
 */
import { flowRight, filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData, withInstanceId } from '@wordpress/components';

export function PostAuthorCheck( { user, users, children } ) {
	const authors = filter( users.data, ( { capabilities } ) => capabilities.level_1 );
	if ( ! user.data || ! user.data.capabilities.publish_posts || authors.length < 2 ) {
		return null;
	}

	return children;
}

const applyWithAPIData = withAPIData( () => {
	return {
		users: '/wp/v2/users?context=edit&per_page=100',
		user: '/wp/v2/users/me?context=edit',
	};
} );

export default flowRight( [
	applyWithAPIData,
	withInstanceId,
] )( PostAuthorCheck );
