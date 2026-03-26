/**
 * External dependencies
 */
import type { ReactNode } from 'react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';
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
import useData from '../hooks/use-data';
import { useInfiniteScroll } from '../hooks/use-infinite-scroll';
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
	// useData ensures data loading is correct whether infinite scroll is enabled or pagination is used.
	const { data: displayData, setVisibleEntries } = useData( {
		view,
		data: data as any,
		getItemId: getItemId as any,
		selection,
		paginationInfo,
	} ) as {
		data: ( Item & { position?: number } )[];
		setVisibleEntries?: React.Dispatch< React.SetStateAction< number[] > >;
	};
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

	const { intersectionObserver } = useInfiniteScroll( {
		view,
		onChangeView,
		isLoading,
		paginationInfo,
		containerRef,
		setVisibleEntries,
	} );

	useEffect( () => {
		if ( hasPrimaryOrLockedFilters && ! isShowingFilter ) {
			setIsShowingFilter( true );
		}
	}, [ hasPrimaryOrLockedFilters, isShowingFilter ] );

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
				intersectionObserver,
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
