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
		// When the record is unavailable, calling getEditedEntityRecord triggers a http
		// request via it's related resolver. Let's return nothing until getNavigationPost
		// resolver marks the record as resolved.
		if ( ! hasResolvedNavigationPost( state, menuId ) ) {
			return null;
		}
		return select( 'core' ).getEditedEntityRecord(
			KIND,
			POST_TYPE,
			buildNavigationPostId( menuId )
		);
	}
);

export const hasResolvedNavigationPost = createRegistrySelector(
	( select ) => ( state, menuId ) => {
		return select( 'core' ).hasFinishedResolution( 'getEntityRecord', [
			KIND,
			POST_TYPE,
			buildNavigationPostId( menuId ),
		] );
	}
);

export const getMenuItemForClientId = createRegistrySelector(
	( select ) => ( state, postId, clientId ) => {
		const mapping = invert( state.mapping[ postId ] );
		return select( 'core' ).getMenuItem( mapping[ clientId ] );
	}
);
