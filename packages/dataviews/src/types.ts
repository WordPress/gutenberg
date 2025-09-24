/**
 * External dependencies
 */
import type {
	ReactElement,
	ReactNode,
	ComponentType,
	ComponentProps,
} from 'react';

/**
 * Internal dependencies
 */
import type { SetSelection } from './private-types';

/**
 * WordPress dependencies
 */
import type { useFocusOnMount } from '@wordpress/compose';

/**
 * Utility type that makes all properties of T optional recursively.
 * Used by field setValue functions to allow partial item updates.
 */
export type DeepPartial< T > = {
	[ P in keyof T ]?: T[ P ] extends object ? DeepPartial< T[ P ] > : T[ P ];
};

export type SortDirection = 'asc' | 'desc';

/**
 * Generic option type.
 */
export interface Option< Value extends any = any > {
	value: Value;
	label: string;
	description?: string;
}

export interface FilterByConfig {
	/**
	 * The list of operators supported by the field.
	 */
	operators?: Operator[];

	/**
	 * Whether it is a primary filter.
	 *
	 * A primary filter is always visible and is not listed in the "Add filter" component,
	 * except for the list layout where it behaves like a secondary filter.
	 */
	isPrimary?: boolean;
}

export interface NormalizedFilterByConfig {
	/**
	 * The list of operators supported by the field.
	 */
	operators: Operator[];

	/**
	 * Whether it is a primary filter.
	 *
	 * A primary filter is always visible and is not listed in the "Add filter" component,
	 * except for the list layout where it behaves like a secondary filter.
	 */
	isPrimary?: boolean;
}

interface FilterConfigForType {
	/**
	 * What operators are used by default.
	 */
	defaultOperators: Operator[];

	/**
	 * What operators are supported by the field.
	 */
	validOperators: Operator[];
}

export type Operator =
	| 'is'
	| 'isNot'
	| 'isAny'
	| 'isNone'
	| 'isAll'
	| 'isNotAll'
	| 'lessThan'
	| 'greaterThan'
	| 'lessThanOrEqual'
	| 'greaterThanOrEqual'
	| 'before'
	| 'after'
	| 'beforeInc'
	| 'afterInc'
	| 'contains'
	| 'notContains'
	| 'startsWith'
	| 'between'
	| 'on'
	| 'notOn'
	| 'inThePast'
	| 'over';

export type FieldType =
	| 'text'
	| 'integer'
	| 'datetime'
	| 'date'
	| 'media'
	| 'boolean'
	| 'email'
	| 'password'
	| 'telephone'
	| 'color'
	| 'url'
	| 'array';

/**
 * An abstract interface for Field based on the field type.
 */
export type FieldTypeDefinition< Item > = {
	/**
	 * Callback used to sort the field.
	 */
	sort: ( a: Item, b: Item, direction: SortDirection ) => number;

	/**
	 * Callback used to validate the field.
	 */
	isValid: Rules< Item >;

	/**
	 * Callback used to render an edit control for the field or control name.
	 */
	Edit:
		| ComponentType< DataFormControlProps< Item > >
		| string
		| EditConfig
		| null;

	/**
	 * Callback used to render the field.
	 */
	render: ComponentType< DataViewRenderFieldProps< Item > >;

	/**
	 * The filter config for the field.
	 */
	filterBy: FilterConfigForType | false;

	/**
	 * Whether the field is readOnly.
	 * If `true`, the value will be rendered using the `render` callback.
	 */
	readOnly?: boolean;

	/**
	 * Whether the field is sortable.
	 */
	enableSorting: boolean;
};

export type Rules< Item > = {
	required?: boolean;
	elements?: boolean;
	custom?: ( item: Item, field: NormalizedField< Item > ) => null | string;
};

/**
 * Edit configuration for textarea controls.
 */
export type EditConfigTextarea = {
	control: 'textarea';
	/**
	 * Number of rows for the textarea.
	 */
	rows?: number;
};

/**
 * Edit configuration for text controls.
 */
export type EditConfigText = {
	control: 'text';
	/**
	 * Prefix component to display before the input.
	 */
	prefix?: React.ComponentType;
	/**
	 * Suffix component to display after the input.
	 */
	suffix?: React.ComponentType;
};

/**
 * Edit configuration for other control types (excluding 'text' and 'textarea').
 */
export type EditConfigGeneric = {
	control: Exclude< FieldType, 'text' | 'textarea' >;
};

/**
 * Edit configuration object with type-safe control options.
 * Each control type has its own specific configuration properties.
 */
export type EditConfig =
	| EditConfigTextarea
	| EditConfigText
	| EditConfigGeneric;

/**
 * A dataview field for a specific property of a data type.
 */
