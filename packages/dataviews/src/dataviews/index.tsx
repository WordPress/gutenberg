/**
 * External dependencies
 */
import type { ReactNode, ComponentProps, ReactElement } from 'react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useResizeObserver, throttle } from '@wordpress/compose';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataViewsContext from '../components/dataviews-context';
import { VIEW_LAYOUTS } from '../components/dataviews-layouts';
import {
	Filters,
	FiltersToggled,
	useFilters,
	FiltersToggle,
} from '../components/dataviews-filters';
import DataViewsLayout from '../components/dataviews-layout';
import DataViewsFooter from '../components/dataviews-footer';
import DataViewsSearch from '../components/dataviews-search';
import { BulkActionsFooter } from '../components/dataviews-bulk-actions';
import { DataViewsPagination } from '../components/dataviews-pagination';
import DataViewsViewConfig, {
	DataviewsViewConfigDropdown,
	ViewTypeMenu,
} from '../components/dataviews-view-config';
import normalizeFields from '../field-types';
import useData from '../hooks/use-data';
import { useInfiniteScrollData } from '../hooks/use-infinite-scroll-data';
import type { Action, Field, View, SupportedLayouts } from '../types';
import type { SelectionOrUpdater } from '../types/private';
type ItemWithId = { id: string };

type DataViewsProps< Item > = {
	view: View;
	onChangeView: ( view: View ) => void;
	fields: Field< Item >[];
	search?: boolean;
	searchLabel?: string;
	actions?: Action< Item >[];
	data: Item[];
	isLoading?: boolean;
	paginationInfo: {
		totalItems: number;
		totalPages: number;
	};
	defaultLayouts: SupportedLayouts;
	selection?: string[];
	onChangeSelection?: ( items: string[] ) => void;
	onClickItem?: ( item: Item ) => void;
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
	isItemClickable?: ( item: Item ) => boolean;
	header?: ReactNode;
	getItemLevel?: ( item: Item ) => number;
	children?: ReactNode;
	config?: {
		perPageSizes: number[];
	};
	empty?: ReactNode;
	onReset?: ( () => void ) | false;
} & ( Item extends ItemWithId
	? { getItemId?: ( item: Item ) => string }
	: { getItemId: ( item: Item ) => string } );

const defaultGetItemId = ( item: ItemWithId ) => item.id;
const defaultIsItemClickable = () => true;
const EMPTY_ARRAY: any[] = [];

const dataViewsLayouts = VIEW_LAYOUTS.filter(
	( viewLayout ) => ! viewLayout.isPicker
);

type DefaultUIProps = Pick<
	DataViewsProps< any >,
	'header' | 'search' | 'searchLabel'
>;

function DefaultUI( {
	header,
	search = true,
	searchLabel = undefined,
}: DefaultUIProps ) {
	const { view } = useContext( DataViewsContext );
	const isInfiniteScroll = view.infiniteScrollEnabled;
	return (
		<>
			<Stack
				direction="row"
				align="top"
				justify="space-between"
				className={ clsx( 'dataviews__view-actions', {
					'dataviews__view-actions--infinite-scroll':
						isInfiniteScroll,
				} ) }
				gap="xs"
			>
				<Stack
					direction="row"
					justify="start"
					gap="sm"
					className="dataviews__search"
				>
					{ search && <DataViewsSearch label={ searchLabel } /> }
					<FiltersToggle />
				</Stack>
				<Stack direction="row" gap="xs" style={ { flexShrink: 0 } }>
					<DataViewsViewConfig />
					{ header }
				</Stack>
			</Stack>
			<FiltersToggled className="dataviews-filters__container" />
			<DataViewsLayout />
			<DataViewsFooter />
		</>
	);
}

