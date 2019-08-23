/**
 * External dependencies
 */
import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Internal dependencies
 */
import { useRouter } from './hooks';

export function getEndpoint( params ) {
	const { path } = params;
	const endpoint = `/_data/${ path }/index.json`;

	return endpoint;
}

export async function fetchAndLoadData( { path, setData, setLoaded } ) {
	const url = getEndpoint( {
		path,
	} );

	try {
		const { data } = await axios.get( url );
		if ( ! data ) {
			return;
		}

		setData( data );
		setLoaded( true );
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.log( err );
	}
}

export function useData( pathname ) {
	const { location } = useRouter();
	const path = pathname || location.pathname || '';

	const [ data, setData ] = useState( {} );
	const [ isLoaded, setLoaded ] = useState( false );

	useEffect( () => {
		fetchAndLoadData( { path, setLoaded, setData } );

		return () => {
			setLoaded( false );
		};
	}, [ path, setLoaded, setData ] );

	return {
		data,
		isLoaded,
	};
}
