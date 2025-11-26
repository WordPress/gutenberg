/**
 * Internal dependencies
 */
import type { DataViewRenderFieldProps } from '../types';
import type { FieldType } from '../types/private';
import RenderFromElements from './utils/render-from-elements';

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
	isValid: {
		elements: true,
		custom: () => null,
	},
	enableSorting: false,
	enableGlobalSearch: false,
	defaultOperators: [],
	validOperators: [],
	getFormat: () => ( {} ),
} satisfies FieldType< any >;
