/**
 * Internal dependencies
 */
import { VARS } from '../config';

/**
 * @param {import('react').ReactText} value
 * @return {string} Spacing.
 */
export function space( value ) {
	return typeof value === 'number'
		? `calc(${ VARS.gridBase } * ${ value })`
		: value;
}
