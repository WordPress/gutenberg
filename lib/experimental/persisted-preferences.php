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
			'const { create } = wp.databasePersistenceLayer;
			const persistenceLayer = create( { preloadedData: %s } );
			const { store: preferencesStore } = wp.preferences;
			wp.data.dispatch( "core/preferences" ).setPersistenceLayer( persistenceLayer );',
			wp_json_encode( $preload_data )
		),
		'after'
	);

}

add_action( 'init', 'gutenberg_configure_persisted_preferences' );

/**
 * Register dependencies for the inline script that configures the persistence layer.
 *
 * Note: When porting this to core add an extra case to the switch here:
 * https://github.com/WordPress/wordpress-develop/blob/d2ab3d183740c3d1252cb921b18005495007e022/src/wp-includes/script-loader.php#L251-L258
 *
 * And the same to the gutenberg client assets file here:
 * https://github.com/WordPress/gutenberg/blob/3f3c8df23c70a37b7ac4dddebc82030362133593/lib/client-assets.php#L242-L254
 * ```
 * case 'wp-database-persistence-layer':
 *     array_push( $dependencies, 'wp-data', 'wp-preferences' );
 *     break;
 * ```
 *
 * @param WP_Scripts $scripts An instance of WP_Scripts.
 */
function gutenberg_update_database_persistence_layer_deps( $scripts ) {
	$script = $scripts->query( 'wp-database-persistence-layer', 'registered' );
	if ( isset( $script->deps ) ) {
		array_push( $script->deps, 'wp-data', 'wp-preferences' );
	}
}

add_action( 'wp_default_scripts', 'gutenberg_update_database_persistence_layer_deps', 11 );
