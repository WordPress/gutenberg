import { RichTextData } from '@wordpress/rich-text';

const RICH_TEXT_CACHE_MAX_SIZE = 500;

// Rich-text values are immutable, so their HTML can be kept for their lifetime.
const richTextHTML = new WeakMap< RichTextData, string >();

/**
 * Returns the HTML of a rich-text value, serializing each value at most once.
 * Values from `getCachedRichTextData` return the string they were built from.
 *
 * @param value Rich-text value.
 * @return The HTML string.
 */
export function getRichTextHTML( value: RichTextData ): string {
	let html = richTextHTML.get( value );

	if ( html === undefined ) {
		html = value.toHTMLString();
		richTextHTML.set( value, html );
	}

	return html;
}

/**
 * Returns a function that converts HTML strings to RichTextData instances,
 * using a FIFO cache bounded by `maxSize` to avoid re-parsing identical
 * strings. Repeated calls with the same string return the cached instance
 * without re-running the HTML parser and DOM traversal.
 *
 * @param maxSize Maximum number of entries to hold in the cache.
 * @return A cached version of RichTextData.fromHTMLString.
 */
export function createRichTextDataCache(
	maxSize: number
): ( value: string ) => RichTextData {
	const cache = new Map< string, RichTextData >();

	return function ( value: string ): RichTextData {
		const cached = cache.get( value );

		if ( cached ) {
			return cached;
		}

		const result = RichTextData.fromHTMLString( value );
		richTextHTML.set( result, value );

		if ( cache.size >= maxSize ) {
			// Evict the oldest entry (Map preserves insertion order).
			cache.delete( cache.keys().next().value! );
		}

		cache.set( value, result );
		return result;
	};
}

export const getCachedRichTextData = createRichTextDataCache(
	RICH_TEXT_CACHE_MAX_SIZE
);
