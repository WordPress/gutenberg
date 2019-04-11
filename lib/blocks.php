<?php
/**
 * Block registration functions.
 *
 * @package gutenberg
 */

/**
 * Substitutes the implementation of a core-registered block type, if exists,
 * with the built result from the plugin.
 */
function gutenberg_reregister_core_block_types() {
	// Blocks directory may not exist if working from a fresh clone.
	$blocks_dir = dirname( __FILE__ ) . '/../build/block-library/blocks/';
	if ( ! file_exists( $blocks_dir ) ) {
		return;
	}

	$block_names = array(
		'archives.php'        => 'core/archives',
		'block.php'           => 'core/block',
		'calendar.php'        => 'core/calendar',
		'categories.php'      => 'core/categories',
		'latest-comments.php' => 'core/latest-comments',
		'latest-posts.php'    => 'core/latest-posts',
		'legacy-widget.php'   => 'core/legacy-widget',
		'rss.php'             => 'core/rss',
		'shortcode.php'       => 'core/shortcode',
		'search.php'          => 'core/search',
		'tag-cloud.php'       => 'core/tag-cloud',
	);

	$registry = WP_Block_Type_Registry::get_instance();

	foreach ( $block_names as $file => $block_name ) {
		if ( ! file_exists( $blocks_dir . $file ) ) {
			return;
		}

		if ( $registry->is_registered( $block_name ) ) {
			$registry->unregister( $block_name );
		}

		require $blocks_dir . $file;
	}
}
add_action( 'init', 'gutenberg_reregister_core_block_types' );

/**
 * Extract the blocks from post content for the REST API post response.
 *
 * @since 1.1.0
 *
 * @param string $content The post content.
 *
 * @return array Array of block data.
 */
function gutenberg_add_blocks_to_post_resource( $content ) {
	$registry = WP_Block_Type_Registry::get_instance();
	$parser   = new WP_Block_Parser();
	$blocks   = $parser->parse( $content );
	$data     = array();

	// Loop thru the blocks, adding rendered content when available.
	foreach ( $blocks as $block ) {
		$block_name  = isset( $block['blockName'] ) ? $block['blockName'] : null;
		$attributes  = is_array( $block['attrs'] ) ? $block['attrs'] : null;
		$raw_content = isset( $block['rawContent'] ) ? $block['rawContent'] : null;

		// Skip block if we didn’t get a valid block name.
		if ( null === $block_name ) {
			continue;
		}

		// Set up rendered content, if available.
		$block['renderedContent'] = null;
		$block_type               = $registry->get_registered( $block_name );
		if ( null !== $block_type ) {
			$block['renderedContent'] = $block_type->render( $attributes, $raw_content );
		}

		// Add the item data.
		$data[] = array(
			'type'       => $block_name,
			'attributes' => $attributes,
			'content'    => $raw_content,
			'rendered'   => $block['renderedContent'],
		);
	}

	return $data;
}

/**
 * Attach a post's block data callback to the REST API response.
 *
 * @since 1.1.0
 *
 * @param string | array $post_types Post type, or array of post types.
 */
function gutenberg_attach_block_response_callback( $post_types ) {
	if ( ! is_array( $post_types ) ) {
		$post_types = array( $post_types );
	}
	foreach ( $post_types as $post_type ) {

		/**
		 * Filter whether a post type has its blocks data added the REST API response content.
		 *
		 * @since 1.1.0
		 *
		 * @param bool   $blocks_show_in_rest Whether to show blocks in the REST API response.
		 * @param string $post_type           The post type.
		 */
		if ( apply_filters( 'gutenberg_add_blocks_to_rest_for_post_type', true, $post_type ) ) {
			add_filter( 'rest_prepare_' . $post_type, 'gutenberg_extract_blocks_from_post_content', 10, 3 );
		}
	}
}
gutenberg_attach_block_response_callback( array( 'post', 'page' ) );

/**
 * Attach a post's block data to the REST API response.
 *
 * @since 1.1.0
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Post          $post     The Post object.
 *
 * @return WP_REST_Response $response The filtered response object.
 */
function gutenberg_extract_blocks_from_post_content( $response, $post ) {
	if ( ! $post ) {
		return $response;
	}

	// Extract the block data from the post content.
	$blocks                              = gutenberg_add_blocks_to_post_resource( $post->post_content );
	$response->data['content']['blocks'] = $blocks;

	return $response;
}
