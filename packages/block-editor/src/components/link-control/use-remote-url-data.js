/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';

function useRemoteUrlData( url ) {
	const isMounted = useRef( false );
	const isFetching = useRef( false );
	const [ richData, setRichData ] = useState( null );

	const { fetchRemoteUrlData } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			fetchRemoteUrlData: getSettings().__experimentalFetchRemoteUrlData,
		};
	}, [] );

	// Avoid fetching or state updates if not mounted.
	useEffect( () => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, [] );

	// Clear the data if the URL changes to avoid stale data in hook consumer.
	useEffect( () => {
		setRichData( null );
	}, [ url ] );

	useEffect( () => {
		const fetchRichData = async () => {
			isFetching.current = true;

			const urlData = await fetchRemoteUrlData( url ).catch( () => {
				isFetching.current = false;
			} );

			isFetching.current = false;

			if ( isMounted.current ) {
				setRichData( urlData );
			}
		};

		if ( url?.length && isMounted.current && fetchRemoteUrlData ) {
			fetchRichData();
		}

		return () => {
			isFetching.current = false;
		};
	}, [ url ] );

	return {
		richData,
		isFetching: isFetching.current,
	};
}

export default useRemoteUrlData;
