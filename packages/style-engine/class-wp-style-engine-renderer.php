<?php
// @TODO we probably don't need this right now.
// Just toying around.
/**
 * WP_Style_Engine_Renderer
 *
 * Renders CSS on the frontend.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_Renderer' ) ) {
	return;
}

/**
 * Renders CSS on the frontend..
 *
 * @access private
 */
class WP_Style_Engine_Renderer {
	/**
	 * Prints registered styles in the page head or footer.
	 *
	 * @TODO this shares code with the styles engine class in generate(). Centralize.
	 *
	 * @see $this->enqueue_block_support_styles
	 */
	public static function render_registered_block_supports_styles() {
		$style_engine         = WP_Style_Engine::get_instance();
		$block_support_styles = $style_engine->get_block_support_styles();

		if ( empty( $block_support_styles ) ) {
			return;
		}

		$output = '';

		foreach ( $block_support_styles as $style ) {
				$output .= "{$style['sanitized_output']}\n";
		}

		echo "<style>\n$output</style>\n";
	}

	/**
	 * Taken from gutenberg_enqueue_block_support_styles()
	 *
	 * This function takes care of adding inline styles
	 * in the proper place, depending on the theme in use.
	 *
	 * For block themes, it's loaded in the head.
	 * For classic ones, it's loaded in the body
	 * because the wp_head action  happens before
	 * the render_block.
	 *
	 * @see gutenberg_enqueue_block_support_styles()
	 */
	public static function enqueue_block_support_styles() {
		$action_hook_name = 'wp_footer';
		if ( wp_is_block_theme() ) {
			$action_hook_name = 'wp_head';
		}
		add_action(
			$action_hook_name,
			array( __CLASS__, 'render_registered_block_supports_styles' )
		);
	}
}

