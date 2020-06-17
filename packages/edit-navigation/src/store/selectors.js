/**
 * External dependencies
 */
import { invert } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { KIND, POST_TYPE, buildNavigationPostId } from './utils';

export const getNavigationPost = createRegistrySelector(
	( select ) => ( state, menuId ) => {
		return select( 'core' ).getEditedEntityRecord(
			KIND,
			POST_TYPE,
			buildNavigationPostId( menuId )
		);
	}
);

export const isResolvingNavigationPost = ( state, menuId ) => {
	const post = getNavigationPost( state, menuId );
	return ! post || post.meta.isResolving;
};

export const getMenuItemForClientId = createRegistrySelector(
	( select ) => ( state, postId, clientId ) => {
		const mapping = invert( state.mapping[ postId ] );
		return select( 'core' ).getMenuItem( mapping[ clientId ] );
	}
);
