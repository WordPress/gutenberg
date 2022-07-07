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
	 * The parent rule.
	 *
	 * @var WP_Style_Engine_CSS_Rule
	 */
	protected $parent;

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
	 * @param WP_Style_Engine_CSS_Rule|null      $parent       The parent rule.
	 * @param WP_Style_Engine_CSS_Declarations[] $declarations An array of WP_Style_Engine_CSS_Declarations objects.
	 */
	public function __construct( $selector = '', $parent = null, $declarations = array() ) {
		$this->set_selector( $selector );
		$this->set_parent( $parent );
		$this->set_declarations( $declarations );
	}

	/**
	 * Set the selector.
	 *
	 * @param string $selector The CSS selector.
	 */
	public function set_selector( $selector ) {
		$this->selector = $selector;
	}

	/**
	 * Set the parent selector.
	 *
	 * @param WP_Style_Engine_CSS_Rule $parent The parent rule.
	 */
	public function set_parent( $parent ) {
		$this->parent = $parent;
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
		$this->declarations = array_merge( $this->$declarations, $declarations );
	}

	/**
	 * Get the parent selector.
	 *
	 * @return string
	 */
	public function get_parent_selector() {
		return $this->parent ? $this->parent->get_selector() : '';
	}

	/**
	 * Get the full selector.
	 *
	 * @return string
	 */
	public function get_selector() {
		if ( 0 === strpos( $this->selector, '&' ) ) {
			return $this->get_parent_selector() . substr( $this->selector, 1 );
		}
		return $this->get_parent_selector() . ' ' . $this->selector;
	}
}
