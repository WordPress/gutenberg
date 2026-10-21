import { useEffect, useState, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import type {
	InserterMediaCategory,
	InserterMediaItem,
	InserterMediaRequest,
	InserterMediaResponse,
} from '../../../store/types';

interface NormalizedFetchResult {
	mediaItems: InserterMediaItem[];
	totalItems?: number;
	totalPages?: number;
}

const EMPTY_MEDIA_LIST: InserterMediaItem[] = [];

/**
 * Normalizes the result of a media category's `fetch`, which may be either a
 * plain array of media items or an `InserterMediaResponse` carrying pagination
 * totals. Sources that don't report totals leave them `undefined`, which is how
 * the panel knows to hide the pager.
 *
 * @param result The raw `fetch` result.
 * @return The normalized result.
 */
function normalizeFetchResult(
	result: InserterMediaItem[] | InserterMediaResponse | undefined
): NormalizedFetchResult {
	if ( Array.isArray( result ) ) {
		return { mediaItems: result };
	}
	return {
		mediaItems: result?.mediaItems ?? [],
		totalItems: result?.totalItems,
		totalPages: result?.totalPages,
	};
}

/**
 * Fetches media items based on the provided category.
 * Each media category is responsible for providing a `fetch` function.
 *
 * @param category   The media category to fetch results for.
 * @param query      The query args to use for the request.
 * @param refreshKey Optional value that, when changed, forces
 *                   a refetch (e.g. after attaching/detaching).
 * @return The media results and paging totals.
 */
export function useMediaResults(
	category: Pick< InserterMediaCategory, 'name' > &
		Partial< Pick< InserterMediaCategory, 'fetch' > >,
	query: Partial< InserterMediaRequest > = {},
	refreshKey?: unknown
): {
	mediaList: InserterMediaItem[];
	isLoading: boolean;
	isSwitchingSource: boolean;
	totalItems: number | undefined;
	totalPages: number | undefined;
} {
	const [ mediaList, setMediaList ] = useState< InserterMediaItem[] >();
	// Which source produced the `mediaList`. Lets the return value go empty
	// during render when a different source is asked for, which is a render
	// earlier than the effect below can manage. See the note on the return.
	const [ resolvedSource, setResolvedSource ] = useState< string >();
	const [ totals, setTotals ] = useState<
		Pick< NormalizedFetchResult, 'totalItems' | 'totalPages' >
	>( {} );
	const [ isLoading, setIsLoading ] = useState( false );
	// We need to keep track of the last request made because
	// multiple request can be fired without knowing the order
	// of resolution, and we need to ensure we are showing
	// the results of the last request.
	// In the future we could use AbortController to cancel previous
	// requests, but we don't for now as it involves adding support
	// for this to `core-data` package.
	const lastRequestRef = useRef< object >( undefined );
	const lastQueryKeyRef = useRef< string >( undefined );
	const lastFetchRef =
		useRef< InserterMediaCategory[ 'fetch' ] >( undefined );
	const lastSourceRef = useRef< string >( undefined );
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
			// Clear the previous results when the query changes, but not on a
			// manual refresh (a `refreshKey` bump after attach/detach), where
			// keeping them lets the panel dim the existing grid rather than
			// blank it. A source change is handled on the return instead,
			// where clearing happens a render earlier.
			if (
				lastQueryKeyRef.current !== key ||
				lastFetchRef.current !== category.fetch
			) {
				setMediaList( [] );
			}
			// Reset paging totals only when the source (category or its `fetch`)
			// changes, so switching to an array-returning source doesn't leave a
			// stale pager showing. A mere page change keeps the previous totals,
			// which is what holds the footer mounted while the next page loads.
			if (
				lastSourceRef.current !== category.name ||
				lastFetchRef.current !== category.fetch
			) {
				setTotals( {} );
			}
			lastQueryKeyRef.current = key;
			lastFetchRef.current = category.fetch;
			lastSourceRef.current = category.name;
			// Omit the default first page so sources that forward the query to a
			// strict external API don't receive an unexpected `page` arg.
			const { page, ...queryWithoutPage } = query;
			// A missing page compares false.
			const fetchQuery =
				( page as number ) > 1 ? query : queryWithoutPage;
			const { mediaItems, totalItems, totalPages } = normalizeFetchResult(
				// Sources treat a missing query arg as unset.
				await category.fetch?.( fetchQuery as InserterMediaRequest )
			);
			if ( request === lastRequestRef.current ) {
				// Set together so the grid and the pager never disagree.
				setMediaList( mediaItems );
				setResolvedSource( category.name );
				setTotals( { totalItems, totalPages } );
				setIsLoading( false );
			}
		} )();
	}, [
		category.name,
		category.fetch,
		...Object.values( query ),
		refreshKey,
	] );
	// `DataViews` holds on to the last non-empty list it was given while a
	// fetch is in flight, which is what keeps the current page visible while
	// the next one loads. A source change isn't the next page though, so the
	// list has to be empty before the fetch starts: clearing it in the effect
	// above would be one render too late, by which point `DataViews` has
	// already taken a copy. Report empty until the requested source resolves.
	const isSwitchingSource = resolvedSource !== category.name;
	return {
		// The list is set with the resolved source.
		mediaList: isSwitchingSource ? EMPTY_MEDIA_LIST : mediaList!,
		isLoading,
		isSwitchingSource,
		// Held back too, so the pager can't show the previous source's totals.
		totalItems: isSwitchingSource ? undefined : totals.totalItems,
		totalPages: isSwitchingSource ? undefined : totals.totalPages,
	};
}

