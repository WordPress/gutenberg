/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
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

/**
 * React hook returns an array which items get asynchronously appended from a source array.
 * This behavior is useful if we want to render a list of items asynchronously for performance reasons.
 *
 * @param list Source array.
 * @return Async array.
 */
function useAsyncList< T >( list: T[] ): T[] {
	const [ current, setCurrent ] = useState( [] as T[] );

	useEffect( () => {
		// On reset, we keep the first items that were previously rendered.
		const firstItems = getFirstItemsPresentInState( list, current );
		setCurrent( firstItems );

		const asyncQueue = createQueue();
		const append = ( index: number ) => () => {
			if ( list.length <= index ) {
				return;
			}
			setCurrent( ( state ) => [ ...state, list[ index ] ] );
			asyncQueue.add( {}, append( index + 1 ) );
		};
		asyncQueue.add( {}, append( firstItems.length ) );

		return () => asyncQueue.reset();
	}, [ list ] );

	return current;
}

export default useAsyncList;
