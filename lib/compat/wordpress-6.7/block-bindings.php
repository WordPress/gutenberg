<?php
/**
 * Temporary compatibility code for new functionalities/changes related to block bindings APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Bootstrap the block bindings sources registered in the server.
 */
function gutenberg_bootstrap_server_block_bindings_sources() {
	$registered_sources = get_all_registered_block_bindings_sources();
	if ( ! empty( $registered_sources ) ) {
		$filtered_sources = array();
		foreach ( $registered_sources as $source ) {
			$filtered_sources[] = array(
				'name'        => $source->name,
				'label'       => $source->label,
				'usesContext' => $source->uses_context,
			);
		}
		$script = sprintf( 'for ( const source of %s ) { ! wp.blocks.getBlockBindingsSource( source.name ) && wp.blocks.registerBlockBindingsSource( source ); }', wp_json_encode( $filtered_sources ) );
		wp_add_inline_script(
			'wp-blocks',
			$script
		);
	}
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_bootstrap_server_block_bindings_sources', 5 );

/**
 * Map the `manage_block_bindings` capability to `manage_options`.
 */
function gutenberg_add_manage_block_bindings_capability() {
	global $wp_roles;
	foreach ( $wp_roles->roles as $role_name => $role_info ) {
		$role = get_role( $role_name );
		// Map the capability to `manage_options`.
		if ( $role->has_cap( 'manage_options' ) ) {
			$role->add_cap( 'manage_block_bindings' );
		}
	}
}
add_action( 'init', 'gutenberg_add_manage_block_bindings_capability' );

/**
 * Initialize `canUpdateBlockBindings` editor setting if it doesn't exist. By default, it is `true` only for admin users.
 *
 * @param array $settings The block editor settings from the `block_editor_settings_all` filter.
 * @return array The editor settings including `canUpdateBlockBindings`.
 */
function gutenberg_add_can_update_block_bindings_editor_setting( $editor_settings ) {
	if ( empty( $editor_settings['canUpdateBlockBindings'] ) ) {
		$editor_settings['canUpdateBlockBindings'] = current_user_can( 'manage_block_bindings' );
	}
	return $editor_settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_add_can_update_block_bindings_editor_setting', 10 );

/**
 * Add `label` to `register_meta`.
 *
 * @param array  $args Array of arguments for registering meta.
 * @return array Modified arguments array including `label`.
 */
function gutenberg_update_meta_args_with_label( $args ) {
	// Don't update schema when label isn't provided.
	if ( ! isset( $args['label'] ) ) {
		return $args;
	}

	$schema = array( 'title' => $args['label'] );
	if ( ! is_array( $args['show_in_rest'] ) ) {
		$args['show_in_rest'] = array(
			'schema' => $schema,
		);
		return $args;
	}

	if ( ! empty( $args['show_in_rest']['schema'] ) ) {
		$args['show_in_rest']['schema'] = array_merge( $args['show_in_rest']['schema'], $schema );
	} else {
		$args['show_in_rest']['schema'] = $schema;
	}

	return $args;
}

// Priority must be lower than 10 to ensure the label is not removed.
add_filter( 'register_meta_args', 'gutenberg_update_meta_args_with_label', 5, 1 );
