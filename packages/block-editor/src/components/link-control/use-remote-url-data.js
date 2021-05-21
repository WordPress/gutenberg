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

	const { fetchRemoteUrlData } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			fetchRemoteUrlData: getSettings().__experimentalFetchRemoteUrlData,
		};
	}, [] );

	useEffect( () => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, [] );

	useEffect( () => {
		const fetchRichData = async () => {
			const urlData = await fetchRemoteUrlData( url );
			if ( isMounted.current ) {
				setRichData( urlData );
			}
		};

		if ( url?.length && isMounted.current ) {
			fetchRichData();
		}
	}, [ url ] );

	return richData;
}

export default useRemoteUrlData;
