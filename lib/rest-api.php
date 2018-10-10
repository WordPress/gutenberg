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
 * Registers the REST API routes needed by the Gutenberg editor.
 *
 * @since 2.8.0
 */
function gutenberg_register_rest_routes() {
	$controller = new WP_REST_Block_Renderer_Controller();
	$controller->register_routes();

	/**
	 * Filters the search handlers to use in the REST search controller.
	 *
	 * @since 3.3.0
	 *
	 * @param array $search_handlers List of search handlers to use in the controller. Each search
	 *                               handler instance must extend the `WP_REST_Search_Handler` class.
	 *                               Default is only a handler for posts.
	 */
	$search_handlers = apply_filters( 'wp_rest_search_handlers', array( new WP_REST_Post_Search_Handler() ) );

	$controller = new WP_REST_Search_Controller( $search_handlers );
	$controller->register_routes();

	foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
		$class = ! empty( $post_type->rest_controller_class ) ? $post_type->rest_controller_class : 'WP_REST_Posts_Controller';

		// Check if the class exists and is a subclass of WP_REST_Controller.
		if ( ! is_subclass_of( $class, 'WP_REST_Controller' ) ) {
			continue;
		}

		// Initialize the Autosaves controller.
		$autosaves_controller = new WP_REST_Autosaves_Controller( $post_type->name );
		$autosaves_controller->register_routes();
	}

	$themes_controller = new WP_REST_Themes_Controller();
	$themes_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_routes' );

/**
 * Make sure oEmbed REST Requests apply the WP Embed security mechanism for WordPress embeds.
 *
 * @see  https://core.trac.wordpress.org/ticket/32522
 *
 * TODO: This is a temporary solution. Next step would be to edit the WP_oEmbed_Controller,
 * once merged into Core.
 *
 * @since 2.3.0
 *
 * @param  WP_HTTP_Response|WP_Error $response The REST Request response.
 * @param  WP_REST_Server            $handler  ResponseHandler instance (usually WP_REST_Server).
 * @param  WP_REST_Request           $request  Request used to generate the response.
 * @return WP_HTTP_Response|object|WP_Error    The REST Request response.
 */
function gutenberg_filter_oembed_result( $response, $handler, $request ) {
	if ( 'GET' !== $request->get_method() ) {
		return $response;
	}

	if ( is_wp_error( $response ) && 'oembed_invalid_url' !== $response->get_error_code() ) {
		return $response;
	}

	// External embeds.
	if ( '/oembed/1.0/proxy' === $request->get_route() ) {
		if ( is_wp_error( $response ) ) {
			// It's possibly a local post, so lets try and retrieve it that way.
			$post_id = url_to_postid( $_GET['url'] );
			$data    = get_oembed_response_data( $post_id, apply_filters( 'oembed_default_width', 600 ) );

			if ( $data ) {
				// It's a local post!
				$response = (object) $data;
			} else {
				// Try using a classic embed, instead.
				global $wp_embed;
				$html = $wp_embed->shortcode( array(), $_GET['url'] );
				if ( $html ) {
					global $wp_scripts;
					// Check if any scripts were enqueued by the shortcode, and
					// include them in the response.
					$enqueued_scripts = array();
					foreach ( $wp_scripts->queue as $script ) {
						$enqueued_scripts[] = $wp_scripts->registered[ $script ]->src;
					}
					return array(
						'provider_name' => __( 'Embed Handler', 'gutenberg' ),
						'html'          => $html,
						'scripts'       => $enqueued_scripts,
					);
				}
			}
		}

		// Make sure the HTML is run through the oembed sanitisation routines.
		$response->html = wp_oembed_get( $_GET['url'], $_GET );
	}

	return $response;
}
add_filter( 'rest_request_after_callbacks', 'gutenberg_filter_oembed_result', 10, 3 );

/**
 * Add additional 'visibility' rest api field to taxonomies.
 *
 * Used so private taxonomies are not displayed in the UI.
 *
 * @see https://core.trac.wordpress.org/ticket/42707
 */
