import type { ReactElement, ComponentType } from 'react';

/**
 * Utility type that makes all properties of T optional recursively.
 * Used by field setValue functions to allow partial item updates.
 */
export type DeepPartial< T > = {
	[ P in keyof T ]?: T[ P ] extends object ? DeepPartial< T[ P ] > : T[ P ];
};

/**
 * The direction in which a field is sorted: ascending or descending.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Generic option type, used for a field's `elements`.
 */
export interface Option< Value extends any = any > {
	/**
	 * The value of the option, stored on the item when selected.
	 */
	value: Value;

	/**
	 * The human-readable label for the option, shown in the UI.
	 */
	label: string;

	/**
	 * An optional description of the option, shown alongside the label
	 * by controls that support it.
	 */
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

/**
 * The operators available to filter a field:
 *
 * - `is` / `isNot`: exact (in)equality against a single value.
 * - `isAny` / `isNone`: membership in a list of values (any / none of them).
 * - `isAll`: for multi-value fields, whether the item contains all of the
 *   selected values.
 * - `isNotAll`: deprecated alias of `isNone` (matches items containing none
 *   of the selected values, not items merely missing one of them).
 * - `lessThan` / `greaterThan` / `lessThanOrEqual` / `greaterThanOrEqual`: numeric comparisons.
 * - `before` / `after` / `beforeInc` / `afterInc`: date comparisons, exclusive and inclusive.
 * - `on` / `notOn`: date (in)equality.
 * - `inThePast` / `over`: relative date ranges (within / more than a given period ago).
 * - `contains` / `notContains` / `startsWith`: substring matching for text.
 * - `between`: range matching between two values.
 */
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

/**
 * The name of a built-in field type.
 *
 * The field type determines the default rendering, editing control, sorting
 * logic, filter operators, and validation rules for a field.
 */
export type FieldTypeName =
	| 'text'
	| 'integer'
	| 'number'
	| 'datetime'
	| 'date'
	| 'time'
	| 'media'
	| 'boolean'
	| 'email'
	| 'password'
	| 'telephone'
	| 'color'
	| 'url'
	| 'array';

/**
 * Validation rules for a field, provided via `field.isValid`.
 */
export type Rules< Item > = {
	/**
	 * Whether the field must have a non-empty value.
	 */
	required?: boolean;

	/**
	 * Whether the value must be one of the field's `elements`.
	 */
	elements?: boolean;

	/**
	 * A regular expression the value must match.
	 */
	pattern?: string;

	/**
	 * The minimum length of the value.
	 */
	minLength?: number;

	/**
	 * The maximum length of the value.
	 */
	maxLength?: number;

	/**
	 * The minimum value. A `number` for numeric field types,
	 * a `string` for date-based field types.
	 */
	min?: number | string;

	/**
	 * The maximum value. A `number` for numeric field types,
	 * a `string` for date-based field types.
	 */
	max?: number | string;

	/**
	 * A custom validation callback, optionally asynchronous.
	 * Returns `null` when the item is valid, or an error message otherwise.
	 */
	custom?:
		| ( ( item: Item, field: NormalizedField< Item > ) => null | string )
		| ( (
				item: Item,
				field: NormalizedField< Item >
		  ) => Promise< null | string > );
};

/**
 * A validation callback for a single rule.
 * Returns whether the item's value for the field satisfies the rule.
 */
export type Validator< Item > = (
	item: Item,
	field: NormalizedField< Item >
) => boolean;

/**
 * A custom validation callback, optionally asynchronous.
 * Returns `null` when the item is valid, or an error message otherwise.
 */
export type CustomValidator< Item > =
	| ( ( item: Item, field: NormalizedField< Item > ) => null | string )
	| ( (
			item: Item,
			field: NormalizedField< Item >
	  ) => Promise< null | string > );

/**
 * A callback implementing a filter operator for a field.
 * Returns whether the item matches the given filter value.
 */
export type FilterOperator< Item > = (
	item: Item,
	field: NormalizedField< Item >,
	filterValue: any
) => boolean;

/**
 * A map from operator name to the callback implementing it for a field.
 * The map's keys are the operators the field supports for in-memory filtering.
 */
export type FilterOperatorMap< Item > = Partial<
	Record< Operator, FilterOperator< Item > >
>;

/**
 * A validation rule after normalization: the constraint provided
 * by the consumer plus the callback that enforces it.
 */
type NormalizedRule< Item, ConstraintType > = {
	/**
	 * The constraint value provided via `field.isValid`
	 * (e.g. the pattern string, or the min/max bound).
	 */
	constraint: ConstraintType;

	/**
	 * The callback that checks the rule against an item.
	 */
	validate: Validator< Item >;
};

/**
 * The validation rules of a field after normalization.
 * Each rule pairs the consumer-provided constraint with its validation
 * callback; `custom` remains the consumer-provided callback.
 */
export type NormalizedRules< Item > = {
	required?: NormalizedRule< Item, boolean >;
	elements?: NormalizedRule< Item, boolean >;
	pattern?: NormalizedRule< Item, string >;
	minLength?: NormalizedRule< Item, number >;
	maxLength?: NormalizedRule< Item, number >;
	min?: NormalizedRule< Item, number > | NormalizedRule< Item, string >;
	max?: NormalizedRule< Item, number > | NormalizedRule< Item, string >;
	custom?: CustomValidator< Item >;
};

/**
 * Edit configuration for textarea controls.
 */
export type EditConfigTextarea = {
	/**
	 * The control to render.
	 */
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
	/**
	 * The control to render.
	 */
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
 * Edit configuration for datetime controls.
 */
export type EditConfigDatetime = {
	/**
	 * The control to render.
	 */
	control: 'datetime';
	/**
	 * Whether to render a compact version without the calendar widget.
	 */
	compact?: boolean;
};

/**
 * Edit configuration for other control types (excluding 'text', 'textarea', and 'datetime').
 */
export type EditConfigGeneric = {
	/**
	 * The control to render.
	 */
	control: Exclude< FieldTypeName, 'text' | 'textarea' | 'datetime' >;
};

/**
 * Edit configuration object with type-safe control options.
 * Each control type has its own specific configuration properties.
 */
export type EditConfig =
	| EditConfigTextarea
	| EditConfigText
	| EditConfigDatetime
	| EditConfigGeneric;

/**
 * A field of an item, as provided by the consumer.
 * It describes how the field is rendered, edited, sorted,
 * filtered, and validated.
 */
export type Field< Item > = {
	/**
	 * Type of the field.
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
	description?: string | ReactElement;

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
	 * Validation config for the field.
	 *
	 * Range rules are normalized according to `type`:
	 * - `'integer' | 'number'`: `min`/`max` accept `number`
	 * - `'date' | 'datetime' | 'time'`: `min`/`max` accept `string`
	 * - all other field types ignore `min`/`max`
	 */
	isValid?: Rules< Item >;

	/**
	 * Callback used to decide if a field should be displayed.
	 */
	isVisible?: ( item: Item ) => boolean;

	/**
	 * Whether a field should be disabled.
	 * Can be a boolean or a callback receiving the current item and field.
	 * Defaults to false.
	 */
	isDisabled?:
		| boolean
		| ( ( args: {
				item: Item;
				field: NormalizedField< Item >;
		  } ) => boolean );

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
	format?:
		| FormatDatetime
		| FormatDate
		| FormatTime
		| FormatNumber
		| FormatInteger;

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
/**
 * A day of the week as a number, from 0 (Sunday) to 6 (Saturday).
 */
export type DayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Format for time fields:
 *
 * - time: the format string (e.g., 'g:i a' for '2:30 pm').
 *
 * If not provided, defaults to the WordPress time format setting.
 *
 * Whether the Edit control offers a seconds field follows this format: it does
 * when the format string renders seconds, and does not otherwise.
 */
export type FormatTime = {
	time?: string;
};

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

/**
 * A field after normalization: the properties listed below have been
 * resolved to a value, either from the consumer-provided field or from the
 * defaults of the field's type. Properties without a default (`description`,
 * `placeholder`, `elements`, `getElements`, `isVisible`) stay optional and
 * may be `undefined`. This is the shape received by field callbacks
 * (`render`, `Edit`, validators, etc.).
 */
export type NormalizedField< Item > = Omit<
	Field< Item >,
	'Edit' | 'isValid'
> & {
	/**
	 * The label of the field. Defaults to the id.
	 */
	label: string;

	/**
	 * The header of the field. Defaults to the label.
	 */
	header: string | ReactElement;

	/**
	 * Callback used to retrieve the value of the field from the item.
	 * Defaults to `item[ field.id ]`.
	 */
	getValue: ( args: { item: Item } ) => any;

	/**
	 * Callback used to set the value of the field on the item.
	 * Defaults to setting `item[ field.id ]`.
	 */
	setValue: ( args: { item: Item; value: any } ) => DeepPartial< Item >;

	/**
	 * Callback used to render the field. Defaults to the renderer
	 * of the field's type.
	 */
	render: ComponentType< DataViewRenderFieldProps< Item > >;

	/**
	 * The control used to edit the field, resolved to a component.
	 * `null` when the field is not editable.
	 */
	Edit: ComponentType< DataFormControlProps< Item > > | null;

	/**
	 * Whether the field provides a list of options to pick from,
	 * either via `elements` or `getElements`.
	 */
	hasElements: boolean;

	/**
	 * Callback used to sort the field. Defaults to the sorter
	 * of the field's type.
	 */
	sort: ( a: Item, b: Item, direction: SortDirection ) => number;

	/**
	 * The validation rules of the field, normalized.
	 */
	isValid: NormalizedRules< Item >;

	/**
	 * Whether the field can be hidden in the UI. Defaults to true.
	 */
	enableHiding: boolean;

	/**
	 * Whether the field is sortable. Defaults to the field type's setting:
	 * `true` for every type except `media` and `password`.
	 */
	enableSorting: boolean;

	/**
	 * Filter config for the field, with all properties resolved.
	 * `false` when the field cannot be used as a filter.
	 */
	filterBy: Required< FilterByConfig > | false;

	/**
	 * The filter operators supported by the field for in-memory filtering,
	 * as provided by the field's type.
	 */
	filter: FilterOperatorMap< Item >;

	/**
	 * Whether the field is readOnly. Defaults to false.
	 */
	readOnly: boolean;

	/**
	 * Callback used to decide if a field should be disabled.
	 * Defaults to returning false.
	 */
	isDisabled: ( args: {
		item: Item;
		field: NormalizedField< Item >;
	} ) => boolean;

	/**
	 * Display format configuration for the field, with all properties
	 * resolved. An empty object for field types without format support.
	 */
	format:
		| {}
		| Required< FormatDate >
		| Required< FormatTime >
		| Required< FormatInteger >
		| Required< FormatNumber >;

	/**
	 * Callback used to format the value of the field for display.
	 * Defaults to the formatter of the field's type.
	 */
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

/**
 * The validity state of a field for a given item, one entry per
 * validation rule. Each entry reports whether the rule is valid,
 * invalid, or still validating, along with an error message.
 */
export type FieldValidity = {
	/**
	 * Validity of the `required` rule.
	 */
	required?: {
		type: 'valid' | 'invalid' | 'validating';
		message?: string;
	};
	/**
	 * Validity of the `pattern` rule.
	 */
	pattern?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	/**
	 * Validity of the `min` rule.
	 */
	min?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	/**
	 * Validity of the `max` rule.
	 */
	max?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	/**
	 * Validity of the `minLength` rule.
	 */
	minLength?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	/**
	 * Validity of the `maxLength` rule.
	 */
	maxLength?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	/**
	 * Validity of the `elements` rule.
	 */
	elements?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	/**
	 * Validity of the `custom` rule.
	 */
	custom?: {
		type: 'valid' | 'invalid' | 'validating';
		message: string;
	};
	/**
	 * Validity of child fields, keyed by field id.
	 */
	children?: Record< string, FieldValidity >;
};

/**
 * Props received by a field's `Edit` control.
 */
export type DataFormControlProps< Item > = {
	/**
	 * The item being edited.
	 */
	data: Item;

	/**
	 * The normalized field the control edits.
	 */
	field: NormalizedField< Item >;

	/**
	 * Callback the control invokes with the updated (partial) item
	 * when the value changes.
	 */
	onChange: ( value: DeepPartial< Item > ) => void;

	/**
	 * Whether to hide the control's label visually
	 * while keeping it available to assistive technology.
	 */
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
		/**
		 * Prefix component to display before the input (text control).
		 */
		prefix?: React.ComponentType;
		/**
		 * Suffix component to display after the input (text control).
		 */
		suffix?: React.ComponentType;
		/**
		 * Number of rows (textarea control).
		 */
		rows?: number;
		/**
		 * Whether to render a compact version without the calendar widget
		 * (datetime control).
		 */
		compact?: boolean;
	};
};

/**
 * Props received by a field's `render` component.
 */
export type DataViewRenderFieldProps< Item > = {
	/**
	 * The item being rendered.
	 */
	item: Item;

	/**
	 * The normalized field being rendered.
	 */
	field: NormalizedField< Item >;

	/**
	 * Layout-specific configuration for the renderer.
	 */
	config?: {
		/**
		 * The `sizes` attribute for responsive images,
		 * as provided by the layout.
		 */
		sizes: string;
	};
};
