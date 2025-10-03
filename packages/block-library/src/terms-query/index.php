<?php
/**
 * Server-side rendering of the `core/terms-query` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/terms-query` block on the server.
 *
 * @since 6.9.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the output of the query, structured using the layout defined by the block's inner blocks.
 */
function render_block_core_terms_query( $attributes, $content, $block ) {
	// Inherit by default if termId is available in context.
	$inherit = isset( $attributes['termQuery']['inherit'] ) ? $attributes['termQuery']['inherit'] : isset( $block->context['termId'] );

	$content = '';

	$query_context            = $attributes['termQuery'];
	$query_context['inherit'] = $inherit;

	if ( $inherit ) {
		if ( isset( $block->context['termQuery'] ) ) {
			// Inherit taxonomy from context if available.
			$query_context['taxonomy'] = $block->context['termQuery']['taxonomy'] ?? $query_context['taxonomy'] ?? 'category';
			// Inherit query context.
			$query_context['context'] = $block->context['termQuery']['context'] ?? $query_context['context'] ?? '';
		}
		if ( isset( $block->context['termId'] ) ) {
			$query_context['parent'] = $block->context['termId'] ?? $query_context['parent'] ?? 0;
		}

		// If this is the top-level query, set the termQuery context value based on whether inheritance is from a post or taxonomy archive.
		if ( ! isset( $block->context['termQuery'] ) ) {
			// Must check for taxonomy archive first as postId is available in term archives.
			if ( is_category() || is_tag() || is_tax() ) {
				$query_context['context'] = 'taxonomy_archive';
				// Set the taxonomy based on the queried object if not already set.
				if ( empty( $query_context['taxonomy'] ) ) {
					$query_context['taxonomy'] = get_queried_object()->taxonomy;
				}
			} elseif ( isset( $block->context['postId'] ) || is_single() ) {
				$query_context['context'] = 'post';
			}
		}
	}

	$filter_block_context = static function ( $context ) use ( $query_context ) {
		$context['termQuery'] = $query_context;
		return $context;
	};

	// Use an early priority so that other 'render_block_context' filters have access to the values.
	add_filter( 'render_block_context', $filter_block_context, 1 );
	$content = ( new WP_Block( $block->parsed_block ) )->render( array( 'dynamic' => false ) );
	remove_filter( 'render_block_context', $filter_block_context, 1 );

	return $content;
}

/**
 * Registers the `core/terms-query` block on the server.
 *
 * @since 6.9.0
 */
function register_block_core_terms_query() {
	register_block_type_from_metadata(
		__DIR__ . '/terms-query',
		array(
			'render_callback' => 'render_block_core_terms_query',
		)
	);
}
add_action( 'init', 'register_block_core_terms_query' );
