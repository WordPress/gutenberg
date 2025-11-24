/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { useResizeObserver, throttle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';
import { VIEW_LAYOUTS } from '../../dataviews-layouts';
import {
	Filters,
	FiltersToggled,
	useFilters,
	FiltersToggle,
} from '../dataviews-filters';
import DataViewsLayout from '../dataviews-layout';
import { DataViewsPickerFooter } from './footer';
import DataViewsSearch from '../dataviews-search';
import { DataViewsPagination } from '../dataviews-pagination';
import DataViewsViewConfig, {
	DataviewsViewConfigDropdown,
	ViewTypeMenu,
} from '../dataviews-view-config';
import normalizeFields from '../../field-types/utils/normalize-fields';
import type { ActionButton, Field, View, SupportedLayouts } from '../../types';
import type { SelectionOrUpdater } from '../../types/private';
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
		infiniteScrollHandler?: () => void;
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
	return (
		<>
			<HStack
				alignment="top"
				justify="space-between"
				className="dataviews__view-actions"
				spacing={ 1 }
			>
				<HStack
					justify="start"
					expanded={ false }
					className="dataviews__search"
				>
					{ search && <DataViewsSearch label={ searchLabel } /> }
					<FiltersToggle />
				</HStack>
				<HStack
					spacing={ 1 }
					expanded={ false }
					style={ { flexShrink: 0 } }
				>
					<DataViewsViewConfig />
				</HStack>
			</HStack>
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
	const { infiniteScrollHandler } = paginationInfo;
	const containerRef = useRef< HTMLDivElement | null >( null );
	const [ containerWidth, setContainerWidth ] = useState( 0 );
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
				data,
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
				hasInfiniteScrollHandler: !! infiniteScrollHandler,
			} }
		>
			<div className="dataviews-picker-wrapper" ref={ containerRef }>
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
