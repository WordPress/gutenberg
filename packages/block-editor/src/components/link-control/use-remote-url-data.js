/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

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
	 * stale URL values.
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
					// Using Promise.resolve to allow createSuggestion to return a
					// non-Promise based value.
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

/**
 * Creates a wrapper around a promise which allows it to be programmatically
 * cancelled.
 * See: https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
 *
 * @param {Promise} promise the Promise to make cancelable
 */
const makeCancelable = ( promise ) => {
	let hasCanceled_ = false;

	const wrappedPromise = new Promise( ( resolve, reject ) => {
		promise.then(
			( val ) =>
				hasCanceled_ ? reject( { isCanceled: true } ) : resolve( val ),
			( error ) =>
				hasCanceled_ ? reject( { isCanceled: true } ) : reject( error )
		);
	} );

	return {
		promise: wrappedPromise,
		cancel() {
			hasCanceled_ = true;
		},
	};
};
