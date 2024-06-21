<?php

/**
 * Inject ignoredHookedBlocks metadata attributes into a template or template part.
 *
 * Given an object that represents a `wp_template` or `wp_template_part` post object
 * prepared for inserting or updating the database, locate all blocks that have
 * hooked blocks, and inject a `metadata.ignoredHookedBlocks` attribute into the anchor
 * blocks to reflect the latter.
 *
 * @access private
 *
 * @param stdClass        $changes    An object representing a template or template part
 *                                    prepared for inserting or updating the database.
 * @param WP_REST_Request $deprecated Deprecated. Not used.
 * @return stdClass|WP_Error The updated object representing a template or template part.
 */
function gutenberg_inject_ignored_hooked_blocks_metadata_attributes( $changes, $deprecated = null ) {
	if ( null !== $deprecated ) {
		_deprecated_argument( __FUNCTION__, '6.5.3' );
	}

	$hooked_blocks = get_hooked_blocks();
	if ( empty( $hooked_blocks ) && ! has_filter( 'hooked_block_types' ) ) {
		return $changes;
	}

	$meta  = isset( $changes->meta_input ) ? $changes->meta_input : array();
	$terms = isset( $changes->tax_input ) ? $changes->tax_input : array();

	if ( empty( $changes->ID ) ) {
		// There's no post object for this template in the database for this template yet.
		$post = $changes;
	} else {
		// Find the existing post object.
		$post = get_post( $changes->ID );

		// If the post is a revision, use the parent post's post_name and post_type.
		$post_id = wp_is_post_revision( $post );
		if ( $post_id ) {
			$parent_post     = get_post( $post_id );
			$post->post_name = $parent_post->post_name;
			$post->post_type = $parent_post->post_type;
		}

		// Apply the changes to the existing post object.
		$post = (object) array_merge( (array) $post, (array) $changes );

		$type_terms        = get_the_terms( $changes->ID, 'wp_theme' );
		$terms['wp_theme'] = ! is_wp_error( $type_terms ) && ! empty( $type_terms ) ? $type_terms[0]->name : null;
	}

	// Required for the WP_Block_Template. Update the post object with the current time.
	$post->post_modified = current_time( 'mysql' );

	// If the post_author is empty, set it to the current user.
	if ( empty( $post->post_author ) ) {
		$post->post_author = get_current_user_id();
	}

    $wp_post = new WP_Post( $post );

	if ( 'wp_template_part' === $post->post_type && ! isset( $terms['wp_template_part_area'] ) ) {
		$area_terms                     = get_the_terms( $changes->ID, 'wp_template_part_area' );
		$terms['wp_template_part_area'] = ! is_wp_error( $area_terms ) && ! empty( $area_terms ) ? $area_terms[0]->name : null;

        /**
		 * Hooked blocks that are ignored from a template part as first_child or last_child
		 * are not inserted into the template part's content because they have no parent block.
		 * Instead, they are inserted into the postmeta.
		*/
		gutenberg_update_ignored_hooked_blocks_postmeta( $wp_post );
	}

	$template = _build_block_template_object_from_post_object( $wp_post, $terms, $meta );

	if ( is_wp_error( $template ) ) {
		return $template;
	}

	$changes->post_content = apply_block_hooks_to_content( $changes->post_content, $template, 'set_ignored_hooked_blocks_metadata' );

	return $changes;
}

add_filter( 'rest_pre_insert_wp_template_part', 'gutenberg_inject_ignored_hooked_blocks_metadata_attributes' );