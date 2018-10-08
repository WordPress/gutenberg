<?php
/**
 * Server-side rendering of the `core/gallery` block.
 *
 * @package gutenberg
 */
/**
 * Renders the `core/gallery` block on the server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Gallery output. Empty string if the passed type is unsupported.
 */
function render_block_core_gallery( $attributes ) {
    $html = sprintf( '<figure class="%s">%s</figure>', esc_attr( $attributes['className'] ), gallery_shortcode( $attributes ) );
    return $html;
}
/**
 * Registers the `core/gallery` block on server if post_gallery is being filtered.
 */

function register_block_core_gallery() {
    // if( has_filter( 'post_gallery' ) ) {
        register_block_type(
            'core/gallery',
            array(
                'render_callback' => 'render_block_core_gallery',
            )
        );
    // }
}
add_action( 'init', 'register_block_core_gallery' );
