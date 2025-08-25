/**
 * External dependencies
 */
import type { ReactNode, ComponentProps, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import {
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useResizeObserver, throttle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';
import {
	default as DataViewsFilters,
	useFilters,
	FiltersToggle,
} from '../dataviews-filters';
import DataViewsPickerLayout from '../dataviews-picker-layout';
import DataViewsFooter from '../dataviews-footer';
import DataViewsSearch from '../dataviews-search';
import { BulkActionsFooter } from '../dataviews-bulk-actions';
import { DataViewsPagination } from '../dataviews-pagination';
import DataViewsViewConfig, {
	DataviewsViewConfigDropdown,
	ViewTypeMenu,
} from '../dataviews-view-config';
import { normalizeFields } from '../../normalize-fields';
import type { Action, Field, View, SupportedLayouts } from '../../types';
import type { SelectionOrUpdater } from '../../private-types';
type ItemWithId = { id: string };

type DataViewsPickerProps< Item > = {
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
	config?:
		| false
		| {
				perPageSizes: number[];
		  };
	empty?: ReactNode;
	label?: string;
} & ( Item extends ItemWithId
	? { getItemId?: ( item: Item ) => string }
	: { getItemId: ( item: Item ) => string } );

const defaultGetItemId = ( item: ItemWithId ) => item.id;
const defaultIsItemClickable = () => true;
const EMPTY_ARRAY: any[] = [];

type DefaultUIProps = Pick<
	DataViewsPickerProps< any >,
	'label' | 'header' | 'search' | 'searchLabel'
>;

function DefaultUI( {
	label,
	header,
	search = true,
	searchLabel = undefined,
}: DefaultUIProps ) {
	const { isShowingFilter, config } = useContext( DataViewsContext );
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
				{ ( config || header ) && (
					<HStack
						spacing={ 1 }
						expanded={ false }
						style={ { flexShrink: 0 } }
					>
						config && <DataViewsViewConfig />
						{ header }
					</HStack>
				) }
			</HStack>
			{ isShowingFilter && (
				<DataViewsFilters className="dataviews-filters__container" />
			) }
			<DataViewsPickerLayout label={ label } />
			<DataViewsFooter />
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
	getItemLevel,
	isLoading = false,
	paginationInfo,
	defaultLayouts,
	selection: selectionProperty,
	onChangeSelection,
	onClickItem,
	renderItemLink,
	isItemClickable = defaultIsItemClickable,
	header,
	children,
	config = { perPageSizes: [ 10, 20, 50, 100 ] },
	empty,
	label,
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
				selection,
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
			} }
		>
			<div className="dataviews-wrapper" ref={ containerRef }>
				{ children ?? (
					<DefaultUI
						label={ label }
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
const DataViewsPickerSubComponents =
	DataViewsPicker as typeof DataViewsPicker & {
		BulkActionToolbar: typeof BulkActionsFooter;
		Filters: typeof DataViewsFilters;
		FiltersToggle: typeof FiltersToggle;
		Layout: typeof DataViewsPickerLayout;
		LayoutSwitcher: typeof ViewTypeMenu;
		Pagination: typeof DataViewsPagination;
		Search: typeof DataViewsSearch;
		ViewConfig: typeof DataviewsViewConfigDropdown;
	};

DataViewsPickerSubComponents.BulkActionToolbar = BulkActionsFooter;
DataViewsPickerSubComponents.Filters = DataViewsFilters;
DataViewsPickerSubComponents.FiltersToggle = FiltersToggle;
DataViewsPickerSubComponents.Layout = DataViewsPickerLayout;
DataViewsPickerSubComponents.LayoutSwitcher = ViewTypeMenu;
DataViewsPickerSubComponents.Pagination = DataViewsPagination;
DataViewsPickerSubComponents.Search = DataViewsSearch;
DataViewsPickerSubComponents.ViewConfig = DataviewsViewConfigDropdown;

export default DataViewsPickerSubComponents;
