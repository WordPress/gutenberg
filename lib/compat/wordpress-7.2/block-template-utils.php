<?php
/**
 * Post-specific block template choices for WordPress 7.2.
 *
 * @package gutenberg
 */

/**
 * Adds the default template and applies homepage rules to post-specific choices.
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

	$hierarchy = get_template_hierarchy( $slug );
	do {
		$default_template = resolve_block_template( $slug, $hierarchy, '' );
		array_shift( $hierarchy );
	} while ( ! empty( $hierarchy ) && empty( $default_template->content ) );

	if ( 'home' === $slug ) {
		return $default_template ? array( $default_template ) : array();
	}
	if ( $default_template ) {
		array_unshift( $templates, $default_template );
	}
	return $templates;
}
add_filter( 'get_block_templates', 'gutenberg_filter_post_templates', 9, 3 );
