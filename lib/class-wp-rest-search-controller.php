<?php
/**
 * REST API: WP_REST_Search_Controller class
 *
 * @package gutenberg
 * @since 2.9.0
 */

/**
 * Core class to search for posts across multiple post types via the REST API.
 *
 * @since 2.9.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Search_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
	 * @since 2.9.0
	 */
	public function __construct() {
		$this->namespace = 'gutenberg/v1';
		$this->rest_base = 'search';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @since 2.9.0
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permission_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to search content.
	 *
	 * @since 2.9.0
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has search access, WP_Error object otherwise.
	 */
	public function get_items_permission_check( $request ) {

		if ( 'edit' === $request['context'] ) {
			$allowed_post_types = $this->get_allowed_post_types( true );

			if ( empty( $allowed_post_types ) ) {
				return new WP_Error( 'rest_forbidden_context', __( 'Sorry, you are not allowed to edit content.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
			}

			if ( 'any' !== $request['type'] ) {
				foreach ( (array) $request['type'] as $post_type ) {
					if ( 'any' !== $post_type && ! in_array( $post_type, $request['type_exclude'], true ) && ! isset( $allowed_post_types[ $post_type ] ) ) {

						/* translators: post type slug */
						return new WP_Error( 'rest_forbidden_context', sprintf( __( 'Sorry, you are not allowed to edit content of type %s.', 'gutenberg' ), $post_type ), array( 'status' => rest_authorization_required_code() ) );
					}
				}
			}
		}

		return true;
	}

	/**
	 * Retrieves a collection of search results.
	 *
	 * @since 2.9.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {

		// Retrieve the list of registered collection query parameters.
		$registered = $this->get_collection_params();
		$query_args = array(
			'post_status'         => array_keys( $this->get_allowed_post_stati() ),
			'post_type'           => $request['type'],
			'ignore_sticky_posts' => true,
		);

		// Transform 'any' into actual post type list.
		if ( in_array( 'any', $request['type'], true ) ) {
			$query_args['post_type'] = array_keys( $this->get_allowed_post_types( 'edit' === $request['context'] ) );
		}

		// Ensure to exclude post types as necessary.
		if ( ! empty( $request['type_exclude'] ) ) {
			$query_args['post_type'] = array_diff( $query_args['post_type'], $request['type_exclude'] );
		}

		/*
		 * This array defines mappings between public API query parameters whose
		 * values are accepted as-passed, and their internal WP_Query parameter
		 * name equivalents (some are the same). Only values which are also
		 * present in $registered will be set.
		 */
		$parameter_mappings = array(
			'page'   => 'paged',
			'search' => 's',
		);

		/*
		 * For each known parameter which is both registered and present in the request,
		 * set the parameter's value on the $query_args.
		 */
		foreach ( $parameter_mappings as $api_param => $wp_param ) {
			if ( isset( $registered[ $api_param ], $request[ $api_param ] ) ) {
				$query_args[ $wp_param ] = $request[ $api_param ];
			}
		}

		// Ensure our per_page parameter overrides any provided posts_per_page filter.
		if ( isset( $registered['per_page'] ) ) {
			$query_args['posts_per_page'] = $request['per_page'];
		}

		$posts_query  = new WP_Query();
		$query_result = $posts_query->query( $query_args );

		// Allow access to all password protected posts if the context is edit.
		if ( 'edit' === $request['context'] ) {
			add_filter( 'post_password_required', '__return_false' );
		}

		$posts = array();

		foreach ( $query_result as $post ) {
			if ( ! $this->check_read_permission( $post ) ) {
				continue;
			}

			$data    = $this->prepare_item_for_response( $post, $request );
			$posts[] = $this->prepare_response_for_collection( $data );
		}

		// Reset filter.
		if ( 'edit' === $request['context'] ) {
			remove_filter( 'post_password_required', '__return_false' );
		}

		$page        = (int) $query_args['paged'];
		$total_posts = $posts_query->found_posts;

		if ( $total_posts < 1 ) {
			// Out-of-bounds, run the query again without LIMIT for total count.
			unset( $query_args['paged'] );

			$count_query = new WP_Query();
			$count_query->query( $query_args );
			$total_posts = $count_query->found_posts;
		}

		$max_pages = ceil( $total_posts / (int) $posts_query->query_vars['posts_per_page'] );

		if ( $page > $max_pages && $total_posts > 0 ) {
			return new WP_Error( 'rest_post_invalid_page_number', __( 'The page number requested is larger than the number of pages available.', 'gutenberg' ), array( 'status' => 400 ) );
		}

		$response = rest_ensure_response( $posts );

		$response->header( 'X-WP-Total', (int) $total_posts );
		$response->header( 'X-WP-TotalPages', (int) $max_pages );

		$request_params = $request->get_query_params();
		$base           = add_query_arg( $request_params, rest_url( sprintf( '%s/%s', $this->namespace, $this->rest_base ) ) );

		if ( $page > 1 ) {
			$prev_page = $page - 1;

			if ( $prev_page > $max_pages ) {
				$prev_page = $max_pages;
			}

			$prev_link = add_query_arg( 'page', $prev_page, $base );
			$response->link_header( 'prev', $prev_link );
		}
		if ( $max_pages > $page ) {
			$next_page = $page + 1;
			$next_link = add_query_arg( 'page', $next_page, $base );

			$response->link_header( 'next', $next_link );
		}

		return $response;
	}

	/**
	 * Checks if a post can be read.
	 *
	 * Correctly handles posts with the inherit status.
	 *
	 * @since 2.9.0
	 *
	 * @param object $post Post object.
	 * @return bool Whether the post can be read.
	 */
	public function check_read_permission( $post ) {

		// Is the post readable?
		if ( 'publish' === $post->post_status ) {
			return true;
		}

		$post_type = get_post_type_object( $post->post_type );
		if ( current_user_can( $post_type->cap->read_post, $post->ID ) ) {
			return true;
		}

		// Can we read the parent if we're inheriting?
		if ( 'inherit' === $post->post_status && $post->post_parent > 0 ) {
			$parent = get_post( $post->post_parent );
			if ( $parent ) {
				return $this->check_read_permission( $parent );
			}
		}

		/*
		 * If there isn't a parent, but the status is set to inherit, assume
		 * it's published (as per get_post_status()).
		 */
		if ( 'inherit' === $post->post_status ) {
			return true;
		}

		return false;
	}

	/**
	 * Prepares a single search result for response.
	 *
	 * @since 2.9.0
	 *
	 * @param WP_Post         $post    Post object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $post, $request ) {

		$GLOBALS['post'] = $post;

		setup_postdata( $post );

		if ( method_exists( $this, 'get_fields_for_response' ) ) {
			$fields = $this->get_fields_for_response( $request );
		} else {
			$schema = $this->get_item_schema();
			$fields = array_keys( $schema['properties'] );
		}

		// Base fields for every post.
		$data = array();

		if ( in_array( 'id', $fields, true ) ) {
			$data['id'] = $post->ID;
		}

		if ( in_array( 'type', $fields, true ) ) {
			$data['type'] = $post->post_type;
		}

		if ( in_array( 'link', $fields, true ) ) {
			$data['link'] = get_permalink( $post->ID );
		}

		if ( in_array( 'title', $fields, true ) ) {
			if ( post_type_supports( $post->post_type, 'title' ) ) {
				add_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );

				$data['title'] = array(
					'raw'      => $post->post_title,
					'rendered' => get_the_title( $post->ID ),
				);

				remove_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );
			} else {
				$data['title'] = array(
					'raw'      => '',
					'rendered' => '',
				);
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		$response->add_links( $this->prepare_links( $post ) );

		return $response;
	}

	/**
	 * Overwrites the default protected title format.
	 *
	 * By default, WordPress will show password protected posts with a title of
	 * "Protected: %s". As the REST API communicates the protected status of a post
	 * in a machine readable format, we remove the "Protected: " prefix.
	 *
	 * @since 2.9.0
	 *
	 * @return string Protected title format.
	 */
	public function protected_title_format() {
		return '%s';
	}

	/**
	 * Retrieves the item schema, conforming to JSON Schema.
	 *
	 * @since 2.9.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'search',
			'type'       => 'object',
			'properties' => array(
				'id'    => array(
					'description' => __( 'Unique identifier for the object.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'link'  => array(
					'description' => __( 'URL to the object.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'uri',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'title' => array(
					'description' => __( 'The title for the object.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit', 'embed' ),
					'properties'  => array(
						'raw'      => array(
							'description' => __( 'Title for the object, as it exists in the database.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'edit' ),
							'readonly'    => true,
						),
						'rendered' => array(
							'description' => __( 'HTML title for the object, transformed for display.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
							'readonly'    => true,
						),
					),
				),
				'type'  => array(
					'description' => __( 'Type of the object.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array_keys( $this->get_allowed_post_types() ),
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Retrieves the query params for the search results collection.
	 *
	 * @since 2.9.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {

		$query_params = parent::get_collection_params();

		$query_params['context']['default'] = 'view';

		$query_params['type'] = array(
			'default'     => 'any',
			'description' => __( 'Limit search results to content of one or more types.', 'gutenberg' ),
			'type'        => 'array',
			'items'       => array(
				'enum' => array_merge( array_keys( $this->get_allowed_post_types() ), array( 'any' ) ),
				'type' => 'string',
			),
		);

		$query_params['type_exclude'] = array(
			'default'     => array(),
			'description' => __( 'Ensure search results exclude content of one or more specific types.', 'gutenberg' ),
			'type'        => 'array',
			'items'       => array(
				'enum' => array_keys( $this->get_allowed_post_types() ),
				'type' => 'string',
			),
		);

		return $query_params;
	}

	/**
	 * Prepares links for the request.
	 *
	 * @since 2.9.0
	 *
	 * @param WP_Post $post Post object.
	 * @return array Links for the given post.
	 */
	protected function prepare_links( $post ) {

		$links = array();

		$item_route = $this->detect_rest_item_route( $post );
		if ( ! empty( $item_route ) ) {
			$links['self'] = array(
				'href'       => rest_url( $item_route ),
				'embeddable' => true,
			);
		}

		$links['collection'] = array(
			'href' => rest_url( sprintf( '%s/%s', $this->namespace, $this->rest_base ) ),
		);

		$links['about'] = array(
			'href' => rest_url( 'wp/v2/types/' . $post->post_type ),
		);

		if ( ! empty( $post->post_author ) ) {
			$links['author'] = array(
				'href'       => rest_url( 'wp/v2/users/' . $post->post_author ),
				'embeddable' => true,
			);
		}

		return $links;
	}

	/**
	 * Attempts to detect the route to access a single item.
	 *
	 * @since 2.9.0
	 *
	 * @param WP_Post $post Post object.
	 * @return string REST route relative to the REST base URI, or empty string if not found.
	 */
	protected function detect_rest_item_route( $post ) {
		$post_type = get_post_type_object( $post->post_type );
		if ( ! $post_type ) {
			return '';
		}

		// It's currently impossible to detect the REST URL from a custom controller.
		if ( ! empty( $post_type->rest_controller_class ) && 'WP_REST_Posts_Controller' !== $post_type->rest_controller_class ) {
			return '';
		}

		$namespace = 'wp/v2';
		$rest_base = ! empty( $post_type->rest_base ) ? $post_type->rest_base : $post_type->name;

		return sprintf( '%s/%s/%d', $namespace, $rest_base, $post->ID );
	}

	/**
	 * Gets the post statuses allowed for search.
	 *
	 * @since 2.9.0
	 *
	 * @return array List of post status objects, keyed by their name.
	 */
	protected function get_allowed_post_stati() {

		$post_stati = get_post_stati( array(
			'public'   => true,
			'internal' => false,
		), 'objects' );

		$post_stati['inherit'] = get_post_status_object( 'inherit' );

		return $post_stati;
	}

	/**
	 * Gets the post types allowed for search.
	 *
	 * @since 2.9.0
	 *
	 * @param bool $editable Optional. Whether to only include post types where the current user
	 *                       has edit access. Default false.
	 * @return array List of post type objects, keyed by their name.
	 */
	protected function get_allowed_post_types( $editable = false ) {

		$post_types = get_post_types( array(
			'public'       => true,
			'show_in_rest' => true,
		), 'objects' );

		if ( $editable ) {
			$allowed = array();

			foreach ( $post_types as $name => $post_type ) {
				if ( ! current_user_can( $post_type->cap->edit_posts ) ) {
					continue;
				}

				$allowed[ $name ] = $post_type;
			}

			return $allowed;
		}

		return $post_types;
	}
}
