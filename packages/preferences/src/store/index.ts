/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';
import type { StoreState } from './types';

/**
 * Store definition for the preferences namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 */
export const store = createReduxStore<
	StoreState,
	typeof actions,
	typeof selectors
>( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );

type SubsequentArgsOfFunc< F > = F extends ( arg: any, ...args: infer R ) => any
	? R
	: never;
type CurriedSelectors = {
	[ key in keyof typeof selectors ]: (
		...args: SubsequentArgsOfFunc< ( typeof selectors )[ key ] >
	) => ReturnType< ( typeof selectors )[ key ] >;
};
declare module '@wordpress/data' {
	function dispatch( key: typeof STORE_NAME ): typeof actions;
	function select( key: typeof STORE_NAME ): CurriedSelectors;

	function useDispatch( key: typeof STORE_NAME ): typeof actions;
	function useSelect( key: typeof STORE_NAME ): CurriedSelectors;
}
