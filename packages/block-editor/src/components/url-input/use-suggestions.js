/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';

export default function useSuggestions( searchTerm, fetchSuggestions, disableSuggestions ) {
	const requestInstance = useRef();
	const [ suggestions, setSuggestions ] = useState( [] );
	const [ isFetching, setIsFetching ] = useState( false );

	useEffect( () => async () => {
		if ( searchTerm === undefined || ( searchTerm && searchTerm.length < 2 ) || disableSuggestions ) {
			setIsFetching( false );
			return;
		}

		setIsFetching( true );

		try {
			const request = fetchSuggestions( searchTerm );
			requestInstance.current = request;

			const suggestionResults = await request;

			// If the request has been superceded, abandon it by
			// returning early.
			if ( request !== requestInstance.current ) {
				return;
			}

			setSuggestions( suggestionResults );
		} catch ( error ) {
			setIsFetching( false );
		}

		setIsFetching( false );
	}, [ searchTerm, fetchSuggestions, disableSuggestions ] );

	return { suggestions, isFetching };
}
