/**
 * Block names for which the Block Bindings UI (both the legacy "Attributes"
 * panel and the new inline picker) is not rendered.
 *
 * Lives in its own module so the constant can be imported from
 * `hooks/block-bindings.js` (legacy panel) and from
 * `components/block-bindings/use-block-bindings-compatible-fields.js`
 * (shared gate predicate) without creating a circular dependency through
 * the `components/block-bindings` barrel.
 */
export const BLOCK_BINDINGS_PANEL_EXCLUDED_BLOCKS = [
	'core/post-date',
	'core/navigation-link',
	'core/navigation-submenu',
];
