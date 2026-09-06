<?php
/**
 * PHP-only block registration for WordPress 6.9+
 *
 * @package gutenberg
 */

/**
 * Exposes blocks with autoRegister flag for ServerSideRender in the editor.
 *
 * Detects blocks that have the autoRegister flag set in their supports
 * and passes them to JavaScript for auto-registration with ServerSideRender.
 */
function _gutenberg_enqueue_auto_register_blocks( $settings ) {
	$auto_register_blocks = array();
	$registered_blocks    = WP_Block_Type_Registry::get_instance()->get_all_registered();

	foreach ( $registered_blocks as $block_name => $block_type ) {
		if ( ! empty( $block_type->supports['autoRegister'] ) && ! empty( $block_type->render_callback ) ) {
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

	return $settings;
}

if ( has_action( 'enqueue_block_editor_assets', '_wp_enqueue_auto_register_blocks' ) ) {
	remove_action( 'enqueue_block_editor_assets', '_wp_enqueue_auto_register_blocks' );
}
add_action( 'enqueue_block_editor_assets', '_gutenberg_enqueue_auto_register_blocks' );

/**
 * Marks user-defined attributes for auto-generated inspector controls.
 *
 * This filter runs during block type registration, before the WP_Block_Type
 * is instantiated. Block supports add their attributes AFTER the block type
 * is created (via {@see WP_Block_Supports::register_attributes()}), so any attributes
 * present at this stage are user-defined.
 *
 * The marker tells generateFieldsFromAttributes() which attributes should
 * get auto-generated inspector controls. Attributes are excluded if they:
 * - Have a 'source' (HTML-derived, edited inline not via inspector)
 * - Have role 'local' (internal state, not user-configurable)
 * - Were added by block supports (added after this filter runs)
 *
 * @param array<string, mixed> $args Array of arguments for registering a block type.
 * @return array<string, mixed> Modified block type arguments.
 */
function gutenberg_mark_auto_generate_control_attributes( array $args ): array {
	if ( empty( $args['attributes'] ) || ! is_array( $args['attributes'] ) ) {
		return $args;
	}

	$has_auto_register = ! empty( $args['supports']['autoRegister'] );
	if ( ! $has_auto_register ) {
		return $args;
	}

	foreach ( $args['attributes'] as $attr_key => $attr_schema ) {
		// Skip HTML-derived attributes (edited inline, not via inspector).
		if ( ! empty( $attr_schema['source'] ) ) {
			continue;
		}
		// Skip internal attributes (not user-configurable).
		if ( isset( $attr_schema['role'] ) && 'local' === $attr_schema['role'] ) {
			continue;
		}
		// Skip unsupported types (only 'string', 'number', 'integer', 'boolean' are supported).
		$type = $attr_schema['type'] ?? null;
		if ( ! in_array( $type, array( 'string', 'number', 'integer', 'boolean' ), true ) ) {
			continue;
		}
		$args['attributes'][ $attr_key ]['autoGenerateControl'] = true;
	}

	return $args;
}

$filter_priority = has_filter( 'register_block_type_args', 'wp_mark_auto_generate_control_attributes' );
if ( $filter_priority ) {
	remove_filter( 'register_block_type_args', 'wp_mark_auto_generate_control_attributes', $filter_priority );
}
// Priority 5 to mark original attributes before other filters (priority 10+) might add their own.
add_filter( 'register_block_type_args', 'gutenberg_mark_auto_generate_control_attributes', 5 );
