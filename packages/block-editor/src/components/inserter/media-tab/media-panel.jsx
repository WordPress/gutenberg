import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import MediaGrid from './media-grid';
import { useMediaResults } from './hooks';
import { useMediaInsert } from './use-media-insert';
import { useAttachmentActions } from './use-attachment-actions';
import AttachImagesButton from './attach-images-button';
import InsertExternalImageModal from './insert-external-image-modal';
import { getBlockAndPreviewFromMedia, getItemId } from './utils';
import InserterNoResults from '../no-results';

// Four rows at the grid's two columns: roughly one screen of the open panel,
// so a page is browsed with little scrolling and the pager does the rest.
const MEDIA_ITEMS_PER_PAGE = 8;

export function MediaCategoryPanel( {
	onInsert,
	category,
	search,
	onChangeSearch,
	mediaTypes,
	mediaType,
	onChangeMediaType,
	sourceMenu,
	footer,
} ) {
	const [ page, setPage ] = useState( 1 );
	// Reset paging whenever the source category or the search term changes.
	// Adjusting state during render (rather than in an effect) keeps the query
	// on page 1 for the very next fetch, avoiding a wasted request for the
	// previous page. Mirrors `usePatternsPaging`.
	const previousCategory = usePrevious( category.name );
	const previousSearch = usePrevious( search );
	if (
		( previousCategory !== category.name || previousSearch !== search ) &&
		page !== 1
	) {
		setPage( 1 );
	}
	const query = useMemo(
		() => ( {
			per_page: MEDIA_ITEMS_PER_PAGE,
			page,
			search,
		} ),
		[ page, search ]
	);
	const { actions, attach, handleAttach, refreshKey } = useAttachmentActions(
		{ category, query }
	);
	const { mediaList, isLoading, totalItems, totalPages } = useMediaResults(
		category,
		query,
		refreshKey
	);
	const numPages = totalPages || 1;
	// If the current set shrinks below the active page (e.g. detaching images
	// empties the last page), clamp back into range so the grid isn't left blank
	// on a page that no longer exists.
	if ( typeof totalPages === 'number' && page > numPages ) {
		setPage( numPages );
	}
	const panelRef = useRef();
	const changePage = useCallback( ( nextPage ) => {
		// The grid's layout container is the scroll host; start the new page
		// from the top rather than wherever the previous one was scrolled to.
		panelRef.current
			?.querySelector( '.dataviews-layout__container' )
			?.scrollTo?.( 0, 0 );
		setPage( nextPage );
	}, [] );
	// Inserting lives here alongside attach and detach, so every operation on
	// the panel's media — and every notice one raises — comes from one place.
	const {
		insert,
		insertingId,
		pendingExternalBlock,
		confirmExternalInsert,
		cancelExternalInsert,
	} = useMediaInsert( onInsert );
	const handleClickItem = useCallback(
		( item ) => {
			const [ block ] = getBlockAndPreviewFromMedia(
				item,
				category.mediaType
			);
			insert( block, getItemId( item ) );
		},
		[ insert, category.mediaType ]
	);

	const searchLabel = category.labels.search_items || __( 'Search' );
	const emptyMessage =
		category.emptyMessage && ! search
			? // For a source with a custom empty message (e.g. Attachments)
				// and no active search, an empty result means nothing is
				// attached yet — clearer than the generic "no results found".
				category.emptyMessage
			: __( 'No results found.' );

	return (
		<div ref={ panelRef } className="block-editor-inserter__media-panel">
			<MediaGrid
				mediaList={ mediaList }
				isLoading={ isLoading }
				totalItems={ totalItems }
				totalPages={ totalPages }
				page={ page }
				perPage={ MEDIA_ITEMS_PER_PAGE }
				onChangePage={ changePage }
				search={ search }
				onChangeSearch={ onChangeSearch }
				category={ category }
				onClickItem={ handleClickItem }
				insertingId={ insertingId }
				actions={ actions }
				searchLabel={ searchLabel }
				empty={
					<InserterNoResults>{ emptyMessage }</InserterNoResults>
				}
				sourceMenu={ sourceMenu }
				mediaTypes={ mediaTypes }
				mediaType={ mediaType }
				onChangeMediaType={ onChangeMediaType }
				// A source that owns the post's attachments offers its own
				// footer action, in place of the shared one.
				footer={
					attach ? (
						<AttachImagesButton onSelect={ handleAttach } />
					) : (
						footer
					)
				}
			/>
			{ pendingExternalBlock && (
				<InsertExternalImageModal
					onClose={ cancelExternalInsert }
					onSubmit={ confirmExternalInsert }
				/>
			) }
		</div>
	);
}
