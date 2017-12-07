<?php
/**
 * Annotations REST API: WP_REST_Annotations_Controller class
 *
 * @package gutenberg
 * @since [version]
 */

/**
 * Controller which provides a REST API endpoint for Gutenberg to read, create and edit annotations.
 * Annotations are stored as posts with a custom post type. They can be children of all other post types.
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
	 * @access protected
	 *
	 * @var array
	 */
	protected $prepared_query_vars = array();

	/**
	 * Constructs the controller.
	 *
	 * @since [version]
	 * @access public
	 */
	public function __construct() {
		parent::__construct( WP_Annotation_Utils::$post_type );

		// `rest_base` is already configured via register_post_type().
		$this->namespace = 'gutenberg/v1'; // @codingStandardsIgnoreLine - PHPCS false positive on 'namespace'.

	}

	/**
	 * Registers REST API routes.
	 *
	 * @since [version]
	 * @access public
	 */
	public function register_routes() {
		WP_Annotation_Utils::register_additional_rest_fields();

		return parent::register_routes();
	}

	/**
	 * Creates an item.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  WP_REST_Request $request  Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function create_item( $request ) {
		if ( ! $request['slug'] ) {
			$request->set_param( 'slug', uniqid( 'a' ) );
		}
		return parent::create_item( $request );
	}

	/**
	 * Retrieves a collection of items.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  WP_REST_Request $request  Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		if ( ! $request['hierarchical'] ) {
			return parent::get_items( $request );
		}

		/*
		 * Hierarchical response.
		 */
		$response = parent::get_items( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		return $this->fill_descendants( $request, $response );
	}

	/**
	 * Determines the allowed query_vars for a get_items() response and prepares them for WP_Query.
	 *
	 * Also stores prepared query vars in a class property for fill_descendants().
	 *
	 * @since [version]
	 * @access protected
	 *
	 * @param array           $prepared_args Optional. Prepared WP_Query arguments.
	 * @param WP_REST_Request $request       Optional. Full details about the request.
	 * @return array                         Prepared query arguments.
	 */
	protected function prepare_items_query( $prepared_args = array(), $request = null ) {
		$this->prepared_query_vars = parent::prepare_items_query( $prepared_args, $request );
		return $this->prepared_query_vars;
	}

	/**
	 * Fetch descendants for posts in current response.
	 *
	 * @since [version]
	 * @access protected
	 *
	 * @param  WP_REST_Request  $request  Full details about the request.
	 * @param  WP_REST_Response $response Current response with posts whose descendants should be filled in.
	 * @return WP_REST_Response|WP_Error  New response with posts + all of their descendants, WP_Error otherwise.
	 */
	protected function fill_descendants( $request, $response ) {
		if ( ! $request['hierarchical'] ) {
			return $response;
		}

		/*
		 * Establish parent query vars to consider in cache algorithm below,
		 * by ignoring parent query vars that are not a factor when caching children.
		 * The more we can *safely* ignore, the better our cache hit-ratio will be.
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
		 * Establish child query vars as a mirror of parent query vars, minus a few
		 * that should simply be ignored when querying child descendants.
		 *
		 * Note: post__in is ignored in child queries so it's possible to query for specific parents
		 * that a block has a reference to, while not ignoring descendants of those parents.
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
	 * Checks if a given request has access to read.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error            True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$parent_check = parent::get_items_permissions_check( $request );
		if ( true !== $parent_check ) {
			return $parent_check; // parent *method* ;-).
		}

		$post_type = get_post_type_object( $this->post_type );

		/*
		 * Parent 'posts' (non-annotation).
		 */
		$parent_post_ids = $request['parent_post_id'];
		$parent_post_ids = $parent_post_ids ? (array) $parent_post_ids : array();
		$parent_post_ids = array_map( 'absint', $parent_post_ids );

		if ( ! $parent_post_ids && ! current_user_can( $post_type->cap->edit_others_posts ) ) {
			return new WP_Error( 'gutenberg_annotations_cannot_list_all', __( 'Sorry, you are not allowed to read all annotations as this user.', 'gutenberg' ), array(
				'status' => rest_authorization_required_code(),
			) );
		}

		foreach ( $parent_post_ids as $parent_post_id ) {
			if ( ! WP_Annotation_Utils::user_can_edit_parent_post( $parent_post_id, null, true ) ) {
				return new WP_Error( 'gutenberg_annotations_cannot_list_parent_post', __( 'Sorry, you are not allowed to read annotations as this user.', 'gutenberg' ), array(
					'status' => rest_authorization_required_code(),
				) );
			}
		}

		/*
		 * Parents 'annotations'.
		 */
		$parent_ids = $request['parent'];
		$parent_ids = $parent_ids ? (array) $parent_ids : array();
		$parent_ids = array_map( 'absint', $parent_ids );

		foreach ( $parent_ids as $key => $parent_id ) {
			$parent = get_post( $parent_id );

			if ( $parent && ! WP_Annotation_Utils::user_can_edit_parent_post( $parent ) ) {
				return new WP_Error( 'gutenberg_annotations_cannot_list_parent', __( 'Sorry, you are not allowed to read annotations as this user.', 'gutenberg' ), array(
					'status' => rest_authorization_required_code(),
				) );
			}
		}

		/*
		 * May only list if you can edit.
		 */
		if ( current_user_can( $post_type->cap->edit_posts ) ) {
			return true;
		}

		return new WP_Error( 'gutenberg_annotations_cannot_list', __( 'Sorry, you are not allowed to read annotations as this user.', 'gutenberg' ), array(
			'status' => rest_authorization_required_code(),
		) );
	}

	/**
	 * Checks if a given request has access to read.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error            True if the request has read access, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		$parent_check = parent::get_item_permissions_check( $request );
		if ( true !== $parent_check ) {
			return $parent_check;
		}

		$post = $this->get_post( $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		if ( $this->check_read_permission( $post ) ) {
			return true;
		}

		return new WP_Error( 'gutenberg_annotation_cannot_read', __( 'Sorry, you are not allowed to read annotations as this user.', 'gutenberg' ), array(
			'status' => rest_authorization_required_code(),
		) );
	}

	/**
	 * Checks if a given request has access to create.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error            True if the request has access to create, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		$parent_check = parent::create_item_permissions_check( $request );
		if ( true !== $parent_check ) {
			return $parent_check;
		}

		$parent_post_id = absint( $request['parent_post_id'] );
		$parent_post    = $parent_post_id ? get_post( $parent_post_id ) : null;

		if ( ! $parent_post ) {
			return new WP_Error( 'gutenberg_annotation_parent_post_required', __( 'Sorry, you must specify a valid parent post ID when creating an annotation.', 'gutenberg' ), array(
				'status' => 400,
			) );
		}

		$post_type = get_post_type_object( $this->post_type );

		if ( current_user_can( $post_type->cap->create_posts ) ) {
			if ( WP_Annotation_Utils::user_can_edit_parent_post( $parent_post, null, true ) ) {
				return true;
			}
		}

		return new WP_Error( 'gutenberg_annotation_cannot_create', __( 'Sorry, you are not allowed to create the annotation as this user.', 'gutenberg' ), array(
			'status' => rest_authorization_required_code(),
		) );
	}

	/**
	 * Checks if a given request has access to update.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error            True if the request has access to update, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		$parent_check = parent::update_item_permissions_check( $request );
		if ( true !== $parent_check ) {
			return $parent_check;
		}

		$post = $this->get_post( $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		if ( $this->check_update_permission( $post ) ) {
			return true;
		}

		return new WP_Error( 'gutenberg_annotation_cannot_update', __( 'Sorry, you are not allowed to update the annotation as this user.', 'gutenberg' ), array(
			'status' => rest_authorization_required_code(),
		) );
	}

	/**
	 * Checks if a given request has access to delete.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error            True if the request has access to delete, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		$parent_check = parent::delete_item_permissions_check( $request );
		if ( true !== $parent_check ) {
			return $parent_check;
		}

		$post = $this->get_post( $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		if ( $this->check_delete_permission( $post ) ) {
			return true;
		}

		return new WP_Error( 'gutenberg_annotation_cannot_delete', __( 'Sorry, you are not allowed to delete the annotation as this user.', 'gutenberg' ), array(
			'status' => rest_authorization_required_code(),
		) );
	}

	/**
	 * Checks if post can be viewed or managed.
	 *
	 * @since [version]
	 * @access protected
	 *
	 * @param  WP_Post_Type|string $post_type Post type name or object.
	 * @return bool                Whether post type is allowed in REST.
	 */
	protected function check_is_post_type_allowed( $post_type ) {
		if ( is_string( $post_type ) ) {
			$post_type = get_post_type_object( $post_type );
		}

		if ( ! ( $post_type instanceof WP_Post_Type ) ) {
			return false;
		}

		/*
		 * Annotations are not registered with REST API support.
		 * However, Gutenberg exposes *this* controller, which obviously *is* allowed.
		 */
		if ( $post_type->name === $this->post_type || ! empty( $post_type->show_in_rest ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Checks if a post can be read.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  WP_Post $post Post object.
	 * @return bool          Whether the post can be read.
	 */
	public function check_read_permission( $post ) {
		$parent_check = parent::check_read_permission( $post );
		if ( true !== $parent_check ) {
			return $parent_check;
		}

		if ( ! ( $post instanceof WP_Post ) ) {
			return false;
		}

		$post_type = get_post_type_object( $post->post_type );
		if ( ! $post_type ) {
			return false;
		}

		if ( current_user_can( $post_type->cap->read_post, $post->ID ) ) {
			return true;
		}

		return false;
	}
}
