import type { ReactElement, ReactNode, ComponentProps } from 'react';
import type { useFocusOnMount } from '@wordpress/compose';
import type {
	Field,
	NormalizedField,
	Operator,
	Option,
	SortDirection,
} from './field-api';
import type { SetSelection } from './private';
import type { MEDIA_ASPECT_RATIOS } from '../constants';

export type ItemWithId = { id: string };

export type DataViewsProps< Item > = {
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
	 * The actions that can be performed on items, shown per item and, for
	 * actions supporting bulk, on multi-selections.
	 */
	actions?: Action< Item >[];

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
	 * defaults).
	 */
	defaultLayouts?: SupportedLayouts;

	/**
	 * The currently selected items, as a list of item ids. When provided
	 * (together with `onChangeSelection`), selection is controlled.
	 */
	selection?: string[];

	/**
	 * Callback invoked with the new list of selected item ids whenever the
	 * selection changes.
	 */
	onChangeSelection?: ( items: string[] ) => void;

	/**
	 * Callback invoked when the user clicks an item's title or media.
	 * Ignored when `renderItemLink` is provided.
	 */
	onClickItem?: ( item: Item ) => void;

	/**
	 * Renders the item's title and media as a link. Receives the item along
	 * with anchor props to spread onto the link element. Takes precedence
	 * over `onClickItem`.
	 */
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;

	/**
	 * Whether an item is clickable, i.e. whether `onClickItem` or
	 * `renderItemLink` applies to it.
	 *
	 * @default () => true
	 */
	isItemClickable?: ( item: Item ) => boolean;

	/**
	 * Extra content rendered in the toolbar area, next to the view
	 * configuration controls.
	 */
	header?: ReactNode;

	/**
	 * Returns the hierarchical depth of an item, used to indent items when
	 * the view's `showLevels` option is enabled.
	 */
	getItemLevel?: ( item: Item ) => number;

	/**
	 * Custom component tree rendered instead of the default layout
	 * composition, using the internal `DataViews.*` sub-components.
	 */
	children?: ReactNode;

	/**
	 * Static configuration of the component's UI.
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
	 * Content rendered when the dataset is empty (no items match the
	 * current view).
	 */
	empty?: ReactNode;

	/**
	 * Callback to reset the view to its initial state, wired to the "Reset"
	 * action shown when filters or search are active. Pass `false` to hide
	 * the reset action.
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

/**
 * The filters applied to the dataset.
 */
export interface Filter {
	/**
	 * The field to filter by.
	 */
	field: string;

	/**
	 * The operator to use.
	 */
	operator: Operator;

	/**
	 * The value to filter by.
	 */
	value: any;

	/**
	 * Whether the filter can be edited by the user.
	 */
	isLocked?: boolean;
}

export interface NormalizedFilter {
	/**
	 * The field to filter by.
	 */
	field: string;

	/**
	 * The field name.
	 */
	name: string;

	/**
	 * The list of options to pick from when using the field as a filter.
	 */
	elements?: Option[];

	/**
	 * Retrieval function to get the elements.
	 */
	getElements?: () => Promise< Option[] >;

	/**
	 * Whether the filter has elements.
	 */
	hasElements: boolean;

	/**
	 * Is a single selection filter.
	 */
	singleSelection: boolean;

	/**
	 * The list of operators supported by the field.
	 */
	operators: Operator[];

	/**
	 * Whether the filter is visible.
	 */
	isVisible: boolean;

	/**
	 * Whether it is a primary filter.
	 */
	isPrimary: boolean;

	/**
	 * Whether the filter can be edited by the user.
	 */
	isLocked: boolean;
}

interface ViewBase {
	/**
	 * The layout of the view.
	 */
	type: string;

	/**
	 * The global search term.
	 */
	search?: string;

	/**
	 * The filters to apply.
	 */
	filters?: Filter[];

