<?php
/**
 * Behaviors.
 *
 * @package gutenberg
 */

add_filter(
	'block_editor_settings_all',
	function( $settings ) {
		// Prevents testing error 'Undefined index: behaviors' in Gutenberg_REST_Block_Editor_Settings_Controller_Test.
		// This should be removed once the REST API is updated to use the new theme.json file.
		$is_mobile_context = (
			defined( 'REST_REQUEST' ) &&
			REST_REQUEST &&
			isset( $_GET['context'] ) &&
			'mobile' === $_GET['context']
		);
		if (! $is_mobile_context) {
			$settings['behaviors'] = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_data()['behaviors'];
		}
		// TODO: Make sure to also get the value from the core theme.json file.
		return $settings;
	},
	'post-editor'
);
