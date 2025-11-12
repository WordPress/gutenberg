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
	custom?:
		| ( ( item: Item, field: NormalizedField< Item > ) => null | string )
		| ( (
				item: Item,
				field: NormalizedField< Item >
		  ) => Promise< null | string > );
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
};

export type NormalizedField< Item > = Omit< Field< Item >, 'Edit' > & {
	label: string;
	header: string | ReactElement;
	getValue: ( args: { item: Item } ) => any;
	setValue: ( args: { item: Item; value: any } ) => DeepPartial< Item >;
	render: ComponentType< DataViewRenderFieldProps< Item > >;
	Edit: ComponentType< DataFormControlProps< Item > > | null;
	hasElements: boolean;
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

export type FieldValidity = {
	required?: {
		type: 'valid' | 'invalid' | 'validating';
		message?: string;
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
