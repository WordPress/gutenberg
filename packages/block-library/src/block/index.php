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
 * @since 7.2.0 Shortcodes in the pattern's saved markup are expanded when the
 *              pattern is rendered outside `the_content` and `widget_block_content`.
 *
 * @global WP_Embed $wp_embed
 *
 * @param array $attributes The block attributes.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_block( $attributes, $content, $block_instance ) {
	static $seen_refs = array();

	if ( empty( $attributes['ref'] ) ) {
		return '';
	}

	$reusable_block = get_post( $attributes['ref'] );
	if ( ! $reusable_block || 'wp_block' !== $reusable_block->post_type ) {
		return '';
	}

	if ( isset( $seen_refs[ $attributes['ref'] ] ) ) {
		// WP_DEBUG_DISPLAY must only be honored when WP_DEBUG. This precedent
		// is set in `wp_debug_mode()`.
		$is_debug = WP_DEBUG && WP_DEBUG_DISPLAY;

		return $is_debug ?
			// translators: Visible only in the front end, this warning takes the place of a faulty block.
			__( '[block rendering halted]' ) :
			'';
	}

	if ( 'publish' !== $reusable_block->post_status || ! empty( $reusable_block->post_password ) ) {
		return '';
	}

	$seen_refs[ $attributes['ref'] ] = true;

	// Handle embeds for reusable blocks.
	global $wp_embed;
	$content = $wp_embed->run_shortcode( $reusable_block->post_content );
	$content = $wp_embed->autoembed( $content );

	/*
	 * The Shortcode block leaves its shortcode in the markup for `the_content`
	 * to expand. A synced pattern rendered outside that filter, in a template
	 * for example, never gets that pass, so expand shortcodes here on the
	 * pattern's saved markup before its blocks are rendered, the same way
	 * `get_the_block_template_html()` processes templates. Running the pass
	 * before block rendering keeps it limited to what the pattern author
	 * saved, so content that dynamic blocks add while rendering (comment
	 * text, post content, pattern overrides) is never treated as shortcodes.
	 *
	 * Inside `the_content` and `widget_block_content`, which run
	 * `do_shortcode` after blocks, this pass is skipped so escaped shortcodes
	 * are not expanded twice.
	 */
	if ( ! doing_filter( 'the_content' ) && ! doing_filter( 'widget_block_content' ) ) {
		$content = shortcode_unautop( $content );
		$content = do_shortcode( $content );
	}

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

	// Apply Block Hooks.
	$content = apply_block_hooks_to_content_from_post_object( $content, $reusable_block );

	/**
	 * We attach the blocks from $content as inner blocks to the Synced Pattern block instance.
	 * This ensures that block context available to the Synced Pattern block instance is provided to
	 * those blocks.
	 */
	$block_instance->parsed_block['innerBlocks']  = parse_blocks( $content );
	$block_instance->parsed_block['innerContent'] = array_fill( 0, count( $block_instance->parsed_block['innerBlocks'] ), null );
	$block_instance->refresh_context_dependents();

	$content = $block_instance->render( array( 'dynamic' => false ) );
	unset( $seen_refs[ $attributes['ref'] ] );

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
