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

		// Ensure a search string is set in case the orderby is set to 'relevance'.
		if ( ! empty( $request['orderby'] ) && 'relevance' === $request['orderby'] && empty( $request['search'] ) ) {
			return new WP_Error( 'rest_no_search_term_defined', __( 'You need to define a search term to order by relevance.', 'gutenberg' ), array( 'status' => 400 ) );
		}

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
			'author'  => 'author__in',
			'order'   => 'order',
			'orderby' => 'orderby',
			'page'    => 'paged',
			'search'  => 's',
			'slug'    => 'post_name__in',
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

		$orderby_mappings = array(
			'id'   => 'ID',
			'slug' => 'name',
		);

		if ( ! empty( $query_args['orderby'] ) && isset( $orderby_mappings[ $query_args['orderby'] ] ) ) {
			$query_args['orderby'] = $orderby_mappings[ $query_args['orderby'] ];
		}

		// Check for & assign any parameters which require special handling or setting.
		$query_args['date_query'] = array();

		// Set before into date query. Date query must be specified as an array of an array.
		if ( isset( $registered['before'], $request['before'] ) ) {
			$query_args['date_query'][0]['before'] = $request['before'];
		}

		// Set after into date query. Date query must be specified as an array of an array.
		if ( isset( $registered['after'], $request['after'] ) ) {
			$query_args['date_query'][0]['after'] = $request['after'];
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

		$fields = $this->get_fields_for_response( $request );

		// Base fields for every post.
		$data = array();

		if ( in_array( 'id', $fields, true ) ) {
			$data['id'] = $post->ID;
		}

		if ( in_array( 'date', $fields, true ) ) {
			$data['date'] = $this->prepare_date_response( $post->post_date_gmt, $post->post_date );
		}

		if ( in_array( 'date_gmt', $fields, true ) ) {
			// For drafts, `post_date_gmt` may not be set, indicating that the
			// date of the draft should be updated each time it is saved (see
			// #38883).  In this case, shim the value based on the `post_date`
			// field with the site's timezone offset applied.
			if ( '0000-00-00 00:00:00' === $post->post_date_gmt ) {
				$post_date_gmt = get_gmt_from_date( $post->post_date );
			} else {
				$post_date_gmt = $post->post_date_gmt;
			}
			$data['date_gmt'] = $this->prepare_date_response( $post_date_gmt );
		}

		if ( in_array( 'guid', $fields, true ) ) {
			$data['guid'] = array(
				/** This filter is documented in wp-includes/post-template.php */
				'rendered' => apply_filters( 'get_the_guid', $post->guid, $post->ID ),
				'raw'      => $post->guid,
			);
		}

		if ( in_array( 'modified', $fields, true ) ) {
			$data['modified'] = $this->prepare_date_response( $post->post_modified_gmt, $post->post_modified );
		}

		if ( in_array( 'modified_gmt', $fields, true ) ) {
			// For drafts, `post_modified_gmt` may not be set (see
			// `post_date_gmt` comments above).  In this case, shim the value
			// based on the `post_modified` field with the site's timezone
			// offset applied.
			if ( '0000-00-00 00:00:00' === $post->post_modified_gmt ) {
				$post_modified_gmt = date( 'Y-m-d H:i:s', strtotime( $post->post_modified ) - ( get_option( 'gmt_offset' ) * 3600 ) );
			} else {
				$post_modified_gmt = $post->post_modified_gmt;
			}
			$data['modified_gmt'] = $this->prepare_date_response( $post_modified_gmt );
		}

		if ( in_array( 'slug', $fields, true ) ) {
			$data['slug'] = $post->post_name;
		}

		if ( in_array( 'status', $fields, true ) ) {
			$data['status'] = $post->post_status;
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

		if ( in_array( 'content', $fields, true ) ) {
			if ( post_type_supports( $post->post_type, 'editor' ) ) {
				/** This filter is documented in wp-includes/post-template.php */
				$content         = apply_filters( 'the_content', $post->post_content );
				$data['content'] = array(
					'raw'       => $post->post_content,
					'rendered'  => post_password_required( $post ) ? '' : $content,
					'protected' => (bool) $post->post_password,
				);
			} else {
				$data['content'] = array(
					'raw'       => '',
					'rendered'  => '',
					'protected' => false,
				);
			}
		}

		if ( in_array( 'excerpt', $fields, true ) ) {
			if ( post_type_supports( $post->post_type, 'excerpt' ) ) {
				/** This filter is documented in wp-includes/post-template.php */
				$excerpt         = apply_filters( 'the_excerpt', apply_filters( 'get_the_excerpt', $post->post_excerpt, $post ) );
				$data['excerpt'] = array(
					'raw'       => $post->post_excerpt,
					'rendered'  => post_password_required( $post ) ? '' : $excerpt,
					'protected' => (bool) $post->post_password,
				);
			} else {
				$data['excerpt'] = array(
					'raw'       => '',
					'rendered'  => '',
					'protected' => false,
				);
			}
		}

		if ( in_array( 'author', $fields, true ) ) {
			if ( post_type_supports( $post->post_type, 'author' ) ) {
				$data['author'] = (int) $post->post_author;
			} else {
				$data['author'] = 0;
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
	 * Checks the post_date_gmt or modified_gmt and prepare any post or
	 * modified date for single post output.
	 *
	 * @since 2.9.0
	 *
	 * @param string      $date_gmt GMT publication time.
	 * @param string|null $date     Optional. Local publication time. Default null.
	 * @return string|null ISO8601/RFC3339 formatted datetime.
	 */
	protected function prepare_date_response( $date_gmt, $date = null ) {
		// Use the date if passed.
		if ( isset( $date ) ) {
			return mysql_to_rfc3339( $date );
		}

		// Return null if $date_gmt is empty/zeros.
		if ( '0000-00-00 00:00:00' === $date_gmt ) {
			return null;
		}

		// Return the formatted datetime.
		return mysql_to_rfc3339( $date_gmt );
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
				'author'       => array(
					'description' => __( 'The ID for the author of the object.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'content'      => array(
					'description' => __( 'The content for the object.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
						'raw'       => array(
							'description' => __( 'Content for the object, as it exists in the database.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'edit' ),
							'readonly'    => true,
						),
						'rendered'  => array(
							'description' => __( 'HTML content for the object, transformed for display.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
							'readonly'    => true,
						),
						'protected' => array(
							'description' => __( 'Whether the content is protected with a password.', 'gutenberg' ),
							'type'        => 'boolean',
							'context'     => array( 'view', 'edit', 'embed' ),
							'readonly'    => true,
						),
					),
				),
				'date'         => array(
					'description' => __( "The date the object was published, in the site's timezone.", 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'date_gmt'     => array(
					'description' => __( 'The date the object was published, as GMT.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'excerpt'      => array(
					'description' => __( 'The excerpt for the object.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit', 'embed' ),
					'properties'  => array(
						'raw'       => array(
							'description' => __( 'Excerpt for the object, as it exists in the database.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'edit' ),
							'readonly'    => true,
						),
						'rendered'  => array(
							'description' => __( 'HTML excerpt for the object, transformed for display.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
							'readonly'    => true,
						),
						'protected' => array(
							'description' => __( 'Whether the excerpt is protected with a password.', 'gutenberg' ),
							'type'        => 'boolean',
							'context'     => array( 'view', 'edit', 'embed' ),
							'readonly'    => true,
						),
					),
				),
				'guid'         => array(
					'description' => __( 'The globally unique identifier for the object.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
					'properties'  => array(
						'raw'      => array(
							'description' => __( 'GUID for the object, as it exists in the database.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'edit' ),
							'readonly'    => true,
						),
						'rendered' => array(
							'description' => __( 'GUID for the object, transformed for display.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
							'readonly'    => true,
						),
					),
				),
				'id'           => array(
					'description' => __( 'Unique identifier for the object.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'link'         => array(
					'description' => __( 'URL to the object.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'uri',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'modified'     => array(
					'description' => __( "The date the object was last modified, in the site's timezone.", 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'modified_gmt' => array(
					'description' => __( 'The date the object was last modified, as GMT.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'slug'         => array(
					'description' => __( 'An alphanumeric identifier for the object unique to its type.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'status'       => array(
					'description' => __( 'A named status for the object.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array_keys( $this->get_allowed_post_stati() ),
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'title'        => array(
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
				'type'         => array(
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

		$query_params['after'] = array(
			'description' => __( 'Limit search results to content published after a given ISO8601 compliant date.', 'gutenberg' ),
			'type'        => 'string',
			'format'      => 'date-time',
		);

		$query_params['author'] = array(
			'description' => __( 'Limit search results to content assigned to specific authors.', 'gutenberg' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'integer',
			),
			'default'     => array(),
		);

		$query_params['before'] = array(
			'description' => __( 'Limit search results to content published before a given ISO8601 compliant date.', 'gutenberg' ),
			'type'        => 'string',
			'format'      => 'date-time',
		);

		$query_params['order'] = array(
			'description' => __( 'Order sort attribute ascending or descending.', 'gutenberg' ),
			'type'        => 'string',
			'default'     => 'desc',
			'enum'        => array( 'asc', 'desc' ),
		);

		$query_params['orderby'] = array(
			'description' => __( 'Sort collection by object attribute.', 'gutenberg' ),
			'type'        => 'string',
			'default'     => 'date',
			'enum'        => array(
				'author',
				'date',
				'id',
				'modified',
				'relevance',
				'slug',
				'title',
			),
		);

		$query_params['slug'] = array(
			'description'       => __( 'Limit search results to content with one or more specific slugs.', 'gutenberg' ),
			'type'              => 'array',
			'items'             => array(
				'type' => 'string',
			),
			'sanitize_callback' => 'wp_parse_slug_list',
		);

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
				'href' => rest_url( $item_route ),
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
