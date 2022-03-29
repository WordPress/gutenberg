<?php
/**
 * Server-side requirements for database persisted preferences.
 *
 * @package gutenberg
 */

/**
 * Register the user meta for persisted preferences.
 */
function gutenberg_register_persisted_preferences_user_meta() {
	global $wpdb;
	register_meta(
		'user',
		$wpdb->get_blog_prefix() . 'persisted_preferences',
		array(
			'type'         => 'object',
			'single'       => true,
			'show_in_rest' => array(
				'name'   => 'persisted_preferences',
				'type'   => 'object',
				'schema' => array(
					'type'                 => 'object',
					'properties'           => array(),
					'additionalProperties' => true,
				),
			),
		)
	);
}

add_action( 'init', 'gutenberg_register_persisted_preferences_user_meta' );
