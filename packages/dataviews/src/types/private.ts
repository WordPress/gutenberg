/**
 * Internal dependencies
 */
import type {
	CustomValidator,
	Field,
	FormatDate,
	FormatDatetime,
	FormatInteger,
	FormatNumber,
	NormalizedField,
	Operator,
	Validator,
} from './field-api';

export type SelectionOrUpdater = string[] | ( ( prev: string[] ) => string[] );
export type SetSelection = ( selection: SelectionOrUpdater ) => void;
export type FieldType< Item > = Pick<
	NormalizedField< Item >,
	'type' | 'render' | 'sort' | 'enableSorting' | 'enableGlobalSearch'
> & {
	Edit: string | null;
	validOperators: Operator[];
	defaultOperators: Operator[];
	getFormat: (
		field: Field< Item >
	) =>
		| Record< string, any >
		| Required< FormatDate >
		| Required< FormatDatetime >
		| Required< FormatNumber >
		| Required< FormatInteger >;
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
