<?php
/**
 * Util to enqueue styles from block supports.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_enqueue_block_support' ) ) {
	/**
	 * Styles should be loaded in the head for block themes.
	 *
	 * For classic ones we need to enqueue them to the body
	 * because the wp_head action (and wp_enqueue_scripts)
	 * happens before the render_block.
	 *
	 * See https://core.trac.wordpress.org/ticket/53494.
	 *
	 * @param string $style HTML content to load in the <head> or <body>.
	 */
	function wp_enqueue_block_support( $style ) {
		$action_hook_name = 'wp_footer';
		if ( wp_is_block_theme() ) {
			$action_hook_name = 'wp_enqueue_scripts';
		}

		add_action(
			$action_hook_name,
			function () use ( $style ) {
				echo $style;
			}
		);
	}
}
