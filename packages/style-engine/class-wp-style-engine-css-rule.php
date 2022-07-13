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
	 * Contains an array of WP_Style_Engine_CSS_Declarations objects.
	 *
	 * @var WP_Style_Engine_CSS_Declarations[]
	 */
	protected $declarations = array();

	/**
	 * Constructor
	 *
	 * @param string                             $selector     The CSS selector.
	 * @param WP_Style_Engine_CSS_Declarations[] $declarations An array of WP_Style_Engine_CSS_Declarations objects.
	 */
	public function __construct( $selector = '', $declarations = array() ) {
		$this->set_selector( $selector );
		$this->set_declarations( $declarations );
	}

	/**
	 * Set the selector.
	 *
	 * @param string $selector The CSS selector.
	 */
	public function set_selector( $selector ) {
		if ( empty( $selector ) ) {
			return;
		}
		$this->selector = esc_html( $selector );
	}

	/**
	 * Set the declarations.
	 *
	 * @param WP_Style_Engine_CSS_Declarations[] $declarations An array of WP_Style_Engine_CSS_Declarations objects.
	 */
	public function set_declarations( $declarations ) {
		if ( $declarations instanceof WP_Style_Engine_CSS_Declarations ) {
			$declarations = array( $declarations );
		}
		$this->declarations = array_merge( $this->declarations, $declarations );
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
		$css = $this->get_selector() . ' {';
		foreach ( $this->declarations as $declaration ) {
			$css .= $declaration->get_declarations_string();
		}
		$css .= '}';
		return $css;
	}
}
