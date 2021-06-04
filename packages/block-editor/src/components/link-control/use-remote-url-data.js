/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useCallback } from '@wordpress/element';

function useRemoteUrlData( url ) {
	// eslint-disable-next-line no-undef
	let controller;
	let signal;

	const [ richData, setRichData ] = useState( null );
	const [ isFetching, setIsFetching ] = useState( false );

	const { fetchRemoteUrlData } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			fetchRemoteUrlData: getSettings().__experimentalFetchRemoteUrlData,
		};
	}, [] );

	const cancelPendingFetch = useCallback( () => {
		controller?.abort();
	}, [ controller ] );

	/**
	 * Cancel any pending requests that were made for
	 * stale URL values. If the component does not unmount
	 * we must handle cancelling the current request if
	 * the URL changes otherwise we will see stale data.
	 */
	useEffect( () => {
		cancelPendingFetch();
	}, [ url ] );

	/**
	 * Cancel any pending requests on "unmount"
	 */
	useEffect( () => {
		return () => {
			cancelPendingFetch();
		};
	}, [] );

	useEffect( () => {
		const fetchRichData = async () => {
			setIsFetching( true );

			// Clear the data if the URL changes to avoid stale data in hook consumer.
			setRichData( null );

			try {
				// eslint-disable-next-line no-undef
				controller = new AbortController();
				signal = controller.signal;

				const urlData = await fetchRemoteUrlData( url, {
					signal,
				} );

				// If the promise is cancelled then this will never run
				// as we should fall into the `catch` below.
				setRichData( urlData );
				setIsFetching( false );
			} catch ( error ) {
				if ( signal?.aborted ) {
					return; // bail if canceled to avoid setting state
				}

				setIsFetching( false );
			}
		};

		if ( url?.length && fetchRemoteUrlData ) {
			fetchRichData();
		}
	}, [ url ] );

	return {
		richData,
		isFetching,
	};
}

export default useRemoteUrlData;