function gutenberg_add_taxonomy_visibility_field() {
	register_rest_field(
		'taxonomy',
		'visibility',
		array(
			'get_callback' => 'gutenberg_get_taxonomy_visibility_data',
			'schema'       => array(
				'description' => __( 'The visibility settings for the taxonomy.', 'gutenberg' ),
				'type'        => 'object',
				'context'     => array( 'edit' ),
				'readonly'    => true,
				'properties'  => array(
					'public'             => array(
						'description' => __( 'Whether a taxonomy is intended for use publicly either via the admin interface or by front-end users.', 'gutenberg' ),
						'type'        => 'boolean',
					),
					'publicly_queryable' => array(
						'description' => __( 'Whether the taxonomy is publicly queryable.', 'gutenberg' ),
						'type'        => 'boolean',
					),
					'show_ui'            => array(
						'description' => __( 'Whether to generate a default UI for managing this taxonomy.', 'gutenberg' ),
						'type'        => 'boolean',
					),
					'show_admin_column'  => array(
						'description' => __( 'Whether to allow automatic creation of taxonomy columns on associated post-types table.', 'gutenberg' ),
						'type'        => 'boolean',
					),
					'show_in_nav_menus'  => array(
						'description' => __( 'Whether to make the taxonomy available for selection in navigation menus.', 'gutenberg' ),
						'type'        => 'boolean',
					),
					'show_in_quick_edit' => array(
						'description' => __( 'Whether to show the taxonomy in the quick/bulk edit panel.', 'gutenberg' ),
						'type'        => 'boolean',
					),
				),
			),
		)
	);
}

/**
 * Gets taxonomy visibility property data.
 *
 * @see https://core.trac.wordpress.org/ticket/42707
 *
 * @param array $object Taxonomy data from REST API.
 * @return array Array of taxonomy visibility data.
 */
function gutenberg_get_taxonomy_visibility_data( $object ) {
	// Just return existing data for up-to-date Core.
	if ( isset( $object['visibility'] ) ) {
		return $object['visibility'];
	}

	$taxonomy = get_taxonomy( $object['slug'] );

	return array(
		'public'             => $taxonomy->public,
		'publicly_queryable' => $taxonomy->publicly_queryable,
		'show_ui'            => $taxonomy->show_ui,
		'show_admin_column'  => $taxonomy->show_admin_column,
		'show_in_nav_menus'  => $taxonomy->show_in_nav_menus,
		'show_in_quick_edit' => $taxonomy->show_ui,
	);
}

add_action( 'rest_api_init', 'gutenberg_add_taxonomy_visibility_field' );

/**
 * Add a permalink template to posts in the post REST API response.
 *
 * @see https://core.trac.wordpress.org/ticket/45017
 *
 * @param WP_REST_Response $response WP REST API response of a post.
 * @param WP_Post          $post The post being returned.
 * @param WP_REST_Request  $request WP REST API request.
 * @return WP_REST_Response Response containing the permalink_template.
 */
function gutenberg_add_permalink_template_to_posts( $response, $post, $request ) {
	if ( 'edit' !== $request['context'] ) {
		return $response;
	}

	if ( ! function_exists( 'get_sample_permalink' ) ) {
		require_once ABSPATH . '/wp-admin/includes/post.php';
	}

	$sample_permalink = get_sample_permalink( $post->ID, $post->post_title, '' );

	$response->data['permalink_template'] = $sample_permalink[0];
	$response->data['generated_slug']     = $sample_permalink[1];

	return $response;
}

/**
 * Add the block format version to post content in the post REST API response.
 *
 * @todo This will need to be registered to the schema too.
 *
 * @see https://core.trac.wordpress.org/ticket/43887
 *
 * @param WP_REST_Response $response WP REST API response of a post.
 * @param WP_Post          $post The post being returned.
 * @param WP_REST_Request  $request WP REST API request.
 * @return WP_REST_Response Response containing the block_format.
 */
function gutenberg_add_block_format_to_post_content( $response, $post, $request ) {
	if ( 'edit' !== $request['context'] ) {
		return $response;
	}

	$response_data = $response->get_data();
	if ( isset( $response_data['content'] ) && is_array( $response_data['content'] ) && isset( $response_data['content']['raw'] ) ) {
		$response_data['content']['block_format'] = gutenberg_content_block_version( $response_data['content']['raw'] );
		$response->set_data( $response_data );
	}

	return $response;
}

/**
 * Include target schema attributes to links, based on whether the user can.
 *
 * @see https://core.trac.wordpress.org/ticket/45014
 *
 * @param WP_REST_Response $response WP REST API response of a post.
 * @param WP_Post          $post The post being returned.
 * @param WP_REST_Request  $request WP REST API request.
 * @return WP_REST_Response Response containing the new links.
 */
