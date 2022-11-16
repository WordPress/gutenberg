/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';

const CACHE = new Map();

/**
 * This is wrapper function for `@wordpress/blocks/parse`, which is using
 * a cache layer to avoid parsing the same pattern multiple times.
 *
 * Patterns registered in the WP instance are preparsed and their parsed content
 * is stored in `blocks` property, which is available for use through the store's selectors.
 *
 * This wrapper is useful for parsing the content of patterns from the patterns directory
 * only once.
 *
 * @param {WPBlockPattern} pattern The pattern to parse.
 *
 * @return {WPBlock[]} Parsed blocks.
 */
export default function parsePattern( pattern ) {
	const key = pattern.id || pattern.content;
	if ( CACHE.has( key ) ) {
		return CACHE.get( key );
	}
	const blocks = parse( pattern.content, {
		__unstableSkipMigrationLogs: true,
	} );
	CACHE.set( key, blocks );
	return blocks;
}
