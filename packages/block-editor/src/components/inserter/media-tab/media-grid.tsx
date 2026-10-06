import type { ReactNode } from 'react';
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { DataViews } from '@wordpress/dataviews';
import type { Action, Field, View } from '@wordpress/dataviews';
import { Spinner } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import InserterDraggableBlocks from '../../inserter-draggable-blocks';
import { getBlockAndPreviewFromMedia, getItemId } from './utils';

type MediaType = 'image' | 'video' | 'audio';

/**
 * An `InserterMediaItem` (see the `registerInserterMediaCategory` typedef in
 * the store actions). Core sources spread the attachment record in, so `date`
 * is present for them and absent for external sources.
 */
type MediaItem = {
	id?: number;
	sourceId?: number | string;
	title?: string | { rendered?: string };
	url: string;
	previewUrl?: string;
	alt?: string;
	caption?: string;
	date?: string;
};

type MediaCategory = {
	name: string;
	mediaType: MediaType;
};

type MediaGridProps = {
	/**
	 * The items for the current page, or `undefined` before the first fetch.
	 */
	mediaList?: MediaItem[];
	isLoading: boolean;
	totalItems?: number;
	totalPages?: number;
	page: number;
	/**
	 * Items per page, as requested from the source by the panel.
	 */
	perPage: number;
	onChangePage: ( page: number ) => void;
	search: string;
	onChangeSearch: ( search: string ) => void;
	category: MediaCategory;
	/**
	 * Called with the item the reader chose to insert.
	 */
	onClickItem: ( item: MediaItem ) => void;
	/**
	 * The item whose insert is in flight, shown with a spinner.
	 */
	insertingId?: string;
	/**
	 * Per-item actions, shown in each card's menu.
	 */
	actions: Action< MediaItem >[];
	searchLabel: string;
	/**
	 * Rendered when there are no items to show.
	 */
	empty: ReactNode;
	/**
	 * Rendered beneath the pager (e.g. the attach button).
	 */
	footer?: ReactNode;
};

const EMPTY_ARRAY: MediaItem[] = [];
// A 120px minimum gives two columns at the inserter's width (the grid derives
// its column count from the container width and this size).
const GRID_LAYOUT = {
	previewSize: 120,
	density: 'compact',
	mediaFit: 'contain',
} as const;
const DEFAULT_LAYOUTS = { grid: { layout: GRID_LAYOUT } };

const getTitle = ( item: MediaItem ) =>
	typeof item.title === 'string'
		? item.title
		: item.title?.rendered || __( 'no title' );

function MediaGridPreview( {
	item,
	mediaType,
	isInserting,
}: {
	item: MediaItem;
	mediaType: MediaType;
	isInserting: boolean;
} ) {
	const [ block, preview ] = useMemo(
		() => getBlockAndPreviewFromMedia( item, mediaType ),
		[ item, mediaType ]
	);
	// The card's media area is the click-to-insert target (a DataViews click
	// wrapper); the preview inside it is what gets dragged onto the canvas. A
	// native drag doesn't emit a click, so the two don't collide.
	return (
		<InserterDraggableBlocks isEnabled blocks={ [ block ] }>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className="block-editor-inserter__media-grid__preview"
					draggable={ draggable }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
				>
					{ preview }
					{ isInserting && (
						<div className="block-editor-inserter__media-grid__spinner">
							<Spinner />
						</div>
					) }
				</div>
			) }
		</InserterDraggableBlocks>
	);
}

/**
 * Which items of the whole set this page holds, so "Page 3 of 42" is never
 * the only wayfinding.
 *
 * Derived from the page rather than from the items in hand, which are cleared
 * while the next page loads. The last page is clamped to the total.
 */
function getItemRange( {
	page,
	perPage,
	totalItems,
}: {
	page: number;
	perPage: number;
	totalItems: number;
} ) {
	if ( ! totalItems ) {
		return undefined;
	}
	const start = ( page - 1 ) * perPage + 1;
	return sprintf(
		/* translators: 1: The first item shown on the page. 2: The last item shown on the page. 3: The total number of items. */
		__( '%1$d–%2$d of %3$d' ),
		start,
		Math.min( page * perPage, totalItems ),
		totalItems
	);
}

/**
 * The redesigned media panel body: a DataViews grid with search above and a
 * pager below, composed from the DataViews sub-components so the view config,
 * layout switcher and bulk toolbar are left out.
 */
export default function MediaGrid( {
	mediaList,
	isLoading,
	totalItems,
	totalPages,
	page,
	perPage,
	onChangePage,
	search,
	onChangeSearch,
	category,
	onClickItem,
	insertingId,
	actions,
	searchLabel,
	empty,
	footer,
}: MediaGridProps ) {
	const { mediaType } = category;

	const fields: Field< MediaItem >[] = useMemo(
		() => [
			{
				id: 'preview',
				label: __( 'Preview' ),
				type: 'media',
				render: ( { item } ) => (
					<MediaGridPreview
						item={ item }
						mediaType={ mediaType }
						isInserting={ getItemId( item ) === insertingId }
					/>
				),
			},
			{
				// Hidden from the card but used as its accessible name.
				id: 'title',
				label: __( 'Title' ),
				type: 'text',
				getValue: ( { item } ) => getTitle( item ),
				enableSorting: false,
				enableGlobalSearch: false,
			},
		],
		[ mediaType, insertingId ]
	);

	const view: View = useMemo(
		() => ( {
			type: 'grid',
			page,
			perPage,
			search,
			fields: [],
			titleField: 'title',
			mediaField: 'preview',
			showTitle: false,
			showMedia: true,
			layout: GRID_LAYOUT,
		} ),
		[ page, perPage, search ]
	);

	// The panel owns page and search, so changes are forwarded to it rather
	// than stored here.
	const onChangeView = useCallback(
		( nextView: View ) => {
			const nextSearch = nextView.search ?? '';
			if ( nextSearch !== search ) {
				onChangeSearch( nextSearch );
			}
			const nextPage = nextView.page ?? 1;
			if ( nextPage !== page ) {
				onChangePage( nextPage );
			}
		},
		[ search, page, onChangeSearch, onChangePage ]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems: totalItems ?? 0,
			totalPages: totalPages ?? 1,
		} ),
		[ totalItems, totalPages ]
	);
	const showPagination = paginationInfo.totalPages > 1;
	const hasFooter = showPagination || !! footer;
	const itemRange = getItemRange( {
		page,
		perPage,
		totalItems: paginationInfo.totalItems,
	} );

	return (
		<DataViews
			data={ mediaList ?? EMPTY_ARRAY }
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
			actions={ actions }
			// Until the first fetch resolves there is nothing to show, so
			// count that as loading rather than as an empty result.
			isLoading={ isLoading || mediaList === undefined }
			paginationInfo={ paginationInfo }
			defaultLayouts={ DEFAULT_LAYOUTS }
			getItemId={ getItemId }
			onClickItem={ onClickItem }
			empty={ empty }
		>
			<div className="block-editor-inserter__media-grid__search">
				<DataViews.Search label={ searchLabel } />
			</div>
			<DataViews.Layout className="block-editor-inserter__media-grid" />
			{ hasFooter && (
				<Stack
					direction="column"
					gap="sm"
					className="block-editor-inserter__media-grid__footer"
				>
					{ showPagination && (
						<Stack
							direction="row"
							justify="space-between"
							align="center"
							gap="sm"
						>
							<span className="block-editor-inserter__media-grid__range">
								{ itemRange }
							</span>
							<DataViews.Pagination />
						</Stack>
					) }
					{ footer }
				</Stack>
			) }
		</DataViews>
	);
}
