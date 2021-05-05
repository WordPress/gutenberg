/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Reducer } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useReducer } from '@wordpress/element';
import { createQueue } from '@wordpress/priority-queue';

/**
 * Returns the first items from list that are present on state.
 *
 * @param list  New array.
 * @param state Current state.
 * @return First items present iin state.
 */
function getFirstItemsPresentInState< T >( list: T[], state: T[] ): T[] {
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

type ResetAction< T > = { type: 'reset'; list: T[] };
type AppendAction< T > = { type: 'append'; item: T };

/**
 * Reducer keeping track of a list of appended items.
 *
 * @template T
 * @param state  Current state
 * @param action Action
 *
 * @return update state.
 */
function listReducer< T >(
	state: T[],
	action: ResetAction< T > | AppendAction< T >
): T[] {
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
 * @param list Source array.
 * @return Async array.
 */
function useAsyncList< T >( list: T[] ): T[] {
	const [ current, dispatch ] = useReducer(
		listReducer as Reducer< T[], ResetAction< T > | AppendAction< T > >,
		[] as T[]
	);

	useEffect( () => {
		// On reset, we keep the first items that were previously rendered.
		const firstItems = getFirstItemsPresentInState( list, current );
		dispatch( {
			type: 'reset',
			list: firstItems,
		} );
		const asyncQueue = createQueue();
		const append = ( index: number ) => () => {
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
