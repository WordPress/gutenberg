/**
 * WordPress dependencies
 */
import { useEffect, useReducer } from '@wordpress/element';
import { createQueue } from '@wordpress/priority-queue';

function listReducer( state, action ) {
	if ( action.type === 'reset' && state.length !== 0 ) {
		return [];
	}

	if ( action.type === 'append' ) {
		return [ ...state, action.item ];
	}

	return state;
}

function useAsyncList( list ) {
	const [ current, dispatch ] = useReducer( listReducer, [] );

	useEffect( () => {
		dispatch( { type: 'reset' } );
		const asyncQueue = createQueue();
		const append = ( index = 0 ) => () => {
			if ( list.length <= index ) {
				return;
			}
			dispatch( { type: 'append', item: list[ index ] } );
			asyncQueue.add( {}, append( index + 1 ) );
		};
		asyncQueue.add( {}, append( 0 ) );

		return () => asyncQueue.reset();
	}, [ list ] );

	return current;
}

export default useAsyncList;
