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
				richData: action.richData,
			};
		case 'ERROR':
			return {
				...state,
				isFetching: false,
				richData: null,
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

function useRemoteUrlData( url ) {
	const [ state, dispatch ] = useReducer( reducer, {
		richData: null,
		isFetching: false,
	} );

	const { fetchRichUrlData } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			fetchRichUrlData: getSettings().__experimentalFetchRichUrlData,
		};
	}, [] );

	useEffect( () => {
		// Only make the request if we have an actual URL
		// and the fetching util is available. In some editors
		// there may not be such a util.
		if (
			url?.length &&
			fetchRichUrlData &&
			typeof AbortController !== 'undefined'
		) {
			dispatch( {
				type: 'LOADING',
			} );

			const controller = new window.AbortController();

			const signal = controller.signal;

			fetchRichUrlData( url, {
				signal,
			} )
				.then( ( urlData ) => {
					dispatch( {
						type: 'RESOLVED',
						richData: urlData,
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
	}, [ url ] );

	return state;
}

export default useRemoteUrlData;
