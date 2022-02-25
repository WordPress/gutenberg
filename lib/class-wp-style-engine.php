<?php
/**
 * WP_Style_Engine class
 *
 * @package Gutenberg
 */

/**
 * Singleton class representing the style engine.
 *
 * Consolidates rendering block styles to reduce duplication and streamline
 * CSS styles generation.
 *
 * @since 6.0.0
 */
class WP_Style_Engine_Gutenberg {
	/**
	 * Registered CSS styles.
	 *
	 * @since 5.5.0
	 * @var array
	 */
	private $registered_styles = array();

	/**
	 * Container for the main instance of the class.
	 *
	 * @since 5.5.0
	 * @var WP_Style_Engine_Gutenberg|null
	 */
	private static $instance = null;

	public function __construct() {
		// Borrows the logic from `gutenberg_enqueue_block_support_styles`.
		$action_hook_name = 'wp_footer';
		if ( wp_is_block_theme() ) {
			$action_hook_name = 'wp_enqueue_scripts';
		}
		add_action(
			$action_hook_name,
			array( $this, 'output_styles' )
		);
	}

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * The instance will be created if it does not exist yet.
	 *
	 * @return WP_Style_Engine_Gutenberg The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	public function add_styles( $styles ) {
		if ( ! is_array( $styles ) ) {
			return array();
		}

		foreach ( $styles as $key => $value ) {
			$value = is_array( $value ) ? $value : array();
			if ( isset( $this->registered_styles[ $key ] ) ) {
				$this->registered_styles[ $key ] = array_merge( $this->registered_styles[ $key ], $value );
			} else {
				$this->registered_styles[ $key ] = $value;
			}
		}
	}

	protected function deduplicate_styles() {
		$result        = array();
		$unique_styles = array();
		array_walk(
			$this->registered_styles,
			function( $value, $key ) use ( &$result, &$unique_styles ) {
				$stringified_value = json_encode( $value );
				if ( array_key_exists( $stringified_value, $unique_styles ) ) {
					$new_key = $unique_styles[ $stringified_value ] . ",\n" . $key;
					unset( $result[ $unique_styles[ $stringified_value ] ] );
					$unique_styles[ $stringified_value ] = $new_key;
					$result[ $new_key ] = $value;
				} else {
					$unique_styles[ $stringified_value ] = $key;
					$result[ $key ]                      = $value;
				}
			}
		);
		return $result;
	}

	public function output_styles() {
		$deduped_styles = $this->deduplicate_styles();
		$callback = function( $css_selector, $css_ruleset ) {
			$style = "{$css_selector} {\n";
			foreach ( $css_ruleset as $css_property => $css_value ) {
				$style .= "    {$css_property}: {$css_value};\n";
			}
			$style .= "}\n";
			return $style;
		};

		$output = array_map( $callback, array_keys( $deduped_styles ), array_values( $deduped_styles ) );
		$output = implode( "\n", $output );

		echo "<style>\n$output</style>\n";
	}
}
