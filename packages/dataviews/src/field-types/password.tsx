/**
 * Internal dependencies
 */
import type { DataViewRenderFieldProps } from '../types';
import type { FieldType } from '../types/private';
import RenderFromElements from './utils/render-from-elements';
import isValidRequired from './utils/is-valid-required';
import isValidMinLength from './utils/is-valid-min-length';
import isValidMaxLength from './utils/is-valid-max-length';
import isValidPattern from './utils/is-valid-pattern';
import isValidElements from './utils/is-valid-elements';

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	return field.hasElements ? (
		<RenderFromElements item={ item } field={ field } />
	) : (
		'••••••••'
	);
}

export default {
	type: 'password',
	render,
	Edit: 'password',
	sort: () => 0, // Passwords should not be sortable for security reasons
	enableSorting: false,
	enableGlobalSearch: false,
	defaultOperators: [],
	validOperators: [],
	getFormat: () => ( {} ),
	validate: {
		required: isValidRequired,
		pattern: isValidPattern,
		minLength: isValidMinLength,
		maxLength: isValidMaxLength,
		elements: isValidElements,
	},
} satisfies FieldType< any >;
