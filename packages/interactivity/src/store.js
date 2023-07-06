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
 * Extends the Interactivity API global store with the passed properties.
 *
 * These props tipically consist of `state`, `selectors` and `actions` that can
 * be used by any directive, making the HTML reactive and interactive.
 *
 * @example
 * ```js
 *  store({
 *    state: {
 *      counter: { value: 0 },
 *    },
 *    actions: {
 *      counter: {
 *        increment: ({ state }) => {
 *          state.counter.value += 1;
 *        },
 *      },
 *    },
 *  });
 * ```
 *
 * The code from the example above allows blocks to subscribe and interact with
 * the store by using directives in the HTML, e.g.:
 *
 * ```html
 * <div data-wp-interactive>
 *   <button
 *     data-wp-text="state.counter.value"
 *     data-wp-on--click="actions.counter.increment"
 *   >
 *     0
 *   </button>
 * </div>
 * ```
 *
 * @param {Object} properties             Properties to be added to the global store.
 * @param {Object} [properties.state]     State to be added to the global store.
 * @param {Object} [properties.selectors] Selectors to be added to the global store.
 * @param {Object} [properties.actions]   Actions to be added to the global store.
 */
export const store = ( { state, ...block } ) => {
	deepMerge( rawStore, block );
	deepMerge( rawState, state );
};
