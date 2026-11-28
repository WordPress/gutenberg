import { RichTextData } from '@wordpress/rich-text';

const RICH_TEXT_CACHE_MAX_SIZE = 500;

/**
 * Returns a function that converts HTML strings to RichTextData instances,
 * using a FIFO cache bounded by `maxSize` to avoid re-parsing identical
 * strings. Repeated calls with the same string return the cached instance
 * without re-running the HTML parser and DOM traversal. Each instance keeps
 * its HTML serialization, so serializing it again does not rebuild it.
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
		// Serialize once and keep it, so every later serialization of the
		// cached value is a lookup. The input string is not reused: it can
		// differ from the serialization, e.g. after concurrent edits.
		Object.defineProperty( result, 'originalHTML', {
			value: result.toHTMLString(),
		} );

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
