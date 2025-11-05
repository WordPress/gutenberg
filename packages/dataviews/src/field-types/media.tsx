/**
 * Internal dependencies
 */
import type { FieldTypeDefinition } from '../types';

function sort() {
	return 0;
}

export default {
	sort,
	isValid: {
		elements: true,
		custom: () => null,
	},
	Edit: null,
	render: () => null,
	enableSorting: false,
	filterBy: false,
} satisfies FieldTypeDefinition< any >;
