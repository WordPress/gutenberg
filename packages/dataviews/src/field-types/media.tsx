/**
 * Internal dependencies
 */
import type { FieldType } from '../types/private';

export default {
	type: 'media',
	render: () => null,
	Edit: null,
	sort: () => 0,
	enableSorting: false,
	enableGlobalSearch: false,
	defaultOperators: [],
	validOperators: [],
	getFormat: () => ( {} ),
	// cannot validate any constraint, so
	// the only available validation for the field author
	// would be providing a custom validator.
	validate: {},
} satisfies FieldType< any >;
