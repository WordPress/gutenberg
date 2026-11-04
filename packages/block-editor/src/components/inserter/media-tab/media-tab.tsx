import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import type { Block } from '@wordpress/blocks';
import { useMediaCategories } from './hooks';
import { getBlockAndPreviewFromMedia } from './utils';
import { MediaCategoryPanel } from './media-panel';
import MediaLibraryButton from './media-library-button';
import SourceMenu from './source-menu';
import FolderSelect from './folder-select';
import NewFolderModal from './new-folder-modal';
import InserterNoResults from '../no-results';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import type { MediaCategory, MediaType } from './types';
import type { MediaFolder } from './folder-select';

/**
 * The media folders capability the host editor supplies, behind the
 * `gutenberg-media-folders` experiment. `block-editor` is WordPress-agnostic
 * and can't read or write a taxonomy itself, so the terms and the writer both
 * arrive as a setting. `undefined` whenever folders are unavailable, which is
 * what hides every folder affordance.
 */
type MediaFolders = {
	folders: MediaFolder[];
	canCreate: boolean;
	create: ( name: string ) => Promise< MediaFolder >;
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
const DEFAULT_MEDIA_TYPE: MediaType = 'image';

/**
 * The inserter's Media tab: one search, a source menu, and a tab per media
 * type when browsing the library. The selection resolves to a single
 * registered category, which the panel below fetches and renders.
 */
function MediaTab( {
	rootClientId,
	onInsert,
}: {
	rootClientId?: string | null;
	/**
	 * Called with the block to insert.
	 */
	onInsert: ( block: Block ) => void;
} ) {
	const { categories: mediaCategories, hasResolved } =
		useMediaCategories( rootClientId );
	const mediaFolders = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getInserterMediaFolders() as
				MediaFolders | undefined,
		[]
	);

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
	const [ mediaType, setMediaType ] =
		useState< MediaType >( DEFAULT_MEDIA_TYPE );
	// Kept here rather than in the panel so a term survives switching tab or
	// source: the tab has one search box, so it should hold one term.
	const [ search, setSearch ] = useState( '' );
	// Likewise the folder, so it survives switching media type, and is still
	// there on returning to a source that has folders.
	const [ folder, setFolder ] = useState< number | undefined >();
	const [ isCreatingFolder, setIsCreatingFolder ] = useState( false );

	// A folder deleted elsewhere leaves nothing to filter by. Only once some
	// folders are known, so a list still loading doesn't drop the selection.
	if (
		folder !== undefined &&
		mediaFolders?.folders.length &&
		! mediaFolders.folders.some( ( { id } ) => id === folder )
	) {
		setFolder( undefined );
	}

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
		// Before the categories resolve there is nothing to show yet, which
		// isn't the same as having nothing to show.
		return hasResolved ? <InserterNoResults /> : null;
	}

	// Folders only apply to a source whose items can be filed into them.
	const folders = category.supportsFolders
		? mediaFolders?.folders
		: undefined;
	// With no folders yet and no means to add one there is nothing to offer.
	const hasFolderControl =
		!! folders && ( !! folders.length || !! mediaFolders?.canCreate );

	return (
		<>
			<MediaCategoryPanel
				category={ category }
				onInsert={ onInsert }
				search={ search }
				onChangeSearch={ setSearch }
				mediaTypes={ mediaTypes }
				mediaType={ category.mediaType }
				onChangeMediaType={ setMediaType }
				folder={ folder }
				folderControl={
					hasFolderControl ? (
						<FolderSelect
							folders={ folders }
							value={ folder }
							onChange={ setFolder }
							onCreate={
								mediaFolders?.canCreate
									? () => setIsCreatingFolder( true )
									: undefined
							}
						/>
					) : undefined
				}
				sourceMenu={
					sources.length > 1 ? (
						<SourceMenu
							sources={ sources }
							value={ activeSource.name }
							onChange={ setSourceName }
						/>
					) : undefined
				}
				footer={
					<MediaLibraryButton
						label={ __( 'Open Media Library' ) }
						onSelect={ onSelectMedia }
						allowedTypes={ ALLOWED_MEDIA_TYPES }
					/>
				}
			/>
			{ isCreatingFolder && mediaFolders && (
				<NewFolderModal
					create={ mediaFolders.create }
					// Browse what was just made, which is also where the "Add to
					// folder" action will be.
					onCreated={ ( newFolder ) => {
						setFolder( newFolder.id );
						setIsCreatingFolder( false );
					} }
					onClose={ () => setIsCreatingFolder( false ) }
				/>
			) }
		</>
	);
}

export default MediaTab;
