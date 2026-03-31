import type { ReactElement } from 'react';

/**
 * This type is used by @wordpress/i18n to make sprintf type-safe.
 *
 * We don't want to import from there directly to avoid a circular dependency.
 */
type TranslatableText< T extends string > = string & {
	readonly __translatableText: T;
};

/**
 * The input that can be passed to `createInterpolateElement`.
 */
export type InterpolationInput = string | TranslatableText< string >;

/**
 * The literal string extracted from the input.
 */
export type InterpolationString< Input > = Input extends TranslatableText<
	infer Text
>
	? Text
	: Input;

/**
 * Recursively trims trailing spaces from a string type.
 * Matches the runtime tokenizer's `\s*` before the closing `>` or `/>`.
 */
type TrimTrailingSpaces< S extends string > = S extends `${ infer Rest } `
	? TrimTrailingSpaces< Rest >
	: S;

/**
 * Helper type to extract tag name and handle closing/self-closing indicators.
 * Filters out tags with spaces as they won't be parsed by the tokenizer.
 */
type ExtractTagName< T extends string > =
	// Skip closing tags like "/div"
	T extends `/${ string }`
		? never
		: TrimTrailingSpaces< T > extends infer Name extends string
		? Name extends ''
			? never // Empty tag name
			: Name extends `${ string } ${ string }`
			? never // Skip tags with inner spaces like "spaced token"
			: Name extends `${ infer Base }/`
			? Base // Self-closing tags like "br/"
			: Name // Regular opening tags like "div"
		: never;

/**
 * Utility type to extract all tag names from a template literal string.
 * Only handles simple tags without attributes, matching the runtime tokenizer.
 */
export type ExtractTags< T extends string > =
	T extends `${ string }<${ infer Tag }>${ infer After }`
		? ExtractTagName< Tag > | ExtractTags< After >
		: never;

/**
 * Utility type to create a conversion map that:
 * - Makes extracted tag keys optional
 * - Only allows properties for tags found in the template literal
 */
export type ConversionMap< T extends string > = Partial<
	Record< ExtractTags< T >, ReactElement >
>;
