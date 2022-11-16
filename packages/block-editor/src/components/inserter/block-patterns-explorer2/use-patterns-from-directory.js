/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const defaultPerPage = 10;
const CACHE = new Map();

export default function usePatternsFromDirectory( options = {} ) {
	const [ patterns, setPatterns ] = useState( [] );
	const isLoading = useRef();
	useEffect( () => {
		if ( ! Object.keys( options ).length ) {
			return;
		}
		const key = JSON.stringify( options );
		if ( CACHE.has( key ) ) {
			isLoading.current = false;
			setPatterns( CACHE.get( key ) );
			return;
		}
		if ( isLoading.current ) {
			// abort previous request
		}
		isLoading.current = true;
		setPatterns( [] );
		apiFetch( {
			path: addQueryArgs( '/wp/v2/pattern-directory/patterns', {
				...options,
				per_page: options.per_page || defaultPerPage,
			} ),
		} ).then( ( fetchedPatterns ) => {
			CACHE.set( key, fetchedPatterns );
			isLoading.current = false;
			setPatterns( fetchedPatterns );
		} );
	}, [ options.search, options.category, options.per_page ] );
	return [ patterns, isLoading.current ];
}
