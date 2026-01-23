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
 * @param {Object}               category The media category to fetch results for.
 * @param {InserterMediaRequest} query    The query args to use for the request.
 * @return {InserterMediaItem[]} The media results.
 */
export function useMediaResults( category, query = {} ) {
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
	useEffect( () => {
		( async () => {
			const key = JSON.stringify( {
				category: category.name,
				...query,
			} );
			lastRequestRef.current = key;
			setIsLoading( true );
			setMediaList( [] ); // Empty the previous results.
			const _media = await category.fetch?.( query );
			if ( key === lastRequestRef.current ) {
				setMediaList( _media );
				setIsLoading( false );
			}
		} )();
	}, [ category.name, ...Object.values( query ) ] );
	return { mediaList, isLoading };
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
						} catch ( e ) {
							// If the request fails, we shallow the error and just don't show
							// the category, in order to not break the media tab.
						}
						return [ category.name, !! results.length ];
					} )
				)
			);
			// We need to filter out categories that don't have any media items or
			// whose corresponding block type is not allowed to be inserted, based
			// on the category's `mediaType`.
			const canInsertMediaType = {
				image: canInsertImage,
				video: canInsertVideo,
				audio: canInsertAudio,
			};
			inserterMediaCategories.forEach( ( category ) => {
				if (
					canInsertMediaType[ category.mediaType ] &&
					categoriesHaveMedia.get( category.name )
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
