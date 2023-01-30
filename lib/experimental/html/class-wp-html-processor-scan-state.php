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
	public $budget      = 1000;
	public $open_tags   = array();
	public $match_depth = null;

	public function relative_depth() {
		return count( $this->open_tags );
	}
}
