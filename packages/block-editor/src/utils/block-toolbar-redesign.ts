declare global {
	interface Window {
		/**
		 * Whether the block toolbar redesign experiment is enabled.
		 *
		 * @see https://github.com/WordPress/gutenberg/issues/85204
		 */
		__experimentalBlockToolbarRedesign?: boolean;
	}
}

/**
 * Whether the block toolbar redesign experiment is enabled.
 *
 * The redesign shows the block name in the toolbar, groups block tools in one
 * searchable options menu, moves text formatting to a toolbar that appears
 * with a text selection, and moves the parent selector outside the block.
 *
 * @see https://github.com/WordPress/gutenberg/issues/85204
 *
 * @return Whether the experiment is enabled.
 */
export function isBlockToolbarRedesignEnabled(): boolean {
	return (
		typeof window !== 'undefined' &&
		!! window.__experimentalBlockToolbarRedesign
	);
}
