/**
 * WordPress dependencies
 */
import { createInitialResolutionState } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import {
	addEntities,
	receiveCurrentUser,
	receiveEntityRecords,
	receiveUserPermissions,
} from './actions';
import { postTypeEntitiesFromResponse } from './entities';
import {
	ALLOWED_RESOURCE_ACTIONS,
	getUserPermissionCacheKey,
	getUserPermissionsFromAllowHeader,
} from './utils/user-permissions';

/**
 * Synthesises one or more root-reducer actions for a hydration entry.
 * Returns an array (possibly empty) so a single entry can register
 * dependencies (e.g. `addEntities` before a record receive) when the
 * equivalent resolver would have.
 *
 * @param {Object} entry Hydration entry `{ selector, args, data, allow? }`.
 * @return {Object[]} Actions to dispatch through the root reducer.
 */
function synthesizeActions( entry ) {
	const { selector, args, data, allow } = entry;

	switch ( selector ) {
		case 'getCurrentUser':
			return [ receiveCurrentUser( data ) ];

		case 'getEntitiesConfig': {
			const [ kind ] = args;
			if ( kind !== 'postType' ) {
				return [];
			}
			// Mirror the getEntitiesConfig resolver: take the raw types
			// response and map it through the same transform that
			// `loadPostTypeEntities` would have used after apiFetch.
			const configs = postTypeEntitiesFromResponse( data );
			return configs.length ? [ addEntities( configs ) ] : [];
		}

		case 'getEntityRecord': {
			const [ kind, name, key ] = args;
			const actions = [ receiveEntityRecords( kind, name, data ) ];

			// Mirror the resolver: prime canUser for every action that the
			// REST `Allow` header reports for this resource, so the canUser
			// resolver doesn't fire a separate OPTIONS request.
			if ( typeof allow === 'string' ) {
				const permissions = getUserPermissionsFromAllowHeader( allow );
				const permissionMap = {};
				for ( const action of ALLOWED_RESOURCE_ACTIONS ) {
					permissionMap[
						getUserPermissionCacheKey( action, {
							kind,
							name,
							id: key,
						} )
					] = permissions[ action ];
				}
				actions.push( receiveUserPermissions( permissionMap ) );
			}
			return actions;
		}

		case 'getEntityRecords': {
			const [ kind, name, query ] = args;
			return [ receiveEntityRecords( kind, name, data, query ) ];
		}
	}
	return [];
}

/**
 * Reads the preload payload (emitted by the PHP-side helper as
 * `window.__wpCoreDataPreload`) and folds it into a complete initial
 * inner-store state for `@wordpress/core-data` — both the root slice
 * (with entity records and configs pre-populated by replaying
 * receive-actions through the reducer) and the metadata slice (with the
 * matching (selector, args) pairs marked as already-resolved, so
 * resolvers never fire for the preloaded data).
 *
 * @return {Object|undefined} `{ root, metadata }` ready for createReduxStore,
 *                            or undefined when there is no preload payload.
 */
export function buildHydratedInitialState() {
	if ( typeof window === 'undefined' ) {
		return undefined;
	}
	const payload = window.__wpCoreDataPreload;
	if ( ! Array.isArray( payload ) || ! payload.length ) {
		return undefined;
	}

	// `getEntitiesConfig` entries first so entity records below have a
	// registered slot in the reducer when their RECEIVE_ITEMS lands.
	const ordered = [
		...payload.filter( ( e ) => e.selector === 'getEntitiesConfig' ),
		...payload.filter( ( e ) => e.selector !== 'getEntitiesConfig' ),
	];

	let root = reducer( undefined, { type: '@@INIT' } );
	const argsBySelector = new Map();

	const markResolved = ( selector, args ) => {
		if ( ! argsBySelector.has( selector ) ) {
			argsBySelector.set( selector, [] );
		}
		argsBySelector.get( selector ).push( args );
	};

	for ( const entry of ordered ) {
		for ( const action of synthesizeActions( entry ) ) {
			root = reducer( root, action );
		}

		markResolved( entry.selector, entry.args );

		// When the entry primes a record's permissions via the Allow
		// header, also mark every canUser resolution as finished so the
		// canUser resolver doesn't fire its OPTIONS request for them.
		if ( entry.selector === 'getEntityRecord' && entry.allow ) {
			const [ kind, name, key ] = entry.args;
			for ( const action of ALLOWED_RESOURCE_ACTIONS ) {
				markResolved( 'canUser', [ action, { kind, name, id: key } ] );
			}
		}
	}

	return {
		root,
		metadata: createInitialResolutionState( argsBySelector ),
	};
}
