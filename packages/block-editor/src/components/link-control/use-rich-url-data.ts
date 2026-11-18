import { useSelect } from '@wordpress/data';
import { useEffect, useReducer } from '@wordpress/element';
import { store as blockEditorStore } from '../../store';
import type { RichUrlData } from './types';

interface RichUrlDataState {
	richData: RichUrlData | null;
	isFetching: boolean;
}

type RichUrlDataAction =
	| { type: 'RESOLVED'; richData: RichUrlData | null }
	| { type: 'ERROR' }
	| { type: 'LOADING' };

function reducer(
	state: RichUrlDataState,
	action: RichUrlDataAction
): RichUrlDataState {
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
			// Unreachable for typed callers.
			throw new Error(
				`Unexpected action type ${ ( action as { type: string } ).type }`
			);
	}
}

function useRemoteUrlData( url: string | null | undefined ) {
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

	useEffect( (): ( () => void ) | void => {
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
