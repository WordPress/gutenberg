/**
 * External dependencies
 */
import type { ReactNode } from 'react';
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
import { DataViewsPickerFooter } from '../components/dataviews-picker-footer';
import DataViewsSearch from '../components/dataviews-search';
import { DataViewsPagination } from '../components/dataviews-pagination';
import DataViewsViewConfig, {
	DataviewsViewConfigDropdown,
	ViewTypeMenu,
} from '../components/dataviews-view-config';
import normalizeFields from '../field-types';
import { useInfiniteScrollData } from '../components/dataviews-layouts/utils/useInfiniteScrollData';
import type { ActionButton, Field, View, SupportedLayouts } from '../types';
import type { SelectionOrUpdater } from '../types/private';
type ItemWithId = { id: string };

const isItemClickable = () => false;

const dataViewsPickerLayouts = VIEW_LAYOUTS.filter(
	( viewLayout ) => viewLayout.isPicker
);

type DataViewsPickerProps< Item > = {
	view: View;
	onChangeView: ( view: View ) => void;
	fields: Field< Item >[];
	actions?: ActionButton< Item >[];
	search?: boolean;
	searchLabel?: string;
	data: Item[];
	isLoading?: boolean;
	paginationInfo: {
		totalItems: number;
		totalPages: number;
	};
	defaultLayouts: SupportedLayouts;
	selection: string[];
	onChangeSelection: ( items: string[] ) => void;
	children?: ReactNode;
	config?: {
		perPageSizes: number[];
	};
	itemListLabel?: string;
	empty?: ReactNode;
} & ( Item extends ItemWithId
	? { getItemId?: ( item: Item ) => string }
	: { getItemId: ( item: Item ) => string } );

const defaultGetItemId = ( item: ItemWithId ) => item.id;
const EMPTY_ARRAY: any[] = [];

type DefaultUIProps = Pick<
	DataViewsPickerProps< any >,
	'search' | 'searchLabel'
>;

function DefaultUI( {
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
					gap="sm"
					justify="start"
					className="dataviews__search"
				>
					{ search && <DataViewsSearch label={ searchLabel } /> }
					<FiltersToggle />
				</Stack>
				<Stack direction="row" gap="xs" style={ { flexShrink: 0 } }>
					<DataViewsViewConfig />
				</Stack>
			</Stack>
			<FiltersToggled className="dataviews-filters__container" />
			<DataViewsLayout />
			<DataViewsPickerFooter />
		</>
	);
}

