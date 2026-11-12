<?php
/**
 * WordPress 7.3 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Adds the `viewportWidth` value to the `wp_template` schema.
 *
 * The value comes from the `viewportWidth` property of the template's entry in
 * the `customTemplates` of the active theme's `theme.json`. It is `null` when
 * the theme does not set one.
 *
 * @since 7.3.0
 */
function gutenberg_add_viewport_width_wp_template_schema() {
	register_rest_field(
		'wp_template',
		'viewportWidth',
		array(
			'schema'       => array(
				'description' => __( "Width, in pixels, of the viewport used to render the template's preview.", 'gutenberg' ),
				'type'        => array( 'integer', 'null' ),
				'minimum'     => 1,
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
			),
			'get_callback' => static function ( $item ) {
				if ( empty( $item['slug'] ) || empty( $item['theme'] ) ) {
					return null;
				}

				// Only templates of the active theme (or its parent) are described by its theme.json.
				if ( ! in_array( $item['theme'], array( get_stylesheet(), get_template() ), true ) ) {
					return null;
				}

				$custom_templates = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_custom_templates();

				return $custom_templates[ $item['slug'] ]['viewportWidth'] ?? null;
			},
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_add_viewport_width_wp_template_schema' );
