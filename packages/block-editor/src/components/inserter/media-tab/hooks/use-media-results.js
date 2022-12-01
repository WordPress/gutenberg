/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../../store';
import { fetchExternalMedia } from './use-external-media-results';

// TODO: check how to clean this up and when(maybe WeakMap could be used..?).
const CACHE = new Map();

/**
 * Interface for media requests.
 *
 * @typedef {Object} InserterMediaRequest
 * @property {number} per_page     How many items to fetch per page.
 * @property {string} search       The search term to use for filtering the results.
 * @property {string} [media_type] The media type to fetch. This is usefull for sources that support multiple media types.
 * @property {string} [orderBy]    Order by clause to sort the results.
 */

/**
 * Interface for media responses.
 * TODO: in progress..
 *
 * @typedef {Object} InserterMediaResponse
 * @property {string} title The title of the media item.
 */

/**
 * Fetches media items based on the provided category.
 * For internal media sources, it uses the `__unstableFetchMedia` block editor setting.
 * For external media sources, it uses the `__experimentalFetchLinkSuggestions` block editor setting.
 *
 * @param {Object}               category The media category to fetch results for.
 * @param {InserterMediaRequest} options  The options to use for the request.
 * @return {InserterMediaResponse[]} The media results.
 */
export function useMediaResults( category, options = {} ) {
	const abortController = useRef();
	const [ results, setResults ] = useState();
	const isLoading = useRef();
	const settings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	useEffect( () => {
		( async () => {
			const requestArgs = { ...options, ...category.defaultRequestArgs };
			const key = JSON.stringify( {
				category: category.name,
				...requestArgs,
			} );
			if ( CACHE.has( key ) ) {
				isLoading.current = false;
				setResults( CACHE.get( key ) );
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
			setResults( [] ); // Empty the previous results.
			// TODO: We have to abort any request because if we don't
			// It can lead to wrong results being displayed.
			// Currently __unstableFetchMedia doesn't support aborting and
			// we need either to handle it somewhow here(update the logic),
			// or enforce the support to abort in every __unstableFetchMedia implementation.
			const fetchMethod =
				category.type !== 'external'
					? settings?.__unstableFetchMedia
					: fetchExternalMedia;
			try {
				const _media = await fetchMethod?.(
					{ ...requestArgs },
					category,
					abortController.current
				);
				// TODO: need to map results to InserterMediaResponse interface.
				CACHE.set( key, _media );
				isLoading.current = false;
				setResults( _media );
			} catch ( error ) {
				// Don't throw the error if we have aborted the request.
				if ( error.name !== 'AbortError' ) {
					throw error;
				}
			}
		} )();
		return () => abortController.current?.abort?.();
	}, [ category.name, ...Object.values( options ) ] );
	// TODO: I'll probably need to add a `loading` state.
	return results;
}
