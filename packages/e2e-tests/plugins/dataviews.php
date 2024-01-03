<?php
/**
 * Plugin Name: Gutenberg Test DataViews
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-dataviews
 */

/**
 * Disables the DataViews experiment on plugin deactivation.
 */
function disable_dataviews_experiment() {
	update_option( 'gutenberg-experiments', array() );
}

/**
 * Enables the DataViews experiment.
 */
function enable_dataviews_experiment() {
	update_option( 'gutenberg-experiments', array( 'gutenberg-dataviews' => true ) );
	register_deactivation_hook( __FILE__, 'disable_dataviews_experiment' );
}

add_action( 'init', 'enable_dataviews_experiment' );
