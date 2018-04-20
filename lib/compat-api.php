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
 * Ensure that the wp-json index contains the `permalink_structure` setting as
 * part of its site info elements.
 *
 * @see https://core.trac.wordpress.org/ticket/42465
 *
 * @param WP_REST_Response $response WP REST API response of the wp-json index.
 * @return WP_REST_Response Response that contains the permalink structure.
 */
function gutenberg_ensure_wp_json_has_permalink_structure( $response ) {
	$site_info = $response->get_data();

	if ( ! array_key_exists( 'permalink_structure', $site_info ) ) {
		$site_info['permalink_structure'] = get_option( 'permalink_structure' );
	}

	$response->set_data( $site_info );

	return $response;
}
add_filter( 'rest_index', 'gutenberg_ensure_wp_json_has_permalink_structure' );

/**
 * Includes the value for the custom field `post_type_capabities` inside the REST API response of user.
 *
 * TODO: This is a temporary solution. Next step would be to edit the WP_REST_Users_Controller,
 * once merged into Core.
 *
 * @since ?
 *
 * @param array           $user An array containing user properties.
 * @param string          $name The name of the custom field.
 * @param WP_REST_Request $request Full details about the REST API request.
 * @return object The Post Type capabilities.
 */
function gutenberg_get_post_type_capabilities( $user, $name, $request ) {
	$post_type = $request->get_param( 'post_type' );
	$value     = new stdClass;

	if ( ! empty( $user['id'] ) && $post_type && post_type_exists( $post_type ) ) {
		// The Post Type object contains the Post Type's specific caps.
		$post_type_object = get_post_type_object( $post_type );

		// Loop in the Post Type's caps to validate the User's caps for it.
		foreach ( $post_type_object->cap as $post_cap => $post_type_cap ) {
			// Ignore caps requiring a post ID.
			if ( in_array( $post_cap, array( 'edit_post', 'read_post', 'delete_post' ) ) ) {
				continue;
			}

			// Set the User's post type capability.
			$value->{$post_cap} = user_can( $user['id'], $post_type_cap );
		}
	}

	return $value;
}

/**
 * Adds the custom field `post_type_capabities` to the REST API response of user.
 *
 * TODO: This is a temporary solution. Next step would be to edit the WP_REST_Users_Controller,
 * once merged into Core.
 *
 * @since ?
 */
function gutenberg_register_rest_api_post_type_capabilities() {
	register_rest_field( 'user',
		'post_type_capabilities',
		array(
			'get_callback' => 'gutenberg_get_post_type_capabilities',
			'schema'       => array(
				'description' => __( 'Post Type capabilities for the user.', 'gutenberg' ),
				'type'        => 'object',
				'context'     => array( 'edit' ),
				'readonly'    => true,
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_rest_api_post_type_capabilities' );

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

			if ( ! $data ) {
				// Not a local post, return the original error.
				return $response;
			}
			$response = (object) $data;
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

	$sample_permalink = get_sample_permalink( $post->ID );

	$response->data['permalink_template'] = $sample_permalink[0];

	if ( 'draft' === $post->post_status && ! $post->post_name ) {
		$response->data['draft_slug'] = $sample_permalink[1];
	}

	return $response;
}

/**
 * Whenever a post type is registered, ensure we're hooked into it's WP REST API response.
 *
 * @param string $post_type The newly registered post type.
 * @return string That same post type.
 */
function gutenberg_register_permalink_template_function( $post_type ) {
	add_filter( "rest_prepare_{$post_type}", 'gutenberg_add_permalink_template_to_posts', 10, 3 );
	return $post_type;
}
add_filter( 'registered_post_type', 'gutenberg_register_permalink_template_function' );

/**
 * Includes the value for the 'viewable' attribute of a post type resource.
 *
 * @see https://core.trac.wordpress.org/ticket/43739
 *
 * @param object $post_type Post type response object.
 * @return boolean Whether or not the post type can be viewed.
 */
function gutenberg_get_post_type_viewable( $post_type ) {
	return is_post_type_viewable( $post_type['slug'] );
}

/**
 * Adds the 'viewable' attribute to the REST API response of a post type.
 *
 * @see https://core.trac.wordpress.org/ticket/43739
 */
function gutenberg_register_rest_api_post_type_viewable() {
	register_rest_field( 'type',
		'viewable',
		array(
			'get_callback' => 'gutenberg_get_post_type_viewable',
			'schema'       => array(
				'description' => __( 'Whether or not the post type can be viewed', 'gutenberg' ),
				'type'        => 'boolean',
				'context'     => array( 'edit' ),
				'readonly'    => true,
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_rest_api_post_type_viewable' );
