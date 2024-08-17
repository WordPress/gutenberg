<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

if ( ! function_exists( 'wp_api_template_access_controller' ) ) {
	/**
	 * Hook in to the template and template part post types and modify the
	 * access control for the rest endpoint to allow lower user roles to access
	 * the templates and template parts.
	 *
	 * @param array  $args Current registered post type args.
	 * @param string $post_type Name of post type.
	 *
	 * @return array
	 */
	function wp_api_template_access_controller( $args, $post_type ) {
		if ( 'wp_template' === $post_type || 'wp_template_part' === $post_type ) {
			$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller_6_6';
		}
		return $args;
	}
}
add_filter( 'register_post_type_args', 'wp_api_template_access_controller', 10, 2 );

/**
 * Adds the post classes to the REST API response.
 *
 * @param  array $post The response object data.
 *
 * @return array
 */
function gutenberg_add_class_list_to_api_response( $post ) {

	if ( ! isset( $post['id'] ) ) {
		return array();
	}

	return get_post_class( array(), $post['id'] );
}

/**
 * Adds the post classes to public post types in the REST API.
 */
function gutenberg_add_class_list_to_public_post_types() {
	$post_types = get_post_types(
		array(
			'public'       => true,
			'show_in_rest' => true,
		),
		'names'
	);

	if ( ! empty( $post_types ) ) {
		register_rest_field(
			$post_types,
			'class_list',
			array(
				'get_callback' => 'gutenberg_add_class_list_to_api_response',
				'schema'       => array(
					'description' => __( 'An array of the class names for the post container element.', 'gutenberg' ),
					'type'        => 'array',
					'items'       => array(
						'type' => 'string',
					),
				),
			)
		);
	}
}
add_action( 'rest_api_init', 'gutenberg_add_class_list_to_public_post_types' );


/**
 * Registers the Global Styles Revisions REST API routes.
 */
function gutenberg_register_global_styles_revisions_endpoints() {
	$global_styles_revisions_controller = new Gutenberg_REST_Global_Styles_Revisions_Controller_6_6();
	$global_styles_revisions_controller->register_routes();
}

add_action( 'rest_api_init', 'gutenberg_register_global_styles_revisions_endpoints' );

if ( ! function_exists( 'gutenberg_register_wp_rest_themes_stylesheet_directory_uri_field' ) ) {
	/**
	 * Adds `stylesheet_uri` fields to WP_REST_Themes_Controller class.
	 */
	function gutenberg_register_wp_rest_themes_stylesheet_directory_uri_field() {
		register_rest_field(
			'theme',
			'stylesheet_uri',
			array(
				'get_callback' => function ( $item ) {
					if ( ! empty( $item['stylesheet'] ) ) {
						$theme         = wp_get_theme( $item['stylesheet'] );
						$current_theme = wp_get_theme();
						if ( $theme->get_stylesheet() === $current_theme->get_stylesheet() ) {
							return get_stylesheet_directory_uri();
						} else {
							return $theme->get_stylesheet_directory_uri();
						}
					}

					return null;
				},
				'schema'       => array(
					'type'        => 'string',
					'description' => __( 'The uri for the theme\'s stylesheet directory.', 'gutenberg' ),
					'format'      => 'uri',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
			)
		);
	}
}
add_action( 'rest_api_init', 'gutenberg_register_wp_rest_themes_stylesheet_directory_uri_field' );

if ( ! function_exists( 'gutenberg_register_wp_rest_themes_template_directory_uri_field' ) ) {
	/**
	 * Adds `template_uri` fields to WP_REST_Themes_Controller class.
	 */
	function gutenberg_register_wp_rest_themes_template_directory_uri_field() {
		register_rest_field(
			'theme',
			'template_uri',
			array(
				'get_callback' => function ( $item ) {
					if ( ! empty( $item['stylesheet'] ) ) {
						$theme         = wp_get_theme( $item['stylesheet'] );
						$current_theme = wp_get_theme();
						if ( $theme->get_stylesheet() === $current_theme->get_stylesheet() ) {
							return get_template_directory_uri();
						} else {
							return $theme->get_template_directory_uri();
						}
					}

					return null;
				},
				'schema'       => array(
					'type'        => 'string',
					'description' => __( 'The uri for the theme\'s template directory. If this is a child theme, this refers to the parent theme, otherwise this is the same as the theme\'s stylesheet directory.', 'gutenberg' ),
					'format'      => 'uri',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
			)
		);
	}
}
add_action( 'rest_api_init', 'gutenberg_register_wp_rest_themes_template_directory_uri_field' );

/**
 * Preload theme and global styles paths to avoid flash of variation styles in post editor.
 *
 * @param array                   $paths REST API paths to preload.
 * @param WP_Block_Editor_Context $context Current block editor context.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_6_6( $paths, $context ) {
	if ( 'core/edit-post' === $context->name ) {
		$paths[] = '/wp/v2/global-styles/themes/' . get_stylesheet();
		$paths[] = '/wp/v2/themes?context=edit&status=active';
		$paths[] = '/wp/v2/global-styles/' . WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id() . '?context=edit';
	}
	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_6_6', 10, 2 );
