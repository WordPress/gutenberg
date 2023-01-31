<?php
/**
 * HTML Processor Scan State: Track opening tags and scanning depth.
 *
 * @package WordPress
 * @subpackage HTML
 * @since 6.2.0
 */

/**
 * Track opening tags and scanning depth.
 *
 * This class is for internal usage of the WP_HTML_Processor class.
 *
 * @access private
 * @since 6.2.0
 *
 * @see WP_HTML_Processor
 */
class WP_HTML_Processor_Scan_State {
	/**
	 * The maximum number of tags we'll traverse in search of a matching closing tag.
	 *
	 * @var integer
	 */
	public $budget = 1000;

	/**
	 * A stack of the opening tags that we have visited.
	 *
	 * @var string[]
	 */
	public $open_tags = array();

	/**
	 * The maximum depth of nested tags we're willing to traverse.
	 *
	 * @var int
	 */
	public $match_depth = null;

	/**
	 * The depth of nested opening tags, counted from where we started.
	 *
	 * @return int The depth of nested tags.
	 */
	public function relative_depth() {
		return count( $this->open_tags );
	}
}
