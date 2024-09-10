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

/**
 * Update the preload paths registered in Core (`site-editor.php` or `edit-form-blocks.php`).
 *
 * @param array                   $paths REST API paths to preload.
 * @param WP_Block_Editor_Context $context Current block editor context.
 * @return array Filtered preload paths.
 */
function gutenberg_block_editor_preload_paths_6_7( $paths, $context ) {
	if ( 'core/edit-site' === $context->name ) {
		// Fixes post type name. It should be `type/wp_template_part`.
		$parts_key = array_search( '/wp/v2/types/wp_template-part?context=edit', $paths, true );
		if ( false !== $parts_key ) {
			$paths[ $parts_key ] = '/wp/v2/types/wp_template_part?context=edit';
		}

		$page_options_path = array( rest_get_route_for_post_type_items( 'page' ), 'OPTIONS' );
		$page_options_key  = array_search( $page_options_path, $paths, true );
		if ( false === $page_options_key ) {
			$paths[] = $page_options_path;
		}
	}

	if ( 'core/edit-post' === $context->name ) {
		$reusable_blocks_key = array_search(
			add_query_arg(
				array(
					'context'  => 'edit',
					'per_page' => -1,
				),
				rest_get_route_for_post_type_items( 'wp_block' )
			),
			$paths,
			true
		);

		if ( false !== $reusable_blocks_key ) {
			unset( $paths[ $reusable_blocks_key ] );
		}
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_6_7', 10, 2 );

if ( ! function_exists( 'wp_api_template_registry' ) ) {
	/**
	 * Hook in to the template and template part post types and modify the rest
	 * endpoint to include modifications to read templates from the
	 * BlockTemplatesRegistry.
	 *
	 * @param array  $args Current registered post type args.
	 * @param string $post_type Name of post type.
	 *
	 * @return array
	 */
	function wp_api_template_registry( $args, $post_type ) {
		if ( 'wp_template' === $post_type || 'wp_template_part' === $post_type ) {
			$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller_6_7';
		}
		return $args;
	}
}
add_filter( 'register_post_type_args', 'wp_api_template_registry', 10, 2 );

/**
 * Adds `plugin` fields to WP_REST_Templates_Controller class.
 */
function gutenberg_register_wp_rest_templates_controller_plugin_field() {

	register_rest_field(
		'wp_template',
		'plugin',
		array(
			'get_callback'    => function ( $template_object ) {
				if ( $template_object ) {
					$registered_template = WP_Block_Templates_Registry::get_instance()->get_by_slug( $template_object['slug'] );
					if ( $registered_template ) {
						return $registered_template->plugin;
					}
				}

				return;
			},
			'update_callback' => null,
			'schema'          => array(
				'type'        => 'string',
				'description' => __( 'Plugin that registered the template.', 'gutenberg' ),
				'readonly'    => true,
				'context'     => array( 'view', 'edit', 'embed' ),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_wp_rest_templates_controller_plugin_field' );

/**
 * Overrides the default 'WP_REST_Server' class.
 *
 * @return string The name of the custom server class.
 */
function gutenberg_override_default_rest_server() {
	return 'Gutenberg_REST_Server';
}
add_filter( 'wp_rest_server_class', 'gutenberg_override_default_rest_server', 1 );

/**
 * Updates the comment type in the REST API for WordPress version 6.7.
 *
 * This function is used as a filter callback for the 'rest_pre_insert_comment' hook.
 * It checks if the 'comment_type' parameter is set to 'block_comment' in the REST API request,
 * and if so, updates the 'comment_type' and 'comment_approved' properties of the prepared comment.
 *
 * @param array $prepared_comment The prepared comment data.
 * @param WP_REST_Request $request The REST API request object.
 * @return array The updated prepared comment data.
 */
if ( ! function_exists( 'update_comment_type_in_rest_api_6_7' ) && gutenberg_is_experiment_enabled( 'gutenberg-block-comment' ) ) {
	function update_comment_type_in_rest_api_6_7( $prepared_comment, $request ) {
		if ( ! empty( $request['comment_type'] ) && 'block_comment' === $request['comment_type'] ) {
			$prepared_comment['comment_type']     = $request['comment_type'];
			$prepared_comment['comment_approved'] = $request['comment_approved'];
		}

		return $prepared_comment;
	}
	add_filter( 'rest_pre_insert_comment', 'update_comment_type_in_rest_api_6_7', 10, 2 );
}

/**
 * Updates the comment type for avatars in the WordPress REST API.
 *
 * This function adds the 'block_comment' type to the list of comment types
 * for which avatars should be retrieved in the WordPress REST API.
 *
 * @param array $comment_type The array of comment types.
 * @return array The updated array of comment types.
 */
if ( ! function_exists( 'update_get_avatar_comment_type' ) && gutenberg_is_experiment_enabled( 'gutenberg-block-comment' ) ) {
    function update_get_avatar_comment_type( $comment_type ) {
        
        $comment_type[] = 'block_comment';
        return $comment_type;
        
    }
    add_filter( 'get_avatar_comment_types', 'update_get_avatar_comment_type', 10, 1 );
}

/**
 * Updates the comment type filter dropdown options.
 *
 * This function is only defined if the 'gutenberg-block-comment' experiment is enabled and the 'update_comment_type_filter_dropdown' function does not already exist.
 * It returns an array of comment type options for the comment type filter dropdown in the admin area.
 *
 * @return array An associative array of comment type options.
 *               The keys are the comment type slugs and the values are the translated names of the comment types.
 */
if ( ! function_exists( 'update_comment_type_filter_dropdown' ) && gutenberg_is_experiment_enabled( 'gutenberg-block-comment' ) ) {
	function update_comment_type_filter_dropdown() {
		return array(
			'comment' => __( 'Comments' ),
			'block_comment' => __( 'Block Comments' ),
		);
	}
	add_filter( 'admin_comment_types_dropdown', 'update_comment_type_filter_dropdown' );
}
