/**
 * Internal dependencies
 */
import number, { getValidation } from './number';
import type { FieldTypeDefinition } from '../types';

export default {
	...number,
	Edit: 'integer',
	isValid: {
		custom: getValidation( true ),
	},
} satisfies FieldTypeDefinition< any >;
