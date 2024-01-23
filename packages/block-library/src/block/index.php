<?php
/**
 * Server-side rendering of the `core/block` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/block` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_block( $attributes ) {
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

	$gutenberg_experiments        = get_option( 'gutenberg-experiments' );
	$has_partial_synced_overrides = $gutenberg_experiments
		&& array_key_exists( 'gutenberg-pattern-partial-syncing', $gutenberg_experiments )
		&& isset( $attributes['overrides'] );

	/**
	 * We set the `pattern/overrides` context through the `render_block_context`
	 * filter so that it is available when a pattern's inner blocks are
	 * rendering via do_blocks given it only receives the inner content.
	 */
	if ( $has_partial_synced_overrides ) {
		$filter_block_context = static function ( $context ) use ( $attributes ) {
			$context['pattern/overrides'] = $attributes['overrides'];
			return $context;
		};
		add_filter( 'render_block_context', $filter_block_context, 1 );
	}

	$content = do_blocks( $content );
	unset( $seen_refs[ $attributes['ref'] ] );

	if ( $has_partial_synced_overrides ) {
		remove_filter( 'render_block_context', $filter_block_context, 1 );
	}

	return $content;
}

/**
 * Registers the `core/block` block.
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

$gutenberg_experiments = get_option( 'gutenberg-experiments' );
if ( $gutenberg_experiments && array_key_exists( 'gutenberg-pattern-partial-syncing', $gutenberg_experiments ) ) {
	/**
	 * Registers the overrides attribute for core/block.
	 *
	 * @param array  $args       Array of arguments for registering a block type.
	 * @param string $block_name Block name including namespace.
	 * @return array $args
	 */
	function register_block_core_block_args( $args, $block_name ) {
		if ( 'core/block' === $block_name ) {
			$args['attributes'] = array_merge(
				$args['attributes'],
				array(
					'overrides' => array(
						'type' => 'object',
					),
				)
			);
		}
		return $args;
	}
	add_filter( 'register_block_type_args', 'register_block_core_block_args', 10, 2 );
}
