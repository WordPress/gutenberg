/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getCurrentPostType } from '../../store/selectors';

export function PostStickyCheck( { postType, children, user } ) {
	const userCaps = user.data ?
		{ ...user.data.capabilities, ...user.data.post_type_capabilities } :
		{ publish_posts: false, edit_others_posts: false };

	if (
		postType !== 'post' ||
		! userCaps.publish_posts ||
		! userCaps.edit_others_posts
	) {
		return null;
	}

	return children;
}

const applyConnect = connect(
	( state ) => {
		return {
			postType: getCurrentPostType( state ),
		};
	},
);

const applyWithAPIData = withAPIData( () => {
	const postTypeSlug = window._wpGutenbergPost.type;

	return {
		user: `/wp/v2/users/me?post_type=${ postTypeSlug }&context=edit`,
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( PostStickyCheck );
