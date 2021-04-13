/**
 * Internal dependencies
 */
import { tokens } from '../tokens';

/**
 * @param {import('react').ReactText} value
 * @return {string} Spacing.
 */
export function space( value ) {
	return typeof value === 'number'
		? `calc(${ tokens.gridBase } * ${ value })`
		: value;
}