export type Field< Item > = {
	/**
	 * Type of the fields.
	 */
	type?: FieldType;

	/**
	 * The unique identifier of the field.
	 */
	id: string;

	/**
	 * The label of the field. Defaults to the id.
	 */
	label?: string;

	/**
	 * The header of the field. Defaults to the label.
	 * It allows the usage of a React Element to render the field labels.
	 */
	header?: string | ReactElement;

	/**
	 * A description of the field.
	 */
	description?: string;

	/**
	 * Placeholder for the field.
	 */
	placeholder?: string;

	/**
	 * Callback used to render the field. Defaults to `field.getValue`.
	 */
	render?: ComponentType< DataViewRenderFieldProps< Item > >;

	/**
	 * Callback used to render an edit control for the field.
	 */
	Edit?: ComponentType< DataFormControlProps< Item > > | string | EditConfig;

	/**
	 * Callback used to sort the field.
	 */
	sort?: ( a: Item, b: Item, direction: SortDirection ) => number;

	/**
	 * Callback used to validate the field.
	 */
	isValid?: Rules< Item >;

	/**
	 * Callback used to decide if a field should be displayed.
	 */
	isVisible?: ( item: Item ) => boolean;

	/**
	 * Whether the field is sortable.
	 */
	enableSorting?: boolean;

	/**
	 * Whether the field is searchable.
	 */
	enableGlobalSearch?: boolean;

	/**
	 * Whether the field can be hidden in the UI.
	 */
	enableHiding?: boolean;

	/**
	 * The list of options to pick from when using the field as a filter.
	 */
	elements?: Option[];

	/**
	 * Filter config for the field.
	 */
	filterBy?: FilterByConfig | false;

	/**
	 * Whether the field is readOnly.
	 * If `true`, the value will be rendered using the `render` callback.
	 */
	readOnly?: boolean;

	/**
	 * Callback used to retrieve the value of the field from the item.
	 * Defaults to `item[ field.id ]`.
	 */
	getValue?: ( args: { item: Item } ) => any;

	/**
	 * Callback used to set the value of the field on the item.
	 * Used for editing operations to update field values.
	 */
	setValue?: ( args: { item: Item; value: any } ) => DeepPartial< Item >;
};

export type NormalizedField< Item > = Omit< Field< Item >, 'Edit' > & {
	label: string;
	header: string | ReactElement;
	getValue: ( args: { item: Item } ) => any;
	setValue: ( args: { item: Item; value: any } ) => DeepPartial< Item >;
	render: ComponentType< DataViewRenderFieldProps< Item > >;
	Edit: ComponentType< DataFormControlProps< Item > > | null;
	sort: ( a: Item, b: Item, direction: SortDirection ) => number;
	isValid: Rules< Item >;
	enableHiding: boolean;
	enableSorting: boolean;
	filterBy: NormalizedFilterByConfig | false;
	readOnly: boolean;
};

/**
 * A collection of dataview fields for a data type.
 */
export type Fields< Item > = Field< Item >[];

export type Data< Item > = Item[];

export type DataFormControlProps< Item > = {
	data: Item;
	field: NormalizedField< Item >;
	onChange: ( value: DeepPartial< Item > ) => void;
	hideLabelFromVision?: boolean;
	/**
	 * The currently selected filter operator for this field.
	 *
	 * Used by DataViews filters to determine which control to render based on the operator type.
	 */
	operator?: Operator;
	/**
	 * Configuration object for the control.
	 */
	config?: {
		prefix?: React.ComponentType;
		suffix?: React.ComponentType;
		rows?: number;
	};
};

export type DataViewRenderFieldProps< Item > = {
	item: Item;
	field: NormalizedField< Item >;
	config?: {
		sizes: string;
	};
};

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
	 * Whether the action is destructive.
	 */
	isDestructive?: boolean;

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
	modalHeader?: string;

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

/**
 * DataForm layouts.
 */
export type LayoutType = 'regular' | 'panel' | 'card' | 'row';
export type LabelPosition = 'top' | 'side' | 'none';

export type RegularLayout = {
	type: 'regular';
	labelPosition?: LabelPosition;
};
export type NormalizedRegularLayout = {
	type: 'regular';
	labelPosition: LabelPosition;
};

export type PanelLayout = {
	type: 'panel';
	labelPosition?: LabelPosition;
	openAs?: 'dropdown' | 'modal';
};
export type NormalizedPanelLayout = {
	type: 'panel';
	labelPosition: LabelPosition;
	openAs: 'dropdown' | 'modal';
};

export type CardLayout =
	| {
			type: 'card';
			withHeader: false;
			// isOpened cannot be false if withHeader is false as well.
			// Otherwise, the card would not be visible.
			isOpened?: true;
	  }
	| {
			type: 'card';
			withHeader?: true | undefined;
			isOpened?: boolean;
	  };
export type NormalizedCardLayout =
	| {
			type: 'card';
			withHeader: false;
			// isOpened cannot be false if withHeader is false as well.
			// Otherwise, the card would not be visible.
			isOpened: true;
	  }
	| {
			type: 'card';
			withHeader: true;
			isOpened: boolean;
	  };

export type RowLayout = {
	type: 'row';
	alignment?: 'start' | 'center' | 'end';
};
export type NormalizedRowLayout = {
	type: 'row';
	alignment: 'start' | 'center' | 'end';
};

export type Layout = RegularLayout | PanelLayout | CardLayout | RowLayout;
export type NormalizedLayout =
	| NormalizedRegularLayout
	| NormalizedPanelLayout
	| NormalizedCardLayout
	| NormalizedRowLayout;

export type SimpleFormField = {
	id: string;
	layout?: Layout;
};

export type CombinedFormField = {
	id: string;
	label?: string;
	description?: string;
	layout?: Layout;
	children: Array< FormField | string >;
	summary?: string | string[];
};

export type FormField = SimpleFormField | CombinedFormField;

/**
 * The form configuration.
 */
export type Form = {
	layout?: Layout;
	fields?: Array< FormField | string >;
};

export interface DataFormProps< Item > {
	data: Item;
	fields: Field< Item >[];
	form: Form;
	onChange: ( value: Record< string, any > ) => void;
}

export interface FieldLayoutProps< Item > {
	data: Item;
	field: FormField;
	onChange: ( value: any ) => void;
	hideLabelFromVision?: boolean;
}
