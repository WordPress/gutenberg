/**
 * Cache of blocks parsed from an entity's `content` string. Keyed by the
 * record's `content` object reference (the `{ raw, rendered }` value from
 * the REST response), which the queried-data reducer preserves across
 * receives via `conservativeMapItem` and replaces whenever content changes.
 * That gives us free eviction when content is replaced and survival across
 * unrelated record updates. Populated both eagerly by the `getEntityRecord`
 * resolver and lazily by `useEntityBlockEditor`.
 */
export const parsedBlocksCache = new WeakMap();
