/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactText } from 'react';
/**
 * Internal dependencies
 */
import { CONFIG } from '../../utils';

export function space( value: ReactText ): string {
	return typeof value === 'number'
		? `calc(${ CONFIG.gridBase } * ${ value })`
		: value;
}
