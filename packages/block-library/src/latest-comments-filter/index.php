<?php

function render_block_core_latest_comments_filter( $attributes, $content, $block ) {
  wp_enqueue_script( 'wp-block-latest-comments-filter-view' );  
  return $content;
}

/**
 * Registers the `core/latest-comments` block.
 */
function register_block_core_latest_comments_filter() {
	register_block_type_from_metadata(
		__DIR__ . '/latest-comments-filter',
		array(
			'render_callback' => 'render_block_core_latest_comments_filter',
		)
	);
}

add_action( 'init', 'register_block_core_latest_comments_filter' );
