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
		$class    = ! empty( $options['suffix'] ) ? $key . '-' . sanitize_title( $options['suffix'] ) : $key;
		$selector = ! empty( $options['selector'] ) ? ' ' . trim( $options['selector'] ) : '';
		$rules    = ! empty( $options['rules'] ) ? $options['rules'] : array();
		$prefix   = ! empty( $options['prefix'] ) ? $options['prefix'] : '.';

		if ( ! $class ) {
			return;
		}

		if ( ! empty( $options['obfuscate'] ) && $options['obfuscate'] === true ) {
			// Will we ever need to decode/decrypt the classname?
			// If so, look at openssl_encrypt()
			$class = $key . '__' . hash( 'crc32', $class );
		}

		$this->registered_styles[ $prefix . $class . $selector ] = $rules;

		return $class;
	}

	/**
	 * Accepts and parses a Gutenberg attributes->style object and returns add_style()
	 * Stores style rules for a given CSS selector (the key) and returns an associated classname.
	 *
	 * @param string $key              A class name used to construct a key.
	 * @param array  $block_styles     An array of styles from a block's attributes.
	 * @param array  $path             An array of strings representing a path to the style value.
	 * @param array  $options          An array of options that add_style() accepts.
	 *
	 * @return string The class name for the added style.
	 */
	public function add_style_from_attributes( $key, $block_attributes, $path, $options ) {
		if ( ! is_array( $block_attributes ) || ! is_array( $path ) ) {
			return;
		}

		$style_value = _wp_array_get( $block_attributes, $path, null );
		$rules       = array();
		$suffix      = '';

		/*
			// Only expecting padding for now. This will be extracted/abstracted.
			// Possibly we'd have parsing rules and extra metadata, e.g.,
			const STYLE_DEFINITIONS_METADATA = array(
				'spacing'     => array(
					'margin' => array(
						'value_func' => 'gutenberg_get_style_engine_css_box_rules',
					),
					'padding' => array(
						'value_func' => 'gutenberg_get_style_engine_css_box_rules',
					),
				),
			);
		  */
		if ( is_array( $style_value ) ) {
			foreach ( $style_value as $property => $value ) {
				$rules[ "padding-$property" ] = $value . '  !important'; // Challenge: deal with specificity that inline styles bring us. Maybe we could pass an option.
			}
			$suffix = implode( '-', array_values( $style_value ) );
		} elseif ( null !== $style_value ) {
			$rules[] = sprintf( 'padding: %s !important;', $style_value );
			$suffix  = str_replace( ' ', '-', $style_value );
		}

		$options = array_merge(
			$options,
			array(
				'suffix' => implode( '-', $path ) . '__' . $suffix,
				'rules'  => $rules,
			)
		);

		return $this->add_style(
			$key,
			$options
		);
	}

	/**
	 * Render registered styles as key { ...rules }  for final output.
	 */
	public function output_styles() {
		$output = $this->get_generated_styles();
		echo "<style>\n$output</style>\n";
	}
}
