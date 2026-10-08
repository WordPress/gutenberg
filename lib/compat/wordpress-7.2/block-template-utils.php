<?php
/**
 * Post-specific template choices for WordPress 7.2.
 *
 * @package gutenberg
 */

/**
 * Includes the hierarchy default before plugins filter the available choices.
 *
 * Runs before the usual filter priority. Core and plugins restrict choices in
 * this pipeline, independently of the template used to render the post.
 * When merged to Core, this preparation belongs in get_block_templates().
 *
 * @param WP_Block_Template[] $templates     Available templates.
 * @param array               $query         Template query.
 * @param string              $template_type Template type.
 * @return WP_Block_Template[] Available choices.
 */
function gutenberg_prepare_post_template_choices( $templates, $query, $template_type ) {
	if (
		'wp_template' !== $template_type ||
		! isset( $query['slug'], $query['post_type'] ) ||
		! is_string( $query['slug'] ) ||
		! is_string( $query['post_type'] ) ||
		! is_array( $templates )
	) {
		return $templates;
	}

	$slug    = sanitize_title( $query['slug'] );
	$post_id = isset( $query['post_id'] ) && is_numeric( $query['post_id'] ) ? (int) $query['post_id'] : 0;
	if ( 'page' === $query['post_type'] && $post_id && 'page' === get_option( 'show_on_front' ) ) {
		$fixed_template = null;
		if ( (int) get_option( 'page_on_front' ) === $post_id ) {
			$fixed_template = get_block_template( get_stylesheet() . '//front-page' );
		}
		if ( ! $fixed_template && (int) get_option( 'page_for_posts' ) === $post_id ) {
			$fixed_template = resolve_block_template( 'home', get_template_hierarchy( 'home' ), '' );
		}
		if ( $fixed_template ) {
			return ! isset( $query['wp_id'] ) || (int) $fixed_template->wp_id === $query['wp_id'] ? array( $fixed_template ) : array();
		}
	}
	if ( '' !== $slug && ! $post_id ) {
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
			$slug = '';
		}
	}
	$template_slug = 'page' === $query['post_type'] ? 'page' : 'single-' . $query['post_type'];
	if ( '' !== $slug ) {
		$template_slug .= '-' . $slug;
	}
	$default = resolve_block_template( $template_slug, get_template_hierarchy( $template_slug ), '' );
	if ( $default && ( ! isset( $query['wp_id'] ) || (int) $default->wp_id === $query['wp_id'] ) ) {
		array_unshift( $templates, $default );
	}
	return $templates;
}
add_filter( 'get_block_templates', 'gutenberg_prepare_post_template_choices', 9, 3 );
