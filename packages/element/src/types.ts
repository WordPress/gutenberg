/**
 * Helper type to extract tag name and handle closing/self-closing indicators
 * Matches the tokenizer regex: /<(\/)?(\w+)\s*(\/)?>/g
 * Filters out tags with spaces as they won't be parsed by the tokenizer
 */
type ExtractTagName< T extends string > = T extends `/${ string }`
	? never // Skip closing tags like "/div"
	: T extends `${ string } ${ string }`
	? never // Skip tags with spaces like "spaced token"
	: T extends `${ infer Name }/`
	? Name // Self-closing tags like "br/"
	: T; // Regular opening tags like "div"

/**
 * Utility type to extract all tag names from a template literal string.
 * Only handles simple tags without attributes, matching the runtime tokenizer.
 */
export type ExtractTags< T extends string > =
	T extends `${ string }<${ infer Tag }>${ infer After }`
		? ExtractTagName< Tag > extends never
			? ExtractTags< After >
			: ExtractTagName< Tag > | ExtractTags< After >
		: never;

/**
 * Utility type to create a conversion map that:
 * - Makes extracted tag keys optional
 * - Only allows properties for tags found in the template literal
 */
export type ConversionMap< T extends string > = Partial<
	Record< ExtractTags< T >, React.ReactElement >
>;
