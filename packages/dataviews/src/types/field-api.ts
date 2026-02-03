/**
 * External dependencies
 */
import type { ReactElement, ComponentType } from 'react';

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

export type FieldTypeName =
	| 'text'
	| 'integer'
	| 'number'
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

export type Rules< Item > = {
	required?: boolean;
	elements?: boolean;
	pattern?: string;
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
	custom?:
		| ( ( item: Item, field: NormalizedField< Item > ) => null | string )
		| ( (
				item: Item,
				field: NormalizedField< Item >
		  ) => Promise< null | string > );
};

export type Validator< Item > = (
	item: Item,
	field: NormalizedField< Item >
) => boolean;

export type CustomValidator< Item > =
	| ( ( item: Item, field: NormalizedField< Item > ) => null | string )
	| ( (
			item: Item,
			field: NormalizedField< Item >
	  ) => Promise< null | string > );

export type FilterOperator< Item > = (
	item: Item,
	field: NormalizedField< Item >,
	filterValue: any
) => boolean;

export type FilterOperatorMap< Item > = Partial<
	Record< Operator, FilterOperator< Item > >
>;

type NormalizedRule< Item, ConstraintType > = {
	constraint: ConstraintType;
	validate: Validator< Item >;
};

export type NormalizedRules< Item > = {
	required?: NormalizedRule< Item, boolean >;
	elements?: NormalizedRule< Item, boolean >;
	pattern?: NormalizedRule< Item, string >;
	minLength?: NormalizedRule< Item, number >;
	maxLength?: NormalizedRule< Item, number >;
	min?: NormalizedRule< Item, number >;
	max?: NormalizedRule< Item, number >;
	custom?: CustomValidator< Item >;
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
	control: Exclude< FieldTypeName, 'text' | 'textarea' >;
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
	type?: FieldTypeName;

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
	 * Retrieval function for elements.
	 */
	getElements?: () => Promise< Option[] >;

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

	/**
	 * Display format configuration for fields.
	 */
	format?: FormatDatetime | FormatDate | FormatNumber | FormatInteger;

	/**
	 * Callback used to format the value of the field for display.
	 */
	getValueFormatted?: ( {
		item,
		field,
	}: {
		item: Item;
		field: NormalizedField< Item >;
	} ) => string;
};

/**
 * Format for datetime fields:
 *
 * - datetime: the format string (e.g., "M j, Y g:i a" for "Jan 1, 2021 2:30 pm").
 * - weekStartsOn: to specify the first day of the week (0 for 'sunday', 1 for 'monday', etc.).
 *
 * If not provided, defaults to WordPress date format settings.
 */
export type FormatDatetime = {
	datetime?: string;
	weekStartsOn?: DayNumber;
};

/**
 * Format for date fields:
 *
 * - date: the format string (e.g., 'F j, Y' for 'March 10, 2023')
 * - weekStartsOn: to specify the first day of the week (0 for 'sunday', 1 for 'monday', etc.).
 *
 * If not provided, defaults to WordPress date format settings.
 */
export type FormatDate = {
	date?: string;
	weekStartsOn?: DayNumber;
};
export type DayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Format for number fields:
 *
 * - separatorThousand: character to use for thousand separators (e.g., ',')
 * - separatorDecimal: character to use for decimal point (e.g., '.')
 * - decimals: number of decimal places to display (e.g., 2)
 *
 * If not provided, defaults to ',' for thousands, '.' for decimal, 2 decimals.
 */
export type FormatNumber = {
	separatorThousand?: string;
	separatorDecimal?: string;
	decimals?: number;
};

/**
 * Format for integer fields:
 *
 * - separatorThousand: character to use for thousand separators (e.g., ',')
 *
 * If not provided, defaults to ',' for thousands.
 */
export type FormatInteger = {
	separatorThousand?: string;
};

export type NormalizedField< Item > = Omit<
	Field< Item >,
	'Edit' | 'isValid'
> & {
	label: string;
	header: string | ReactElement;
	getValue: ( args: { item: Item } ) => any;
	setValue: ( args: { item: Item; value: any } ) => DeepPartial< Item >;
	render: ComponentType< DataViewRenderFieldProps< Item > >;
	Edit: ComponentType< DataFormControlProps< Item > > | null;
	hasElements: boolean;
	sort: ( a: Item, b: Item, direction: SortDirection ) => number;
	isValid: NormalizedRules< Item >;
	enableHiding: boolean;
	enableSorting: boolean;
	filterBy: Required< FilterByConfig > | false;
	filter: FilterOperatorMap< Item >;
	readOnly: boolean;
	format:
		| {}
		| Required< FormatDate >
		| Required< FormatInteger >
		| Required< FormatNumber >;
	getValueFormatted: ( {
		item,
		field,
	}: {
		item: Item;
		field: NormalizedField< Item >;
	} ) => string;
};

/**
 * A collection of dataview fields for a data type.
 */
export type Fields< Item > = Field< Item >[];

export type FieldValidity = {
	required?: {
		type: 'valid' | 'invalid' | 'validating';
		message?: string;
	};
	pattern?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	min?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	max?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	minLength?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	maxLength?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	elements?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	custom?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	children?: Record< string, FieldValidity >;
};

export type DataFormControlProps< Item > = {
	data: Item;
	field: NormalizedField< Item >;
	onChange: ( value: DeepPartial< Item > ) => void;
	hideLabelFromVision?: boolean;
	/**
	 * Label the control as "optional" when _not_ required, instead of showing "required".
	 */
	markWhenOptional?: boolean;
	/**
	 * The currently selected filter operator for this field.
	 *
	 * Used by DataViews filters to determine which control to render based on the operator type.
	 */
	operator?: Operator;
	/**
	 * Validity information for the field, if any.
	 */
	validity?: FieldValidity;
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
