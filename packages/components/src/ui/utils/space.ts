/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactText } from 'react';
/**
 * Internal dependencies
 */

const GRID_BASE = '4px';

export function space( value: ReactText ): string {
	return typeof value === 'number'
		? `calc(${ GRID_BASE } * ${ value })`
		: value;
}
