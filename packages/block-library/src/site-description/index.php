<?php
/**
 * Server-side rendering of the `core/site-description` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/site-description` block on the server.
 *
 * @return string The render.
 */
function render_block_core_site_description() {
	return sprintf( '<p>%s</p>', get_bloginfo( 'description' ) );
}

/**
 * Registers the `core/site-description` block on the server.
 */
function register_block_core_site_description() {
	register_block_type(
		'core/site-description',
		array(
			'attributes'      => array(
				'className'             => array(
					'type'    => 'string',
					'default' => '',
				),
				'align'                 => array(
					'type'    => 'string',
				),
				'textAlign'             => array(
					'type'    => 'string',
					'default' => 'center',
				),
				'textColor'             => array(
					'type' => 'string',
				),
				'customTextColor'       => array(
					'type' => 'string',
				),
				'backgroundColor'       => array(
					'type' => 'string',
				),
				'customBackgroundColor' => array(
					'type' => 'string',
				),
				'fontSize'              => array(
					'type'    => 'string',
				),
				'customFontSize'        => array(
					'type' => 'number',
				),
			),
		'render_callback' => 'render_block_core_site_description',
		)
	);
}
add_action( 'init', 'register_block_core_site_description' );
