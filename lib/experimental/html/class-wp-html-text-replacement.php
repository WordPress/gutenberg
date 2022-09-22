<?php
/**
 * HTML Walker: Text replacement class.
 *
 * @package WordPress
 * @subpackage HTML
 * @since 6.1.0
 */

/**
 * Data structure used to replace existing content from start to end that allows to drastically improve performance.
 *
 * @since 6.1.0
 *
 * @see WP_HTML_Walker
 */
class WP_HTML_Text_Replacement {
	/**
	 * Byte offset into document where replacement span begins.
	 *
	 * @since 6.1.0
	 * @var int
	 */
	public $start;

	/**
	 * Byte offset into document where replacement span ends.
	 *
	 * @since 6.1.0
	 * @var int
	 */
	public $end;

	/**
	 * Span of text to insert in document to replace existing content from start to end.
	 *
	 * @since 6.1.0
	 * @var string
	 */
	public $text;

	/**
	 * Constructor.
	 *
	 * @since 6.1.0
	 *
	 * @param int    $start Byte offset into document where replacement span begins.
	 * @param int    $end   Byte offset into document where replacement span ends.
	 * @param string $text  Span of text to insert in document to replace existing content from start to end.
	 */
	public function __construct( $start, $end, $text ) {
		$this->start = $start;
		$this->end   = $end;
		$this->text  = $text;
	}
}
