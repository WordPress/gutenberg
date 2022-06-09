/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable jsdoc/check-line-alignment */
/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable jsdoc/require-returns-check */

/**
 * @typedef {import('./types').StoreDescriptor<C>} StoreDescriptor
 * @template C
 */
/**
 * @typedef {import('./types').ReduxStoreConfig<State,Actions,Selectors>} ReduxStoreConfig
 * @template State,Actions,Selectors
 */
/**
 * @typedef {import('./types').UseSelectReturn<F>} UseSelectReturn
 * @template F
 */
/** @typedef {import('./types').MapSelect} MapSelect */

/**
 * @template {MapSelect | StoreDescriptor<any>} F
 * @param    {F} mapSelect
 * @param    {*} deps
 * @return   {UseSelectReturn<F>} A custom react hook.
 */
function useSelect( mapSelect, deps ) {}

/**
 * @template State,Actions,Selectors
 * @param    {string}    key                  Unique namespace identifier.
 * @param    {ReduxStoreConfig<State,Actions,Selectors>}    options              Registered store options, with properties
 *                                         describing reducer, actions, selectors,
 *                                         and resolvers.
 *
 * @return   {StoreDescriptor<ReduxStoreConfig<State,Actions,Selectors>>} Store Object.
 */
function createReduxStore( key, options ) {}

const config = {
	reducer: () => null,
	selectors: {
		/**
		 * @param {Object} state
		 * @param {string} singleArg
		 * @returns {number}
		 */
		test: ( state, singleArg ) => 1,
	},
};

const store = createReduxStore( 'STORE_NAME', config );

// Confirm that `selectors` is of type {test: (singleArg: string) => number}
const selectors = useSelect( store );

// Confirm that `mappedValue` is of type number
const mappedValue = useSelect( ( select ) => {
	return select( store ).test( 'any string' );
} );

/* eslint-enable no-unused-vars */
/* eslint-enable no-undef */
/* eslint-enable jsdoc/check-line-alignment */
/* eslint-enable jsdoc/check-tag-names */
/* eslint-enable react-hooks/rules-of-hooks */
/* eslint-enable jsdoc/require-returns-check */
