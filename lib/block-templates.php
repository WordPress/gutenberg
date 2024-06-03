<?php
/**
 * Block template functions.
 *
 * @package gutenberg
 */

function gutenberg_register_block_template( $template_name, $args = array() ) {
	return WP_Block_Templates_Registry::get_instance()->register( $template_name, 'wp_template', $args );
}

function gutenberg_register_block_template_part( $template_name, $args = array() ) {
	return WP_Block_Templates_Registry::get_instance()->register( $template_name, 'wp_template_part', $args );
}
