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
	let { current: isMounted } = useRef( false );
	const [ richData, setRichData ] = useState( {} );

	const { fetchRemoteUrlData } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			fetchRemoteUrlData: getSettings().__experimentalFetchRemoteUrlData,
		};
	}, [] );

	useEffect( () => {
		const fetchRichData = async () => {
			const urlData = await fetchRemoteUrlData( url );
			if ( isMounted ) {
				setRichData( urlData );
			}
		};

		if ( url?.length && isMounted ) {
			fetchRichData();
		}
	}, [ url ] );

	useEffect( () => {
		isMounted = true;
		return () => {
			isMounted = false;
		};
	}, [] );

	return richData;
}

export default useRemoteUrlData;