function gutenberg_add_target_schema_to_links( $response, $post, $request ) {
	$new_links  = array();
	$orig_links = $response->get_links();
	$post_type  = get_post_type_object( $post->post_type );
	$orig_href  = ! empty( $orig_links['self'][0]['href'] ) ? $orig_links['self'][0]['href'] : null;
	if ( 'edit' === $request['context'] && current_user_can( 'unfiltered_html' ) ) {
		$new_links['https://api.w.org/action-unfiltered-html'] = array(
			array(
				'title'        => __( 'The current user can post HTML markup and JavaScript.', 'gutenberg' ),
				'href'         => $orig_href,
				'targetSchema' => array(
					'type'       => 'object',
					'properties' => array(
						'unfiltered_html' => array(
							'type' => 'boolean',
						),
					),
				),
			),
		);
	}

	$response->add_links( $new_links );
	return $response;
}

/**
 * Whenever a post type is registered, ensure we're hooked into it's WP REST API response.
 *
 * @param string $post_type The newly registered post type.
 * @return string That same post type.
 */
function gutenberg_register_post_prepare_functions( $post_type ) {
	add_filter( "rest_prepare_{$post_type}", 'gutenberg_add_permalink_template_to_posts', 10, 3 );
	add_filter( "rest_prepare_{$post_type}", 'gutenberg_add_block_format_to_post_content', 10, 3 );
	add_filter( "rest_prepare_{$post_type}", 'gutenberg_add_target_schema_to_links', 10, 3 );
	add_filter( "rest_{$post_type}_collection_params", 'gutenberg_filter_post_collection_parameters', 10, 2 );
	add_filter( "rest_{$post_type}_query", 'gutenberg_filter_post_query_arguments', 10, 2 );
	return $post_type;
}
add_filter( 'registered_post_type', 'gutenberg_register_post_prepare_functions' );

/**
 * Whenever a taxonomy is registered, ensure we're hooked into its WP REST API response.
 *
 * @param string $taxonomy The newly registered taxonomy.
 */
function gutenberg_register_taxonomy_prepare_functions( $taxonomy ) {
	add_filter( "rest_{$taxonomy}_collection_params", 'gutenberg_filter_term_collection_parameters', 10, 2 );
	add_filter( "rest_{$taxonomy}_query", 'gutenberg_filter_term_query_arguments', 10, 2 );
}
add_filter( 'registered_taxonomy', 'gutenberg_register_taxonomy_prepare_functions' );

/**
 * Ensure that the wp-json index contains the 'theme-supports' setting as
 * part of its site info elements.
 *
 * @see https://core.trac.wordpress.org/ticket/45016
 *
 * @param WP_REST_Response $response WP REST API response of the wp-json index.
 * @return WP_REST_Response Response that contains theme-supports.
 */
function gutenberg_ensure_wp_json_has_theme_supports( $response ) {
	$site_info = $response->get_data();
	if ( ! array_key_exists( 'theme_supports', $site_info ) ) {
		$site_info['theme_supports'] = array();
	}
	if ( ! array_key_exists( 'formats', $site_info['theme_supports'] ) ) {
		$formats = get_theme_support( 'post-formats' );
		$formats = is_array( $formats ) ? array_values( $formats[0] ) : array();
		$formats = array_merge( array( 'standard' ), $formats );

		$site_info['theme_supports']['formats'] = $formats;
	}
	if ( ! array_key_exists( 'post-thumbnails', $site_info['theme_supports'] ) ) {
		$post_thumbnails = get_theme_support( 'post-thumbnails' );
		if ( $post_thumbnails ) {
			// $post_thumbnails can contain a nested array of post types.
			// e.g. array( array( 'post', 'page' ) ).
			$site_info['theme_supports']['post-thumbnails'] = is_array( $post_thumbnails ) ? $post_thumbnails[0] : true;
		}
	}
	$response->set_data( $site_info );
	return $response;
}
add_filter( 'rest_index', 'gutenberg_ensure_wp_json_has_theme_supports' );

/**
 * Handle any necessary checks early.
 *
 * @param WP_HTTP_Response $response Result to send to the client. Usually a WP_REST_Response.
 * @param WP_REST_Server   $handler  ResponseHandler instance (usually WP_REST_Server).
 * @param WP_REST_Request  $request  Request used to generate the response.
 */