	/**
	 * The sorting configuration.
	 */
	sort?: {
		/**
		 * The field to sort by.
		 */
		field: string;

		/**
		 * The direction to sort by.
		 */
		direction: SortDirection;
	};

	/**
	 * The active page
	 */
	page?: number;

	/**
	 * The number of items per page.
	 * Also used as the batch size when infinite scroll is enabled.
	 */
	perPage?: number;

	/**
	 * The fields to render
	 */
	fields?: string[];

	/**
	 * Title field
	 */
	titleField?: string;

	/**
	 * Media field
	 */
	mediaField?: string;

	/**
	 * Description field
	 */
	descriptionField?: string;

	/**
	 * Whether to show the title
	 */
	showTitle?: boolean;

	/**
	 * Whether to show the media
	 */
	showMedia?: boolean;

	/**
	 * Whether to show the description
	 */
	showDescription?: boolean;

	/**
	 * Whether to show the hierarchical levels.
	 */
	showLevels?: boolean;

	/**
	 * The grouping configuration.
	 */
	groupBy?: {
		/**
		 * The field to group by.
		 */
		field: string;

		/**
		 * The direction to sort by.
		 */
		direction: SortDirection;

		/**
		 * Whether to show the field label in the group header.
		 *
		 * @default true
		 */
		showLabel?: boolean;
	};

	/**
	 * Whether infinite scroll is enabled.
	 */
	infiniteScrollEnabled?: boolean;

	/**
	 * The start position for infinite scroll (1-indexed).
	 * Used when infiniteScrollEnabled is true.
	 */
	startPosition?: number;
}

export interface ColumnStyle {
	/**
	 * The width of the field column.
	 */
	width?: string | number;

	/**
	 * The minimum width of the field column.
	 */
	maxWidth?: string | number;

	/**
	 * The maximum width of the field column.
	 */
	minWidth?: string | number;

	/**
	 * The alignment of the field column, defaults to left.
	 */
	align?: 'start' | 'center' | 'end';
}

export type Density = 'compact' | 'balanced' | 'comfortable';

/**
 * The preset aspect ratios available for item media previews, mirroring
 * Core's default `aspect-ratio` presets. Derived from the
 * `MEDIA_ASPECT_RATIOS` constant, which layouts also use to validate the
 * configured value at runtime, so the two can't drift apart.
 */
export type MediaAspectRatio = ( typeof MEDIA_ASPECT_RATIOS )[ number ];

/**
 * How the media field fills its preview box. `cover` crops it to fill,
 * `contain` fits the whole media inside, letterboxing it so its own aspect
 * ratio stays visible. Unlike `MediaAspectRatio` there is no matching runtime
 * constant: layouts style the fit from a class they add for `contain` alone,
 * so any other value simply leaves previews cropped.
 */
export type MediaFit = 'cover' | 'contain';

export interface ViewTable extends ViewBase {
	type: 'table';

	layout?: {
		/**
		 * The styles for the columns.
		 */
		styles?: Record< string, ColumnStyle >;

		/**
		 * The density of the view.
		 */
		density?: Density;

		/**
		 * Whether the view allows column moving.
		 */
		enableMoving?: boolean;

		/**
		 * A fixed aspect ratio for the primary column's media preview, one of
		 * the preset ratios. Applied uniformly to every row. Defaults to
		 * `'1/1'`.
		 */
		aspectRatio?: MediaAspectRatio;
	};
}

export interface ViewList extends ViewBase {
	type: 'list';

	layout?: {
		/**
		 * The density of the view.
		 */
		density?: Density;
	};
}

export interface ViewActivity extends ViewBase {
	type: 'activity';

	layout?: {
		/**
		 * The density of the view.
		 */
		density?: Density;
	};
}

export interface ViewGrid extends ViewBase {
	type: 'grid';

