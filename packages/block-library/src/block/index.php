<?php
/**
 * Server-side rendering of the `core/block` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/block` block on server.
 *
 * @since 5.0.0
 *
 * @global WP_Embed $wp_embed
 *
 * @param array    $attributes     The block attributes. Either `ref`, the ID of a
 *                                 `wp_block` post, or `slug`, the name of a
 *                                 registered pattern.
 * @param string   $content        The block content.
 * @param WP_Block $block_instance The block instance.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_block( $attributes, $content, $block_instance ) {
	static $seen_refs = array();

	$ref  = ! empty( $attributes['ref'] ) ? (int) $attributes['ref'] : 0;
	$slug = ! empty( $attributes['slug'] ) ? (string) $attributes['slug'] : '';

	if ( ! $ref && ! $slug ) {
		return '';
	}

	$reusable_block = null;

	if ( $ref ) {
		// A user pattern: a `wp_block` post.
		$reusable_block = get_post( $ref );
		if ( ! $reusable_block || 'wp_block' !== $reusable_block->post_type ) {
			return '';
		}

		if ( 'publish' !== $reusable_block->post_status || ! empty( $reusable_block->post_password ) ) {
			return '';
		}

		$seen_key = 'ref:' . $ref;
		$content  = $reusable_block->post_content;
	} else {
		// A registered pattern, referenced by its name.
		$pattern = WP_Block_Patterns_Registry::get_instance()->get_registered( $slug );
		if ( ! $pattern ) {
			return '';
		}

		$seen_key = 'slug:' . $slug;
		$content  = $pattern['content'];
	}

	if ( isset( $seen_refs[ $seen_key ] ) ) {
		// WP_DEBUG_DISPLAY must only be honored when WP_DEBUG. This precedent
		// is set in `wp_debug_mode()`.
		$is_debug = WP_DEBUG && WP_DEBUG_DISPLAY;

		return $is_debug ?
			// translators: Visible only in the front end, this warning takes the place of a faulty block.
			__( '[block rendering halted]' ) :
			'';
	}

	$seen_refs[ $seen_key ] = true;

	// Handle embeds for reusable blocks.
	global $wp_embed;
	$content = $wp_embed->run_shortcode( $content );
	$content = $wp_embed->autoembed( $content );

	// Back compat.
	// For blocks that have not been migrated in the editor, add some back compat
	// so that front-end rendering continues to work.

	// This matches the `v2` deprecation. Removes the inner `values` property
	// from every item.
	if ( isset( $attributes['content'] ) ) {
		foreach ( $attributes['content'] as &$content_data ) {
			if ( isset( $content_data['values'] ) ) {
				$is_assoc_array = is_array( $content_data['values'] ) && ! wp_is_numeric_array( $content_data['values'] );

				if ( $is_assoc_array ) {
					$content_data = $content_data['values'];
				}
			}
		}
	}

	// This matches the `v1` deprecation. Rename `overrides` to `content`.
	if ( isset( $attributes['overrides'] ) && ! isset( $attributes['content'] ) ) {
		$attributes['content'] = $attributes['overrides'];
	}

	// Apply Block Hooks. Registered patterns already have them applied by the registry.
	if ( $reusable_block ) {
		$content = apply_block_hooks_to_content_from_post_object( $content, $reusable_block );
	}

	/**
	 * We attach the blocks from $content as inner blocks to the Synced Pattern block instance.
	 * This ensures that block context available to the Synced Pattern block instance is provided to
	 * those blocks.
	 */
	$block_instance->parsed_block['innerBlocks']  = parse_blocks( $content );
	$block_instance->parsed_block['innerContent'] = array_fill( 0, count( $block_instance->parsed_block['innerBlocks'] ), null );
	$block_instance->refresh_context_dependents();

	$content = $block_instance->render( array( 'dynamic' => false ) );
	unset( $seen_refs[ $seen_key ] );

	return $content;
}

/**
 * Registers the `core/block` block.
 *
 * @since 5.3.0
 */
function register_block_core_block() {
	register_block_type_from_metadata(
		__DIR__ . '/block',
		array(
			'render_callback' => 'render_block_core_block',
		)
	);
}
add_action( 'init', 'register_block_core_block' );
