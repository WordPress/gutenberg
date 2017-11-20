/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getCurrentPostType } from '../../state/selectors';

export function PostStickyCheck( { postType, children, user } ) {
	if (
		postType !== 'post' ||
		! user.data ||
		! user.data.capabilities.publish_posts ||
		! user.data.capabilities.edit_others_posts
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
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} );

export default flowRight( [
	applyConnect,
	applyWithAPIData,
] )( PostStickyCheck );
