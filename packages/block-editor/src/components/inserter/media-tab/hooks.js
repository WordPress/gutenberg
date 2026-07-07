/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/** @typedef {import('../../../store/actions').InserterMediaRequest} InserterMediaRequest */
/** @typedef {import('../../../store/actions').InserterMediaItem} InserterMediaItem */

/**
 * Fetches media items based on the provided category.
 * Each media category is responsible for providing a `fetch` function.
 *
 * @param {Object}               category   The media category to fetch results for.
 * @param {InserterMediaRequest} query      The query args to use for the request.
 * @param {any}                  refreshKey Optional value that, when changed, forces
 *                                          a refetch (e.g. after attaching/detaching).
 * @return {InserterMediaItem[]} The media results.
 */
export function useMediaResults( category, query = {}, refreshKey ) {
	const [ mediaList, setMediaList ] = useState();
	const [ isLoading, setIsLoading ] = useState( false );
	// We need to keep track of the last request made because
	// multiple request can be fired without knowing the order
	// of resolution, and we need to ensure we are showing
	// the results of the last request.
	// In the future we could use AbortController to cancel previous
	// requests, but we don't for now as it involves adding support
	// for this to `core-data` package.
	const lastRequestRef = useRef();
	const lastQueryKeyRef = useRef();
	const lastFetchRef = useRef();
	useEffect( () => {
		( async () => {
			const key = JSON.stringify( {
				category: category.name,
				...query,
			} );
			// Unique token so identical-query refreshes can't apply stale results.
			const request = {};
			lastRequestRef.current = request;
			setIsLoading( true );
			// Only clear the previous results when the category source or query
			// changes, not on a manual refresh (a `refreshKey` bump after
			// attach/detach). Keeping them lets the panel dim the existing grid
			// during the refetch instead of blanking it.
			if (
				lastQueryKeyRef.current !== key ||
				lastFetchRef.current !== category.fetch
			) {
				setMediaList( [] );
			}
			lastQueryKeyRef.current = key;
			lastFetchRef.current = category.fetch;
			const _media = await category.fetch?.( query );
			if ( request === lastRequestRef.current ) {
				setMediaList( _media );
				setIsLoading( false );
			}
		} )();
	}, [
		category.name,
		category.fetch,
		...Object.values( query ),
		refreshKey,
	] );
	return { mediaList, isLoading };
}

/**
 * Delays surfacing a loading state until a request has been in flight for
 * `delay` ms, so brief operations (e.g. a quick attach/detach refetch) don't
 * flash a loading indicator at all. Mirrors the DataViews `useDelayedLoading`
 * hook.
 *
 * @param {boolean} isLoading Whether a request is currently in flight.
 * @param {number}  delay     Milliseconds to wait before showing the loader.
 * @return {boolean} Whether the loading state should be shown yet.
 */
export function useDelayedLoading( isLoading, delay = 400 ) {
	const [ showLoading, setShowLoading ] = useState( false );
	useEffect( () => {
		if ( ! isLoading ) {
			return undefined;
		}
		const timeout = setTimeout( () => setShowLoading( true ), delay );
		return () => {
			clearTimeout( timeout );
			setShowLoading( false );
		};
	}, [ isLoading, delay ] );
	return showLoading;
}

export function useMediaCategories( rootClientId ) {
	const [ categories, setCategories ] = useState( [] );

	const inserterMediaCategories = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getInserterMediaCategories(),
		[]
	);
	const { canInsertImage, canInsertVideo, canInsertAudio } = useSelect(
		( select ) => {
			const { canInsertBlockType } = select( blockEditorStore );
			return {
				canInsertImage: canInsertBlockType(
					'core/image',
					rootClientId
				),
				canInsertVideo: canInsertBlockType(
					'core/video',
					rootClientId
				),
				canInsertAudio: canInsertBlockType(
					'core/audio',
					rootClientId
				),
			};
		},
		[ rootClientId ]
	);
	useEffect( () => {
		( async () => {
			const _categories = [];
			// If `inserterMediaCategories` is not defined in
			// block editor settings, do not show any media categories.
			if ( ! inserterMediaCategories ) {
				return;
			}
			// Loop through categories to check if they have at least one media item.
			const categoriesHaveMedia = new Map(
				await Promise.all(
					inserterMediaCategories.map( async ( category ) => {
						// Some sources are external and we don't need to make a request.
						if ( category.isExternalResource ) {
							return [ category.name, true ];
						}
						let results = [];
						try {
							results = await category.fetch( {
								per_page: 1,
							} );
						} catch {
							// If the request fails, we shallow the error and just don't show
							// the category, in order to not break the media tab.
						}
						return [ category.name, !! results.length ];
					} )
				)
			);
			// We need to filter out categories that don't have any media items or
			// whose corresponding block type is not allowed to be inserted, based
			// on the category's `mediaType`. A category that provides an
			// `emptyMessage` stays in the list even when empty, so it can show
			// that message (e.g. Attachments, to expose its "Attach" action).
			const canInsertMediaType = {
				image: canInsertImage,
				video: canInsertVideo,
				audio: canInsertAudio,
			};
			inserterMediaCategories.forEach( ( category ) => {
				if (
					canInsertMediaType[ category.mediaType ] &&
					( categoriesHaveMedia.get( category.name ) ||
						category.emptyMessage )
				) {
					_categories.push( category );
				}
			} );
			if ( !! _categories.length ) {
				setCategories( _categories );
			}
		} )();
	}, [
		canInsertImage,
		canInsertVideo,
		canInsertAudio,
		inserterMediaCategories,
	] );
	return categories;
}
