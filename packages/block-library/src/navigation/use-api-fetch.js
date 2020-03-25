/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Function that fetches data using apiFetch, and updates the status.
 *
 * @param {Function} setIsRequesting function to set requesting state to true or false.
 * @param {Function} setData Function to set data being returned, or empty array on error.
 * @param {string} path Query path.
 */
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
