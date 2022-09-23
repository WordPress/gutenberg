/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

// TODO: Even though the `mature` param is `false` by default, we might need to determine where
// and if there is other 'weird' content like in the title. It happened for me to test with `skate`
// and the first result contains a word in the title that might not be suitable for all users.
async function fetchFromOpenverse( { search, pageSize } ) {
	const controller = new AbortController();
	const url = new URL( 'https://api.openverse.engineering/v1/images/' );
	url.searchParams.set( 'q', search );
	url.searchParams.set( 'page_size', pageSize );
	const response = await window.fetch( url, {
		headers: [ [ 'Content-Type', 'application/json' ] ],
		signal: controller.signal,
	} );
	return response.json();
}

export function useImageResults( options ) {
	const [ results, setResults ] = useState( [] );

	useEffect( () => {
		( async () => {
			try {
				const response = await fetchFromOpenverse( options );
				setResults( response.results );
			} catch ( error ) {
				// TODO: handle this
				throw error;
			}
		} )();
	}, [ ...Object.values( options ) ] );

	return results;
}
