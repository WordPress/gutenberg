<?php
/**
 * Walker_Page_List_Block class.
 *
 * @package gutenberg
 */

/**
 * Class that adds submenu dropdown indicators to Page List block.
 */
class Walker_Page_List_Block extends Walker_Page {
	/**
	 * Outputs the beginning of the current level in the tree before elements are output.
	 *
	 * @since 2.1.0
	 *
	 * @see Walker::start_lvl()
	 *
	 * @param string $output Used to append additional content (passed by reference).
	 * @param int    $depth  Optional. Depth of page. Used for padding. Default 0.
	 * @param array  $args   Optional. Arguments for outputting the next level.
	 *                       Default empty array.
	 */
	public function start_lvl( &$output, $depth = 0, $args = array() ) {
		if ( isset( $args['item_spacing'] ) && 'preserve' === $args['item_spacing'] ) {
			$t = "\t";
			$n = "\n";
		} else {
			$t = '';
			$n = '';
		}
		$indent  = str_repeat( $t, $depth );
		$output .= "<span class='wp-block-page-list__submenu-icon'><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' transform='rotate(90)'><path d='M8 5v14l11-7z'/><path d='M0 0h24v24H0z' fill='none'/></svg></span>{$n}{$indent}<ul class='children'>{$n}";
	}
}
