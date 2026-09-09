import type { ReactNode } from 'react';
import clsx from 'clsx';
import {
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';
import { Stack } from '@wordpress/ui';
import DataViewsContext from '../components/dataviews-context';
import { VIEW_LAYOUTS } from '../components/dataviews-layouts';
import {
	Filters,
	FiltersToggled,
	useFilters,
	FiltersToggle,
} from '../components/dataviews-filters';
import DataViewsLayout from '../components/dataviews-layout';
import {
	DataViewsPickerFooter,
	DataViewsPickerBulkActionToolbar,
} from '../components/dataviews-picker-footer';
import DataViewsSearch from '../components/dataviews-search';
import { DataViewsPagination } from '../components/dataviews-pagination';
import DataViewsViewConfig, {
	DataviewsViewConfigDropdown,
	ViewTypeMenu,
} from '../components/dataviews-view-config';
import normalizeFields from '../field-types';
import useData from '../hooks/use-data';
import { useInfiniteScroll } from '../hooks/use-infinite-scroll';
import usePageClamp from '../hooks/use-page-clamp';
import type { ActionButton, Field, View, SupportedLayouts } from '../types';
import type { SelectionOrUpdater } from '../types/private';
type ItemWithId = { id: string };

const isItemClickable = () => false;

const dataViewsPickerLayouts = VIEW_LAYOUTS.filter(
	( viewLayout ) => viewLayout.isPicker
);

type DataViewsPickerProps< Item > = {
	/**
	 * The current view configuration: layout type, filters, sorting,
	 * pagination, search term, and visible fields.
	 */
	view: View;
	/**
	 * Callback invoked with the new view whenever the user changes it
	 * (filtering, sorting, switching layout, changing page, etc.).
	 * Consumers own the view state and must store the new value.
	 */
	onChangeView: ( view: View ) => void;
	/**
	 * The fields describing each item's data: how to get and render a value,
	 * plus its sorting and filtering capabilities.
	 */
	fields: Field< Item >[];
	/**
	 * The button actions that can be performed on items. Unlike `DataViews`,
	 * pickers only support button actions (no modals).
	 */
	actions?: ActionButton< Item >[];
	/**
	 * Whether the global search input is displayed.
	 *
	 * @default true
	 */
	search?: boolean;
	/**
	 * The accessible label and placeholder for the search input.
	 *
	 * @default 'Search'
	 */
	searchLabel?: string;
	/**
	 * The dataset to render, already filtered, sorted, and paginated
	 * according to the current view.
	 */
	data: Item[];
	/**
	 * Whether the data is loading, in which case a loading state is shown.
	 *
	 * @default false
	 */
	isLoading?: boolean;
	/**
	 * Pagination totals for the full dataset (not just the current page).
	 */
	paginationInfo: {
		/**
		 * The total number of items in the dataset.
		 */
		totalItems: number;
		/**
		 * The total number of pages, given the current items per page.
		 */
		totalPages: number;
	};
	/**
	 * The layouts the user can switch between, mapping each supported layout
	 * type to view settings applied when switching to it (or `true` for
	 * defaults). Only picker layouts (`pickerGrid`, `pickerTable`,
	 * `pickerActivity`) are supported; other layout types are ignored.
	 *
	 * @default { pickerGrid: true, pickerTable: true }
	 */
	defaultLayouts?: SupportedLayouts;
	/**
	 * The currently selected items, as a list of item ids. Selection is
	 * always controlled in pickers, so this prop is required.
	 */
	selection: string[];
	/**
	 * Callback invoked with the new list of selected item ids whenever the
	 * selection changes.
	 */
	onChangeSelection: ( items: string[] ) => void;
	/**
	 * Custom component tree rendered instead of the default layout
	 * composition, using the internal `DataViewsPicker.*` sub-components.
	 */
	children?: ReactNode;
	/**
	 * Static configuration of the component's UI.
	 *
	 * @default { perPageSizes: [ 10, 20, 50, 100 ] }
	 */
	config?: {
		/**
		 * The options offered in the "items per page" control.
		 */
		perPageSizes: number[];
		/**
		 * Whether the view config popover offers the "Original aspect ratio"
		 * control for grid layouts, letting users switch item previews
		 * between cropped (`cover`) and fitted (`contain`).
		 */
		mediaFitControl?: boolean;
	};
	/**
	 * The accessible label for the list of items rendered by the layout.
	 */
	itemListLabel?: string;
	/**
	 * Content rendered when the dataset is empty (no items match the
	 * current view).
	 */
	empty?: ReactNode;
	/**
	 * Callback to reset the view to its initial state, wired to the
	 * "Reset view" button in the view options popover. When provided, the
	 * view options toggle also shows a "modified" indicator. Pass `false` to
	 * render the button disabled (the view is not modified); omit the prop
	 * to hide the button altogether (no reset support).
	 */
	onReset?: ( () => void ) | false;
} & ( Item extends ItemWithId
	? {
			/**
			 * Returns a unique id for an item. Optional when items already
			 * have a string `id` property, which is used by default.
			 */
			getItemId?: ( item: Item ) => string;
	  }
	: {
			/**
			 * Returns a unique id for an item. Required when items have no
			 * string `id` property.
			 */
			getItemId: ( item: Item ) => string;
	  } );

const defaultGetItemId = ( item: ItemWithId ) => item.id;
const EMPTY_ARRAY: any[] = [];
const DEFAULT_PICKER_LAYOUTS: SupportedLayouts = {
	pickerGrid: true,
	pickerTable: true,
};

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
	defaultLayouts: defaultLayoutsProperty = DEFAULT_PICKER_LAYOUTS,
	selection,
	onChangeSelection,
	children,
	config = { perPageSizes: [ 10, 20, 50, 100 ] },
	itemListLabel,
	empty,
	onReset,
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

	usePageClamp( {
		view,
		onChangeView,
		isLoading,
		totalPages: paginationInfo.totalPages,
	} );

	useEffect( () => {
		if ( hasPrimaryOrLockedFilters && ! isShowingFilter ) {
			setIsShowingFilter( true );
		}
	}, [ hasPrimaryOrLockedFilters, isShowingFilter ] );

	// Filter out non-picker layouts and normalize `true` to `{}`.
	const defaultLayouts = useMemo(
		() =>
			Object.fromEntries(
				Object.entries( defaultLayoutsProperty )
					.filter( ( [ layoutType ] ) => {
						return dataViewsPickerLayouts.some(
							( viewLayout ) => viewLayout.type === layoutType
						);
					} )
					.map( ( [ key, value ] ) => [
						key,
						value === true ? {} : value,
					] )
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
				onReset,
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

/**
 * `DataViewsPicker` renders a dataset allowing users to select one or multiple
 * items. It shares the layouts, search, and filtering of `DataViews` but is
 * geared toward choosing items rather than managing them.
 */
// Populate the DataViews sub components
const DataViewsPickerSubComponents =
	DataViewsPicker as typeof DataViewsPicker & {
		BulkActionToolbar: typeof DataViewsPickerBulkActionToolbar;
		Footer: typeof DataViewsPickerFooter;
		Filters: typeof Filters;
		FiltersToggled: typeof FiltersToggled;
		FiltersToggle: typeof FiltersToggle;
		Layout: typeof DataViewsLayout;
		LayoutSwitcher: typeof ViewTypeMenu;
		Pagination: typeof DataViewsPagination;
		Search: typeof DataViewsSearch;
		ViewConfig: typeof DataviewsViewConfigDropdown;
	};

DataViewsPickerSubComponents.BulkActionToolbar =
	DataViewsPickerBulkActionToolbar;
DataViewsPickerSubComponents.Footer = DataViewsPickerFooter;
DataViewsPickerSubComponents.Filters = Filters;
DataViewsPickerSubComponents.FiltersToggled = FiltersToggled;
DataViewsPickerSubComponents.FiltersToggle = FiltersToggle;
DataViewsPickerSubComponents.Layout = DataViewsLayout;
DataViewsPickerSubComponents.LayoutSwitcher = ViewTypeMenu;
DataViewsPickerSubComponents.Pagination = DataViewsPagination;
DataViewsPickerSubComponents.Search = DataViewsSearch;
DataViewsPickerSubComponents.ViewConfig = DataviewsViewConfigDropdown;

export default DataViewsPickerSubComponents;
