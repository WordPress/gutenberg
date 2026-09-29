<?php
/**
 * Post-specific template choices for WordPress 7.2.
 *
 * @package gutenberg
 */

/**
 * Includes the hierarchy default before plugins filter the available choices.
 *
 * Runs before the usual filter priority. Neither the order nor membership of
 * the returned choices determines the active template or changes an assignment.
 * When merged to Core, this preparation belongs in get_block_templates().
 *
 * @param WP_Block_Template[] $templates     Available templates.
 * @param array               $query         Template query.
 * @param string              $template_type Template type.
 * @return WP_Block_Template[] Available choices.
 */
function gutenberg_prepare_post_template_choices( $templates, $query, $template_type ) {
	if ( 'wp_template' !== $template_type || ! isset( $query['slug'], $query['post_type'] ) || ! is_string( $query['slug'] ) || ! is_string( $query['post_type'] ) || ! is_array( $templates ) ) {
		return $templates;
	}

	$slug = sanitize_title( $query['slug'] );
	if ( '' === $slug ) {
		return $templates;
	}
	$posts = get_posts(
		array(
			'name'           => $slug,
			'post_type'      => $query['post_type'],
			'post_status'    => 'any',
			'posts_per_page' => 2,
			'fields'         => 'ids',
		)
	);
	// Drafts and hierarchical posts can share a slug. Offer generic choices.
	if ( count( $posts ) > 1 ) {
		$slug = null;
	}
	$template_slug = 'page' === $query['post_type'] ? 'page' : 'single-' . $query['post_type'];
	if ( null !== $slug ) {
		$template_slug .= '-' . $slug;
	}
	$default = resolve_block_template( $template_slug, get_template_hierarchy( $template_slug ), '' );
	if ( $default && ( ! isset( $query['wp_id'] ) || (int) $default->wp_id === $query['wp_id'] ) ) {
		array_unshift( $templates, $default );
	}
	return $templates;
}
add_filter( 'get_block_templates', 'gutenberg_prepare_post_template_choices', 9, 3 );