function gutenberg_handle_early_callback_checks( $response, $handler, $request ) {
	if ( 0 === strpos( $request->get_route(), '/wp/v2/' ) ) {
		$can_unbounded_query = false;
		$types               = get_post_types( array( 'show_in_rest' => true ), 'objects' );
		foreach ( $types as $type ) {
			if ( current_user_can( $type->cap->edit_posts ) ) {
				$can_unbounded_query = true;
			}
		}
		if ( $request['per_page'] < 0 ) {
			if ( ! $can_unbounded_query ) {
				return new WP_Error( 'rest_forbidden_per_page', __( 'Sorry, you are not allowed make unbounded queries.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
			}
		}
	}
	return $response;
}
add_filter( 'rest_request_before_callbacks', 'gutenberg_handle_early_callback_checks', 10, 3 );

/**
 * Include additional query parameters on the posts query endpoint.
 *
 * @see https://core.trac.wordpress.org/ticket/43998
 *
 * @param array        $query_params JSON Schema-formatted collection parameters.
 * @param WP_Post_Type $post_type    Post type object being accessed.
 * @return array
 */
function gutenberg_filter_post_collection_parameters( $query_params, $post_type ) {
	if (
		isset( $query_params['per_page'] ) &&
		( $post_type->hierarchical || 'wp_block' === $post_type->name )
	) {
		// Change from '1' to '-1', which means unlimited.
		$query_params['per_page']['minimum'] = -1;
		// Default sanitize callback is 'absint', which won't work in our case.
		$query_params['per_page']['sanitize_callback'] = 'rest_sanitize_request_arg';
	}
	return $query_params;
}

/**
 * Filter post collection query parameters to include specific behavior.
 *
 * @see https://core.trac.wordpress.org/ticket/43998
 *
 * @param array           $prepared_args Array of arguments for WP_Query.
 * @param WP_REST_Request $request       The current request.
 * @return array
 */
function gutenberg_filter_post_query_arguments( $prepared_args, $request ) {
	if (
		is_post_type_hierarchical( $prepared_args['post_type'] ) ||
		'wp_block' === $prepared_args['post_type']
	) {
		// Avoid triggering 'rest_post_invalid_page_number' error
		// which will need to be addressed in https://core.trac.wordpress.org/ticket/43998.
		if ( -1 === $prepared_args['posts_per_page'] ) {
			$prepared_args['posts_per_page'] = 100000;
		}
	}
	return $prepared_args;
}

/**
 * Include additional query parameters on the terms query endpoint.
 *
 * @see https://core.trac.wordpress.org/ticket/43998
 *
 * @param array  $query_params JSON Schema-formatted collection parameters.
 * @param object $taxonomy     Taxonomy being accessed.
 * @return array
 */
function gutenberg_filter_term_collection_parameters( $query_params, $taxonomy ) {
	if ( $taxonomy->show_in_rest
		&& ( false === $taxonomy->rest_controller_class
			|| 'WP_REST_Terms_Controller' === $taxonomy->rest_controller_class )
		&& isset( $query_params['per_page'] ) ) {
		// Change from '1' to '-1', which means unlimited.
		$query_params['per_page']['minimum'] = -1;
		// Default sanitize callback is 'absint', which won't work in our case.
		$query_params['per_page']['sanitize_callback'] = 'rest_sanitize_request_arg';
	}
	return $query_params;
}

/**
 * Filter term collection query parameters to include specific behavior.
 *
 * @see https://core.trac.wordpress.org/ticket/43998
 *
 * @param array           $prepared_args Array of arguments for WP_Term_Query.
 * @param WP_REST_Request $request       The current request.
 * @return array
 */
function gutenberg_filter_term_query_arguments( $prepared_args, $request ) {
	// Can't check the actual taxonomy here because it's not
	// passed through in $prepared_args (or the filter generally).
	if ( 0 === strpos( $request->get_route(), '/wp/v2/' ) ) {
		if ( -1 === $prepared_args['number'] ) {
			// This should be unset( $prepared_args['number'] )
			// but WP_REST_Terms Controller needs to be updated to support
			// unbounded queries.
			// Will be addressed in https://core.trac.wordpress.org/ticket/43998.
			$prepared_args['number'] = 100000;
		}
	}
	return $prepared_args;
}

/**
 * Include additional query parameters on the user query endpoint.
 *
 * @see https://core.trac.wordpress.org/ticket/43998
 *
 * @param array $query_params JSON Schema-formatted collection parameters.
 * @return array
 */
function gutenberg_filter_user_collection_parameters( $query_params ) {
	if ( isset( $query_params['per_page'] ) ) {
		// Change from '1' to '-1', which means unlimited.
		$query_params['per_page']['minimum'] = -1;
		// Default sanitize callback is 'absint', which won't work in our case.
		$query_params['per_page']['sanitize_callback'] = 'rest_sanitize_request_arg';
	}
	return $query_params;
}
add_filter( 'rest_user_collection_params', 'gutenberg_filter_user_collection_parameters' );
