<?php
/**
 * Overrides Core's wp-includes/rest-api.php and registers the new endpoint for WP 6.3.
 *
 * @package gutenberg
 */

/**
 * Updates `wp_template` and `wp_template_part` post types to use
 * Gutenberg's REST controllers
 *
 * Adds `_edit_link` to the following post type schemata:
 *
 * - wp_global_styles
 * - wp_template
 * - wp_template_part
 * - wp_navigation
 *
 * See https://github.com/WordPress/gutenberg/issues/48065
 *
 * @param array  $args Array of arguments for registering a post type.
 * @param string $post_type Post type key.
 */
function gutenberg_update_templates_template_parts_rest_controller( $args, $post_type ) {
	if ( in_array( $post_type, array( 'wp_template', 'wp_template_part' ), true ) ) {
		$template_edit_link = 'site-editor.php?' . build_query(
			array(
				'postType' => $post_type,
				'postId'   => '%s',
				'canvas'   => 'edit',
			)
		);
		$args['_edit_link'] = $template_edit_link;
	}

	if ( in_array( $post_type, array( 'wp_global_styles' ), true ) ) {
		$args['_edit_link'] = '/site-editor.php?canvas=edit';
	}

	if ( 'wp_navigation' === $post_type ) {
		$navigation_edit_link = 'site-editor.php?' . build_query(
			array(
				'postId'   => '%s',
				'postType' => 'wp_navigation',
				'canvas'   => 'edit',
			)
		);
		$args['_edit_link']   = $navigation_edit_link;
	}

	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_update_templates_template_parts_rest_controller', 10, 2 );

/**
 * Registers the Global Styles Revisions REST API routes.
 */
function gutenberg_register_global_styles_revisions_endpoints() {
	$global_styles_revisions_controller = new Gutenberg_REST_Global_Styles_Revisions_Controller_6_3();
	$global_styles_revisions_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_global_styles_revisions_endpoints' );

/**
 * Registers the Global Styles REST API routes.
 */
function gutenberg_register_global_styles_endpoints() {
	$global_styles_controller = new Gutenberg_REST_Global_Styles_Controller();
	$global_styles_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_global_styles_endpoints' );

/**
 * Add the `modified` value to the `wp_template` schema.
 *
 * @since 6.3.0 Added 'modified' property and response value.
 */
function add_modified_wp_template_schema() {
		register_rest_field(
			array( 'wp_template', 'wp_template_part' ),
			'modified',
			array(
				'schema'       => array(
					'description' => __( "The date the template was last modified, in the site's timezone.", 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'get_callback' => function( $object ) {
					if ( ! empty( $object['wp_id'] ) ) {
						$post = get_post( $object['wp_id'] );
						if ( $post && isset( $post->post_modified ) ) {
							return mysql_to_rfc3339( $post->post_modified );
						}
					}
					return null;
				},
			)
		);
}
add_filter( 'rest_api_init', 'add_modified_wp_template_schema' );

/**
 * Registers the block patterns REST API routes.
 */
function gutenberg_register_rest_block_patterns() {
	$block_patterns = new Gutenberg_REST_Block_Patterns_Controller_6_3();
	$block_patterns->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_block_patterns' );


/**
 * Registers the Navigation Fallbacks REST API routes.
 */
function gutenberg_register_rest_navigation_fallbacks() {
	$editor_settings = new Gutenberg_REST_Navigation_Fallback_Controller();
	$editor_settings->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_navigation_fallbacks' );
