<?php
/**
 * Server-side requirements for database persisted preferences.
 *
 * @package gutenberg
 */

/**
 * Register the user meta for persisted preferences.
 */
function gutenberg_configure_persisted_preferences() {
	$user_id = get_current_user_id();
	if ( empty( $user_id ) ) {
		return;
	}

	global $wpdb;

	$meta_key = $wpdb->get_blog_prefix() . 'persisted_preferences';
	register_meta(
		'user',
		$meta_key,
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

	$preload_data = get_user_meta( $user_id, $meta_key, true );

	wp_add_inline_script(
		'wp-database-persistence-layer',
		sprintf(
			'wp.databasePersistenceLayer.__experimentalConfigureDatabasePersistenceLayer( { preloadedData: %s } );',
			wp_json_encode( $preload_data )
		),
		'after'
	);
}

add_action( 'init', 'gutenberg_configure_persisted_preferences' );

