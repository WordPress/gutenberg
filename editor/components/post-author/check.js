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

export function PostAuthorCheck( { canPublishPosts, users, children } ) {
	const authors = filter( users.data, ( { capabilities } ) => get( capabilities, [ 'level_1' ], false ) );

	if ( ! canPublishPosts || authors.length < 2 ) {
		return null;
	}

	return <PostTypeSupportCheck supportKeys="author">{ children }</PostTypeSupportCheck>;
}

const applyWithSelect = withSelect(
	( select ) => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getUserPostTypeCapability } = select( 'core' );
		return {
			canPublishPosts: getUserPostTypeCapability( getEditedPostAttribute( 'type' ), 'publish_posts' ),
		};
	},
);

const applyWithAPIData = withAPIData( () => ( {
	users: '/wp/v2/users?context=edit&per_page=100',
} ) );

export default compose( [
	applyWithSelect,
	applyWithAPIData,
	withInstanceId,
] )( PostAuthorCheck );
