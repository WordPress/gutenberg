/**
 * WordPress dependencies
 */
import { useEffect, useReducer } from '@wordpress/element';
import { createQueue } from '@wordpress/priority-queue';

/**
 * Returns the first items from list that are present on state.
 *
 * @template T
 *
 * @param {Array<T>} list  New array.
 * @param {Array<T>} state Current state.
 * @return {Array<T>} First items present in state.
 */
function getFirstItemsPresentInState( list, state ) {
	const firstItems = [];

	for ( let i = 0; i < list.length; i++ ) {
		const item = list[ i ];
		if ( ! state.includes( item ) ) {
			break;
		}

		firstItems.push( item );
	}

	return firstItems;
}

/**
 * @template T
 * @typedef {{type: 'reset', list: Array<T>}|{type: 'append', item: T}} Action
 */

/**
 * Reducer keeping track of a list of appended items.
 *
 * @template T
 *
 * @param {Array<T>} state   Current state
 * @param {Action<T>} action Action
 *
 * @return {Array<T>} Updated state
 */
function listReducer( state, action ) {
	if ( action.type === 'reset' ) {
		return action.list;
	}

	if ( action.type === 'append' ) {
		return [ ...state, action.item ];
	}

	return state;
}

/**
 * React hook returns an array which items get asynchronously appended from a source array.
 * This behavior is useful if we want to render a list of items asynchronously for performance reasons.
 *
 * @template T
 *
 * @param {Array<T>} list Source array.
 * @return {Array<T>} Async array.
 */
function useAsyncList( list ) {
	const reducer = useReducer( listReducer, [] );
	/* eslint-disable jsdoc/no-undefined-types */
	const current = /** @type {Array<T>} */ ( reducer[ 0 ] );
	const dispatch = /** @type {Dispatch<Action<T>>} */ reducer[ 1 ];
	/* eslint-enable jsdoc/no-undefined-types */

	useEffect( () => {
		// On reset, we keep the first items that were previously rendered.
		const firstItems = getFirstItemsPresentInState( list, current );
		dispatch( {
			type: 'reset',
			list: firstItems,
		} );
		const asyncQueue = createQueue();
		/**
		 * @param {number} index
		 */
		const append = ( index ) => () => {
			if ( list.length <= index ) {
				return;
			}
			dispatch( { type: 'append', item: list[ index ] } );
			asyncQueue.add( {}, append( index + 1 ) );
		};
		asyncQueue.add( {}, append( firstItems.length ) );

		return () => asyncQueue.reset();
	}, [ list ] );

	return current;
}

export default useAsyncList;
