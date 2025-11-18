/**
 * Internal dependencies
 */
import type { FieldTypeDefinition, NormalizedFormat } from '../types';

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
	getFormat: (): NormalizedFormat => ( {} ),
	enableSorting: false,
	filterBy: false,
} satisfies FieldTypeDefinition< any >;
