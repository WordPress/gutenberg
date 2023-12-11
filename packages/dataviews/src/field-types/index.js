/**
 * Internal dependencies
 */
import { DateField } from './date-field';
import { StringFieldEdit } from './string-field';
import { EnumerationFieldEdit } from './enumeration-field';

export const FIELD_TYPES = {
	date: {
		render: DateField,
	},
	string: {
		edit: StringFieldEdit,
	},
	enumeration: { edit: EnumerationFieldEdit },
};
