<?php
/**
 * REST API Extensions.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers REST field for `available_page_templates` on page resources.
 *
 * @since 0.7.0
 *
 * @return void
 */
function gutenberg_register_available_page_templates_field() {
	register_rest_field( 'page', 'available_page_templates', array(
		'get_callback' => 'gutenberg_get_available_page_templates',
		'schema' => array(
			'description' => __( 'Available templates for a given page.', 'gutenberg' ),
			'type' => 'array',
			'items' => array(
				'type' => 'object',
				'properties' => array(
					'name' => array(
						'type' => 'string',
						'description' => __( 'Template name', 'gutenberg' ),
					),
					'template' => array(
						'type' => 'string',
						'description' => __( 'Template slug', 'gutenberg' ),
					),
				),
			),
			'readonly' => true,
			'context' => array( 'edit' ),
		),
	) );
}
add_action( 'rest_api_init', 'gutenberg_register_available_page_templates_field' );

/**
 * Returns available page templates for a requested page..
 *
 * @since 0.7.0
 * @see gutenberg_register_available_page_templates_field()
 *
 * @param array $page Page data.
 * @return array Available page templates.
 */
function gutenberg_get_available_page_templates( $page ) {
	$available_templates = array();

	// No page templates are available if the post is the page on front. See page_attributes_meta_box().
	if ( intval( get_option( 'page_for_posts' ) ) === $page['id'] ) {
		return array();
	}

	$page_templates = wp_get_theme()->get_page_templates( $page['id'] );
	foreach ( $page_templates as $template => $name ) {
		$available_templates[] = compact( 'name', 'template' );
	}
	return $available_templates;
}
