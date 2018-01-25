<?php
/**
 * Annotations REST API: WP_REST_Annotations_Controller class
 *
 * @package gutenberg
 * @since [version]
 */

/**
 * Controller providing a REST API endpoint for annotations.
 *
 * Annotations are stored as posts with a custom post type.
 *
 * @since [version]
 *
 * @see WP_REST_Controller
 * @see WP_REST_Posts_Controller
 */
class WP_REST_Annotations_Controller extends WP_REST_Posts_Controller {
	/**
	 * Prepared query vars.
	 *
	 * @since [version]
	 *
	 * @var array
	 */
	protected $prepared_query_vars = array();

	/**
	 * Registers REST API routes.
	 *
	 * @since [version]
	 *
	 * @see WP_REST_Posts_Controller::register_routes()
	 */
	public function register_routes() {
		WP_Annotation_Utils::register_additional_rest_fields();
		WP_Annotation_Utils::add_rest_related_filters();

		return parent::register_routes();
	}

	/**
	 * Creates an item.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request  Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success,
	 *                                   {@see WP_Error} on failure.
	 *
	 * @see WP_REST_Posts_Controller::create_item()
	 */
	public function create_item( $request ) {
		if ( ! $request['slug'] ) {
			$request->set_param( 'slug', uniqid( 'a' ) );
		}

		$response = parent::create_item( $request );

		if ( ! is_wp_error( $response ) ) {
			// Handle response context differently; i.e., check permission explicitly.
			$request->set_param( 'context', current_user_can( 'edit_annotation', $response->data['id'] ) ? 'edit' : 'view' );
		}

		return $response;
	}

	/**
	 * Retrieves a collection of items.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request  Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success,
	 *                                   {@see WP_Error} otherwise.
	 *
	 * @see WP_REST_Posts_Controller::get_items()
	 */
	public function get_items( $request ) {
		$response = parent::get_items( $request );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $this->maybe_fill_descendants( $request, $response );
	}

	/**
	 * Determines allowed query_vars for a {@see
	 * WP_REST_Annotations_Controller::get_items()} response.
	 *
	 * Also stores prepared query vars in a class property for {@see
	 * WP_REST_Annotations_Controller::fill_descendants()}.
	 *
	 * @since [version]
	 *
	 * @param array           $prepared_args Optional. {@see WP_Query} arguments.
	 * @param WP_REST_Request $request       Optional. Full details about the request.
	 *
	 * @return array                         Prepared query arguments.
	 *
	 * @see WP_REST_Posts_Controller::prepare_items_query()
	 */
	protected function prepare_items_query( $prepared_args = array(), $request = null ) {
		$this->prepared_query_vars = parent::prepare_items_query( $prepared_args, $request );

		return $this->prepared_query_vars;
	}