	layout?: {
		/**
		 * The fields to use as badge fields.
		 */
		badgeFields?: string[];

		/**
		 * The preview size of the grid.
		 */
		previewSize?: number;

		/**
		 * The density of the grid layout.
		 */
		density?: Density;

		/**
		 * A fixed aspect ratio for the grid item previews (the media field),
		 * one of the preset ratios. Applied uniformly to every item so rows
		 * stay aligned. Defaults to `'1/1'`.
		 */
		aspectRatio?: MediaAspectRatio;

		/**
		 * How the media field fills the preview box. `'cover'` crops it to
		 * fill, `'contain'` fits the whole media inside so its own aspect
		 * ratio stays visible. The box keeps the shape set by `aspectRatio`
		 * either way, so rows stay aligned. Defaults to `'cover'`.
		 */
		mediaFit?: MediaFit;
	};
}

export interface ViewPickerGrid extends ViewBase {
	type: 'pickerGrid';

	layout?: {
		/**
		 * The fields to use as badge fields.
		 */
		badgeFields?: string[];

		/**
		 * The preview size of the grid.
		 */
		previewSize?: number;

		/**
		 * The density of the grid layout.
		 */
		density?: Density;

		/**
		 * How the media field fills the preview box. `'cover'` crops it to
		 * fill, `'contain'` fits the whole media inside so its own aspect
		 * ratio stays visible. The box stays square either way, so rows stay
		 * aligned. Defaults to `'cover'`.
		 */
		mediaFit?: MediaFit;
	};
}

export interface ViewPickerTable extends ViewBase {
	type: 'pickerTable';

	layout?: {
		/**
		 * The styles for the columns.
		 */
		styles?: Record< string, ColumnStyle >;

		/**
		 * The density of the view.
		 */
		density?: Density;

		/**
		 * Whether the view allows column moving.
		 */
		enableMoving?: boolean;
	};
}

export interface ViewPickerActivity extends ViewBase {
	type: 'pickerActivity';

	layout?: {
		/**
		 * The density of the view.
		 */
		density?: Density;
	};
}

export type View =
	| ViewList
	| ViewGrid
	| ViewTable
	| ViewPickerGrid
	| ViewPickerTable
	| ViewPickerActivity
	| ViewActivity;

interface ActionBase< Item > {
	/**
	 * The unique identifier of the action.
	 */
	id: string;

	/**
	 * The label of the action.
	 * In case we want to adjust the label based on the selected items,
	 * a function can be provided.
	 */
	label: string | ( ( items: Item[] ) => string );

	/**
	 * The icon of the action. (Either a string or an SVG element)
	 * This should be IconType from the components package
	 * but that import is breaking typescript build for the moment.
	 */
	icon?: any;

	/**
	 * Whether the action is disabled.
	 */
	disabled?: boolean;

	/**
	 * Whether the action is a primary action.
	 */
	isPrimary?: boolean;

	/**
	 * Whether the item passed as an argument supports the current action.
	 */
	isEligible?: ( item: Item ) => boolean;

	/**
	 * Whether the action can be used as a bulk action.
	 */
	supportsBulk?: boolean;

	/**
	 * The context in which the action is visible.
	 * This is only a "meta" information for now.
	 */
	context?: 'list' | 'single';
}

export interface RenderModalProps< Item > {
	items: Item[];
	closeModal?: () => void;
	onActionPerformed?: ( items: Item[] ) => void;
}

export interface ActionModal< Item > extends ActionBase< Item > {
	/**
	 * Modal to render when the action is triggered.
	 */
	RenderModal: ( {
		items,
		closeModal,
		onActionPerformed,
	}: RenderModalProps< Item > ) => ReactElement;

	/**
	 * Whether to hide the modal header.
	 */
	hideModalHeader?: boolean;

	/**
	 * The header of the modal.
	 */
	modalHeader?: string | ( ( items: Item[] ) => string );

	/**
	 * The size of the modal.
	 *
	 * @default 'medium'
	 */
	modalSize?: 'small' | 'medium' | 'large' | 'fill';

