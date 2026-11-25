import type { ReactNode } from 'react';
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { DataViews } from '@wordpress/dataviews';
import type { Action, Field, View } from '@wordpress/dataviews';
import { Spinner as WCSpinner } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import InserterDraggableBlocks from '../../inserter-draggable-blocks';
import MediaSearch from './media-search';
import { getBlockAndPreviewFromMedia, getItemId } from './utils';
import type { MediaItem, MediaSource, MediaType } from './types';

type MediaGridProps = {
	// Results.
	/**
	 * The items for the current page. Empty until the requested source
	 * resolves, so the previous source's items never show under a new tab.
	 */
	mediaList: MediaItem[];
	isLoading: boolean;
	totalItems?: number;
	totalPages?: number;

	// Search row.
	search: string;
	onChangeSearch: ( search: string ) => void;
	searchLabel: string;

	// Source, chosen in the menu beside the search input.
	/**
	 * Fewer than two offers no choice, since there is nothing to switch
	 * between.
	 */
	sources?: MediaSource[];
	source?: string;
	onChangeSource?: ( source: string ) => void;
	/**
	 * Goes back to the default source and media type, from the same menu.
	 */
	onReset?: ( () => void ) | false;

	// Media-type tabs.
	/**
	 * Fewer than two renders no tab bar, since there is nothing to switch
	 * between.
	 */
	mediaTypes?: { value: MediaType; label: string }[];
	mediaType: MediaType;
	onChangeMediaType?: ( mediaType: MediaType ) => void;

	// Grid.
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
	/**
	 * Rendered when there are no items to show.
	 */
	empty: ReactNode;

	// Footer.
	page: number;
	/**
	 * Items per page, as requested from the source by the panel.
	 */
	perPage: number;
	onChangePage: ( page: number ) => void;
	/**
	 * Rendered beneath the pager (e.g. the attach button).
	 */
	footer?: ReactNode;
};

// A 120px minimum gives two columns at the inserter's width (the grid derives
// its column count from the container width and this size).
const GRID_LAYOUT = {
	previewSize: 120,
	density: 'compact',
	mediaFit: 'contain',
} as const;
const DEFAULT_LAYOUTS = { grid: { layout: GRID_LAYOUT } };

// The media type is shown as tabs, so the menu leaves it out. A source is
// always selected, so its group in the menu has no "All" option.
const MENU_EXCLUDED_FIELDS = [ 'mediaType' ];
const MENU_REQUIRED_FIELDS = [ 'source' ];

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
							<WCSpinner />
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
	search,
	onChangeSearch,
	searchLabel,
	sources,
	source,
	onChangeSource,
	onReset,
	mediaTypes,
	mediaType,
	onChangeMediaType,
	onClickItem,
	insertingId,
	actions,
	empty,
	page,
	perPage,
	onChangePage,
	footer,
}: MediaGridProps ) {
	const hasTabs = !! mediaTypes && mediaTypes.length > 1;
	const hasSources = !! sources && sources.length > 1 && !! source;

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
				filterBy: false,
			},
			// The source and the media type decide what the panel fetches,
			// rather than narrowing down what is already on screen. They are
			// modelled as filters so they live in the view, where the menu
			// and the tabs read and change them.
			{
				id: 'source',
				label: __( 'Source' ),
				type: 'text',
				getValue: () => source,
				elements: hasSources
					? sources.map( ( { name, label } ) => ( {
							value: name,
							label,
						} ) )
					: undefined,
				filterBy: hasSources ? { operators: [ 'is' ] } : false,
				enableSorting: false,
				enableGlobalSearch: false,
			},
			{
				id: 'mediaType',
				label: __( 'Media type' ),
				type: 'text',
				getValue: () => mediaType,
				elements: hasTabs ? mediaTypes : undefined,
				filterBy: hasTabs ? { operators: [ 'is' ] } : false,
				enableSorting: false,
				enableGlobalSearch: false,
			},
		],
		[
			mediaType,
			insertingId,
			hasSources,
			sources,
			source,
			hasTabs,
			mediaTypes,
		]
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
			filters: [
				...( hasSources
					? [
							{
								field: 'source',
								operator: 'is' as const,
								value: source,
							},
						]
					: [] ),
				...( hasTabs
					? [
							{
								field: 'mediaType',
								operator: 'is' as const,
								value: mediaType,
							},
						]
					: [] ),
			],
		} ),
		[ page, perPage, search, hasSources, source, hasTabs, mediaType ]
	);

	// The tab and the panel own the source, the media type and the page, so
	// changes are forwarded to them rather than stored here. Search comes in
	// through `MediaSearch`, not the view.
	const onChangeView = useCallback(
		( nextView: View ) => {
			const getFilterValue = ( field: string ) =>
				nextView.filters?.find( ( filter ) => filter.field === field )
					?.value;
			const nextSource = getFilterValue( 'source' );
			if ( nextSource !== undefined && nextSource !== source ) {
				onChangeSource?.( nextSource );
			}
			const nextMediaType = getFilterValue( 'mediaType' );
			if ( nextMediaType !== undefined && nextMediaType !== mediaType ) {
				onChangeMediaType?.( nextMediaType );
			}
			const nextPage = nextView.page ?? 1;
			if ( nextPage !== page ) {
				onChangePage( nextPage );
			}
		},
		[
			source,
			onChangeSource,
			mediaType,
			onChangeMediaType,
			page,
			onChangePage,
		]
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
			data={ mediaList }
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
			actions={ actions }
			isLoading={ isLoading }
			paginationInfo={ paginationInfo }
			defaultLayouts={ DEFAULT_LAYOUTS }
			getItemId={ getItemId }
			onClickItem={ onClickItem }
			empty={ empty }
			onReset={ onReset }
		>
			<Stack
				direction="row"
				align="center"
				gap="sm"
				className="block-editor-inserter__media-grid__search"
			>
				<MediaSearch
					label={ searchLabel }
					defaultValue={ search }
					onChange={ onChangeSearch }
				/>
				<DataViews.ViewMenu
					excludeFields={ MENU_EXCLUDED_FIELDS }
					requiredFields={ MENU_REQUIRED_FIELDS }
					size="default"
				/>
			</Stack>
			{ /* Without media types to switch between, this is the grid alone. */ }
			<DataViews.FilterTabs field="mediaType" showAll={ false }>
				<DataViews.Layout className="block-editor-inserter__media-grid" />
			</DataViews.FilterTabs>
			{ hasFooter && (
				<Stack
					direction="column"
					gap="lg"
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
