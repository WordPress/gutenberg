<?php
/**
 * WP_Style_Engine_Rule
 *
 * A
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_Rule' ) ) {
	return;
}

abstract class WP_Style_Engine_Rule_Abstraction {
	/**
	 * The CSS rule set's selector.
	 *
	 * @var string|null
	 */
	private string $selector = '';

	/**
	 * The CSS property definitions key value pairs.
	 *
	 * @var array
	 */
	private array $css_definitions = array();

	/**
	 * Creates a string consisting of CSS property declarations suitable for the value of an HTML element's style attribute.
	 */
	abstract public function get_inline_css_declarations();

	/**
	 * Creates a string consisting of a CSS rule.
	 */
	abstract public function get_css_rule();

	/**
	 * Gets the CSS rule set's selector.
	 *
	 * @access public
	 *
	 * @return string A CSS selector, e.g., `.some-class-name`.
	 */
	public function get_selector() {
		return $this->selector;
	}

	/**
	 * Gets the CSS property definitions key value pairs.
	 *
	 * @access public
	 *
	 * @return array A collection of CSS definitions `[ [ 'color' => 'red' ] ]`.
	 */
	public function get_css_definitions() {
		return $this->css_definitions;
	}
}

/**
 * Singleton class representing the style engine.
 *
 * Consolidates rendering block styles to reduce duplication and streamline
 * CSS styles generation.
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please, use gutenberg_style_engine_get_styles instead.
 *
 * @access private
 */
class WP_Style_Engine_Rule extends WP_Style_Engine_Rule_Abstraction {
	/**
	 * The CSS rule set's selector.
	 *
	 * @var string
	 */
	private string $selector;

	/**
	 * The CSS property definitions key value pairs.
	 *
	 * @var array
	 */
	private array $css_definitions;

	/**
	 * Constructor.
	 *
	 * @param string $selector A CSS selector, e.g., `.some-class-name`.
	 * @param array  $css_definitions An collection of CSS definitions `[ [ 'color' => 'red' ] ]`.
	 */
	public function __construct( $selector = '', $css_definitions = array() ) {
		$this->selector        = $selector;
		$this->css_definitions = $css_definitions;
	}

	/**
	 * Filters incoming CSS properties against WordPress Core's allowed CSS attributes in wp-includes/kses.php.
	 *
	 * @param string $property_declaration A CSS property declaration, e.g., `color: 'pink'`.
	 *
	 * @return string A filtered CSS property. Empty if not allowed.
	 */
	public static function sanitize_property_declaration( $property_declaration ) {
		return esc_html( safecss_filter_attr( $property_declaration ) );
	}

	/**
	 * Creates a string consisting of CSS property declarations suitable for the value of an HTML element's style attribute.
	 *
	 * @access public
	 *
	 * @return string A concatenated string of CSS properties, e.g. `'color: red; font-size:12px'`
	 */
	public function get_inline_css_declarations() {
		$inline_css_declarations = array();

		if ( empty( $this->css_definitions ) ) {
			return '';
		}
		foreach ( $this->css_definitions as $css_property => $css_value ) {
			$filtered_css_declaration = self::sanitize_property_declaration( "{$css_property}: {$css_value}" );
			if ( ! empty( $filtered_css_declaration ) ) {
				$inline_css_declarations[] = $filtered_css_declaration . ';';
			}
		}

		if ( empty( $inline_css_declarations ) ) {
			return '';
		}

		return implode( ' ', $inline_css_declarations );
	}

	/**
	 * Creates a string consisting of a CSS rule.
	 *
	 * @access public
	 *
	 * @param array $options array(
	 *      'prettify' => (boolean) Whether to add carriage returns and indenting.
	 *      'indent' => (number) The number of tab indents to apply to the rule. Applies if `prettify` is `true`.
	 *  );.
	 *
	 * @return string A CSS rule, e.g. `'.some-selector { color: red; font-size:12px }'`
	 */
	public function get_css_rule( $options = array() ) {
		$css_rule_block = '';

		if ( ! $this->selector || empty( $this->css_definitions ) ) {
			return $css_rule_block;
		}

		$defaults       = array(
			'prettify' => false,
			'indent'   => 0,
		);
		$options        = wp_parse_args( $options, $defaults );
		$indent         = str_repeat( "\t", $options['indent'] );
		$css_rule_block = $options['prettify'] ? "$indent{$this->selector} {\n" : "{$this->selector} { ";

		foreach ( $this->css_definitions as $css_property => $css_value ) {
			$filtered_css_declaration = self::sanitize_property_declaration( "{$css_property}: {$css_value}" );
			if ( ! empty( $filtered_css_declaration ) ) {
				if ( $options['prettify'] ) {
					$css_rule_block .= "\t$indent$filtered_css_declaration;\n";
				} else {
					$css_rule_block .= $filtered_css_declaration . '; ';
				}
			}
		}
		$css_rule_block .= $options['prettify'] ? "$indent}\n" : '}';
		return $css_rule_block;
	}
}
