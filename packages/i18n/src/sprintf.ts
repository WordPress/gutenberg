/**
 * External dependencies
 */
import _sprintf from '@tannin/sprintf';

/**
 * Internal dependencies
 */
import type {
	DistributeSprintfArgs,
	FormattedText,
	TranslatableText,
} from './types';

export function sprintf< T extends string >(
	format: T | TranslatableText< T >,
	...args: DistributeSprintfArgs< T >
): FormattedText< T >;
export function sprintf< T extends string >(
	format: T | TranslatableText< T >,
	args: DistributeSprintfArgs< T >
): FormattedText< T >;

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
	format: T | TranslatableText< T >,
	...args: DistributeSprintfArgs< T >
): FormattedText< T > {
	return _sprintf(
		format as T,
		...( args as DistributeSprintfArgs< T > )
	) as FormattedText< T >;
}
