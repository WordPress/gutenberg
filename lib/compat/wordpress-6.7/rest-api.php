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
 * Updates comment metadata from a REST API request.
 *
 * This function is hooked to the `rest_prepare_comment` filter and is responsible for updating the comment metadata based on the data provided in the REST API request.
 *
 * It performs the following tasks:
 * - Updates the `block_comment` metadata for the comment based on the `meta` field in the request.
 * - Updates the `comment_type` and `comment_approved` fields for the comment based on the corresponding fields in the request.
 * - Retrieves the author's avatar URLs and adds them to the response data.
 * - Retrieves the `block_comment` metadata for the comment and adds it to the response data.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Comment       $comment  The comment object.
 * @param WP_REST_Request  $request  The request object.
 * @return WP_REST_Response The updated response object.
 */
if ( ! function_exists( 'update_comment_meta_from_rest_request_6_7' ) ) {
	function update_comment_meta_from_rest_request_6_7( $response, $comment, $request ) {

		if ( isset( $request['comment_type'] ) && ! empty( $request['comment_type'] ) ) {
			$comment_data = array(
				'comment_ID'       => $comment->comment_ID,
				'comment_type'     => $request['comment_type'],
				'comment_approved' => isset( $request['comment_approved'] ) ? $request['comment_approved'] : 0,
			);

			wp_update_comment( $comment_data );
		}

		if ( $response->data['author'] ) {
			$avatar_url                           = get_avatar_url( $response->data['author'] );
			$response->data['author_avatar_urls'] = array(
				'default' => $avatar_url,
				'48'      => add_query_arg( 's', 48, $avatar_url ),
				'96'      => add_query_arg( 's', 96, $avatar_url ),
			);
		}

		return $response;
	}
}
add_filter( 'rest_prepare_comment', 'update_comment_meta_from_rest_request_6_7', 10, 3 );
