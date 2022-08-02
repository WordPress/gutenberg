<?php
/**
 * WP_Style_Engine_CSS_Rule
 *
 * An object for CSS rules.
 *
 * @package Gutenberg
 */

if ( class_exists( 'WP_Style_Engine_CSS_Rule' ) ) {
	return;
}

/**
 * Holds, sanitizes, processes and prints CSS declarations for the style engine.
 *
 * @access private
 */
class WP_Style_Engine_CSS_Rule {

	/**
	 * The selector.
	 *
	 * @var string
	 */
	protected $selector;

	/**
	 * The selector declarations.
	 *
	 * Contains a WP_Style_Engine_CSS_Declarations object.
	 *
	 * @var WP_Style_Engine_CSS_Declarations
	 */
	protected $declarations;

	/**
	 * Constructor
	 *
	 * @param string                                 $selector     The CSS selector.
	 * @param array|WP_Style_Engine_CSS_Declarations $declarations An array of declarations (property => value pairs),
	 *                                                             or a WP_Style_Engine_CSS_Declarations object.
	 */
	public function __construct( $selector = '', $declarations = array() ) {
		$this->set_selector( $selector );
		$this->add_declarations( $declarations );
	}

	/**
	 * Set the selector.
	 *
	 * @param string $selector The CSS selector.
	 *
	 * @return WP_Style_Engine_CSS_Rule|void Returns the object to allow chaining of methods.
	 */
	public function set_selector( $selector ) {
		if ( empty( $selector ) ) {
			return;
		}
		$this->selector = $selector;

		return $this;
	}

	/**
	 * Set the declarations.
	 *
	 * @param array|WP_Style_Engine_CSS_Declarations $declarations An array of declarations (property => value pairs),
	 *                                                             or a WP_Style_Engine_CSS_Declarations object.
	 *
	 * @return WP_Style_Engine_CSS_Rule Returns the object to allow chaining of methods.
	 */
	public function add_declarations( $declarations ) {
		$is_declarations_object = ! is_array( $declarations );
		$declarations_array     = $is_declarations_object ? $declarations->get_declarations() : $declarations;

		if ( null === $this->declarations && $is_declarations_object ) {
			$this->declarations = $declarations;
			return $this;
		}
		if ( null === $this->declarations ) {
			$this->declarations = new WP_Style_Engine_CSS_Declarations( $declarations_array );
		}
		$this->declarations->add_declarations( $declarations_array );

		return $this;
	}

	/**
	 * Get the declarations object.
	 *
	 * @return WP_Style_Engine_CSS_Declarations
	 */
	public function get_declarations() {
		return $this->declarations;
	}

	/**
	 * Get the full selector.
	 *
	 * @return string
	 */
	public function get_selector() {
		return $this->selector;
	}

	/**
	 * Get the CSS.
	 *
	 * @return string
	 */
	public function get_css() {
		$styles = $this->declarations->get_declarations_string();
		if ( empty( $styles ) ) {
			return '';
		}

		return $this->get_selector() . '{' . $styles . '}';
	}
}
