<?php
/**
 * WP_Style_Engine class
 *
 * @package Gutenberg
 */

require_once __DIR__ . '/style-definition-utils.php';

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
	 * Style definitions that contain the instructions to
	 * parse/output valid Gutenberg styles.
	 */
	const STYLE_DEFINITIONS_METADATA = array(
		'spacing' => array(
			'padding' => array(
				'value_key'  => 'padding',
				'value_func' => 'gutenberg_get_style_engine_css_box_rules',
			),
			'margin' => array(
				'value_key'  => 'margin',
				'value_func' => 'gutenberg_get_style_engine_css_box_rules',
			),
		),
	);

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

		if ( ! empty( $options['obfuscate'] ) && true === $options['obfuscate'] ) {
			// Generate a consistent, obfuscated key by hashing a unique class based on the rules.
			// Outputs something like .wp-my-key__002d308c.
			// Will we ever need to decode/decrypt the classname?
			// If so, look at openssl_encrypt().
			$class = $key . '__' . hash( 'crc32', $class );
		}

		$this->registered_styles[ $prefix . $class . $selector ] = $rules;

		return $class;
	}

	/**
	 * Returns a CSS ruleset based on the instructions in STYLE_DEFINITIONS_METADATA.
	 *
	 * @param string|array $style_value A single raw Gutenberg style attributes value for a CSS property.
	 * @param array        $path        An array of strings representing a path to the style value.
	 *
	 * @return array The class name for the added style.
	 */
	protected function get_style_css_rules( $style_value, $path ) {
		$style_definition = _wp_array_get( static::STYLE_DEFINITIONS_METADATA, $path, null );

		if ( $style_definition ) {
			if (
				isset( $style_definition['value_func'] ) &&
				is_callable( $style_definition['value_func'] )
			) {
				return call_user_func( $style_definition['value_func'], $style_value, $style_definition['value_key'] );
			}
		}

		return array();
	}

	/**
	 * Returns an CSS ruleset destined to be inserted in an HTML `style` attribute.
	 * Styles are bundled based on the instructions in STYLE_DEFINITIONS_METADATA.
	 *
	 * @param array $block_attributes An array of styles from a block's attributes.
	 * @param array $path             An array of strings representing a path to the style value.
	 *
	 * @return string A CSS ruleset formatted to be placed in an HTML `style` attribute.
	 */
	public function get_inline_styles_from_attributes( $block_attributes, $path ) {
		if ( ! is_array( $block_attributes ) || ! is_array( $path ) ) {
			return;
		}

		$style_value = _wp_array_get( $block_attributes, $path, null );
		$rules       = $this->get_style_css_rules( $style_value, $path );
		$output      = '';

		foreach ( $rules as $rule => $value ) {
			$output .= "{$rule}: {$value}; ";
		}
		return $output;
	}

	/**
	 * Accepts and parses a Gutenberg attributes->style object and returns add_style()
	 * Stores style rules for a given CSS selector (the key) and returns an associated classname.
	 *
	 * @param string $key              A class name used to construct a key.
	 * @param array  $block_attributes An array of styles from a block's attributes.
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

		if ( ! $style_value ) {
			return;
		}

		$rules = $this->get_style_css_rules( $style_value, $path );

		// Collect individual CSS property values so we can build a unique classname.
		$suffix = is_array( $style_value ) ? implode( '-', array_values( $style_value ) ) : str_replace( ' ', '-', $style_value );

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
