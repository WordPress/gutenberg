<?php
/**
 * WordPress 7.1 compatibility: controls whether the Classic block
 * is available in the inserter.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_declare_classic_block_necessary' ) ) {
	/**
	 * Inject a global JS flag that declares the editor will need the classic block.
	 *
	 * @global WP_Post|null $post The post being edited, or null if not in the post editor.
	 */
	function wp_declare_classic_block_necessary() {
		global $post;

		/**
		 * Filters whether the Classic block should be available in the inserter.
		 *
		 * Defaults to false. Use this filter to opt in (globally or per post).
		 *
		 * @param bool         $supports_inserter Whether the Classic block is available in the inserter.
		 * @param WP_Post|null $post              The post being edited, or null if not in the post editor.
		 */
		if ( ! (bool) apply_filters( 'wp_classic_block_supports_inserter', false, $post ) ) {
			return;
		}

		wp_add_inline_script(
			'wp-block-library',
			'window.__needsClassicBlock = true;',
			'before'
		);
	}
	add_action( 'enqueue_block_editor_assets', 'wp_declare_classic_block_necessary' );
}
