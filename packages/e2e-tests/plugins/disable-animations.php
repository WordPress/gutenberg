<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Disables the CSS animations
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-disable-animations
 */

/**
 * Enqueue CSS stylesheet disabling animations.
 */
function enqueue_disable_animations_stylesheet() {
	$custom_css = '* { animation-duration: 0ms !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }';
	wp_add_inline_style( 'wp-components', $custom_css );
}

add_action( 'admin_enqueue_scripts', 'enqueue_disable_animations_stylesheet' );
