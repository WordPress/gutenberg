<?php
/**
 * Server-side rendering of the `core/site-title` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/site-title` block on the server.
 *
 * @since 5.8.0
 *
 * @param array $attributes The block attributes.
 *
 * @return string The render.
 */
function render_block_core_site_title( $attributes ) {
	$site_title = get_bloginfo( 'name' );
	if ( ! trim( $site_title ) ) {
		return '';
	}

	$tag_name = 'h1';
	$classes  = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes .= ' has-link-color';
	}

	if ( isset( $attributes['level'] ) ) {
		$tag_name = 0 === $attributes['level'] ? 'p' : 'h' . (int) $attributes['level'];
	}

	// Don't link the site title to the homepage when we're already on the homepage,
	// if the block is configured to omit the link there.
	$should_unlink_on_homepage = ! empty( $attributes['shouldUnlinkOnHomepage'] ) && is_front_page() && ! is_paged();

	if ( $attributes['isLink'] && ! $should_unlink_on_homepage ) {
		$aria_current = ! is_paged() && ( is_front_page() || is_home() && ( (int) get_option( 'page_for_posts' ) !== get_queried_object_id() ) ) ? ' aria-current="page"' : '';
		$link_target  = ! empty( $attributes['linkTarget'] ) ? $attributes['linkTarget'] : '_self';

		$site_title = sprintf(
			'<a href="%1$s" target="%2$s" rel="home"%3$s>%4$s</a>',
			esc_url( home_url() ),
			esc_attr( $link_target ),
			$aria_current,
			esc_html( $site_title )
		);
	} else {
		$site_title = esc_html( $site_title );
	}
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => trim( $classes ) ) );

	return sprintf(
		'<%1$s %2$s>%3$s</%1$s>',
		$tag_name,
		$wrapper_attributes,
		$site_title
	);
}

/**
 * Registers the `core/site-title` block on the server.
 *
 * @since 5.8.0
 */
function register_block_core_site_title() {
	register_block_type_from_metadata(
		__DIR__ . '/site-title',
		array(
			'render_callback' => 'render_block_core_site_title',
		)
	);
}
add_action( 'init', 'register_block_core_site_title' );
