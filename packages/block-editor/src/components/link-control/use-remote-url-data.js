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

	const [ richData, setRichData ] = useState( null );
	const [ isFetching, setIsFetching ] = useState( false );

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
	// useEffect( () => {
	// 	setRichData( null );
	// }, [ url ] );

	useEffect( () => {
		const fetchRichData = async () => {
			setIsFetching( true );
			setRichData( null );

			try {
				const urlData = await fetchRemoteUrlData( url ).catch( () => {
					setIsFetching( false );
				} );

				if ( isMounted.current ) {
					setRichData( urlData );
					setIsFetching( false );
				}
			} catch ( e ) {
				setIsFetching( false );
			}
		};

		if ( url?.length && isMounted.current && fetchRemoteUrlData ) {
			fetchRichData();
		}
	}, [ url ] );

	return {
		richData,
		isFetching,
	};
}

export default useRemoteUrlData;
