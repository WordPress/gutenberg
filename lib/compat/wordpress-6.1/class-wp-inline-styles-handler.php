<?php
/**
 * Handler for inline styles.
 *
 * @package gutenberg
 */

/**
 * Handler for inline styles.
 */
class WP_Inline_Styles_Handler {

	/**
	 * An array of selectors along with their styles.
	 *
	 * @var array
	 */
	private $styles_array = array();

	/**
	 * Get an instance of the object.
	 *
	 * @return WP_Inline_Styles_Handler
	 */
	public static function get_instance() {
		static $instance;

		if ( null === $instance ) {
			$instance = new self();
		}

		return $instance;
	}

	/**
	 * Constructor.
	 * Private constructor, call get_instance() to get an instance of the object.
	 *
	 * Adds the action to print the inline styles.
	 */
	private function __construct() {
		$action_hook_name = 'wp_footer';
		if ( wp_is_block_theme() ) {
			$action_hook_name = 'wp_head';
		}

		add_action( $action_hook_name, array( $this, 'print_styles' ) );
	}

	/**
	 * Print styles.
	 *
	 * @return void
	 */
	public function print_styles() {
		echo '<style>' . $this->get_styles() . '</style>';
	}

	/**
	 * Add styles to the $styles_array in the object.
	 *
	 * @param array $styles An array of selectors along with their styles.
	 *
	 * @return void
	 */
	public function add_array_styles( $styles = array() ) {
		foreach ( $styles as $selector => $selector_styles ) {
			$this->add_selector_styles( $selector, $selector_styles );
		}
	}

	/**
	 * Add styles for a single selector.
	 *
	 * @param string $selector The CSS selector.
	 * @param array  $styles   The styles for the defined selector.
	 *
	 * @return void
	 */
	public function add_selector_styles( $selector = '', $styles = array() ) {
		if ( empty( $this->styles_array[ $selector ] ) ) {
			$this->styles_array[ $selector ] = array();
		}
		$this->styles_array[ $selector ] = array_merge( $this->styles_array[ $selector ], $styles );
	}

	/**
	 * Combines selectors from the $styles_array
	 * when they have the same styles.
	 *
	 * @return void
	 */
	private function combine_selectors() {

		$json_styles = array();

		// Sort the styles to make comparing values easier.
		foreach ( $this->styles_array as $selector => $styles ) {
			ksort( $styles );
			$this->styles_array[ $selector ] = $styles;

			// Convert styles to JSON to make comparing them easier.
			$json_styles[ $selector ] = json_encode( $styles );

		}

		// Combine selectors that have the same styles.
		foreach ( $json_styles as $selector => $json ) {
			// Get selectors that use the same styles.
			$duplicates = array_keys( $json_styles, $json, true );

			// Combine selectors for duplicates.
			if ( 1 < count( $duplicates ) ) {
				$css = $this->styles_array[ $selector ];
				foreach ( $duplicates as $key ) {
					unset( $json_styles[ $key ] );
					unset( $this->styles_array[ $key ] );
				}
				$this->styles_array[ implode( ',', $duplicates ) ] = $css;
			}
		}
	}

	/**
	 * Get the styles array with removed duplicates.
	 *
	 * @return array
	 */
	public function get_styles_array() {
		$this->combine_selectors();
		return $this->styles_array;
	}

	/**
	 * Get CSS from the styles array.
	 *
	 * @return string
	 */
	public function get_styles() {
		$css    = '';
		$styles = $this->get_styles_array();
		foreach ( $styles as $selector => $rules ) {
			$css .= "$selector{";
			foreach ( $rules as $key => $value ) {
				$css .= "$key:$value;";
			}
			$css .= '}';
		}
		error_log( strlen( $css ) );
		return $css;
	}
}
