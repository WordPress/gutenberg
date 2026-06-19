/**
 * Loader for field collection script modules.
 *
 * This module is intentionally empty. It exists so WordPress can re-register
 * it with the script modules of registered field collections as dynamic
 * dependencies, which adds them to the import map without fetching them — see
 * `gutenberg_enqueue_field_collections_loader()` in
 * lib/compat/wordpress-7.1/field-collections.php.
 *
 * The collection modules are only fetched when `useFieldCollections` (from
 * `@wordpress/field-collections`) dynamically imports them to merge each
 * collection's non-serializable extensions into its field definitions.
 *
 * @see packages/vips/src/loader.ts — the reference pattern
 */
export {};
