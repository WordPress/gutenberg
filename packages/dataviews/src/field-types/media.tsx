/**
 * Internal dependencies
 */
import type { TypeProvidedProps } from '../types/private';

export default {
	type: 'media',
	render: () => null,
	Edit: null,
	sort: () => 0,
	isValid: {
		elements: true,
		custom: () => null,
	},
	enableSorting: false,
	enableGlobalSearch: false,
	defaultOperators: [],
	validOperators: [],
	getFormat: () => ( {} ),
} satisfies TypeProvidedProps< any >;
