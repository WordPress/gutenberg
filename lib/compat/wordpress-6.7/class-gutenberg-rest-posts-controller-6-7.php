<?php
/**
 * REST API: Gutenberg_REST_Posts_Controller_6_7 class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.7.0
 */

/**
 * Extend the core WP_REST_Posts_Controller class to add support for post formats.
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Posts_Controller_6_7 extends WP_REST_Posts_Controller {
	/**
	 * Post type.
	 *
	 * @since 4.7.0
	 * @var string
	 */
	protected $post_type;

	/**
	 * Retrieves a collection of posts.
	 *
	 * @since 4.7.0
	 * @since 6.7.0 Added support for the `format` query parameter.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		// Ensure a search string is set in case the orderby is set to 'relevance'.
		if ( ! empty( $request['orderby'] ) && 'relevance' === $request['orderby'] && empty( $request['search'] ) ) {
			return new WP_Error(
				'rest_no_search_term_defined',
				__( 'You need to define a search term to order by relevance.' ),
				array( 'status' => 400 )
			);
		}

		// Ensure an include parameter is set in case the orderby is set to 'include'.
		if ( ! empty( $request['orderby'] ) && 'include' === $request['orderby'] && empty( $request['include'] ) ) {
			return new WP_Error(
				'rest_orderby_include_missing_include',
				__( 'You need to define an include parameter to order by include.' ),
				array( 'status' => 400 )
			);
		}

		// Retrieve the list of registered collection query parameters.
		$registered = $this->get_collection_params();
		$args       = array();

		/*
		 * This array defines mappings between public API query parameters whose
		 * values are accepted as-passed, and their internal WP_Query parameter
		 * name equivalents (some are the same). Only values which are also
		 * present in $registered will be set.
		 */
		$parameter_mappings = array(
			'author'         => 'author__in',
			'author_exclude' => 'author__not_in',
			'exclude'        => 'post__not_in',
			'include'        => 'post__in',
			'menu_order'     => 'menu_order',
			'offset'         => 'offset',
			'order'          => 'order',
			'orderby'        => 'orderby',
			'page'           => 'paged',
			'parent'         => 'post_parent__in',
			'parent_exclude' => 'post_parent__not_in',
			'search'         => 's',
			'search_columns' => 'search_columns',
			'slug'           => 'post_name__in',
			'status'         => 'post_status',
		);

		/*
		 * For each known parameter which is both registered and present in the request,
		 * set the parameter's value on the query $args.
		 */
		foreach ( $parameter_mappings as $api_param => $wp_param ) {
			if ( isset( $registered[ $api_param ], $request[ $api_param ] ) ) {
				$args[ $wp_param ] = $request[ $api_param ];
			}
		}

		// Check for & assign any parameters which require special handling or setting.
		$args['date_query'] = array();

		if ( isset( $registered['before'], $request['before'] ) ) {
			$args['date_query'][] = array(
				'before' => $request['before'],
				'column' => 'post_date',
			);
		}

		if ( isset( $registered['modified_before'], $request['modified_before'] ) ) {
			$args['date_query'][] = array(
				'before' => $request['modified_before'],
				'column' => 'post_modified',
			);
		}

		if ( isset( $registered['after'], $request['after'] ) ) {
			$args['date_query'][] = array(
				'after'  => $request['after'],
				'column' => 'post_date',
			);
		}

		if ( isset( $registered['modified_after'], $request['modified_after'] ) ) {
			$args['date_query'][] = array(
				'after'  => $request['modified_after'],
				'column' => 'post_modified',
			);
		}

		// Ensure our per_page parameter overrides any provided posts_per_page filter.
		if ( isset( $registered['per_page'] ) ) {
			$args['posts_per_page'] = $request['per_page'];
		}

		if ( isset( $registered['sticky'], $request['sticky'] ) ) {
			$sticky_posts = get_option( 'sticky_posts', array() );
			if ( ! is_array( $sticky_posts ) ) {
				$sticky_posts = array();
			}
			if ( $request['sticky'] ) {
				/*
				 * As post__in will be used to only get sticky posts,
				 * we have to support the case where post__in was already
				 * specified.
				 */
				$args['post__in'] = $args['post__in'] ? array_intersect( $sticky_posts, $args['post__in'] ) : $sticky_posts;

				/*
				 * If we intersected, but there are no post IDs in common,
				 * WP_Query won't return "no posts" for post__in = array()
				 * so we have to fake it a bit.
				 */
				if ( ! $args['post__in'] ) {
					$args['post__in'] = array( 0 );
				}
			} elseif ( $sticky_posts ) {
				/*
				 * As post___not_in will be used to only get posts that
				 * are not sticky, we have to support the case where post__not_in
				 * was already specified.
				 */
				$args['post__not_in'] = array_merge( $args['post__not_in'], $sticky_posts );
			}
		}

		$args = $this->prepare_tax_query( $args, $request );

		if ( ! empty( $request['format'] ) ) {
			$formats = $request['format'];
			/*
			 * The relation needs to be set to `OR` since the request can contain
			 * two separate conditions. The user may be querying for items that have
			 * either the `standard` format or a specific format.
			 */
			$formats_query = array( 'relation' => 'OR' );

			/*
			 * The default post format, `standard`, is not stored in the database.
			 * If `standard` is part of the request, the query needs to exclude all post items that
			 * have a format assigned.
			 */
			if ( in_array( 'standard', $formats, true ) ) {
				$formats_query[] = array(
					'taxonomy' => 'post_format',
					'field'    => 'slug',
					'operator' => 'NOT EXISTS',
				);
				// Remove the `standard` format, since it cannot be queried.
				unset( $formats[ array_search( 'standard', $formats, true ) ] );
			}

			// Add any remaining formats to the formats query.
			if ( ! empty( $formats ) ) {
				// Add the `post-format-` prefix.
				$terms = array_map(
					static function ( $format ) {
						return "post-format-$format";
					},
					$formats
				);

				$formats_query[] = array(
					'taxonomy' => 'post_format',
					'field'    => 'slug',
					'terms'    => $terms,
					'operator' => 'IN',
				);
			}

			// Enable filtering by both post formats and other taxonomies by combining them with `AND`.
			if ( isset( $args['tax_query'] ) ) {
				$args['tax_query'][] = array(
					'relation' => 'AND',
					$formats_query,
				);
			} else {
				$args['tax_query'] = $formats_query;
			}
		}

		// Force the post_type argument, since it's not a user input variable.
		$args['post_type'] = $this->post_type;

		/**
		 * Filters WP_Query arguments when querying posts via the REST API.
		 *
		 * The dynamic portion of the hook name, `$this->post_type`, refers to the post type slug.
		 *
		 * Possible hook names include:
		 *
		 *  - `rest_post_query`
		 *  - `rest_page_query`
		 *  - `rest_attachment_query`
		 *
		 * Enables adding extra arguments or setting defaults for a post collection request.
		 *
		 * @since 4.7.0
		 * @since 5.7.0 Moved after the `tax_query` query arg is generated.
		 *
		 * @link https://developer.wordpress.org/reference/classes/wp_query/
		 *
		 * @param array           $args    Array of arguments for WP_Query.
		 * @param WP_REST_Request $request The REST API request.
		 */
		$args       = apply_filters( "rest_{$this->post_type}_query", $args, $request );
		$query_args = $this->prepare_items_query( $args, $request );

		$posts_query  = new WP_Query();
		$query_result = $posts_query->query( $query_args );

		// Allow access to all password protected posts if the context is edit.
		if ( 'edit' === $request['context'] ) {
			add_filter( 'post_password_required', array( $this, 'check_password_required' ), 10, 2 );
		}

		$posts = array();

		update_post_author_caches( $query_result );
		update_post_parent_caches( $query_result );

		if ( post_type_supports( $this->post_type, 'thumbnail' ) ) {
			update_post_thumbnail_cache( $posts_query );
		}

		foreach ( $query_result as $post ) {
			if ( ! $this->check_read_permission( $post ) ) {
				continue;
			}

			$data    = $this->prepare_item_for_response( $post, $request );
			$posts[] = $this->prepare_response_for_collection( $data );
		}

		// Reset filter.
		if ( 'edit' === $request['context'] ) {
			remove_filter( 'post_password_required', array( $this, 'check_password_required' ) );
		}

		$page        = (int) $query_args['paged'];
		$total_posts = $posts_query->found_posts;

		if ( $total_posts < 1 && $page > 1 ) {
			// Out-of-bounds, run the query again without LIMIT for total count.
			unset( $query_args['paged'] );

			$count_query = new WP_Query();
			$count_query->query( $query_args );
			$total_posts = $count_query->found_posts;
		}

		$max_pages = (int) ceil( $total_posts / (int) $posts_query->query_vars['posts_per_page'] );

		if ( $page > $max_pages && $total_posts > 0 ) {
			return new WP_Error(
				'rest_post_invalid_page_number',
				__( 'The page number requested is larger than the number of pages available.' ),
				array( 'status' => 400 )
			);
		}

		$response = rest_ensure_response( $posts );

		$response->header( 'X-WP-Total', (int) $total_posts );
		$response->header( 'X-WP-TotalPages', (int) $max_pages );

		$request_params = $request->get_query_params();
		$collection_url = rest_url( rest_get_route_for_post_type_items( $this->post_type ) );
		$base           = add_query_arg( urlencode_deep( $request_params ), $collection_url );

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
	 * Retrieves the query params for the posts collection.
	 *
	 * @since 4.7.0
	 * @since 5.4.0 The `tax_relation` query parameter was added.
	 * @since 5.7.0 The `modified_after` and `modified_before` query parameters were added.
	 * @since 6.7.0 The `format` query parameter was added.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();

		$query_params['context']['default'] = 'view';

		$query_params['after'] = array(
			'description' => __( 'Limit response to posts published after a given ISO8601 compliant date.' ),
			'type'        => 'string',
			'format'      => 'date-time',
		);

		$query_params['modified_after'] = array(
			'description' => __( 'Limit response to posts modified after a given ISO8601 compliant date.' ),
			'type'        => 'string',
			'format'      => 'date-time',
		);

		if ( post_type_supports( $this->post_type, 'author' ) ) {
			$query_params['author']         = array(
				'description' => __( 'Limit result set to posts assigned to specific authors.' ),
				'type'        => 'array',
				'items'       => array(
					'type' => 'integer',
				),
				'default'     => array(),
			);
			$query_params['author_exclude'] = array(
				'description' => __( 'Ensure result set excludes posts assigned to specific authors.' ),
				'type'        => 'array',
				'items'       => array(
					'type' => 'integer',
				),
				'default'     => array(),
			);
		}

		$query_params['before'] = array(
			'description' => __( 'Limit response to posts published before a given ISO8601 compliant date.' ),
			'type'        => 'string',
			'format'      => 'date-time',
		);

		$query_params['modified_before'] = array(
			'description' => __( 'Limit response to posts modified before a given ISO8601 compliant date.' ),
			'type'        => 'string',
			'format'      => 'date-time',
		);

		$query_params['exclude'] = array(
			'description' => __( 'Ensure result set excludes specific IDs.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'integer',
			),
			'default'     => array(),
		);

		$query_params['include'] = array(
			'description' => __( 'Limit result set to specific IDs.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'integer',
			),
			'default'     => array(),
		);

		if ( 'page' === $this->post_type || post_type_supports( $this->post_type, 'page-attributes' ) ) {
			$query_params['menu_order'] = array(
				'description' => __( 'Limit result set to posts with a specific menu_order value.' ),
				'type'        => 'integer',
			);
		}

		$query_params['offset'] = array(
			'description' => __( 'Offset the result set by a specific number of items.' ),
			'type'        => 'integer',
		);

		$query_params['order'] = array(
			'description' => __( 'Order sort attribute ascending or descending.' ),
			'type'        => 'string',
			'default'     => 'desc',
			'enum'        => array( 'asc', 'desc' ),
		);

		$query_params['orderby'] = array(
			'description' => __( 'Sort collection by post attribute.' ),
			'type'        => 'string',
			'default'     => 'date',
			'enum'        => array(
				'author',
				'date',
				'id',
				'include',
				'modified',
				'parent',
				'relevance',
				'slug',
				'include_slugs',
				'title',
			),
		);

		if ( 'page' === $this->post_type || post_type_supports( $this->post_type, 'page-attributes' ) ) {
			$query_params['orderby']['enum'][] = 'menu_order';
		}

		$post_type = get_post_type_object( $this->post_type );

		if ( $post_type->hierarchical || 'attachment' === $this->post_type ) {
			$query_params['parent']         = array(
				'description' => __( 'Limit result set to items with particular parent IDs.' ),
				'type'        => 'array',
				'items'       => array(
					'type' => 'integer',
				),
				'default'     => array(),
			);
			$query_params['parent_exclude'] = array(
				'description' => __( 'Limit result set to all items except those of a particular parent ID.' ),
				'type'        => 'array',
				'items'       => array(
					'type' => 'integer',
				),
				'default'     => array(),
			);
		}

		$query_params['search_columns'] = array(
			'default'     => array(),
			'description' => __( 'Array of column names to be searched.' ),
			'type'        => 'array',
			'items'       => array(
				'enum' => array( 'post_title', 'post_content', 'post_excerpt' ),
				'type' => 'string',
			),
		);

		$query_params['slug'] = array(
			'description' => __( 'Limit result set to posts with one or more specific slugs.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
			),
		);

		$query_params['status'] = array(
			'default'           => 'publish',
			'description'       => __( 'Limit result set to posts assigned one or more statuses.' ),
			'type'              => 'array',
			'items'             => array(
				'enum' => array_merge( array_keys( get_post_stati() ), array( 'any' ) ),
				'type' => 'string',
			),
			'sanitize_callback' => array( $this, 'sanitize_post_statuses' ),
		);

		$query_params = $this->prepare_taxonomy_limit_schema( $query_params );

		if ( 'post' === $this->post_type ) {
			$query_params['sticky'] = array(
				'description' => __( 'Limit result set to items that are sticky.' ),
				'type'        => 'boolean',
			);
		}

		if ( post_type_supports( $this->post_type, 'post-formats' ) ) {
			$query_params['format'] = array(
				'description' => __( 'Limit result set to items assigned one or more given formats.' ),
				'type'        => 'array',
				'uniqueItems' => true,
				'items'       => array(
					'enum' => array_values( get_post_format_slugs() ),
					'type' => 'string',
				),
			);
		}

		/**
		 * Filters collection parameters for the posts controller.
		 *
		 * The dynamic part of the filter `$this->post_type` refers to the post
		 * type slug for the controller.
		 *
		 * This filter registers the collection parameter, but does not map the
		 * collection parameter to an internal WP_Query parameter. Use the
		 * `rest_{$this->post_type}_query` filter to set WP_Query parameters.
		 *
		 * @since 4.7.0
		 *
		 * @param array        $query_params JSON Schema-formatted collection parameters.
		 * @param WP_Post_Type $post_type    Post type object.
		 */
		return apply_filters( "rest_{$this->post_type}_collection_params", $query_params, $post_type );
	}

	/**
	 * Prepares the 'tax_query' for a collection of posts.
	 *
	 * @since 5.7.0
	 *
	 * @param array           $args    WP_Query arguments.
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array Updated query arguments.
	 */
	private function prepare_tax_query( array $args, WP_REST_Request $request ) {
		$relation = $request['tax_relation'];

		if ( $relation ) {
			$args['tax_query'] = array( 'relation' => $relation );
		}

		$taxonomies = wp_list_filter(
			get_object_taxonomies( $this->post_type, 'objects' ),
			array( 'show_in_rest' => true )
		);

		foreach ( $taxonomies as $taxonomy ) {
			$base = ! empty( $taxonomy->rest_base ) ? $taxonomy->rest_base : $taxonomy->name;

			$tax_include = $request[ $base ];
			$tax_exclude = $request[ $base . '_exclude' ];

			if ( $tax_include ) {
				$terms            = array();
				$include_children = false;
				$operator         = 'IN';

				if ( rest_is_array( $tax_include ) ) {
					$terms = $tax_include;
				} elseif ( rest_is_object( $tax_include ) ) {
					$terms            = empty( $tax_include['terms'] ) ? array() : $tax_include['terms'];
					$include_children = ! empty( $tax_include['include_children'] );

					if ( isset( $tax_include['operator'] ) && 'AND' === $tax_include['operator'] ) {
						$operator = 'AND';
					}
				}

				if ( $terms ) {
					$args['tax_query'][] = array(
						'taxonomy'         => $taxonomy->name,
						'field'            => 'term_id',
						'terms'            => $terms,
						'include_children' => $include_children,
						'operator'         => $operator,
					);
				}
			}

			if ( $tax_exclude ) {
				$terms            = array();
				$include_children = false;

				if ( rest_is_array( $tax_exclude ) ) {
					$terms = $tax_exclude;
				} elseif ( rest_is_object( $tax_exclude ) ) {
					$terms            = empty( $tax_exclude['terms'] ) ? array() : $tax_exclude['terms'];
					$include_children = ! empty( $tax_exclude['include_children'] );
				}

				if ( $terms ) {
					$args['tax_query'][] = array(
						'taxonomy'         => $taxonomy->name,
						'field'            => 'term_id',
						'terms'            => $terms,
						'include_children' => $include_children,
						'operator'         => 'NOT IN',
					);
				}
			}
		}

		return $args;
	}

	/**
	 * Prepares the collection schema for including and excluding items by terms.
	 *
	 * @since 5.7.0
	 *
	 * @param array $query_params Collection schema.
	 * @return array Updated schema.
	 */
	private function prepare_taxonomy_limit_schema( array $query_params ) {
		$taxonomies = wp_list_filter( get_object_taxonomies( $this->post_type, 'objects' ), array( 'show_in_rest' => true ) );

		if ( ! $taxonomies ) {
			return $query_params;
		}

		$query_params['tax_relation'] = array(
			'description' => __( 'Limit result set based on relationship between multiple taxonomies.' ),
			'type'        => 'string',
			'enum'        => array( 'AND', 'OR' ),
		);

		$limit_schema = array(
			'type'  => array( 'object', 'array' ),
			'oneOf' => array(
				array(
					'title'       => __( 'Term ID List' ),
					'description' => __( 'Match terms with the listed IDs.' ),
					'type'        => 'array',
					'items'       => array(
						'type' => 'integer',
					),
				),
				array(
					'title'                => __( 'Term ID Taxonomy Query' ),
					'description'          => __( 'Perform an advanced term query.' ),
					'type'                 => 'object',
					'properties'           => array(
						'terms'            => array(
							'description' => __( 'Term IDs.' ),
							'type'        => 'array',
							'items'       => array(
								'type' => 'integer',
							),
							'default'     => array(),
						),
						'include_children' => array(
							'description' => __( 'Whether to include child terms in the terms limiting the result set.' ),
							'type'        => 'boolean',
							'default'     => false,
						),
					),
					'additionalProperties' => false,
				),
			),
		);

		$include_schema = array_merge(
			array(
				/* translators: %s: Taxonomy name. */
				'description' => __( 'Limit result set to items with specific terms assigned in the %s taxonomy.' ),
			),
			$limit_schema
		);
		// 'operator' is supported only for 'include' queries.
		$include_schema['oneOf'][1]['properties']['operator'] = array(
			'description' => __( 'Whether items must be assigned all or any of the specified terms.' ),
			'type'        => 'string',
			'enum'        => array( 'AND', 'OR' ),
			'default'     => 'OR',
		);

		$exclude_schema = array_merge(
			array(
				/* translators: %s: Taxonomy name. */
				'description' => __( 'Limit result set to items except those with specific terms assigned in the %s taxonomy.' ),
			),
			$limit_schema
		);

		foreach ( $taxonomies as $taxonomy ) {
			$base         = ! empty( $taxonomy->rest_base ) ? $taxonomy->rest_base : $taxonomy->name;
			$base_exclude = $base . '_exclude';

			$query_params[ $base ]                = $include_schema;
			$query_params[ $base ]['description'] = sprintf( $query_params[ $base ]['description'], $base );

			$query_params[ $base_exclude ]                = $exclude_schema;
			$query_params[ $base_exclude ]['description'] = sprintf( $query_params[ $base_exclude ]['description'], $base );

			if ( ! $taxonomy->hierarchical ) {
				unset( $query_params[ $base ]['oneOf'][1]['properties']['include_children'] );
				unset( $query_params[ $base_exclude ]['oneOf'][1]['properties']['include_children'] );
			}
		}

		return $query_params;
	}
}
