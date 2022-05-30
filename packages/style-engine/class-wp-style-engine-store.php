<?php
/**
 * WP_Style_Engine_Store
 *
 * Registers and stores styles to be processed or rendered on the frontend.
 *
 * @package Gutenberg
 */

// Probably don't need this, but it was just helped to design things.
if ( ! interface_exists( 'WP_Style_Engine_Store_Interface' ) ) {
	/**
	 * Registers and retrieves stored styles.
	 *
	 * @access private
	 */
	interface WP_Style_Engine_Store_Interface {
		/**
		 * Register a style
		 *
		 * @param string $key Unique key for a $style_data object.
		 * @param array  $style_data Associative array of style information.
		 * @return void
		 */
		public function register( $key, $style_data );

		/**
		 * Retrieves style data from the store.
		 *
		 * @param string $key Unique key for a $style_data object.
		 * @return void
		 */
		public function get( $key );
	}
}

/**
 * Registers and stores styles to be processed or rendered on the frontend.
 *
 * @access private
 */
class WP_Style_Engine_Store implements WP_Style_Engine_Store_Interface {
	/**
	 * Registered styles.
	 *
	 * @var WP_Style_Engine_Store|null
	 */
	private $registered_styles = array();

	/**
	 * Register a style
	 *
	 * @param string $key Unique key for a $style_data object.
	 * @param array  $style_data Associative array of style information.
	 * @return void
	 */
	public function register( $key, $style_data ) {
		if ( empty( $key ) || empty( $style_data ) ) {
			return;
		}

		if ( isset( $this->registered_styles[ $key ] ) ) {
			$style_data = array_unique( array_merge( $this->registered_styles[ $key ], $style_data ) );
		}
		$this->registered_styles[ $key ] = $style_data;
	}

	/**
	 * Retrieves style data from the store.
	 *
	 * @param string $key Optional unique key for a $style_data object to return a single style object.
	 * @param array? $style_data Associative array of style information.
	 */
	public function get( $key = null ) {
		if ( isset( $this->registered_styles[ $key ] ) ) {
			return $this->registered_styles[ $key ];
		}
		return $this->registered_styles;
	}
}

/*

For each style category we could have a separate object:
e.g.,

$global_style_store = new WP_Style_Engine_Store();
$block_supports_style_store = new WP_Style_Engine_Store();


@TODO

Work out enqueuing and rendering
*/
	/**
	 * Prints registered styles in the page head or footer.
	 *
	 * @see $this->enqueue_block_support_styles

	public function output_registered_block_support_styles() {
		if ( empty( $this->registered_block_support_styles ) ) {
			return;
		}

		$output = '';

		foreach ( $this->registered_block_support_styles as $selector => $rules ) {
				$output .= "\t$selector { ";
				$output .= implode( ' ', $rules );
				$output .= " }\n";
		}

		echo "<style>\n$output</style>\n";
	} */

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

	private function enqueue_block_support_styles() {
		$action_hook_name = 'wp_footer';
		if ( wp_is_block_theme() ) {
			$action_hook_name = 'wp_head';
		}
		add_action(
			$action_hook_name,
			array( $this, 'output_registered_block_support_styles' )
		);
	} */