function DataViews< Item >( {
	view,
	onChangeView,
	fields,
	search = true,
	searchLabel = undefined,
	actions = EMPTY_ARRAY,
	data,
	getItemId = defaultGetItemId,
	getItemLevel,
	isLoading = false,
	paginationInfo,
	defaultLayouts: defaultLayoutsProperty,
	selection: selectionProperty,
	onChangeSelection,
	onClickItem,
	renderItemLink,
	isItemClickable = defaultIsItemClickable,
	header,
	children,
	config = { perPageSizes: [ 10, 20, 50, 100 ] },
	empty,
	onReset,
}: DataViewsProps< Item > ) {
	// Always use useData for pagination info and initial load tracking
	const {
		data: dataFromUseData,
		paginationInfo: paginationInfoFromUseData,
		hasInitiallyLoaded,
	} = useData( data, isLoading, paginationInfo );

	// Use infinite scroll hook when enabled to get the infinite scroll data
	const { data: infiniteScrollData, setVisibleEntries } =
		useInfiniteScrollData( {
			view,
			data: data as any,
			getItemId: getItemId as any,
		} );

	// Use infinite scroll data when enabled, otherwise use data from useData
	const displayData = view.infiniteScrollEnabled
		? ( infiniteScrollData as Item[] )
		: ( dataFromUseData as Item[] );
	const containerRef = useRef< HTMLDivElement >( null );
	const [ containerWidth, setContainerWidth ] = useState( 0 );
	const isLoadingRef = useRef( false );
	// Store the initial batch size calculated from the first startPosition and endPosition
	const initialBatchSizeRef = useRef< number | null >( null );
	// Track scroll position for preservation when prepending items
	const scrollPreservationRef = useRef< {
		scrollHeight: number;
		scrollTop: number;
		isPending: boolean;
		direction: 'up' | 'down' | null;
	} >( { scrollHeight: 0, scrollTop: 0, isPending: false, direction: null } );
	const resizeObserverRef = useResizeObserver(
		( resizeObserverEntries: any ) => {
			setContainerWidth(
				resizeObserverEntries[ 0 ].borderBoxSize[ 0 ].inlineSize
			);
		},
		{ box: 'border-box' }
	);
	const [ selectionState, setSelectionState ] = useState< string[] >( [] );
	const isUncontrolled =
		selectionProperty === undefined || onChangeSelection === undefined;
	const selection = isUncontrolled ? selectionState : selectionProperty;
	const [ openedFilter, setOpenedFilter ] = useState< string | null >( null );
	function setSelectionWithChange( value: SelectionOrUpdater ) {
		const newValue =
			typeof value === 'function' ? value( selection ) : value;
		if ( isUncontrolled ) {
			setSelectionState( newValue );
		}
		if ( onChangeSelection ) {
			onChangeSelection( newValue );
		}
	}
	const _fields = useMemo( () => normalizeFields( fields ), [ fields ] );
	// When infinite scroll is enabled, don't filter selection by current data
	// because items may be scrolled out of view but still selected.
	const _selection = useMemo( () => {
		if ( view.infiniteScrollEnabled ) {
			return selection;
		}
		return selection.filter( ( id ) =>
			data.some( ( item ) => getItemId( item ) === id )
		);
	}, [ selection, data, getItemId, view.infiniteScrollEnabled ] );

	const filters = useFilters( _fields, view );
	const hasPrimaryOrLockedFilters = useMemo(
		() =>
			( filters || [] ).some(
				( filter ) => filter.isPrimary || filter.isLocked
			),
		[ filters ]
	);
	const [ isShowingFilter, setIsShowingFilter ] = useState< boolean >(
		hasPrimaryOrLockedFilters
	);

	const intersectionObserverCallback:
		| IntersectionObserverCallback
		| undefined = useCallback(
		( entries: IntersectionObserverEntry[] ) => {
			// Calculate new visible entries outside of setState
			if ( ! setVisibleEntries ) {
				return;
			}
			setVisibleEntries( ( prev: number[] ) => {
				const newVisibleEntries = new Set( prev );
				let hasChanged = false;

				entries.forEach( ( entry ) => {
					const posInSet = Number(
						entry.target?.attributes?.getNamedItem(
							'aria-posinset'
						)?.value
					);
					if ( isNaN( posInSet ) ) {
						return;
					}
					if ( entry.isIntersecting ) {
						if ( ! newVisibleEntries.has( posInSet ) ) {
							newVisibleEntries.add( posInSet );
							hasChanged = true;
						}
					} else if ( newVisibleEntries.has( posInSet ) ) {
						newVisibleEntries.delete( posInSet );
						hasChanged = true;
					}
				} );

				// Only return new array if something actually changed
				return hasChanged
					? Array.from( newVisibleEntries ).sort()
					: prev;
			} );
		},
		[ setVisibleEntries ]
	);

	useEffect( () => {
		if ( hasPrimaryOrLockedFilters && ! isShowingFilter ) {
			setIsShowingFilter( true );
		}
	}, [ hasPrimaryOrLockedFilters, isShowingFilter ] );

	// Preserve scroll position when items are added or removed during infinite scroll
	useLayoutEffect( () => {
		const container = containerRef.current;
		if (
			! container ||
			! view.infiniteScrollEnabled ||
			! scrollPreservationRef.current.isPending
		) {
			return;
		}

		// Calculate the height difference and adjust scroll position
		const heightDiff =
			container.scrollHeight - scrollPreservationRef.current.scrollHeight;
		const { direction } = scrollPreservationRef.current;

		if ( direction === 'up' && heightDiff > 0 ) {
			// Items were prepended while scrolling up, add the difference to maintain position
			container.scrollTop =
				scrollPreservationRef.current.scrollTop + heightDiff;
		} else if ( direction === 'down' && heightDiff < 0 ) {
			// Items were removed from top while scrolling down, adjust to prevent jumping up
			container.scrollTop =
				scrollPreservationRef.current.scrollTop + heightDiff;
		}
		// When scrolling down and items are added at bottom (heightDiff > 0), no adjustment needed
		// When scrolling up and items are removed from bottom (heightDiff < 0), no adjustment needed

		scrollPreservationRef.current.isPending = false;
		scrollPreservationRef.current.direction = null;
	}, [ displayData, view.infiniteScrollEnabled ] );

	// Attach scroll event listener for infinite scroll
	useEffect( () => {
		if (
			! hasInitiallyLoaded ||
			! view.infiniteScrollEnabled ||
			! containerRef.current
		) {
			return;
		}

		let lastScrollTop = 0;
		// Use larger thresholds to trigger loading earlier during fast scrolling
		const BOTTOM_THRESHOLD = 600; // px from bottom to trigger load
		const TOP_THRESHOLD = 800; // px from top to trigger load

		const handleScroll = throttle( ( event: unknown ) => {
			const target = ( event as Event ).target as HTMLElement;
			const scrollTop = target.scrollTop;
			const scrollHeight = target.scrollHeight;
			const clientHeight = target.clientHeight;

			// Determine scroll direction
			const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
			lastScrollTop = scrollTop;

			// Don't trigger if already loading
			if ( isLoadingRef.current || isLoading ) {
				return;
			}

			const currentStartPosition = view.startPosition || 1;
			const currentEndPosition =
				view.endPosition ||
				currentStartPosition + ( view.perPage || 10 ) - 1;
			// Calculate and store batch size from initial range (only once)
			if ( initialBatchSizeRef.current === null ) {
				initialBatchSizeRef.current =
					currentEndPosition - currentStartPosition + 1;
			}
			const batchSize = initialBatchSizeRef.current;

			// Check if user has scrolled near the bottom
			if (
				scrollDirection === 'down' &&
				scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD
			) {
				// Check if there's more data to load
				if ( currentEndPosition < paginationInfo.totalItems ) {
					isLoadingRef.current = true;

					// Store current scroll state for position preservation when items are unloaded
					scrollPreservationRef.current = {
						scrollHeight: target.scrollHeight,
						scrollTop: target.scrollTop,
						isPending: true,
						direction: 'down',
					};

					const newStartPosition = currentEndPosition - 3;
					const newEndPosition = Math.min(
						newStartPosition + batchSize,
						paginationInfo.totalItems
					);
					onChangeView( {
						...view,
						startPosition: newStartPosition,
						endPosition: newEndPosition,
					} );
					isLoadingRef.current = false;
				}
			}

			// Check if user has scrolled near the top
			if ( scrollDirection === 'up' && scrollTop <= TOP_THRESHOLD ) {
				// Check if there's more data to load
				if ( currentStartPosition > 1 ) {
					isLoadingRef.current = true;

					// Store current scroll state for position preservation
					scrollPreservationRef.current = {
						scrollHeight: target.scrollHeight,
						scrollTop: target.scrollTop,
						isPending: true,
						direction: 'up',
					};

					const newEndPosition = currentStartPosition + 1;
					const newStartPosition = Math.max(
						newEndPosition - batchSize,
						1
					);

					onChangeView( {
						...view,
						startPosition: newStartPosition,
						endPosition: newEndPosition,
					} );
					isLoadingRef.current = false;
				}
			}
		}, 50 ); // Faster throttle (50ms) for better response to fast scrolling

		const container = containerRef.current;
		container.addEventListener( 'scroll', handleScroll );

		return () => {
			container.removeEventListener( 'scroll', handleScroll );
			handleScroll.cancel(); // Cancel any pending throttled calls
		};
	}, [ isLoading, onChangeView, paginationInfo.totalItems, view ] );

	// Filter out DataViewsPicker layouts.
	const defaultLayouts = useMemo(
		() =>
			Object.fromEntries(
				Object.entries( defaultLayoutsProperty ).filter(
					( [ layoutType ] ) => {
						return dataViewsLayouts.some(
							( viewLayout ) => viewLayout.type === layoutType
						);
					}
				)
			),
		[ defaultLayoutsProperty ]
	);

	if ( ! defaultLayouts[ view.type ] ) {
		return null;
	}

	return (
		<DataViewsContext.Provider
			value={ {
				view,
				onChangeView,
				fields: _fields,
				actions,
				data: displayData,
				isLoading,
				paginationInfo: paginationInfoFromUseData,
				selection: _selection,
				onChangeSelection: setSelectionWithChange,
				openedFilter,
				setOpenedFilter,
				getItemId,
				getItemLevel,
				isItemClickable,
				onClickItem,
				renderItemLink,
				containerWidth,
				containerRef,
				resizeObserverRef,
				defaultLayouts,
				filters,
				isShowingFilter,
				setIsShowingFilter,
				config,
				empty,
				hasInitiallyLoaded,
				onReset,
				intersectionObserverCallback: view.infiniteScrollEnabled
					? intersectionObserverCallback
					: undefined,
			} }
		>
			<div className="dataviews-wrapper">
				{ children ?? (
					<DefaultUI
						header={ header }
						search={ search }
						searchLabel={ searchLabel }
					/>
				) }
			</div>
		</DataViewsContext.Provider>
	);
}

