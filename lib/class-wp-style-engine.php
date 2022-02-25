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

	/**
	 * Assemble the style rule from a list of rules, and store based on a key
	 * generated from the class name, the selector, and any values used as a suffix.
	 *
	 * @param string $key     A class name used to construct a key.
	 * @param array  $options An array of options, rules, and selector for constructing the rules.
	 *
	 * @return string The class name for the added style.
	 */
	public function add_style( $key, $options ) {
		$class    = ! empty( $options['suffix'] ) ? $key . '-' . sanitize_title( $options['suffix'] ) : $key;
		$selector = ! empty( $options['selector'] ) ? ' ' . trim( $options['selector'] ) : '';
		$rules    = ! empty( $options['rules'] ) ? $options['rules'] : array();
		$prefix   = ! empty( $options['prefix'] ) ? $options['prefix'] : '.';

		if ( ! $class ) {
			return;
		}

		$style = "{$prefix}{$class}{$selector} {\n";

		if ( is_string( $rules ) ) {
			$style .= '  ';
			$style .= $rules;
		} else {
			foreach( $rules as $rule => $value ) {
				$style .= "  {$rule}: {$value};\n";
			}
		}
		$style .= "}\n";

		$this->registered_styles[ $class . $selector ] = $style;

		return $class;
	}

	public function output_styles() {
		$style = implode( "\n", $this->registered_styles );
		echo "<style>\n$style</style>\n";
	}
}
