/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Function that fetches data using apiFetch, and updates the status.
 *
 * @param {string} path Query path.
 */
export default function useApiFetch( path ) {
	// Indicate the fetching status
	const [ isLoading, setIsLoading ] = useState( true );
	const [ data, setData ] = useState( [] );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		apiFetch( { path } )
			.then( ( dataList ) => {
				setData( dataList );
				// We've stopped fetching
				setIsLoading( false );
			} )
			.catch( ( err ) => {
				setError( err );
				// We've stopped fetching
				setIsLoading( false );
			} );
	}, [ path ] );

	return {
		isLoading,
		data,
		error,
	};
}
