/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

export default function useApiFetch( setIsRequesting, setData, path ) {
	useEffect( () => {
		// Indicate the fetching status
		setIsRequesting( true );

		apiFetch( { path } )
			.then( ( dataList ) => {
				setData( dataList );
				// We've stopped fetching
				setIsRequesting( false );
			} )
			.catch( () => {
				setData( [] );
				// We've stopped fetching
				setIsRequesting( false );
			} );
	}, [] );
}
