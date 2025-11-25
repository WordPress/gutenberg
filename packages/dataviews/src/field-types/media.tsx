/**
 * Internal dependencies
 */
import type { Field, Rules } from '../types';
import type { TypeProvidedProps } from '../types/private';
import { getControl } from '../dataform-controls';

function sort() {
	return 0;
}

function render() {
	return null;
}

const isValid: Rules< any > = {
	elements: true,
	custom: () => null,
};

export default function normalizeField< Item >(
	field: Field< Item >
): TypeProvidedProps< Item > {
	return {
		type: 'media',
		render: field.render ?? render,
		Edit: getControl( field, null ),
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
