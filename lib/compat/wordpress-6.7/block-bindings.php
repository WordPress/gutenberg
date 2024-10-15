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
 * Map the `edit_block_binding` capability to `edit_{object_subtype}` or `edit_theme_options``
 * depending on the context.
 * @param array  $caps    Primitive capabilities required of the user.
 * @param string $cap     Capability being checked.
 * @param int    $user_id The user ID.
 * @param array  $args    Argumenst that add the context to the cap.
 * @return array The updated capabilities.
 */
function gutenberg_add_edit_block_binding_capability( $caps, $cap, $user_id, $args ) {
	if ( 'edit_block_binding' === $cap ) {
		$block_editor_context = $args[0];
		if ( isset( $block_editor_context->post ) ) {
			$object_id = $block_editor_context->post->ID;
		}
		/*
		* If the post ID is null, check if the context is the site editor.
		* Fall back to the edit_theme_options in that case.
		*/
		if ( ! isset( $object_id ) ) {
			if ( ! isset( $block_editor_context->name ) || 'core/edit-site' !== $block_editor_context->name ) {
				return array( 'do_not_allow' );
			}
			$caps = map_meta_cap( 'edit_theme_options', $user_id );
		} else {
			$object_subtype = get_object_subtype( 'post', (int) $object_id );
			if ( empty( $object_subtype ) ) {
				return array( 'do_not_allow' );
			}
			$caps = map_meta_cap( "edit_{$object_subtype}", $user_id, $object_id );
		}
	}
	return $caps;
}
add_filter( 'map_meta_cap', 'gutenberg_add_edit_block_binding_capability', 5, 4 );

/**
 * Initialize `canUpdateBlockBindings` editor setting if it doesn't exist. By default, it is `true` only for admin users.
 *
 * @param array $editor_settings      The block editor settings from the `block_editor_settings_all` filter.
 * @param array $block_editor_context The block editor context.
 * @return array The editor settings including `canUpdateBlockBindings`.
 */
function gutenberg_add_can_update_block_bindings_editor_setting( $editor_settings, $block_editor_context ) {
	if ( ! isset( $editor_settings['canUpdateBlockBindings'] ) ) {
		$editor_settings['canUpdateBlockBindings'] = current_user_can( 'edit_block_binding', $block_editor_context );
	}
	return $editor_settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_add_can_update_block_bindings_editor_setting', 10, 2 );

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
