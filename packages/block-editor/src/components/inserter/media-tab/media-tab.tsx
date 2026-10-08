import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMediaCategories } from './hooks';
import { getBlockAndPreviewFromMedia } from './utils';
import { MediaCategoryPanel } from './media-panel';
import MediaLibraryButton from './media-library-button';
import SourceMenu from './source-menu';
import InserterNoResults from '../no-results';

type MediaType = 'image' | 'video' | 'audio';

type MediaCategory = {
	name: string;
	label: string;
	mediaType: string;
	attach?: unknown;
};

const ALLOWED_MEDIA_TYPES = [ 'image', 'video', 'audio' ];

// The categories that together make up the media library: one per media type,
// shown as tabs rather than as separate sources. Everything else a category
// can be — the post's attached images, Openverse, anything registered through
// the public API — is a source of its own. So a source is not a category: this
// set collapses into the one "Media library" source.
// TODO: `InserterMediaCategory` has no notion of grouping, so this matches by
// name. A `group` property on the registration API would do this properly.
const LIBRARY_CATEGORIES = [ 'images', 'videos', 'audio' ];

const LIBRARY_SOURCE = 'media-library';
const DEFAULT_MEDIA_TYPE = 'image';

/**
 * The inserter's Media tab: one search, a source menu, and a tab per media
 * type when browsing the library. The selection resolves to a single
 * registered category, which the panel below fetches and renders.
 */
function MediaTab( {
	rootClientId,
	onInsert,
}: {
	rootClientId?: string;
	/**
	 * Called with the block to insert.
	 */
	onInsert: ( block: unknown ) => void;
} ) {
	const mediaCategories = useMediaCategories( rootClientId );

	// `MediaLibraryButton` hands the selection over untyped, since what the
	// modal returns depends on which picker the `editor.MediaUpload` filter
	// installed.
	const onSelectMedia = useCallback(
		( media: unknown ) => {
			const item = media as {
				url?: string;
				mime_type?: string;
				type?: MediaType;
			};
			if ( ! item?.url ) {
				return;
			}
			// When the experimental DataViews media modal is enabled,
			// we need to extract the media type from mime_type (e.g., 'image/jpeg' -> 'image')
			const isDataViewsModal = (
				window as Window & {
					__experimentalDataViewsMediaModal?: boolean;
				}
			 ).__experimentalDataViewsMediaModal;
			const mediaType =
				isDataViewsModal && item.mime_type
					? ( item.mime_type.split( '/' )[ 0 ] as MediaType )
					: item.type;
			// Without a type there is no block to build, so there is nothing
			// useful to insert.
			if ( ! mediaType ) {
				return;
			}
			const [ block ] = getBlockAndPreviewFromMedia(
				{ ...item, url: item.url },
				mediaType
			);
			onInsert( block );
		},
		[ onInsert ]
	);

	const categories: MediaCategory[] = useMemo(
		() =>
			mediaCategories.map( ( mediaCategory ) => ( {
				...mediaCategory,
				label: mediaCategory.labels.name,
			} ) ),
		[ mediaCategories ]
	);

	const { libraryCategories, sources } = useMemo( () => {
		const library = categories.filter( ( category ) =>
			LIBRARY_CATEGORIES.includes( category.name )
		);
		return {
			libraryCategories: library,
			sources: [
				...( library.length
					? [ { name: LIBRARY_SOURCE, label: __( 'Media library' ) } ]
					: [] ),
				...categories
					.filter(
						( category ) =>
							! LIBRARY_CATEGORIES.includes( category.name )
					)
					.map( ( { name, label } ) => ( { name, label } ) ),
			],
		};
	}, [ categories ] );

	const [ sourceName, setSourceName ] = useState( LIBRARY_SOURCE );
	const [ mediaType, setMediaType ] = useState( DEFAULT_MEDIA_TYPE );
	// Kept here rather than in the panel so a term survives switching tab or
	// source: the tab has one search box, so it should hold one term.
	const [ search, setSearch ] = useState( '' );

	// The source list is derived from what the editor can insert and what has
	// items, so a selection can stop being available.
	const activeSource =
		sources.find( ( source ) => source.name === sourceName ) ??
		sources[ 0 ];
	const isLibrary = activeSource?.name === LIBRARY_SOURCE;

	const mediaTypes = isLibrary
		? libraryCategories.map( ( category ) => ( {
				value: category.mediaType,
				label: category.label,
			} ) )
		: [];

	const category = isLibrary
		? ( libraryCategories.find(
				( candidate ) => candidate.mediaType === mediaType
			) ?? libraryCategories[ 0 ] )
		: categories.find(
				( candidate ) => candidate.name === activeSource?.name
			);

	if ( ! category ) {
		return <InserterNoResults />;
	}

	const footer: ReactNode = (
		<MediaLibraryButton
			label={ __( 'Open Media Library' ) }
			onSelect={ onSelectMedia }
			allowedTypes={ ALLOWED_MEDIA_TYPES }
		/>
	);

	return (
		<MediaCategoryPanel
			category={ category }
			onInsert={ onInsert }
			search={ search }
			onChangeSearch={ setSearch }
			mediaTypes={ mediaTypes }
			mediaType={ category.mediaType }
			onChangeMediaType={ setMediaType }
			sourceMenu={
				sources.length > 1 && (
					<SourceMenu
						sources={ sources }
						value={ activeSource.name }
						onChange={ setSourceName }
					/>
				)
			}
			footer={ footer }
		/>
	);
}

export default MediaTab;
