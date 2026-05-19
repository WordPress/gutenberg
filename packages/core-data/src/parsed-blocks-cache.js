/**
 * Shared cache of blocks parsed from an entity's `content` string, keyed by
 * `kind:name:id`. Populated both eagerly by the `getEntityRecord` resolver
 * (when the sync manager parses content for transient edits) and lazily by
 * `useEntityBlockEditor`. The stored `content` string acts as a validator so
 * stale entries are discarded when the underlying record changes.
 */
export const parsedBlocksCache = new Map();

export function getCacheKey( kind, name, id ) {
	return `${ kind }:${ name }:${ id }`;
}
