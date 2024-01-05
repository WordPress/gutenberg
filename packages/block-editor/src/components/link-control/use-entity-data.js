/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useReducer } from '@wordpress/element';

function reducer( state, action ) {
	switch ( action.type ) {
		case 'RESOLVED':
			return {
				...state,
				isFetching: false,
				entityData: action.entityData,
			};
		case 'ERROR':
			return {
				...state,
				isFetching: false,
				entityData: null,
			};
		case 'LOADING':
			return {
				...state,
				isFetching: true,
			};
		default:
			throw new Error( `Unexpected action type ${ action.type }` );
	}
}

function useEntityData( postType, id ) {
	const [ state, dispatch ] = useReducer( reducer, {
		entityData: null,
		isFetching: false,
	} );

	const { fetchEntityData } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			fetchEntityData: getSettings().__experimentalSyncGetEntityRecord,
		};
	}, [] );

	useEffect( () => {
		// Only make the request if we have an actual URL
		// and the fetching util is available. In some editors
		// there may not be such a util.
		if ( id && fetchEntityData && typeof AbortController !== 'undefined' ) {
			dispatch( {
				type: 'LOADING',
			} );

			const controller = new window.AbortController();

			const signal = controller.signal;

			fetchEntityData( 'postType', postType, Number( id ), {
				signal,
			} )
				.then( ( data ) => {
					dispatch( {
						type: 'RESOLVED',
						entityData: data,
					} );
				} )
				.catch( () => {
					// Avoid setting state on unmounted component
					if ( ! signal.aborted ) {
						dispatch( {
							type: 'ERROR',
						} );
					}
				} );
			// Cleanup: when the URL changes the abort the current request.
			return () => {
				controller.abort();
			};
		}
	}, [ fetchEntityData, postType, id ] );

	return state;
}

export default useEntityData;
