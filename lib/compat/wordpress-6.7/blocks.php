<?php

/**
 * Updates the wp_postmeta with the list of ignored hooked blocks where the inner blocks are stored as post content.
 * Currently only supports `wp_navigation` and `wp_template_part` post types.
 *
 * @access private
 *
 * @param stdClass $post Post object.
 * @return stdClass The updated post object.
 */
function gutenberg_update_ignored_hooked_blocks_postmeta( $post ) {
	/*
	 * In this scenario the user has likely tried to create a navigation via the REST API.
	 * In which case we won't have a post ID to work with and store meta against.
	 */
	if ( empty( $post->ID ) ) {
		return $post;
	}

	/*
	 * Skip meta generation when consumers intentionally update specific Navigation fields
	 * and omit the content update.
	 */
	if ( ! isset( $post->post_content ) ) {
		return $post;
	}

    $post_type_to_block_name_map = array(
		'wp_navigation'    => 'core/navigation',
		'wp_template_part' => 'core/template-part',
	);

	/*
	 * Skip meta generation when the post content is not in the above map.
	 */
	if ( ! isset( $post->post_type ) || ! isset( $post_type_to_block_name_map[ $post->post_type ] ) ) {
		return $post;
	}

    $parent_block_name = $post_type_to_block_name_map[ $post->post_type ];
	$attributes = array();

	$ignored_hooked_blocks = get_post_meta( $post->ID, '_wp_ignored_hooked_blocks', true );
	if ( ! empty( $ignored_hooked_blocks ) ) {
		$ignored_hooked_blocks  = json_decode( $ignored_hooked_blocks, true );
		$attributes['metadata'] = array(
			'ignoredHookedBlocks' => $ignored_hooked_blocks,
		);
	}

	$markup = get_comment_delimited_block_content(
        $parent_block_name,
		$attributes,
		$post->post_content
	);

	$serialized_block = apply_block_hooks_to_content( $markup, get_post( $post->ID ), 'set_ignored_hooked_blocks_metadata' );
	$root_block       = parse_blocks( $serialized_block )[0];

	$ignored_hooked_blocks = isset( $root_block['attrs']['metadata']['ignoredHookedBlocks'] )
		? $root_block['attrs']['metadata']['ignoredHookedBlocks']
		: array();

	if ( ! empty( $ignored_hooked_blocks ) ) {
		$existing_ignored_hooked_blocks = get_post_meta( $post->ID, '_wp_ignored_hooked_blocks', true );
		if ( ! empty( $existing_ignored_hooked_blocks ) ) {
			$existing_ignored_hooked_blocks = json_decode( $existing_ignored_hooked_blocks, true );
			$ignored_hooked_blocks          = array_unique( array_merge( $ignored_hooked_blocks, $existing_ignored_hooked_blocks ) );
		}
		update_post_meta( $post->ID, '_wp_ignored_hooked_blocks', json_encode( $ignored_hooked_blocks ) );
	}

	$post->post_content = remove_serialized_parent_block( $serialized_block );
	return $post;
}

if ( ! has_filter( 'rest_pre_insert_wp_template_part', 'update_ignored_hooked_blocks_postmeta' ) ) {
    add_filter( 'rest_pre_insert_wp_template_part', 'gutenberg_update_ignored_hooked_blocks_postmeta' );
}