<?php
/**
 * PHP-only block registration for WordPress 6.9+
 *
 * @package gutenberg
 */

/**
 * Expose blocks with auto_register flag for ServerSideRender in the editor.
 *
 * Detects blocks that have the auto_register flag set in their supports
 * and passes them to JavaScript for auto-registration with ServerSideRender.
 */
function gutenberg_register_auto_register_blocks() {
	$auto_register_blocks = array();
	$registered_blocks    = WP_Block_Type_Registry::get_instance()->get_all_registered();

	foreach ( $registered_blocks as $block_name => $block_type ) {
		$has_auto_register_flag = ! empty( $block_type->auto_register ) || ! empty( $block_type->supports['auto_register'] );
		$has_render_callback    = ! empty( $block_type->render_callback );

		if ( $has_auto_register_flag && $has_render_callback ) {
			$auto_register_blocks[] = $block_name;
		}
	}

	if ( ! empty( $auto_register_blocks ) ) {
		wp_add_inline_script(
			'wp-block-library',
			sprintf( 'window.__unstableAutoRegisterBlocks = %s;', wp_json_encode( $auto_register_blocks ) ),
			'before'
		);
	}
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_register_auto_register_blocks', 5 );

/**
 * Mark user-defined attributes for auto-generated inspector controls.
 *
 * This filter runs during block type registration, before the WP_Block_Type
 * is instantiated. Block supports add their attributes AFTER the block type
 * is created (via WP_Block_Supports::register_attributes()), so any attributes
 * present at this stage are user-defined.
 *
 * The marker tells generateFieldsFromAttributes() which attributes should
 * get auto-generated inspector controls. Attributes are excluded if they:
 * - Have a 'source' (HTML-derived, edited inline not via inspector)
 * - Have role 'local' (internal state, not user-configurable)
 * - Were added by block supports (added after this filter runs)
 *
 * @param array $settings Array of block type arguments for registration.
 * @return array Modified settings with marked attributes.
 */
function gutenberg_mark_auto_inspector_control_attributes( $settings ) {
	if ( empty( $settings['attributes'] ) || ! is_array( $settings['attributes'] ) ) {
		return $settings;
	}

	// Only process blocks with auto_register flag.
	$has_auto_register = ! empty( $settings['supports']['auto_register'] );
	if ( ! $has_auto_register ) {
		return $settings;
	}

	foreach ( $settings['attributes'] as $name => $def ) {
		// Skip HTML-derived attributes (edited inline, not via inspector).
		if ( ! empty( $def['source'] ) ) {
			continue;
		}
		// Skip internal attributes (not user-configurable).
		if ( isset( $def['role'] ) && 'local' === $def['role'] ) {
			continue;
		}
		$settings['attributes'][ $name ]['__experimentalAutoInspectorControl'] = true;
	}

	return $settings;
}

// Priority 5 to mark original attributes before other filters (priority 10+) might add their own.
add_filter( 'register_block_type_args', 'gutenberg_mark_auto_inspector_control_attributes', 5 );
