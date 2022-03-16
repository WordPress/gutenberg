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

	/**
	 * Register action for outputting styles when the class is constructed.
	 */
	public function __construct() {
		// Borrows the logic from `gutenberg_enqueue_block_support_styles`.
		// $action_hook_name = 'wp_footer';
		// if ( wp_is_block_theme() ) {
		// 	$action_hook_name = 'wp_enqueue_scripts';
		// }
		// add_action(
		// 	$action_hook_name,
		// 	array( $this, 'output_styles' )
		// );
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

	public function reset() {
		$this->registered_styles = array();
	}

	public function get_generated_styles() {
		$output = '';
		foreach ( $this->registered_styles as $selector => $rules ) {
			$output .= "{$selector} {\n";

			if ( is_string( $rules ) ) {
				$output .= '  ';
				$output .= $rules;
			} else {
				foreach ( $rules as $rule => $value ) {
					$output .= "  {$rule}: {$value};\n";
				}
			}
			$output .= "}\n";
		}
		return $output;
	}

	/**
	 * Stores style rules for a given CSS selector (the key) and returns an associated classname.
	 *
	 * @param string $key     A class name used to construct a key.
	 * @param array  $options An array of options, rules, and selector for constructing the rules.
	 *
	 * @return string The class name for the added style.
	 */
	public function add_style( $key, $options ) {
		$suffix   = ! empty( $options['suffix'] ) && is_array( $options['suffix'] ) ? implode( '--', $options['suffix'] ) : $options['suffix'];
		$class    = ! empty( $suffix ) ? $key . '--' . sanitize_key( $suffix ) : $key;
		$selector = ! empty( $options['selector'] ) ? ' ' . trim( $options['selector'] ) : '';
		$rules    = ! empty( $options['rules'] ) ? $options['rules'] : array();
		$prefix   = ! empty( $options['prefix'] ) ? $options['prefix'] : '.';

		if ( ! $class ) {
			return;
		}

		$this->registered_styles[ $prefix . $class . $selector ] = $rules;

		return $class;
	}

	/**
	 * Render registered styles as key { ...rules }  for final output.
	 */
	public function output_styles() {
		$output = $this->get_generated_styles();
		echo "<style>\n$output</style>\n";
	}
}
