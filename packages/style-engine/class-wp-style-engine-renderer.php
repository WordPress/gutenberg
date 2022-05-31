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
	 * Constructor.
	 *
	 * @return void
	 */
	public function __construct() {
		// @TODO some argument to determine how/where the styles are rendered.
		// For example, we could enqueue specific inline styles like global styles, see: gutenberg_enqueue_global_styles().
		//
	}

	/**
	 * Prints registered styles in the page head or footer.
	 *
	 * @see $this->enqueue_block_support_styles
	 */
	public function render_registered_styles( $styles ) {
		if ( empty( $styles ) ) {
			return;
		}

		$output = '';

		foreach ( $styles as $selector => $rules ) {
				$output .= "\t$selector { ";
				$output .= implode( ' ', $rules );
				$output .= " }\n";
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
	private function enqueue_block_support_styles() {
		$action_hook_name = 'wp_footer';
		if ( wp_is_block_theme() ) {
			$action_hook_name = 'wp_head';
		}
		add_action(
			$action_hook_name,
			array( $this, 'render_registered_styles' )
		);
	}
}

