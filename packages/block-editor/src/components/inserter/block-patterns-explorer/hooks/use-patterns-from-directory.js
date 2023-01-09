/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../../store';

const defaultPerPage = 10;

export default function usePatternsFromDirectory( options = {} ) {
	const abortController = useRef();
	const [ patterns, setPatterns ] = useState( [] );
	const isLoading = useRef();
	const fetchEntities = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().__unstableFetchEntities,
		[]
	);
	useEffect( () => {
		if ( ! fetchEntities ) {
			return;
		}
		// Request only if we perform a search or select a category.
		if ( ! [ options.search, options.category ].filter( Boolean ).length ) {
			return;
		}
		// If we have a pending request and make a new one, abort the former.
		if ( isLoading.current ) {
			abortController.current?.abort();
		}
		// We need a new instance of AbortController for each request.
		abortController.current =
			typeof AbortController === 'undefined'
				? undefined
				: new AbortController();
		isLoading.current = true;
		setPatterns( [] ); // Empty the previous results.
		fetchEntities(
			'/wp/v2/pattern-directory/patterns',
			{
				...options,
				per_page: options.per_page || defaultPerPage,
			},
			abortController
		)
			.then( ( fetchedPatterns ) => {
				isLoading.current = false;
				setPatterns( fetchedPatterns );
			} )
			.catch( ( error ) => {
				// Don't throw the error if we have aborted the request.
				if ( error.name !== 'AbortError' ) {
					throw error;
				}
			} );
		return () => abortController.current?.abort?.();
	}, [
		options.search,
		options.category,
		options.allowed_blocks,
		options.per_page,
	] );
	return [ patterns, isLoading.current ];
}