function DataViewsPicker< Item >( {
	view,
	onChangeView,
	fields,
	search = true,
	searchLabel = undefined,
	actions = EMPTY_ARRAY,
	data,
	getItemId = defaultGetItemId,
	isLoading = false,
	paginationInfo,
	defaultLayouts: defaultLayoutsProperty,
	selection,
	onChangeSelection,
	children,
	config = { perPageSizes: [ 10, 20, 50, 100 ] },
	itemListLabel,
	empty,
}: DataViewsPickerProps< Item > ) {
	// Use infinite scroll hook internally when enabled
	const { data: infiniteScrollData, setVisibleEntries } =
		useInfiniteScrollData( {
			view,
			data: data as any,
			getItemId: getItemId as any,
		} );

	// Use infinite scroll data and pagination info when enabled, otherwise use the provided ones
	const displayData = view.infiniteScrollEnabled
		? ( infiniteScrollData as Item[] )
		: data;
	const containerRef = useRef< HTMLDivElement >( null );
	const [ containerWidth, setContainerWidth ] = useState( 0 );
	const isLoadingRef = useRef( false );
	// Track scroll position for preservation when prepending items
	const scrollPreservationRef = useRef< {
		scrollHeight: number;
		scrollTop: number;
		isPending: boolean;
	} >( { scrollHeight: 0, scrollTop: 0, isPending: false } );
	const resizeObserverRef = useResizeObserver(
		( resizeObserverEntries: any ) => {
			setContainerWidth(
				resizeObserverEntries[ 0 ].borderBoxSize[ 0 ].inlineSize
			);
		},
		{ box: 'border-box' }
	);
	const [ openedFilter, setOpenedFilter ] = useState< string | null >( null );
	function setSelectionWithChange( value: SelectionOrUpdater ) {
		const newValue =
			typeof value === 'function' ? value( selection ) : value;
		if ( onChangeSelection ) {
			onChangeSelection( newValue );
		}
	}
	const _fields = useMemo( () => normalizeFields( fields ), [ fields ] );
	const filters = useFilters( _fields, view );

	const intersectionObserverCallback: IntersectionObserverCallback =
		useCallback(
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

	useEffect( () => {
		if ( hasPrimaryOrLockedFilters && ! isShowingFilter ) {
			setIsShowingFilter( true );
		}
	}, [ hasPrimaryOrLockedFilters, isShowingFilter ] );

	// Preserve scroll position when new items are prepended (scroll up loading)
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
		if ( heightDiff > 0 ) {
			container.scrollTop =
				scrollPreservationRef.current.scrollTop + heightDiff;
		}
		scrollPreservationRef.current.isPending = false;
	}, [ displayData, view.infiniteScrollEnabled ] );

	// Attach scroll event listener for infinite scroll
	useEffect( () => {
		if ( ! view.infiniteScrollEnabled || ! containerRef.current ) {
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

			const perPage = view.perPage || 10;
			const currentStartPosition = view.startPosition || 1;
			const currentEndPosition =
				view.endPosition || currentStartPosition + perPage - 1;

			// Check if user has scrolled near the bottom
			if (
				scrollDirection === 'down' &&
				scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD
			) {
				// Check if there's more data to load
				if ( currentEndPosition < paginationInfo.totalItems ) {
					isLoadingRef.current = true;
					const newStartPosition = currentEndPosition - 3;
					const newEndPosition = Math.min(
						newStartPosition + perPage,
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
					};

					const newEndPosition = currentStartPosition + 1;
					const newStartPosition = Math.max(
						newEndPosition - perPage,
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
						return dataViewsPickerLayouts.some(
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
				paginationInfo,
				isItemClickable,
				selection,
				onChangeSelection: setSelectionWithChange,
				openedFilter,
				setOpenedFilter,
				getItemId,
				containerWidth,
				containerRef,
				resizeObserverRef,
				defaultLayouts,
				filters,
				isShowingFilter,
				setIsShowingFilter,
				config,
				itemListLabel,
				empty,
				hasInitiallyLoaded: true,
				intersectionObserverCallback: view.infiniteScrollEnabled
					? intersectionObserverCallback
					: undefined,
			} }
		>
			<div className="dataviews-picker-wrapper">
				{ children ?? (
					<DefaultUI search={ search } searchLabel={ searchLabel } />
				) }
			</div>
		</DataViewsContext.Provider>
	);
}

// Populate the DataViews sub components
const DataViewsPickerSubComponents =
	DataViewsPicker as typeof DataViewsPicker & {
		BulkActionToolbar: typeof DataViewsPickerFooter;
		Filters: typeof Filters;
		FiltersToggled: typeof FiltersToggled;
		FiltersToggle: typeof FiltersToggle;
		Layout: typeof DataViewsLayout;
		LayoutSwitcher: typeof ViewTypeMenu;
		Pagination: typeof DataViewsPagination;
		Search: typeof DataViewsSearch;
		ViewConfig: typeof DataviewsViewConfigDropdown;
	};

DataViewsPickerSubComponents.BulkActionToolbar = DataViewsPickerFooter;
DataViewsPickerSubComponents.Filters = Filters;
DataViewsPickerSubComponents.FiltersToggled = FiltersToggled;
DataViewsPickerSubComponents.FiltersToggle = FiltersToggle;
DataViewsPickerSubComponents.Layout = DataViewsLayout;
DataViewsPickerSubComponents.LayoutSwitcher = ViewTypeMenu;
DataViewsPickerSubComponents.Pagination = DataViewsPagination;
DataViewsPickerSubComponents.Search = DataViewsSearch;
DataViewsPickerSubComponents.ViewConfig = DataviewsViewConfigDropdown;

export default DataViewsPickerSubComponents;
