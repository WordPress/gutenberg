<?php
/**
 * Plugin Name: Gutenberg Test Connectors Empty State
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Removes the default connector data so the Connectors page renders its empty state.
 *
 * @package gutenberg-test-connectors-empty-state
 */

// Remove the Gutenberg filter that provides default connector data.
add_action(
	'init',
	static function () {
		remove_filter( 'script_module_data_options-connectors-wp-admin', '_gutenberg_get_connector_script_module_data' );
	},
	PHP_INT_MAX
);