// Populate the DataViews sub components
const DataViewsSubComponents = DataViews as typeof DataViews & {
	BulkActionToolbar: typeof BulkActionsFooter;
	Filters: typeof Filters;
	FiltersToggle: typeof FiltersToggle;
	FiltersToggled: typeof FiltersToggled;
	Layout: typeof DataViewsLayout;
	LayoutSwitcher: typeof ViewTypeMenu;
	Pagination: typeof DataViewsPagination;
	Search: typeof DataViewsSearch;
	ViewConfig: typeof DataviewsViewConfigDropdown;
	Footer: typeof DataViewsFooter;
};

DataViewsSubComponents.BulkActionToolbar = BulkActionsFooter;
DataViewsSubComponents.Filters = Filters;
DataViewsSubComponents.FiltersToggled = FiltersToggled;
DataViewsSubComponents.FiltersToggle = FiltersToggle;
DataViewsSubComponents.Layout = DataViewsLayout;
DataViewsSubComponents.LayoutSwitcher = ViewTypeMenu;
DataViewsSubComponents.Pagination = DataViewsPagination;
DataViewsSubComponents.Search = DataViewsSearch;
DataViewsSubComponents.ViewConfig = DataviewsViewConfigDropdown;
DataViewsSubComponents.Footer = DataViewsFooter;

export default DataViewsSubComponents;
