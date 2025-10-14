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
		custom: () => null,
	},
	Edit: null,
	render: () => null,
	enableSorting: false,
	filterBy: false,
} satisfies FieldTypeDefinition< any >;
