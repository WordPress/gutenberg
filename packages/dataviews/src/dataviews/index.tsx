/**
 * External dependencies
 */
import type { ReactNode, ComponentProps, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
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
		infiniteScrollHandler?: () => void;
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
	return (
		<>
			<Stack
				direction="row"
				align="top"
				justify="space-between"
				className="dataviews__view-actions"
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
	const { infiniteScrollHandler } = paginationInfo;
	const containerRef = useRef< HTMLDivElement >( null );
	const [ containerWidth, setContainerWidth ] = useState( 0 );
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
	const _selection = useMemo( () => {
		return selection.filter( ( id ) =>
			data.some( ( item ) => getItemId( item ) === id )
		);
	}, [ selection, data, getItemId ] );

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

	useEffect( () => {
		if ( hasPrimaryOrLockedFilters && ! isShowingFilter ) {
			setIsShowingFilter( true );
		}
	}, [ hasPrimaryOrLockedFilters, isShowingFilter ] );

	// Attach scroll event listener for infinite scroll
	useEffect( () => {
		if ( ! view.infiniteScrollEnabled || ! containerRef.current ) {
			return;
		}

		const handleScroll = throttle( ( event: unknown ) => {
			const target = ( event as Event ).target as HTMLElement;
			const scrollTop = target.scrollTop;
			const scrollHeight = target.scrollHeight;
			const clientHeight = target.clientHeight;

			// Check if user has scrolled near the bottom
			if ( scrollTop + clientHeight >= scrollHeight - 100 ) {
				infiniteScrollHandler?.();
			}
		}, 100 ); // Throttle to 100ms

		const container = containerRef.current;
		container.addEventListener( 'scroll', handleScroll );

		return () => {
			container.removeEventListener( 'scroll', handleScroll );
			handleScroll.cancel(); // Cancel any pending throttled calls
		};
	}, [ infiniteScrollHandler, view.infiniteScrollEnabled ] );

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
				data,
				isLoading,
				paginationInfo,
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
				hasInfiniteScrollHandler: !! infiniteScrollHandler,
				onReset,
			} }
		>
			<div className="dataviews-wrapper" ref={ containerRef }>
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
