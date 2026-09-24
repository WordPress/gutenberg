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
 * @since 7.1.0 Added a synced pattern expansion budget, filterable via
 *              `block_core_block_render_budget`, to prevent memory exhaustion
 *              from densely cross-referenced patterns.
 *
 * @global WP_Embed $wp_embed
 *
 * @param array $attributes The block attributes.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_block( $attributes, $content, $block_instance ) {
	static $seen_refs = array();

	/*
	 * Caps the number of synced pattern (core/block) expansions for the current
	 * top-level render. The $seen_refs guard below only prevents a pattern from
	 * being nested within itself (A -> ... -> A); it does not dedupe a pattern
	 * referenced repeatedly across the tree. A densely cross-referenced set of
	 * patterns can therefore expand exponentially (depth x fan-out) and exhaust
	 * memory, so the budget bounds the work per top-level render.
	 *
	 * $seen_refs is populated below and emptied (in a finally block) as each ref
	 * unwinds, so it is empty exactly when no ancestor core/block call is on the
	 * stack -- i.e. on the outermost invocation. That is where the budget is
	 * (re)initialized.
	 *
	 * This bounds the exponential blow-up of a single deeply/diamond-referenced
	 * pattern, which is the dangerous case (small markup, huge expansion), and
	 * keeps peak memory flat (each top-level render's working set is freed before
	 * the next). It does not bound the aggregate of a post that repeats many
	 * independent top-level references; that is linear in the post's markup and is
	 * better capped higher up (do_blocks / the REST controller).
	 */
	static $render_budget = -1;

	if ( empty( $attributes['ref'] ) ) {
		return '';
	}

	$reusable_block = get_post( $attributes['ref'] );
	if ( ! $reusable_block || 'wp_block' !== $reusable_block->post_type ) {
		return '';
	}

	if ( empty( $seen_refs ) ) {
		/**
		 * Filters the maximum number of synced pattern (core/block) expansions
		 * rendered within a single top-level render.
		 *
		 * Repeated or "diamond" references to the same synced pattern are not
		 * deduplicated, so this acts as a safety limit that keeps a densely
		 * cross-referenced set of patterns from expanding exponentially and
		 * exhausting memory.
		 *
		 * Return -1 (or any negative value) to remove the limit entirely. A value
		 * of 0 disables synced pattern expansion. This filter fires once per
		 * top-level render, before any nested expansion begins; the value returned
		 * governs the whole expansion tree.
		 *
		 * @since 7.1.0
		 *
		 * @param int $render_budget Maximum number of synced pattern expansions
		 *                           per top-level render. Default 10000.
		 */
		$render_budget = (int) apply_filters( 'block_core_block_render_budget', 10000 );

		/*
		 * Normalize so that only -1 represents "no limit"; an accidental negative
		 * never becomes a surprise expansion cap. A filter returning false or null
		 * casts to 0, which disables expansion -- itself a safe outcome.
		 */
		if ( $render_budget < 0 ) {
			$render_budget = -1;
		}
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

	if ( -1 !== $render_budget && $render_budget < 1 ) {
		/*
		 * The synced pattern expansion budget for this top-level render has been
		 * exhausted. Halt gracefully rather than risk exhausting memory.
		 */
		$is_debug = WP_DEBUG && WP_DEBUG_DISPLAY;

		return $is_debug ?
			// translators: Visible only in the front end, this warning takes the place of a faulty block whose synced pattern expansion limit was reached.
			__( '[block rendering halted: synced pattern limit reached]' ) :
			'';
	}

	if ( -1 !== $render_budget ) {
		--$render_budget;
	}

	$seen_refs[ $attributes['ref'] ] = true;

	/*
	 * Clear the ref in a finally block so a throw from any of the render steps
	 * below cannot leave $seen_refs dirty, which would wrongly trip the
	 * self-reference guard on later renders in a long-lived process.
	 */
	try {
		// Handle embeds for reusable blocks.
		global $wp_embed;
		$content = $wp_embed->run_shortcode( $reusable_block->post_content );
		$content = $wp_embed->autoembed( $content );

		/*
		 * Back compat.
		 * For blocks that have not been migrated in the editor, add some back compat
		 * so that front-end rendering continues to work.
		 *
		 * This matches the `v2` deprecation. Removes the inner `values` property
		 * from every item.
		 */
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

		/*
		 * We attach the blocks from $content as inner blocks to the Synced Pattern block instance.
		 * This ensures that block context available to the Synced Pattern block instance is provided to
		 * those blocks.
		 */
		$block_instance->parsed_block['innerBlocks']  = parse_blocks( $content );
		$block_instance->parsed_block['innerContent'] = array_fill( 0, count( $block_instance->parsed_block['innerBlocks'] ), null );
		$block_instance->refresh_context_dependents();

		$content = $block_instance->render( array( 'dynamic' => false ) );
	} finally {
		unset( $seen_refs[ $attributes['ref'] ] );
	}

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
