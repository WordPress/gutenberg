/**
 * Internal dependencies
 */
import type {
	CustomValidator,
	NormalizedField,
	Operator,
	Validator,
} from './field-api';

export type SelectionOrUpdater = string[] | ( ( prev: string[] ) => string[] );
export type SetSelection = ( selection: SelectionOrUpdater ) => void;
export type FieldType< Item > = Pick<
	NormalizedField< Item >,
	| 'type'
	| 'render'
	| 'sort'
	| 'enableSorting'
	| 'enableGlobalSearch'
	| 'format'
	| 'getValueFormatted'
> & {
	Edit: string | null;
	validOperators: Operator[];
	defaultOperators: Operator[];
	validate: {
		required?: Validator< Item >;
		elements?: Validator< Item >;
		pattern?: Validator< Item >;
		minLength?: Validator< Item >;
		maxLength?: Validator< Item >;
		min?: Validator< Item >;
		max?: Validator< Item >;
		custom?: CustomValidator< Item >;
	};
};
