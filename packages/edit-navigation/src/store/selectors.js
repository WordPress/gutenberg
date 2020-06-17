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

export function getPendingActions( state, menuId ) {
	return state.processing[ menuId ]?.pendingActions || [];
}

export function isProcessingMenuItems( state, menuId ) {
	return state.processing[ menuId ]?.inProgress;
}

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
	( select ) => ( state, post, clientId ) => {
		const mapping = invert( post.meta.menuItemIdToClientId );
		return select( 'core' ).getMenuItem( mapping[ clientId ] );
	}
);