	/**
	 * Maybe fill descendants for posts in current response.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request  $request  Full details about the request.
	 * @param  WP_REST_Response $response Current response with annotations.
	 *
	 * @return WP_REST_Response|WP_Error  New response with annotations + all of their
	 *                                    descendants, {@see WP_Error} otherwise.
	 *
	 * @see WP_Comment_Query::fill_descendants()
	 */
	protected function maybe_fill_descendants( $request, $response ) {
		if ( ! $request['hierarchical'] ) {
			return $response;
		}

		/*
		 * Establish parent query vars to consider in cache algorithm below, by ignoring parent
		 * query vars that are not a factor when caching children. The more we can *safely*
		 * ignore, the better our cache hit-ratio will be.
		 */
		$parent_query_vars_to_ignore_in_level_cache_keys = array(
			'page',
			'paged',
			'offset',
			'nopaging',
			'posts_per_page',
			'posts_per_archive_page',

			'fields',
			'no_found_rows',

			'cache_results',
			'update_post_meta_cache',
			'update_post_term_cache',
			'lazy_load_term_meta',
		);
		$parent_query_vars_in_level_cache_keys = array_diff_key(
			$this->prepared_query_vars,
			array_fill_keys( $parent_query_vars_to_ignore_in_level_cache_keys, null )
		);
		$level_cache_key_template              = 'get_' . $this->post_type . '_child_ids:{%level_parent_id%}'; // Replace {%level_parent_id%}.
		$level_cache_key_template             .= ':' . md5( serialize( $parent_query_vars_in_level_cache_keys ) );
		$level_cache_key_template             .= ':' . wp_cache_get_last_changed( 'posts' );

		/*
		 * Establish child query vars as a mirror of parent query vars, minus a few that should
		 * simply be ignored when querying child descendants.
		 *
		 * Note: post__in is ignored in child queries so it's possible to query for specific
		 * parents that a block references, while not ignoring descendants of those parents.
		 */
		$parent_query_vars_to_ignore_when_querying_child_levels = array(
			'p',
			'page_id',
			'pagename',
			'attachment_id',

			'post__in',
			'post_name__in',

			'post_parent',
			'post_parent__in',
			'post_parent__not_in',

			'page',
			'paged',
			'offset',
			'nopaging',
			'posts_per_page',
			'posts_per_archive_page',

			'fields',
			'no_found_rows',
			'ignore_sticky_posts',

			'cache_results',
			'update_post_meta_cache',
			'update_post_term_cache',
			'lazy_load_term_meta',
		);
		$child_query_vars_template                        = array_diff_key(
			$this->prepared_query_vars,
			array_fill_keys( $parent_query_vars_to_ignore_when_querying_child_levels, null )
		);
		$child_query_vars_template['cache_results']       = true;
		$child_query_vars_template['ignore_sticky_posts'] = true;
		$child_query_vars_template['no_found_rows']       = true;
		$child_query_vars_template['posts_per_page']      = -1;

		/*
		 * Retrieve an entire level of children at a time.
		 */
		$response_data = $response->get_data();
		$level         = 0;
		$levels        = array(
			$level => wp_list_pluck( $response_data, 'id' ),
		);

		do { // While we have child IDs at current level.

			$level_child_ids           = array();
			$level_uncached_parent_ids = array();
			$level_parent_ids          = $levels[ $level ];

			foreach ( $level_parent_ids as $level_parent_id ) {
				$level_cache_key        = str_replace( '{%level_parent_id%}', $level_parent_id, $level_cache_key_template );
				$level_parent_child_ids = wp_cache_get( $level_cache_key, $this->post_type );

				if ( false !== $level_parent_child_ids ) {
					$level_child_ids = array_merge( $level_child_ids, $level_parent_child_ids );
				} else {
					$level_uncached_parent_ids[] = $level_parent_id;
				}
			}

			if ( $level_uncached_parent_ids ) {
				$level_query                         = new WP_Query();
				$level_query_vars                    = $child_query_vars_template;
				$level_query_vars['post_parent__in'] = $level_uncached_parent_ids;

				$level_posts      = $level_query->query( $level_query_vars );
				$level_parent_map = array_fill_keys( $level_uncached_parent_ids, array() );

				foreach ( $level_posts as $level_post ) {
					$level_parent_map[ $level_post->post_parent ][] = $level_post->ID;
					$level_child_ids[]                              = $level_post->ID;
				}
				foreach ( $level_parent_map as $level_parent_id => $level_parent_child_ids ) {
					$level_cache_key = str_replace( '{%level_parent_id%}', $level_parent_id, $level_cache_key_template );
					wp_cache_set( $level_cache_key, $level_parent_child_ids, $this->post_type );
				}
			}

			$level_child_ids    = array_unique( $level_child_ids );
			$levels[ ++$level ] = $level_child_ids;

		} while ( $level_child_ids );

		/*
		 * Establish non-top-level descendants and prime post caches.
		 */
		for (
			$i = 1,
			$c = count( $levels ),
			$descendant_ids = array();
			$i < $c;
			$i++
		) {
			$descendant_ids = array_merge( $descendant_ids, $levels[ $i ] );
		}
		_prime_post_caches( $descendant_ids );

		/*
		 * Flat array of all response data + descendants.
		 */
		$all_response_data = $response_data;

		foreach ( $descendant_ids as $descendant_id ) {
			$descendant_post = get_post( $descendant_id );

			if ( ! $descendant_post || ! $this->check_read_permission( $descendant_post ) ) {
				continue; // Exclude in either case.
			}
			$descendant_response = $this->prepare_item_for_response( $descendant_post, $request );
			$all_response_data[] = $this->prepare_response_for_collection( $descendant_response );
		}

		/*
		 * If a threaded representation was requested, build tree.
		 */
		if ( 'threaded' === $request['hierarchical'] ) {
			$refs                   = array();
			$threaded_response_data = array();

			foreach ( $all_response_data as &$data ) { // By reference.
				$data['children'] = array();

				// If not in reference array, it's top level.
				if ( ! isset( $refs[ $data['parent'] ] ) ) {
					$threaded_response_data[] = &$data;
					$refs[ $data['id'] ]      = &$data;

				} else { // Add child by reference.
					$refs[ $data['parent'] ]['children'][] = &$data;
					$refs[ $data['id'] ]                   = &$data;
				}
			}
			$all_response_data = $threaded_response_data; // Top-level.
		}

		/*
		 * Update response data & return.
		 */
		$response->set_data( $all_response_data );

		return $response;
	}

