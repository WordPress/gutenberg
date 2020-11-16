<?php
/**
 * Blocks API: Block recursion error handling.
 *
 * @package gutenberg
 */

/**
 * Reports a recursion error to the user.
 *
 * If WP_DEBUG is true then additional information is displayed.
 * Use the $class parameter to override default behavior.
 *
 * @param $id string|integer recursive ID detected
 * @param $type string content type
 * @return string HTML reporting the error to the user
 */
function gutenberg_report_recursion_error( $message=null, $class=null ) {
	$recursion_control = WP_Block_Recursion_Control::get_instance();
	if ( $class && class_exists( $class ) ) {
		$recursion_error = new $class( $recursion_control );
	} else {
		$recursion_error = new WP_Block_Recursion_Error( $recursion_control );
	}
	$html = $recursion_error->report_recursion_error( $message );
	return $html;
}
