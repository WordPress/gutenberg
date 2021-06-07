/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

function useRemoteUrlData( url ) {
	const [ richData, setRichData ] = useState( null );
	const [ isFetching, setIsFetching ] = useState( false );

	const { fetchRemoteUrlData } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			fetchRemoteUrlData: getSettings().__experimentalFetchRemoteUrlData,
		};
	}, [] );

	useEffect( () => {
		// Only make the request if we have an actual URL
		// and the fetching util is available. In some editors
		// there may not be such a util.
		if ( url?.length && fetchRemoteUrlData ) {
			setIsFetching( true );

			// eslint-disable-next-line no-undef
			const controller = new AbortController();
			const signal = controller.signal;

			fetchRemoteUrlData( url, {
				signal,
			} )
				.then( ( urlData ) => {
					setRichData( urlData );
					setIsFetching( false );
				} )
				.catch( () => {
					// Avoid setting state on unmounted component
					if ( ! signal?.aborted ) {
						setIsFetching( false );
						setRichData( null );
					}
				} );
			// Cleanup: when the URL changes the abort the current request
			return () => {
				controller.abort();
			};
		}
	}, [ url ] );

	return {
		richData,
		isFetching,
	};
}

export default useRemoteUrlData;
