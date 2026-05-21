/**
 * WordPress dependencies
 */
import { createInitialResolutionState } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import {
	__experimentalReceiveCurrentGlobalStylesId,
	__experimentalReceiveThemeBaseGlobalStyles,
	__experimentalReceiveThemeGlobalStyleVariations,
	addEntities,
	receiveAutosaves,
	receiveCurrentTheme,
	receiveCurrentUser,
	receiveEntityRecords,
	receiveUserPermissions,
} from './actions';
import {
	postTypeEntitiesFromResponse,
	siteEntityFromResponse,
	taxonomyEntitiesFromResponse,
} from './entities';
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
	const { selector, args, data, allow, stylesheet } = entry;

	switch ( selector ) {
		case 'getCurrentUser':
			return [ receiveCurrentUser( data ) ];

		case 'getEntitiesConfig': {
			const [ kind ] = args;
			// Mirror the getEntitiesConfig resolver: take the raw response
			// and map it through the same transform that the matching
			// `loadXEntities` would have used after apiFetch.
			let configs;
			if ( kind === 'postType' ) {
				configs = postTypeEntitiesFromResponse( data );
			} else if ( kind === 'taxonomy' ) {
				configs = taxonomyEntitiesFromResponse( data );
			} else if ( kind === 'root' ) {
				configs = siteEntityFromResponse( data );
			} else {
				return [];
			}
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

		case 'getCurrentTheme': {
			// The resolver fetches the active-themes list, then dispatches
			// the [0] entry as the current theme. But the `getCurrentTheme`
			// selector only stores the stylesheet name on state.currentTheme
			// and looks up the theme record from the entities store — so
			// the inner getEntityRecords flow (which the resolver delegates
			// to via resolveSelect) is what fills the record. Mirror both
			// here so the selector finds the data.
			const themes = Array.isArray( data ) ? data : [ data ];
			const active = themes[ 0 ];
			if ( ! active ) {
				return [];
			}
			return [
				receiveEntityRecords( 'root', 'theme', themes, {
					status: 'active',
				} ),
				receiveCurrentTheme( active ),
			];
		}

		case 'getBlockPatternCategories': {
			return [
				{ type: 'RECEIVE_BLOCK_PATTERN_CATEGORIES', categories: data },
			];
		}

		case '__experimentalGetCurrentGlobalStylesId': {
			return data
				? [ __experimentalReceiveCurrentGlobalStylesId( data ) ]
				: [];
		}

		case 'getAutosaves': {
			// args: [ postType, postId ]. The resolver dispatches
			// receiveAutosaves with the postId and the response body.
			const [ , postId ] = args;
			return data && data.length
				? [ receiveAutosaves( postId, data ) ]
				: [];
		}

		case '__experimentalGetCurrentThemeBaseGlobalStyles': {
			if ( ! stylesheet ) {
				return [];
			}
			return [
				__experimentalReceiveThemeBaseGlobalStyles( stylesheet, data ),
			];
		}

		case '__experimentalGetCurrentThemeGlobalStylesVariations': {
			if ( ! stylesheet ) {
				return [];
			}
			return [
				__experimentalReceiveThemeGlobalStyleVariations(
					stylesheet,
					data
				),
			];
		}

		case 'canUser': {
			// args: [ action, resource, id? ]. The resolver issues an
			// OPTIONS to the resource's URL, reads the Allow header,
			// and primes every action's permission for that resource
			// in a single pass. Mirror that here.
			if ( typeof allow !== 'string' ) {
				return [];
			}
			const [ , resource, id ] = args;
			const permissions = getUserPermissionsFromAllowHeader( allow );
			const permissionMap = {};
			for ( const a of ALLOWED_RESOURCE_ACTIONS ) {
				permissionMap[ getUserPermissionCacheKey( a, resource, id ) ] =
					permissions[ a ];
			}
			return [ receiveUserPermissions( permissionMap ) ];
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

		// The getCurrentTheme resolver delegates to getEntityRecords for
		// the active themes list; mark that resolution finished too so
		// any downstream resolver (e.g. __experimentalGetCurrentGlobalStylesId)
		// or direct caller doesn't fire the network request for it.
		if ( entry.selector === 'getCurrentTheme' ) {
			markResolved( 'getEntityRecords', [
				'root',
				'theme',
				{ status: 'active' },
			] );
		}

		// A canUser entry primes all four actions for its resource.
		// Mark the sibling actions resolved alongside the requested one
		// so none of them re-fires.
		if ( entry.selector === 'canUser' && entry.allow ) {
			const [ requested, resource, id ] = entry.args;
			for ( const action of ALLOWED_RESOURCE_ACTIONS ) {
				if ( action === requested ) {
					continue;
				}
				const siblingArgs =
					id === undefined
						? [ action, resource ]
						: [ action, resource, id ];
				markResolved( 'canUser', siblingArgs );
			}
		}
	}

	return {
		root,
		metadata: createInitialResolutionState( argsBySelector ),
	};
}
