/**
 * Internal dependencies
 */
import type {
	DataViewRenderFieldProps,
	Field,
	Rules,
	SortDirection,
} from '../types';
import type { TypeProvidedProps } from '../types/private';
import RenderFromElements from './utils/render-from-elements';
import { getControl } from '../dataform-controls';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function sort( _valueA: any, _valueB: any, _direction: SortDirection ) {
	// Passwords should not be sortable for security reasons
	return 0;
}

function render( { item, field }: DataViewRenderFieldProps< any > ) {
	return field.hasElements ? (
		<RenderFromElements item={ item } field={ field } />
	) : (
		'••••••••'
	);
}

const isValid: Rules< any > = {
	elements: true,
	custom: () => null,
};

export default function normalizeField< Item >(
	field: Field< Item >
): TypeProvidedProps< Item > {
	return {
		type: 'password',
		render: field.render ?? render,
		Edit: getControl( field, 'password' ),
		sort: field.sort ?? sort,
		isValid: {
			...isValid,
			...field.isValid,
		},
		enableSorting: field.enableSorting ?? false,
		enableGlobalSearch: field.enableGlobalSearch ?? false,
		filterBy: false,
		format: {},
	};
}
