/**
 * External dependencies
 */
import { deepSignal } from 'deepsignal';

const isObject = ( item ) =>
	item && typeof item === 'object' && ! Array.isArray( item );

const deepMerge = ( target, source ) => {
	if ( isObject( target ) && isObject( source ) ) {
		for ( const key in source ) {
			if ( isObject( source[ key ] ) ) {
				if ( ! target[ key ] ) Object.assign( target, { [ key ]: {} } );
				deepMerge( target[ key ], source[ key ] );
			} else {
				Object.assign( target, { [ key ]: source[ key ] } );
			}
		}
	}
};

const getSerializedState = () => {
	const storeTag = document.querySelector(
		`script[type="application/json"]#wp-interactivity-store-data`
	);
	if ( ! storeTag ) return {};
	try {
		const { state } = JSON.parse( storeTag.textContent );
		if ( isObject( state ) ) return state;
		throw Error( 'Parsed state is not an object' );
	} catch ( e ) {
		// eslint-disable-next-line no-console
		console.log( e );
	}
	return {};
};

const rawState = getSerializedState();
export const rawStore = { state: deepSignal( rawState ) };

/**
 * Extends the global store with the passed properties. These props tipically
 * consist of `state`, `actions` and `effects` used by interactive blocks, and
 * any of them may be accessed by any directive present in the page.
 *
 * @example
 * ```js
 *  store({
 *    state: {
 *      favoriteMovies: [],
 *    },
 *    actions: {
 *      addMovie: ({ state, context }) => {
 *        // We assume that there is a `wp-context` directive
 *        // on the block which provides the item ID.
 *        state.favoriteMovies.push(context.item.id);
 *      },
 *      clearFavoriteMovies: ({ state }) => {
 *        state.favoriteMovies = [];
 *      },
 *    },
 *  });
 * ```
 *
 * @param {Object} properties           Properties to be added to the global store.
 * @param {Object} [properties.state]   State to be added to the global store.
 * @param {Object} [properties.actions] Actions to be added to the global store.
 * @param {Object} [properties.effects] Effects to be added to the global store.
 */
export const store = ( { state, ...block } ) => {
	deepMerge( rawStore, block );
	deepMerge( rawState, state );
};