/**
 * The media categories available, and whether or not the list has been resolved.
 * `hasResolved` allows a consumer to distinguish between "no categories available"
 * and "still determining available categories." (i.e. categories are loading)
 *
 * @param rootClientId The client id of the insertion point.
 * @return The categories, and whether they have been worked out yet.
 */
export function useMediaCategories( rootClientId?: string | null ): {
	categories: InserterMediaCategory[];
	hasResolved: boolean;
} {
	const [ categories, setCategories ] = useState< InserterMediaCategory[] >(
		[]
	);
	// Stays true once set: a later run (the insertion point moved, say)
	// refreshes the list in place rather than emptying the tab again.
	const [ hasResolved, setHasResolved ] = useState( false );

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
			const _categories: InserterMediaCategory[] = [];
			// If `inserterMediaCategories` is not defined in
			// block editor settings, do not show any media categories.
			if ( ! inserterMediaCategories ) {
				setHasResolved( true );
				return;
			}
			// Loop through categories to check if they have at least one media item.
			const categoriesHaveMedia = new Map(
				await Promise.all(
					inserterMediaCategories.map(
						async (
							category: InserterMediaCategory
						): Promise< [ string, boolean ] > => {
							// Some sources are external and we don't need to make a request.
							if ( category.isExternalResource ) {
								return [ category.name, true ];
							}
							let results: InserterMediaItem[] = [];
							try {
								const { mediaItems } = normalizeFetchResult(
									// Sources treat a missing search as none.
									await category.fetch( {
										per_page: 1,
									} as InserterMediaRequest )
								);
								results = mediaItems;
							} catch {
								// If the request fails, we shallow the error and just don't show
								// the category, in order to not break the media tab.
							}
							return [ category.name, !! results.length ];
						}
					)
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
			inserterMediaCategories.forEach(
				( category: InserterMediaCategory ) => {
					if (
						canInsertMediaType[ category.mediaType ] &&
						( categoriesHaveMedia.get( category.name ) ||
							category.emptyMessage )
					) {
						_categories.push( category );
					}
				}
			);
			if ( !! _categories.length ) {
				setCategories( _categories );
			}
			setHasResolved( true );
		} )();
	}, [
		canInsertImage,
		canInsertVideo,
		canInsertAudio,
		inserterMediaCategories,
	] );
	return { categories, hasResolved };
}
