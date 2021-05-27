/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import makeCancelable from './make-cancelable';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';

function useRemoteUrlData( url ) {
	const cancelableFetch = useRef();

	const [ richData, setRichData ] = useState( null );
	const [ isFetching, setIsFetching ] = useState( false );

	const { fetchRemoteUrlData } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			fetchRemoteUrlData: getSettings().__experimentalFetchRemoteUrlData,
		};
	}, [] );

	const cancelPendingFetch = useCallback( () => {
		if ( cancelableFetch.current ) {
			cancelableFetch.current.cancel();
		}
	}, [ cancelableFetch ] );

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
				cancelableFetch.current = makeCancelable(
					fetchRemoteUrlData( url )
				);
				const urlData = await cancelableFetch.current.promise;

				// If the promise is cancelled then this will never run
				// as we should fall into the `catch` below.
				setRichData( urlData );
				setIsFetching( false );
			} catch ( error ) {
				if ( error?.isCanceled ) {
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
