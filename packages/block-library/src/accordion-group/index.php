<?php
/**
 * Server-side rendering of the `core/accordion-group` block.
 *
 * @package WordPress
 * @since 6.6.0
 * 
 * @param array $attributes The block attributes.
 * @param string $content The block content.
 *
 * @return string Returns the updated markup.
 */

function block_core_accordion_group_render( $attributes, $content ) {
    if ( ! $content ) {
        return $content;
    }
    
    $p = new WP_HTML_Tag_Processor( $content );
    $autoclose = $attributes['autoclose'];

    while ( $p->next_tag() ){
        if ( $p->has_class( 'wp-block-accordion-group') ) {
            $p->set_attribute( 'data-wp-interactive', 'core/accordion' );
            $p->set_attribute( 'data-wp-context', '{"isOpen":[],"autoclose":"' . $autoclose . '"}' );
        }
    }

    return $p->get_updated_html();
}

/**
 * Registers the `core/accordion-group` block on server.
 *
 * @since 6.6.0
 */
function register_block_core_accordion_group() {
    register_block_type_from_metadata(
        __DIR__ . '/accordion-group',
        array(
            'render_callback' => 'block_core_accordion_group_render',
        )
    );
}