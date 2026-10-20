import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { Spinner as WCSpinner } from '@wordpress/components';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';
import MediaGrid from './media-grid';
import { useMediaResults } from './hooks';
import { useMediaInsert } from './use-media-insert';
import { useAttachmentActions } from './use-attachment-actions';
import MediaLibraryButton from './media-library-button';
import InsertExternalImageModal from './insert-external-image-modal';
import { getBlockAndPreviewFromMedia, getItemId } from './utils';
import InserterNoResults from '../no-results';

// Items per page by window height. The grid is two columns, so pages step by
// rows of two, and each threshold is `chrome + rows * row height`:
//
// - Row height, 167px: a tile plus the gap under it. Measure a
//   `.dataviews-view-grid__row` and add the grid's `row-gap`.
// - Chrome, 381px: everything else stacked around the grid, from the editor
//   header down to the footer button. Measure `window.innerHeight` minus the
//   grid's height, on the library tabs: they carry the most chrome, so other
//   sources under-fill rather than overshoot into a scrollbar.
//
// Either number drifting leaves a page over- or under-filled by a row. The
// largest entry is the tallest window worth planning for, not an API limit.
const MIN_ITEMS_PER_PAGE = 8;
const ITEMS_PER_PAGE_BY_WINDOW_HEIGHT = [
	[ 2060, 20 ],
	[ 1890, 18 ],
	[ 1720, 16 ],
	[ 1550, 14 ],
	[ 1390, 12 ],
	[ 1220, 10 ],
];

function getItemsPerPage() {
	if ( typeof window === 'undefined' ) {
		return MIN_ITEMS_PER_PAGE;
	}
	const band = ITEMS_PER_PAGE_BY_WINDOW_HEIGHT.find(
		( [ height ] ) => window.innerHeight >= height
	);
	return band?.[ 1 ] ?? MIN_ITEMS_PER_PAGE;
}

// The attach flow is image-only, so the picker is constrained to images.
const ATTACH_ALLOWED_TYPES = [ 'image' ];

// The media-type and source props pass through to the grid: they belong to
// the tab, but render inside its `DataViews`.
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
	const panelRef = useRef();
	const [ page, setPage ] = useState( 1 );
	const [ perPage, setPerPage ] = useState( getItemsPerPage );
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
	// Only taken again on a source change, so a resize doesn't move the items
	// under the reader. `previousCategory` is still the old name on the
	// re-render this triggers, so the value comparison is what ends it.
	if ( previousCategory !== category.name ) {
		const nextPerPage = getItemsPerPage();
		if ( nextPerPage !== perPage ) {
			setPerPage( nextPerPage );
		}
	}
	const query = useMemo(
		() => ( {
			per_page: perPage,
			page,
			search,
		} ),
		[ perPage, page, search ]
	);
	const { actions, attach, handleAttach, refreshKey } = useAttachmentActions(
		{ category, query }
	);
	const { mediaList, isLoading, isSwitchingSource, totalItems, totalPages } =
		useMediaResults( category, query, refreshKey );
	const numPages = totalPages || 1;
	// If the current set shrinks below the active page (e.g. detaching images
	// empties the last page), clamp back into range so the grid isn't left blank
	// on a page that no longer exists.
	if ( typeof totalPages === 'number' && page > numPages ) {
		setPage( numPages );
	}
	const changePage = useCallback( ( nextPage ) => {
		// Start the new page from the top rather than wherever the previous
		// one was scrolled to. Same approach as `usePatternsPaging`: the panel
		// doesn't scroll itself, so find whichever ancestor does.
		// `scrollTo` is guarded because jsdom leaves it undefined.
		getScrollContainer( panelRef.current )?.scrollTo?.( 0, 0 );
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
				// While loading, `DataViews` goes on showing the items it
				// already has. After a source change those belong to the
				// previous source, so tell it nothing is loading and let the
				// placeholder below cover the source switch.
				isLoading={ isLoading && ! isSwitchingSource }
				totalItems={ totalItems }
				totalPages={ totalPages }
				page={ page }
				perPage={ perPage }
				onChangePage={ changePage }
				search={ search }
				onChangeSearch={ onChangeSearch }
				onClickItem={ handleClickItem }
				insertingId={ insertingId }
				actions={ actions }
				searchLabel={ searchLabel }
				// Shown whenever the grid has no items, so during a fetch the
				// placeholder stands in for the results to come. Only a source
				// change replaces a loaded grid, so only it reserves height.
				empty={
					isLoading || isSwitchingSource ? (
						<div
							className={ clsx(
								'block-editor-inserter__media-grid__loading',
								{ 'is-replacing-results': isSwitchingSource }
							) }
						>
							<WCSpinner />
						</div>
					) : (
						<InserterNoResults>{ emptyMessage }</InserterNoResults>
					)
				}
				sourceMenu={ sourceMenu }
				mediaTypes={ mediaTypes }
				mediaType={ mediaType }
				onChangeMediaType={ onChangeMediaType }
				// A source that owns the post's attachments offers its own
				// footer action, in place of the shared one.
				footer={
					attach ? (
						<MediaLibraryButton
							label={ __( 'Attach images' ) }
							title={ __( 'Attach images' ) }
							onSelect={ handleAttach }
							// Purely additive: the picker opens with nothing
							// preselected, so it never implies that deselecting
							// would detach. Detaching is a per-item action.
							multiple="add"
							allowedTypes={ ATTACH_ALLOWED_TYPES }
						/>
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
