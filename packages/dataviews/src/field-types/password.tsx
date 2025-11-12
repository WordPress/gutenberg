/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	SortDirection,
	FieldTypeDefinition,
} from '../types';
import RenderFromElements from './utils/render-from-elements';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function sort( valueA: any, valueB: any, direction: SortDirection ) {
	// Passwords should not be sortable for security reasons
	return 0;
}

export default {
	sort,
	isValid: {
		elements: true,
		custom: () => null,
	},
	Edit: 'password',
	render: ( { item, field }: DataViewRenderFieldProps< any > ) => {
		return field.hasElements ? (
			<RenderFromElements item={ item } field={ field } />
		) : (
			'••••••••'
		);
	},
	enableSorting: false,
	filterBy: false,
} satisfies FieldTypeDefinition< any >;
