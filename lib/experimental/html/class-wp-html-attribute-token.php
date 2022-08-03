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
	 * Tag name.
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
	 * Start position of the token.
	 *
	 * @since 6.1.0
	 * @var integer
	 */
	public $start;

	/**
	 * End position of the token.
	 *
	 * @since 6.1.0
	 * @var integer
	 */
	public $end;

	/**
	 * Constructor.
	 *
	 * @since 6.1.0
	 *
	 * @param string  $name  Tag name.
	 * @param string  $value Attribute value.
	 * @param integer $start Start position of the token.
	 * @param integer $end   End position of the token.
	 */
	public function __construct( $name, $value, $start, $end ) {
		$this->name  = $name;
		$this->value = $value;
		$this->start = $start;
		$this->end   = $end;
	}
}