	/**
	 * Checks if an annotation can be read.
	 *
	 * Overrides the parent method because it allows read access if the post status is
	 * 'publish', w/o checking read permissions explicitly. Therefore, this method is
	 * more secure than the parent method alone.
	 *
	 * @since [version]
	 *
	 * @param  WP_Post $post Post object.
	 *
	 * @return bool          True if the annotation can be read.
	 *
	 * @see WP_REST_Posts_Controller::check_read_permission()
	 */
	public function check_read_permission( $post ) {
		$parent_check = parent::check_read_permission( $post );

		if ( true !== $parent_check ) {
			return $parent_check;
		}

		if ( ! ( $post instanceof WP_Post ) ) {
			return false;
		}

		return current_user_can( 'read_annotation', $post->ID );
	}

	/**
	 * Checks if a given request has access to read (get).
	 *
	 * Overrides the parent method because it doesn't consider parent post permissions.
	 * Therefore, this method is more secure than the parent method alone.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 *
	 * @return bool|WP_Error            True if the request has read access,
	 *                                  {@see WP_Error} otherwise.
	 *
	 * @see WP_REST_Posts_Controller::get_items_permissions_check()
	 */
	public function get_items_permissions_check( $request ) {
		$parent_check = parent::get_items_permissions_check( $request );

		if ( is_wp_error( $parent_check ) ) {
			return $parent_check;
		}

		$parent_post_ids = $request['parent_post'];
		$parent_post_ids = $parent_post_ids ? (array) $parent_post_ids : array();
		$parent_post_ids = array_map( 'absint', $parent_post_ids );

		$parent_post_targets = $request['parent_post_target'];
		$parent_post_targets = isset( $parent_post_targets ) ? (array) $parent_post_targets : array();
		$parent_post_targets = array_map( 'strval', $parent_post_targets );

		$parent_post_passwords = $request['parent_post_password'];
		$parent_post_passwords = $parent_post_passwords ? (array) $parent_post_passwords : array();
		$parent_post_passwords = array_map( 'strval', $parent_post_passwords );

		if ( ! $parent_post_ids ) {
			return new WP_Error( 'rest_missing_annotation_parent_post', __( 'Invalid parent post ID.', 'gutenberg' ), array(
				'status' => 400,
			) );
		} elseif ( ! $parent_post_targets ) {
			return new WP_Error( 'rest_missing_annotation_parent_post_target', __( 'Invalid parent post target.', 'gutenberg' ), array(
				'status' => 400,
			) );
		} // Must have at least one parent post ID & target to check permissions properly.

		foreach ( $parent_post_ids as $key => $parent_post_id ) {
			foreach ( $parent_post_targets as $parent_post_target ) {
				$parent_post_password = isset( $parent_post_passwords[ $key ] ) ? $parent_post_passwords[ $key ] : '';

				if ( ! $parent_post_id || ! get_post( $parent_post_id ) ) {
					return new WP_Error( 'rest_missing_annotation_parent_post', __( 'Invalid parent post ID.', 'gutenberg' ), array(
						'status' => 400,
					) );
				}

				if ( ! current_user_can( 'read_annotations', $parent_post_id, $parent_post_target ) ) {
					return new WP_Error( 'rest_cannot_read_annotation_parent_post', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array(
						'status' => rest_authorization_required_code(),
					) );
				}

				if ( $this->parent_post_password_required( $parent_post_id, $parent_post_target, $parent_post_password ) ) {
					return new WP_Error( 'rest_annotation_parent_post_password_required', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array(
						'status' => rest_authorization_required_code(),
					) );
				}
			}
		}

		return true;
	}

