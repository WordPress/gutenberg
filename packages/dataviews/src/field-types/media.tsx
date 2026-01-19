/**
 * Internal dependencies
 */
import type { FieldType } from '../types/private';
import getValueFormatted from './utils/get-value-formatted-default';
import isValidRequired from './utils/is-valid-required';

export default {
	type: 'media',
	render: () => null,
	Edit: null,
	sort: () => 0,
	enableSorting: false,
	enableGlobalSearch: false,
	defaultOperators: [],
	validOperators: [],
	format: {},
	getValueFormatted,
	validate: {
		required: isValidRequired,
	},
} satisfies FieldType< any >;
