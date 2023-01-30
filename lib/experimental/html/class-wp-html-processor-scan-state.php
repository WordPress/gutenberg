<?php
/**
 * HTML Processor Scan State: Track opening tags and scanning depth.
 *
 * @package WordPress
 * @subpackage HTML
 * @since 6.2.0
 */

class WP_HTML_Processor_Scan_State {
	public $budget      = 1000;
	public $open_tags   = array();
	public $match_depth = null;

	public function relative_depth() {
		return count( $this->open_tags );
	}
}
