/**
 * External dependencies
 */
import _sprintf from '@tannin/sprintf';

/**
 * Internal dependencies
 */
import type { DistributeSprintfArgs, TransformedText } from './types';

export function sprintf< T extends string >(
	format: T | TransformedText< T >,
	...args: DistributeSprintfArgs< T >
): TransformedText< T >;
export function sprintf< T extends string >(
	format: T | TransformedText< T >,
	args: DistributeSprintfArgs< T >
): TransformedText< T >;

/**
 * Returns a formatted string.
 *
 * @param format The format of the string to generate.
 * @param args   Arguments to apply to the format.
 *
 * @see https://www.npmjs.com/package/@tannin/sprintf
 *
 * @return The formatted string.
 */
export function sprintf< T extends string >(
	format: T | TransformedText< T >,
	...args: DistributeSprintfArgs< T >
): TransformedText< T > {
	return _sprintf( format, ...args ) as TransformedText< T >;
}
