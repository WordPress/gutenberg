<?php
/**
 * HTML Walker: Attribute token structure class.
 *
 * @package WordPress
 * @subpackage HTML
 * @since 6.1.0
 */

/**
 * Data structure for the attribute token that allows to drastically improve performance.
 *
 * @since 6.1.0
 *
 * @see WP_HTML_Walker
 */
class WP_HTML_Attribute_Token {
	/**
	 * Attribute name.
	 *
	 * @since 6.1.0
	 * @var string
	 */
	public $name;

	/**
	 * Attribute value.
	 *
	 * @since 6.1.0
	 * @var string
	 */
	public $value;

	/**
	 * The string offset where the attribute name starts.
	 *
	 * @since 6.1.0
	 * @var int
	 */
	public $start;

	/**
	 * The string offset after the attribute value or its name.
	 *
	 * @since 6.1.0
	 * @var int
	 */
	public $end;

	/**
	 * Constructor.
	 *
	 * @since 6.1.0
	 *
	 * @param string  $name  Attribute name.
	 * @param string  $value Attribute value.
	 * @param integer $start The string offset where the attribute name starts.
	 * @param integer $end   The string offset after the attribute value or its name.
	 */
	public function __construct( $name, $value, $start, $end ) {
		$this->name  = $name;
		$this->value = $value;
		$this->start = $start;
		$this->end   = $end;
	}
}