	/**
	 * Checks if a given request has access to create.
	 *
	 * Overrides the parent method because it doesn't consider parent post permissions.
	 * Therefore, this method is more secure than the parent method alone.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 *
	 * @return bool|WP_Error            True if the request has access to create,
	 *                                  {@see WP_Error} otherwise.
	 *
	 * @see WP_REST_Posts_Controller::create_item_permissions_check()
	 */
	public function create_item_permissions_check( $request ) {
		$parent_check = parent::create_item_permissions_check( $request );

		if ( is_wp_error( $parent_check ) ) {
			if ( 'rest_cannot_create' !== $parent_check->get_error_code() ) {
				return $parent_check;
			}
		}

		$parent_post_id       = absint( $request['parent_post'] );
		$parent_post_target   = (string) $request['parent_post_target'];
		$parent_post_password = (string) $request['parent_post_password'];
		$parent_id            = absint( $request['parent'] );

		if ( ! $parent_post_id || ! get_post( $parent_post_id ) ) {
			return new WP_Error( 'rest_missing_annotation_parent_post', __( 'Missing parent post.', 'gutenberg' ), array(
				'status' => 400,
			) );
		}

		if ( ! current_user_can( 'create_annotation', $parent_post_id, $parent_post_target ) ) {
			return new WP_Error( 'rest_cannot_create_annotation', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array(
				'status' => rest_authorization_required_code(),
			) );
		}

		if ( $this->parent_post_password_required( $parent_post_id, $parent_post_target, $parent_post_password ) ) {
			return new WP_Error( 'rest_annotation_parent_post_password_required', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array(
				'status' => rest_authorization_required_code(),
			) );
		}

		if ( $parent_id && ! current_user_can( 'read_annotation', $parent_id ) ) {
			return new WP_Error( 'rest_cannot_read_annotation_parent', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array(
				'status' => rest_authorization_required_code(),
			) );
		}

		return true;
	}

