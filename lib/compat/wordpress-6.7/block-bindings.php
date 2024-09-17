<?php
/**
 * Temporary compatibility code for new functionalities/changes related to block bindings APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Adds the block bindings sources registered in the server to the editor settings.
 *
 * This allows them to be bootstrapped in the editor.
 *
 * @param array $settings The block editor settings from the `block_editor_settings_all` filter.
 * @return array The editor settings including the block bindings sources.
 */
function gutenberg_add_server_block_bindings_sources_to_editor_settings( $editor_settings ) {
	// Check if the sources are already exposed in the editor settings.
	if ( isset( $editor_settings['blockBindingsSources'] ) ) {
		return $editor_settings;
	}

	$registered_block_bindings_sources = get_all_registered_block_bindings_sources();
	if ( ! empty( $registered_block_bindings_sources ) ) {
		// Initialize array.
		$editor_settings['blockBindingsSources'] = array();
		foreach ( $registered_block_bindings_sources as $source_name => $source_properties ) {
			// Add source with the label to editor settings.
			$editor_settings['blockBindingsSources'][ $source_name ] = array(
				'label' => $source_properties->label,
			);
			// Add `usesContext` property if exists.
			if ( ! empty( $source_properties->uses_context ) ) {
				$editor_settings['blockBindingsSources'][ $source_name ]['usesContext'] = $source_properties->uses_context;
			}
		}
	}
	return $editor_settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_add_server_block_bindings_sources_to_editor_settings', 10 );

/**
 * Initialize `canUpdateBlockBindings` editor setting if it doesn't exist. By default, it is `true` only for admin users.
 *
 * @param array $settings The block editor settings from the `block_editor_settings_all` filter.
 * @return array The editor settings including `canUpdateBlockBindings`.
 */
function gutenberg_add_can_update_block_bindings_editor_setting( $editor_settings ) {
	if ( empty( $editor_settings['canUpdateBlockBindings'] ) ) {
		$editor_settings['canUpdateBlockBindings'] = current_user_can( 'manage_options' );
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
