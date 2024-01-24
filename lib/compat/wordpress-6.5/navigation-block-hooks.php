<?php
// Injection of hooked blocks into the Navigation block relies on some functions present in WP >= 6.4
// that have not yet been included in Gutenberg's compatibility layer (lib/compat/wordpress-6.4/block-hooks.php).
if ( function_exists( 'get_hooked_blocks' ) ) {
	add_filter( 'rest_prepare_wp_navigation', 'block_core_navigation_insert_hooked_blocks_into_rest_response', 10, 3 );
	add_action( 'rest_insert_wp_navigation', 'block_core_navigation_update_ignore_hooked_blocks_meta', 10, 3 );
}

/**
 * Updates the post meta with the list of ignored hooked blocks when the navigation is created or updated via the REST API.
 *
 * @param WP_Post $post Post object.
 */
function block_core_navigation_update_ignore_hooked_blocks_meta( $post ) {
	if ( ! isset( $post->ID ) ) {
		return;
	}

	// We run the Block Hooks mechanism so it will return the list of ignored hooked blocks
	// in the mock root Navigation block's metadata attribute.
	// We ignore the rest of the returned `$markup`; `$post->post_content` already has the hooked
	// blocks inserted, whereas `$markup` will have them inserted twice.
	$blocks                = parse_blocks( $post->post_content );
	$markup                = block_core_navigation_insert_hooked_blocks( $blocks, $post );
	$root_nav_block        = parse_blocks( $markup )[0];
	$ignored_hooked_blocks = isset( $root_nav_block['attrs']['metadata']['ignoredHookedBlocks'] )
		? $root_nav_block['attrs']['metadata']['ignoredHookedBlocks']
		: array();

	if ( ! empty( $ignored_hooked_blocks ) ) {
		$existing_ignored_hooked_blocks = get_post_meta( $post->ID, '_wp_ignored_hooked_blocks', true );
		if ( ! empty( $existing_ignored_hooked_blocks ) ) {
			$existing_ignored_hooked_blocks = json_decode( $existing_ignored_hooked_blocks, true );
			$ignored_hooked_blocks          = array_unique( array_merge( $ignored_hooked_blocks, $existing_ignored_hooked_blocks ) );
		}
		update_post_meta( $post->ID, '_wp_ignored_hooked_blocks', json_encode( $ignored_hooked_blocks ) );
	}
}

/**
 * Hooks into the REST API response for the core/navigation block and adds the first and last inner blocks.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Post          $post     Post object.
 * @param WP_REST_Request  $request  Request object.
 * @return WP_REST_Response The response object.
 */
function block_core_navigation_insert_hooked_blocks_into_rest_response( $response, $post ) {
	if ( ! isset( $response->data['content']['raw'] ) || ! isset( $response->data['content']['rendered'] ) ) {
		return $response;
	}
	$parsed_blocks = parse_blocks( $response->data['content']['raw'] );
	$content       = block_core_navigation_insert_hooked_blocks( $parsed_blocks, $post );

	// Remove mock Navigation block wrapper.
	$start   = strpos( $content, '-->' ) + strlen( '-->' );
	$end     = strrpos( $content, '<!--' );
	$content = substr( $content, $start, $end - $start );

	$response->data['content']['raw']      = $content;
	$response->data['content']['rendered'] = apply_filters( 'the_content', $content );

	return $response;
}

/**
 * Insert hooked blocks into a Navigation block.
 *
 * Given a Navigation block's inner blocks and its corresponding `wp_navigation` post object,
 * this function inserts hooked blocks into it, and returns the serialized inner blocks in a
 * mock Navigation block wrapper.
 *
 * If there are any hooked blocks that need to be inserted as the Navigation block's first or last
 * children, the `wp_navigation` post's `_wp_ignored_hooked_blocks` meta is checked to see if any
 * of those hooked blocks should be exempted from insertion.
 *
 * @param array   $inner_blocks Parsed inner blocks of a Navigation block.
 * @param WP_Post $post         `wp_navigation` post object corresponding to the block.
 * @return string Serialized inner blocks in mock Navigation block wrapper, with hooked blocks inserted, if any.
 */
function block_core_navigation_insert_hooked_blocks( $inner_blocks, $post = null ) {
	$before_block_visitor = null;
	$after_block_visitor  = null;
	$hooked_blocks        = get_hooked_blocks();
	$attributes           = array();

	if ( isset( $post->ID ) ) {
		$ignored_hooked_blocks = get_post_meta( $post->ID, '_wp_ignored_hooked_blocks', true );
		if ( ! empty( $ignored_hooked_blocks ) ) {
			$ignored_hooked_blocks  = json_decode( $ignored_hooked_blocks, true );
			$attributes['metadata'] = array(
				'ignoredHookedBlocks' => $ignored_hooked_blocks,
			);
		}
	}

	$mock_anchor_parent_block = array(
		'blockName'    => 'core/navigation',
		'attrs'        => $attributes,
		'innerBlocks'  => $inner_blocks,
		'innerContent' => array_fill( 0, count( $inner_blocks ), null ),
	);
	$before_block_visitor     = null;
	$after_block_visitor      = null;

	if ( ! empty( $hooked_blocks ) || has_filter( 'hooked_block_types' ) ) {
		$before_block_visitor = make_before_block_visitor( $hooked_blocks, $post );
		$after_block_visitor  = make_after_block_visitor( $hooked_blocks, $post );
	}

	return traverse_and_serialize_block( $mock_anchor_parent_block, $before_block_visitor, $after_block_visitor );
}