	/**
	 * Checks if a given request has access to update.
	 *
	 * Overrides the parent method because it doesn't consider parent post permissions.
	 * Therefore, this method is more secure than the parent method alone.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 *
	 * @return bool|WP_Error            True if the request has access to update,
	 *                                  {@see WP_Error} otherwise.
	 *
	 * @see WP_REST_Posts_Controller::update_item_permissions_check()
	 */
	public function update_item_permissions_check( $request ) {
		$parent_check = parent::update_item_permissions_check( $request );

		if ( is_wp_error( $parent_check ) ) {
			return $parent_check;
		}

		$post_id   = absint( $request['id'] );
		$post_info = WP_Annotation_Utils::get_post_info( $post_id );

		if ( ! $post_info ) {
			return new WP_Error( 'rest_missing_annotation', __( 'Missing annotation.', 'gutenberg' ), array(
				'status' => 404,
			) );
		}
		$post           = $post_info['post'];
		$post_parent_id = $post->post_parent;

		$parent_post        = $post_info['parent_post'];
		$parent_post_id     = $post_info['parent_post']->ID;
		$parent_post_target = $post_info['parent_post_target'];

		if ( isset( $request['parent_post'] ) ) {
			$new_parent_post_id = absint( $request['parent_post'] );
		} else {
			$new_parent_post_id = $parent_post_id;
		}

		if ( isset( $request['parent_post_target'] ) ) {
			$new_parent_post_target = (string) $request['parent_post_target'];
		} else {
			$new_parent_post_target = $parent_post_target;
		}

		if ( isset( $request['parent'] ) ) {
			$new_post_parent_id = absint( $request['parent'] );
		} else {
			$new_post_parent_id = $post_parent_id;
		}

		$new_parent_post_password = (string) $request['parent_post_password'];

		if ( $new_parent_post_id !== $parent_post_id || $new_parent_post_target !== $parent_post_target || $new_post_parent_id !== $post_parent_id ) {
			if ( ! $new_parent_post_id || ! get_post( $new_parent_post_id ) ) {
				return new WP_Error( 'rest_missing_annotation_parent_post', __( 'Missing parent post.', 'gutenberg' ), array(
					'status' => 400,
				) );
			}

			if ( ! current_user_can( 'create_annotation', $new_parent_post_id, $new_parent_post_target ) ) {
				return new WP_Error( 'rest_cannot_update_annotation_parent_post', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array(
					'status' => rest_authorization_required_code(),
				) );
			}

			if ( $new_post_parent_id && ! get_post( $new_post_parent_id ) ) {
				return new WP_Error( 'rest_missing_annotation_parent', __( 'Missing annotation parent.', 'gutenberg' ), array(
					'status' => 400,
				) );
			}

			if ( $new_post_parent_id && ! current_user_can( 'read_annotation', $new_post_parent_id ) ) {
				return new WP_Error( 'rest_cannot_read_annotation_parent', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array(
					'status' => rest_authorization_required_code(),
				) );
			}
		}

		if ( $this->parent_post_password_required( $new_parent_post_id, $new_parent_post_target, $new_parent_post_password ) ) {
			return new WP_Error( 'rest_annotation_parent_post_password_required', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array(
				'status' => rest_authorization_required_code(),
			) );
		}

		return true;
	}

	/**
	 * Checks if a parent post password is required.
	 *
	 * @since [version]
	 *
	 * @param  string|int $parent_post_id       Parent post ID.
	 * @param  string     $parent_post_target   Parent post target.
	 * @param  string     $parent_post_password Parent post password.
	 *
	 * @return bool                             True if a password is required.
	 *
	 * @see post_password_required()
	 */
	protected function parent_post_password_required( $parent_post_id, $parent_post_target, $parent_post_password ) {
		if ( ! $parent_post_id ) {
			return false;
		} elseif ( '' !== $parent_post_target ) {
			return false;
		} elseif ( ! post_password_required( $parent_post_id ) ) {
			return false;
		}

		$parent_post_info = WP_Annotation_Utils::get_parent_post_info( $parent_post_id );

		if ( ! $parent_post_info ) {
			return false;
		}

		$parent_post      = $parent_post_info['parent_post'];
		$parent_post_type = $parent_post_info['parent_post_type'];

		if ( ! current_user_can( $parent_post_type->cap->edit_post, $parent_post->ID ) ) {
			// phpcs:ignore PHPCompatibility.PHP.NewFunctions.hash_equalsFound — hash_equals() is provided by core.
			if ( ! hash_equals( $parent_post->post_password, $parent_post_password ) ) { // @codingStandardsIgnoreLine
				return true;
			}
		}

		return false;
	}
}
