<?php
/**
 * Post-specific block template choices for WordPress 7.2.
 *
 * @package gutenberg
 */

/**
 * Selects custom templates, adds the default, and applies homepage rules for a post.
 *
 * Runs before the usual filter priority so plugins can restrict the complete
 * list, including the default, through the existing get_block_templates filter.
 * Queries without post_id retain their existing behavior.
 *
 * @param WP_Block_Template[] $templates     Available templates.
 * @param array               $query         Template query, including the edited post_id.
 * @param string              $template_type Template type.
 * @return WP_Block_Template[] Complete, ordered list of available templates.
 */
function gutenberg_filter_post_templates( $templates, $query, $template_type ) {
	if ( 'wp_template' !== $template_type || empty( $query['post_id'] ) || ! is_array( $templates ) ) {
		return $templates;
	}

	$post = get_post( $query['post_id'] );
	if ( ! $post ) {
		return $templates;
	}

	$slug = 'page' === $post->post_type ? 'page' : 'single-' . $post->post_type;
	if ( $post->post_name ) {
		$slug .= '-' . $post->post_name;
	}
	if ( 'page' === $post->post_type && 'page' === get_option( 'show_on_front' ) ) {
		if ( (int) get_option( 'page_on_front' ) === $post->ID ) {
			$front_page = get_block_template( get_stylesheet() . '//front-page' );
			if ( $front_page ) {
				return array( $front_page );
			}
		}
		if ( (int) get_option( 'page_for_posts' ) === $post->ID ) {
			$slug = 'home';
		}
	}

	$default_template = resolve_block_template( $slug, get_template_hierarchy( $slug ), '' );

	$post_templates = $default_template ? array( $default_template ) : array();
	if ( 'home' === $slug ) {
		return $post_templates;
	}

	foreach ( $templates as $template ) {
		if ( ! $template instanceof WP_Block_Template || ! $template->is_custom ) {
			continue;
		}
		if ( isset( $template->post_types ) && ( ! is_array( $template->post_types ) || ! in_array( $post->post_type, $template->post_types, true ) ) ) {
			continue;
		}
		$post_templates[] = $template;
	}
	return $post_templates;
}
add_filter( 'get_block_templates', 'gutenberg_filter_post_templates', 9, 3 );
