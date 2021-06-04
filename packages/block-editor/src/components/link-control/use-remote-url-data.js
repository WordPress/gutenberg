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

	function abortableFetch( theUrl, signal ) {
		return new Promise( ( resolve, reject ) => {
			// Listen once on the AbortController signal
			// and reject the promise if abort is triggered.
			signal.addEventListener(
				'abort',
				() => {
					reject( 'aborted' );
				},
				{ once: true }
			);

			return fetchRemoteUrlData( theUrl, {
				signal,
			} )
				.then( ( data ) => resolve( data ) )
				.catch( () => reject() );
		} );
	}

	useEffect( () => {
		// eslint-disable-next-line no-undef
		let controller;

		const fetchRichData = () => {
			setIsFetching( true );

			// eslint-disable-next-line no-undef
			controller = new AbortController();

			abortableFetch( url, controller.signal )
				.then( ( urlData ) => {
					setRichData( urlData );
					setIsFetching( false );
				} )
				.catch( ( error ) => {
					// Avoid setting state on unmounted component
					if ( 'aborted' !== error ) {
						setIsFetching( false );
						setRichData( null );
					}
				} );
		};

		// Only make the request if we have an actual URL
		// and the fetching util is available. In some editors
		// there may not be such a util.
		if ( url?.length && fetchRemoteUrlData ) {
			fetchRichData();
		}

		// When the URL changes the abort the current request
		return () => {
			controller?.abort();
		};
	}, [ url ] );

	return {
		richData,
		isFetching,
	};
}

export default useRemoteUrlData;
