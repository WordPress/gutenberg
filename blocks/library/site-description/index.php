<?php
/**
 * Server-side rendering of the `core/site-description` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/site-description` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns HTML for the site description block.
 */
function gutenberg_render_block_core_site_description( $attributes ) {
	if ( ! $attributes[ 'shouldRenderDescription' ] ) {
		return '';
	}

	$class = "wp-block-site-description";
	$description = get_option( 'blogdescription' );
	$block_content = sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( $class ),
		esc_html( $description )
	);

	return $block_content;
}

register_block_type( 'core/site-description', array(
	'attributes' => array(
		/* option attribute
		'description' => array(
			'type' => 'string',
			'option' => 'description',
		),
		 */
		'shouldRenderDescription' => array(
			'type' => 'boolean',
			'default' => false,
		),
	),

	'render_callback' => 'gutenberg_render_block_core_site_description',
) );
