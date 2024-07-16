<?php
/**
 * Block template functions.
 *
 * @package gutenberg
 */

function gutenberg_register_template( $template_name, $args = array() ) {
	return WP_Templates_Registry::get_instance()->register( $template_name, $args );
}
