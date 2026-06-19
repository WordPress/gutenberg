/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';

export interface FieldDefinition {
	type: string;
	label?: string;
	placeholder?: string;
	enableSorting?: boolean;
	filterBy?: boolean | 'object';
	[ key: string ]: unknown;
}

export interface FieldCollection< T > {
	id: string;
	kind: string;
	name: string;
	fields: Field< T >[];
	fields_modules?: string[];
}

export interface State {
	fieldCollections: Record< string, FieldCollection< any >[] >;
}
