/**
 * External dependencies
 */
import type { ReactElement, ReactNode, ComponentProps } from 'react';

/**
 * WordPress dependencies
 */
import type { useFocusOnMount } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type {
	NormalizedField,
	Operator,
	Option,
	SortDirection,
} from './field-api';
import type { SetSelection } from './private';

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
	elements: Option[];

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
	 * The number of items per page
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
	 * The field to group by.
	 */
	groupByField?: string;

	/**
	 * Whether infinite scroll is enabled.
	 */
	infiniteScrollEnabled?: boolean;
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
	};
}

export interface ViewList extends ViewBase {
	type: 'list';
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
	};
}

export type View = ViewList | ViewGrid | ViewTable | ViewPickerGrid;

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

export interface ViewGridProps< Item > extends ViewBaseProps< Item > {
	view: ViewGrid;
}

export interface ViewPickerGridProps< Item >
	extends Omit< ViewPickerBaseProps< Item >, 'view' > {
	view: ViewPickerGrid;
}

export type ViewProps< Item > =
	| ViewTableProps< Item >
	| ViewGridProps< Item >
	| ViewListProps< Item >;

export type ViewPickerProps< Item > = ViewPickerGridProps< Item >;

export interface SupportedLayouts {
	list?: Omit< ViewList, 'type' >;
	grid?: Omit< ViewGrid, 'type' >;
	table?: Omit< ViewTable, 'type' >;
	pickerGrid?: Omit< ViewPickerGrid, 'type' >;
}