	/**
	 * The focus on mount property of the modal.
	 */
	modalFocusOnMount?:
		| Parameters< typeof useFocusOnMount >[ 0 ]
		| 'firstContentElement';
}

export interface ActionButton< Item > extends ActionBase< Item > {
	/**
	 * The callback to execute when the action is triggered.
	 */
	callback: (
		items: Item[],
		context: {
			registry: any;
			onActionPerformed?: ( items: Item[] ) => void;
		}
	) => void;
}

export type Action< Item > = ActionModal< Item > | ActionButton< Item >;

export interface ViewBaseProps< Item > {
	className?: string;
	actions: Action< Item >[];
	data: Item[];
	fields: NormalizedField< Item >[];
	getItemId: ( item: Item ) => string;
	getItemLevel?: ( item: Item ) => number;
	isLoading?: boolean;
	onChangeView: ( view: View ) => void;
	onChangeSelection: SetSelection;
	selection: string[];
	setOpenedFilter: ( fieldId: string ) => void;
	onClickItem?: ( item: Item ) => void;
	renderItemLink?: (
		props: {
			item: Item;
		} & ComponentProps< 'a' >
	) => ReactElement;
	isItemClickable: ( item: Item ) => boolean;
	view: View;
	empty: ReactNode;
}

export type ViewPickerBaseProps< Item > = Omit<
	ViewBaseProps< Item >,
	| 'view'
	| 'onChangeView'
	// The following props are not supported for pickers.
	| 'isItemClickable'
	| 'onClickItem'
	| 'renderItemLink'
	| 'getItemLevel'
> & {
	view: View;
	onChangeView: ( view: View ) => void;
};

export interface ViewTableProps< Item > extends ViewBaseProps< Item > {
	view: ViewTable;
}

export interface ViewListProps< Item > extends ViewBaseProps< Item > {
	view: ViewList;
}

export interface ViewActivityProps< Item > extends ViewBaseProps< Item > {
	view: ViewActivity;
}

export interface ViewGridProps< Item > extends ViewBaseProps< Item > {
	view: ViewGrid;
}

export interface ViewPickerGridProps< Item >
	extends Omit< ViewPickerBaseProps< Item >, 'view' > {
	view: ViewPickerGrid;
}

export interface ViewPickerTableProps< Item >
	extends Omit< ViewPickerBaseProps< Item >, 'view' > {
	view: ViewPickerTable;
}

export interface ViewPickerActivityProps< Item >
	extends Omit< ViewPickerBaseProps< Item >, 'view' > {
	view: ViewPickerActivity;
}

export type ViewProps< Item > =
	| ViewTableProps< Item >
	| ViewGridProps< Item >
	| ViewListProps< Item >
	| ViewActivityProps< Item >;

export type ViewPickerProps< Item > =
	| ViewPickerGridProps< Item >
	| ViewPickerTableProps< Item >
	| ViewPickerActivityProps< Item >;

export interface SupportedLayouts {
	list?: Omit< ViewList, 'type' > | true;
	grid?: Omit< ViewGrid, 'type' > | true;
	table?: Omit< ViewTable, 'type' > | true;
	activity?: Omit< ViewActivity, 'type' > | true;
	pickerGrid?: Omit< ViewPickerGrid, 'type' > | true;
	pickerTable?: Omit< ViewPickerTable, 'type' > | true;
	pickerActivity?: Omit< ViewPickerActivity, 'type' > | true;
}

export interface NormalizedSupportedLayouts {
	list?: Omit< ViewList, 'type' >;
	grid?: Omit< ViewGrid, 'type' >;
	table?: Omit< ViewTable, 'type' >;
	activity?: Omit< ViewActivity, 'type' >;
	pickerGrid?: Omit< ViewPickerGrid, 'type' >;
	pickerTable?: Omit< ViewPickerTable, 'type' >;
	pickerActivity?: Omit< ViewPickerActivity, 'type' >;
}
