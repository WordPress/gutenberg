import { parse } from '@wordpress/blocks';

/**
 * Removes patterns whose name was already used by an earlier pattern in the
 * list, keeping the first occurrence.
 *
 * @template {{ name: string }} T
 * @param {T[]} patterns Pattern list.
 *
 * @return {T[]} Pattern list without duplicates.
 */
export function filterOutDuplicatesByName( patterns ) {
	const names = new Set();
	return patterns.filter( ( { name } ) => {
		if ( names.has( name ) ) {
			return false;
		}
		names.add( name );
		return true;
	} );
}

const parsedBlocksCache = new WeakMap();

/**
 * Returns a copy of a pattern whose `blocks` are parsed from its content on
 * first read, so that only the patterns that are displayed are parsed. The
 * parsed blocks are cached for each source pattern object.
 *
 * @template {{ content: string }} T
 * @param {T}                       pattern Pattern to copy.
 * @param {Record<string, unknown>} [props] Properties to add to the copy.
 *
 * @return {T & { blocks: import('@wordpress/blocks').Block[] }} Pattern with lazily parsed `blocks`.
 */
export function withLazyBlocks( pattern, props = {} ) {
	return {
		...pattern,
		...props,
		get blocks() {
			let blocks = parsedBlocksCache.get( pattern );
			if ( ! blocks ) {
				blocks = parse( pattern.content, {
					__unstableSkipMigrationLogs: true,
				} );
				parsedBlocksCache.set( pattern, blocks );
			}
			return blocks;
		},
	};
}
