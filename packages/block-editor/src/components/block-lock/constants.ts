/**
 * Template lock values that lock the inner layout of a block.
 */
export const LAYOUT_TEMPLATE_LOCKS = [ 'all', 'contentOnly' ];

/**
 * Blocks whose styles can't be locked from the lock menu: their styles are
 * edited in the synced pattern or the template part itself.
 */
export const STYLES_LOCK_EXCLUDED_BLOCKS = [
	'core/block',
	'core/template-part',
];
