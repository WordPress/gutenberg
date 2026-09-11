import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { DataViews } from '@wordpress/dataviews';
import type { Action, Field, View } from '@wordpress/dataviews';
import { Spinner } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { dateI18n } from '@wordpress/date';
import InserterDraggableBlocks from '../../inserter-draggable-blocks';
import { getBlockAndPreviewFromMedia } from './utils';
import { useMediaInsert } from './use-media-insert';
import InsertExternalImageModal from './insert-external-image-modal';

type MediaType = 'image' | 'video' | 'audio';

/**
 * An `InserterMediaItem` (see the `registerInserterMediaCategory` typedef in
 * the store actions). Core sources spread the attachment record in, so `date`
 * is present for them and absent for external sources.
 */
export type MediaItem = {
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
	 * Called with the block to insert.
	 */
	onInsert: ( block: unknown ) => void;
	/**
	 * Per-item actions, shown in each card's menu.
	 */
	actions: Action< MediaItem >[];
	searchLabel: string;
	/**
	 * Rendered between the search and the grid (e.g. the folder filter).
	 */
	filters?: ReactNode;
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

const getItemId = ( item: MediaItem ) => String( item.id ?? item.sourceId );
const isItemClickable = () => true;
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
 * The span of dates covered by the page, newest first, so "Page 3 of 42" is
 * never the only wayfinding. Only meaningful for date-ordered results.
 */
function getDateSpan( mediaList?: MediaItem[] ) {
	const first = mediaList?.[ 0 ]?.date;
	const last = mediaList?.[ mediaList.length - 1 ]?.date;
	if ( ! first || ! last ) {
		return undefined;
	}
	const newest = dateI18n( 'M Y', first, undefined );
	const oldest = dateI18n( 'M Y', last, undefined );
	if ( newest === oldest ) {
		return newest;
	}
	// Within one year the year is only said once ("Jul – May 2024"), which
	// keeps the span on one line beside the pager in the common case.
	if (
		dateI18n( 'Y', first, undefined ) === dateI18n( 'Y', last, undefined )
	) {
		return sprintf(
			/* translators: 1: The newest month on the page, e.g. "Jul". 2: The oldest month on the page, e.g. "May". 3: The year, e.g. "2024". */
			__( '%1$s – %2$s %3$s' ),
			dateI18n( 'M', first, undefined ),
			dateI18n( 'M', last, undefined ),
			dateI18n( 'Y', first, undefined )
		);
	}
	return sprintf(
		/* translators: 1: The newest month on the page, e.g. "Jul 2024". 2: The oldest month on the page, e.g. "May 2024". */
		__( '%1$s – %2$s' ),
		newest,
		oldest
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
	onInsert,
	actions,
	searchLabel,
	filters,
	empty,
	footer,
}: MediaGridProps ) {
	const {
		insert,
		insertingId,
		pendingExternalBlock,
		confirmExternalInsert,
		cancelExternalInsert,
	} = useMediaInsert( onInsert );
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
						isInserting={
							insertingId !== undefined &&
							getItemId( item ) === String( insertingId )
						}
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

	// The panel owns page and search; the view is derived from them, so a
	// change coming back from DataViews (its search input, pager, or page
	// clamp) is forwarded to the panel's setters rather than stored here.
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

	const onClickItem = useCallback(
		( item: MediaItem ) => {
			const [ block ] = getBlockAndPreviewFromMedia( item, mediaType );
			insert( block, getItemId( item ) );
		},
		[ insert, mediaType ]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems: totalItems ?? 0,
			totalPages: totalPages ?? 1,
		} ),
		[ totalItems, totalPages ]
	);
	const showPagination = paginationInfo.totalPages > 1;
	// The footer, when present, supplies the breathing room beneath the grid,
	// so the grid drops its own bottom gutter (see styles).
	const hasFooter = showPagination || !! footer;
	// Search results are ordered by relevance, so the span is only shown for
	// the date-ordered browse.
	const dateSpan = search ? undefined : getDateSpan( mediaList );

	return (
		<>
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
				isItemClickable={ isItemClickable }
				empty={ empty }
			>
				<div className="block-editor-inserter__media-grid__search">
					<DataViews.Search label={ searchLabel } />
				</div>
				{ filters }
				<DataViews.Layout
					className={ clsx( 'block-editor-inserter__media-grid', {
						'has-footer': hasFooter,
					} ) }
				/>
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
								{ /* Always rendered, so the pager doesn't shift when the span resolves (or is absent). */ }
								<span
									className="block-editor-inserter__media-grid__date-span"
									aria-hidden={ ! dateSpan }
									// The full span, in case the row is too narrow
									// and it is truncated (see styles).
									title={ dateSpan }
								>
									{ dateSpan ?? ' ' }
								</span>
								<DataViews.Pagination />
							</Stack>
						) }
						{ footer }
					</Stack>
				) }
			</DataViews>
			{ pendingExternalBlock && (
				<InsertExternalImageModal
					onClose={ cancelExternalInsert }
					onSubmit={ confirmExternalInsert }
				/>
			) }
		</>
	);
}
