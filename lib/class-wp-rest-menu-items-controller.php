<?php
/**
 * REST API: WP_REST_Menu_Items_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Core class to access nav items via the REST API.
 *
 * @see WP_REST_Posts_Controller
 */
class WP_REST_Menu_Items_Controller extends WP_REST_Posts_Controller {
	/**
	 * Constructor.
	 *
	 * @param string $post_type Post type.
	 */
	public function __construct( $post_type ) {
		parent::__construct( $post_type );
		$this->namespace = '__experimental';
	}

	/**
	 * Overrides the route registration to support "allow_batch".
	 *
	 * @since 9.2.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				'allow_batch' => array( 'v1' => true ),
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);

		$schema        = $this->get_item_schema();
		$get_item_args = array(
			'context' => $this->get_context_param( array( 'default' => 'view' ) ),
		);
		if ( isset( $schema['properties']['password'] ) ) {
			$get_item_args['password'] = array(
				'description' => __( 'The password for the post if it is password protected.', 'gutenberg' ),
				'type'        => 'string',
			);
		}
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args'        => array(
					'id' => array(
						'description' => __( 'Unique identifier for the object.', 'gutenberg' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => $get_item_args,
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => array(
						'force' => array(
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Whether to bypass Trash and force deletion.', 'gutenberg' ),
						),
					),
				),
				'allow_batch' => array( 'v1' => true ),
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Get the post, if the ID is valid.
	 *
	 * @param int $id Supplied ID.
	 *
	 * @return object|WP_Error Post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_post( $id ) {
		return $this->get_nav_menu_item( $id );
	}

	/**
	 * Get the nav menu item, if the ID is valid.
	 *
	 * @param int $id Supplied ID.
	 *
	 * @return object|WP_Error Post object if ID is valid, WP_Error otherwise.
	 */
	protected function get_nav_menu_item( $id ) {
		$post = parent::get_post( $id );
		if ( is_wp_error( $post ) ) {
			return $post;
		}
		$nav_item = wp_setup_nav_menu_item( $post );

		return $nav_item;
	}

	/**
	 * Checks if a given request has access to read a menu item if they have access to edit them.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		$post = $this->get_post( $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}
		if ( $post && ! $this->check_update_permission( $post ) ) {
			return new WP_Error( 'rest_cannot_view', __( 'Sorry, you cannot view this menu item, unless you have access to permission edit it. ', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return parent::get_item_permissions_check( $request );
	}

	/**
	 * Checks if a given request has access to read menu items if they have access to edit them.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$post_type = get_post_type_object( $this->post_type );
		if ( ! current_user_can( $post_type->cap->edit_posts ) ) {
			if ( 'edit' === $request['context'] ) {
				return new WP_Error( 'rest_forbidden_context', __( 'Sorry, you are not allowed to edit posts in this post type.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
			}
			return new WP_Error( 'rest_cannot_view', __( 'Sorry, you cannot view these menu items, unless you have access to permission edit them. ', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}
		return true;
	}

	/**
	 * Creates a single post.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		if ( ! empty( $request['id'] ) ) {
			return new WP_Error( 'rest_post_exists', __( 'Cannot create existing post.', 'gutenberg' ), array( 'status' => 400 ) );
		}

		$prepared_nav_item = $this->prepare_item_for_database( $request );

		if ( is_wp_error( $prepared_nav_item ) ) {
			return $prepared_nav_item;
		}
		$prepared_nav_item = (array) $prepared_nav_item;

		$nav_menu_item_id = wp_update_nav_menu_item( $prepared_nav_item['menu-id'], $prepared_nav_item['menu-item-db-id'], $prepared_nav_item );
		if ( is_wp_error( $nav_menu_item_id ) ) {
			if ( 'db_insert_error' === $nav_menu_item_id->get_error_code() ) {
				$nav_menu_item_id->add_data( array( 'status' => 500 ) );
			} else {
				$nav_menu_item_id->add_data( array( 'status' => 400 ) );
			}

			return $nav_menu_item_id;
		}

		$nav_menu_item = $this->get_nav_menu_item( $nav_menu_item_id );
		if ( is_wp_error( $nav_menu_item ) ) {
			$nav_menu_item->add_data( array( 'status' => 404 ) );

			return $nav_menu_item;
		}

		/**
		 * Fires after a single nav menu item is created or updated via the REST API.
		 *
		 * The dynamic portion of the hook name, `$this->post_type`, refers to the post type slug.
		 *
		 * @param object          $nav_menu_item Inserted or updated nav item object.
		 * @param WP_REST_Request $request       Request object.
		 * @param bool            $creating      True when creating a post, false when updating.
		 *                                       SA
		 */
		do_action( "rest_insert_{$this->post_type}", $nav_menu_item, $request, true );

		$schema = $this->get_item_schema();

		if ( ! empty( $schema['properties']['meta'] ) && isset( $request['meta'] ) ) {
			$meta_update = $this->meta->update_value( $request['meta'], $nav_menu_item_id );

			if ( is_wp_error( $meta_update ) ) {
				return $meta_update;
			}
		}

		$nav_menu_item = $this->get_nav_menu_item( $nav_menu_item_id );
		$fields_update = $this->update_additional_fields_for_object( $nav_menu_item, $request );

		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		$request->set_param( 'context', 'edit' );

		/**
		 * Fires after a single nav menu item is completely created or updated via the REST API.
		 *
		 * The dynamic portion of the hook name, `$this->post_type`, refers to the post type slug.
		 *
		 * @param object          $nav_menu_item Inserted or updated nav item object.
		 * @param WP_REST_Request $request       Request object.
		 * @param bool            $creating      True when creating a post, false when updating.
		 */
		do_action( "rest_after_insert_{$this->post_type}", $nav_menu_item, $request, true );

		$response = $this->prepare_item_for_response( $nav_menu_item, $request );
		$response = rest_ensure_response( $response );

		$response->set_status( 201 );
		$response->header( 'Location', rest_url( sprintf( '%s/%s/%d', $this->namespace, $this->rest_base, $nav_menu_item_id ) ) );

		return $response;
	}

	/**
	 * Updates a single nav menu item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$valid_check = $this->get_nav_menu_item( $request['id'] );
		if ( is_wp_error( $valid_check ) ) {
			return $valid_check;
		}

		$prepared_nav_item = $this->prepare_item_for_database( $request );

		if ( is_wp_error( $prepared_nav_item ) ) {
			return $prepared_nav_item;
		}

		$prepared_nav_item = (array) $prepared_nav_item;

		$nav_menu_item_id = wp_update_nav_menu_item( $prepared_nav_item['menu-id'], $prepared_nav_item['menu-item-db-id'], $prepared_nav_item );

		if ( is_wp_error( $nav_menu_item_id ) ) {
			if ( 'db_update_error' === $nav_menu_item_id->get_error_code() ) {
				$nav_menu_item_id->add_data( array( 'status' => 500 ) );
			} else {
				$nav_menu_item_id->add_data( array( 'status' => 400 ) );
			}

			return $nav_menu_item_id;
		}

		$nav_menu_item = $this->get_nav_menu_item( $nav_menu_item_id );
		if ( is_wp_error( $nav_menu_item ) ) {
			$nav_menu_item->add_data( array( 'status' => 404 ) );

			return $nav_menu_item;
		}

		/** This action is documented in wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php */
		do_action( "rest_insert_{$this->post_type}", $nav_menu_item, $request, false );

		$schema = $this->get_item_schema();

		if ( ! empty( $schema['properties']['meta'] ) && isset( $request['meta'] ) ) {
			$meta_update = $this->meta->update_value( $request['meta'], $nav_menu_item->ID );

			if ( is_wp_error( $meta_update ) ) {
				return $meta_update;
			}
		}

		$nav_menu_item = $this->get_nav_menu_item( $nav_menu_item_id );
		$fields_update = $this->update_additional_fields_for_object( $nav_menu_item, $request );

		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		$request->set_param( 'context', 'edit' );

		/** This action is documented in wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php */
		do_action( "rest_after_insert_{$this->post_type}", $nav_menu_item, $request, false );

		$response = $this->prepare_item_for_response( $nav_menu_item, $request );

		return rest_ensure_response( $response );
	}

	/**
	 * Deletes a single menu item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		$menu_item = $this->get_nav_menu_item( $request['id'] );
		if ( is_wp_error( $menu_item ) ) {
			return $menu_item;
		}

		$force = isset( $request['force'] ) ? (bool) $request['force'] : false;

		// We don't support trashing for menu items.
		if ( ! $force ) {
			/* translators: %s: force=true */
			return new WP_Error( 'rest_trash_not_supported', sprintf( __( "Menu items do not support trashing. Set '%s' to delete.", 'gutenberg' ), 'force=true' ), array( 'status' => 501 ) );
		}

		$previous = $this->prepare_item_for_response( $menu_item, $request );

		$result = wp_delete_post( $request['id'], true );

		if ( ! $result ) {
			return new WP_Error( 'rest_cannot_delete', __( 'The post cannot be deleted.', 'gutenberg' ), array( 'status' => 500 ) );
		}

		$response = new WP_REST_Response();
		$response->set_data(
			array(
				'deleted'  => true,
				'previous' => $previous->get_data(),
			)
		);

		/**
		 * Fires immediately after a single menu item is deleted or trashed via the REST API.
		 *
		 * They dynamic portion of the hook name, `$this->post_type`, refers to the post type slug.
		 *
		 * @param Object          $menu_item  The deleted or trashed menu item.
		 * @param WP_REST_Response $response The response data.
		 * @param WP_REST_Request  $request  The request sent to the API.
		 */
		do_action( "rest_delete_{$this->post_type}", $menu_item, $response, $request );

		return $response;
	}

	/**
	 * Prepares a single post for create or update.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return stdClass|WP_Error
	 */
	protected function prepare_item_for_database( $request ) {
		$menu_item_db_id = $request['id'];
		$menu_item_obj   = $this->get_nav_menu_item( $menu_item_db_id );
		// Need to persist the menu item data. See https://core.trac.wordpress.org/ticket/28138 .
		if ( ! is_wp_error( $menu_item_obj ) ) {
			// Correct the menu position if this was the first item. See https://core.trac.wordpress.org/ticket/28140 .
			$position = ( 0 === $menu_item_obj->menu_order ) ? 1 : $menu_item_obj->menu_order;

			$prepared_nav_item = array(
				'menu-item-db-id'       => $menu_item_db_id,
				'menu-item-object-id'   => $menu_item_obj->object_id,
				'menu-item-object'      => $menu_item_obj->object,
				'menu-item-parent-id'   => $menu_item_obj->menu_item_parent,
				'menu-item-position'    => $position,
				'menu-item-type'        => $menu_item_obj->type,
				'menu-item-title'       => $menu_item_obj->title,
				'menu-item-url'         => $menu_item_obj->url,
				'menu-item-description' => $menu_item_obj->description,
				'menu-item-content'     => $menu_item_obj->menu_item_content,
				'menu-item-attr-title'  => $menu_item_obj->attr_title,
				'menu-item-target'      => $menu_item_obj->target,
				// Stored in the database as a string.
				'menu-item-classes'     => implode( ' ', $menu_item_obj->classes ),
				'menu-item-xfn'         => $menu_item_obj->xfn,
				'menu-item-status'      => $menu_item_obj->post_status,
				'menu-id'               => $this->get_menu_id( $menu_item_db_id ),
			);
		} else {
			$prepared_nav_item = array(
				'menu-id'               => 0,
				'menu-item-db-id'       => 0,
				'menu-item-object-id'   => 0,
				'menu-item-object'      => '',
				'menu-item-parent-id'   => 0,
				'menu-item-position'    => 1,
				'menu-item-type'        => 'custom',
				'menu-item-title'       => '',
				'menu-item-url'         => '',
				'menu-item-description' => '',
				'menu-item-content'     => '',
				'menu-item-attr-title'  => '',
				'menu-item-target'      => '',
				'menu-item-classes'     => '',
				'menu-item-xfn'         => '',
				'menu-item-status'      => 'publish',
			);
		}

		$mapping = array(
			'menu-item-db-id'       => 'id',
			'menu-item-object-id'   => 'object_id',
			'menu-item-object'      => 'object',
			'menu-item-parent-id'   => 'parent',
			'menu-item-position'    => 'menu_order',
			'menu-item-type'        => 'type',
			'menu-item-url'         => 'url',
			'menu-item-description' => 'description',
			'menu-item-attr-title'  => 'attr_title',
			'menu-item-target'      => 'target',
			'menu-item-classes'     => 'classes',
			'menu-item-xfn'         => 'xfn',
			'menu-item-status'      => 'status',
		);

		$schema = $this->get_item_schema();

		foreach ( $mapping as $original => $api_request ) {
			if ( ! empty( $schema['properties'][ $api_request ] ) && isset( $request[ $api_request ] ) ) {
				$check = rest_validate_value_from_schema( $request[ $api_request ], $schema['properties'][ $api_request ] );
				if ( is_wp_error( $check ) ) {
					$check->add_data( array( 'status' => 400 ) );
					return $check;
				}
				$prepared_nav_item[ $original ] = rest_sanitize_value_from_schema( $request[ $api_request ], $schema['properties'][ $api_request ] );
			}
		}

		$taxonomy = get_taxonomy( 'nav_menu' );
		$base     = ! empty( $taxonomy->rest_base ) ? $taxonomy->rest_base : $taxonomy->name;
		// If menus submitted, cast to int.
		if ( isset( $request[ $base ] ) && ! empty( $request[ $base ] ) ) {
			$prepared_nav_item['menu-id'] = absint( $request[ $base ] );
		}

		// Nav menu title.
		if ( ! empty( $schema['properties']['title'] ) && isset( $request['title'] ) ) {
			if ( is_string( $request['title'] ) ) {
				$prepared_nav_item['menu-item-title'] = $request['title'];
			} elseif ( ! empty( $request['title']['raw'] ) ) {
				$prepared_nav_item['menu-item-title'] = $request['title']['raw'];
			}
		}

		// Nav menu content.
		if ( ! empty( $schema['properties']['content'] ) && isset( $request['content'] ) ) {
			if ( is_string( $request['content'] ) ) {
				$prepared_nav_item['menu-item-content'] = $request['content'];
			} elseif ( isset( $request['content']['raw'] ) ) {
				$prepared_nav_item['menu-item-content'] = $request['content']['raw'];
			}
		}

		// Check if object id exists before saving.
		if ( ! $prepared_nav_item['menu-item-object'] ) {
			// If taxonony, check if term exists.
			if ( 'taxonomy' === $prepared_nav_item['menu-item-type'] ) {
				$original = get_term( absint( $prepared_nav_item['menu-item-object-id'] ) );
				if ( empty( $original ) || is_wp_error( $original ) ) {
					return new WP_Error( 'rest_term_invalid_id', __( 'Invalid term ID.', 'gutenberg' ), array( 'status' => 400 ) );
				}
				$prepared_nav_item['menu-item-object'] = get_term_field( 'taxonomy', $original );

				// If post, check if post object exists.
			} elseif ( 'post_type' === $prepared_nav_item['menu-item-type'] ) {
				$original = get_post( absint( $prepared_nav_item['menu-item-object-id'] ) );
				if ( empty( $original ) ) {
					return new WP_Error( 'rest_post_invalid_id', __( 'Invalid post ID.', 'gutenberg' ), array( 'status' => 400 ) );
				}
				$prepared_nav_item['menu-item-object'] = get_post_type( $original );
			}
		}

		// If post type archive, check if post type exists.
		if ( 'post_type_archive' === $prepared_nav_item['menu-item-type'] ) {
			$post_type = ( $prepared_nav_item['menu-item-object'] ) ? $prepared_nav_item['menu-item-object'] : false;
			$original  = get_post_type_object( $post_type );
			if ( empty( $original ) ) {
				return new WP_Error( 'rest_post_invalid_type', __( 'Invalid post type.', 'gutenberg' ), array( 'status' => 400 ) );
			}
		}

		// Check if menu item is type custom, then title and url are required.
		if ( 'custom' === $prepared_nav_item['menu-item-type'] ) {
			if ( '' === $prepared_nav_item['menu-item-title'] ) {
				return new WP_Error( 'rest_title_required', __( 'Title required if menu item of type custom.', 'gutenberg' ), array( 'status' => 400 ) );
			}
			if ( empty( $prepared_nav_item['menu-item-url'] ) ) {
				return new WP_Error( 'rest_url_required', __( 'URL required if menu item of type custom.', 'gutenberg' ), array( 'status' => 400 ) );
			}
		}

		// If menu item is type block, then content is required.
		if ( 'block' === $prepared_nav_item['menu-item-type'] ) {
			if ( empty( $prepared_nav_item['menu-item-content'] ) ) {
				return new WP_Error( 'rest_content_required', __( 'Content required if menu item of type block.', 'gutenberg' ), array( 'status' => 400 ) );
			}
		}

		foreach ( array( 'menu-item-object-id', 'menu-item-parent-id' ) as $key ) {
			// Note we need to allow negative-integer IDs for previewed objects not inserted yet.
			$prepared_nav_item[ $key ] = (int) $prepared_nav_item[ $key ];
		}

		foreach ( array( 'menu-item-type', 'menu-item-object', 'menu-item-target' ) as $key ) {
			$prepared_nav_item[ $key ] = sanitize_key( $prepared_nav_item[ $key ] );
		}

		// Valid xfn and classes are an array.
		foreach ( array( 'menu-item-xfn', 'menu-item-classes' ) as $key ) {
			$value = $prepared_nav_item[ $key ];
			if ( ! is_array( $value ) ) {
				$value = wp_parse_list( $value );
			}
			$prepared_nav_item[ $key ] = implode( ' ', array_map( 'sanitize_html_class', $value ) );
		}

		// Valid url.
		if ( '' !== $prepared_nav_item['menu-item-url'] ) {
			$prepared_nav_item['menu-item-url'] = esc_url_raw( $prepared_nav_item['menu-item-url'] );
			if ( '' === $prepared_nav_item['menu-item-url'] ) {
				// Fail sanitization if URL is invalid.
				return new WP_Error( 'invalid_url', __( 'Invalid URL.', 'gutenberg' ), array( 'status' => 400 ) );
			}
		}
		// Only draft / publish are valid post status for menu items.
		if ( 'publish' !== $prepared_nav_item['menu-item-status'] ) {
			$prepared_nav_item['menu-item-status'] = 'draft';
		}

		$prepared_nav_item = (object) $prepared_nav_item;

		/**
		 * Filters a post before it is inserted via the REST API.
		 *
		 * The dynamic portion of the hook name, `$this->post_type`, refers to the post type slug.
		 *
		 * @param stdClass        $prepared_post An object representing a single post prepared
		 *                                       for inserting or updating the database.
		 * @param WP_REST_Request $request       Request object.
		 */
		return apply_filters( "rest_pre_insert_{$this->post_type}", $prepared_nav_item, $request );
	}

	/**
	 * Prepares a single post output for response.
	 *
	 * @param object          $post    Post object.
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $post, $request ) {
		$fields = $this->get_fields_for_response( $request );

		// Base fields for every post.
		$menu_item = wp_setup_nav_menu_item( $post );
		$data      = array();
		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = $menu_item->ID;
		}

		if ( rest_is_field_included( 'title', $fields ) ) {
			$data['title'] = array();
		}
		if ( rest_is_field_included( 'title.raw', $fields ) ) {
			$data['title']['raw'] = $menu_item->title;
		}
		if ( rest_is_field_included( 'title.rendered', $fields ) ) {
			add_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );

			/** This filter is documented in wp-includes/post-template.php */
			$title = apply_filters( 'the_title', $menu_item->title, $menu_item->ID );

			/** This filter is documented in wp-includes/class-walker-nav-menu.php */
			$title = apply_filters( 'nav_menu_item_title', $title, $menu_item, null, 0 );

			$data['title']['rendered'] = $title;

			remove_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );
		}

		if ( rest_is_field_included( 'status', $fields ) ) {
			$data['status'] = $menu_item->post_status;
		}

		if ( rest_is_field_included( 'url', $fields ) ) {
			$data['url'] = $menu_item->url;
		}

		if ( rest_is_field_included( 'attr_title', $fields ) ) {
			// Same as post_excerpt.
			$data['attr_title'] = $menu_item->attr_title;
		}

		if ( rest_is_field_included( 'description', $fields ) ) {
			// Same as post_content.
			$data['description'] = $menu_item->description;
		}

		if ( rest_is_field_included( 'type', $fields ) ) {
			// Using 'item_type' since 'type' already exists.
			$data['type'] = $menu_item->type;
		}

		if ( rest_is_field_included( 'type_label', $fields ) ) {
			// Using 'item_type_label' to match up with 'item_type' - IS READ ONLY!
			$data['type_label'] = $menu_item->type_label;
		}

		if ( rest_is_field_included( 'object', $fields ) ) {
			$data['object'] = $menu_item->object;
		}

		if ( rest_is_field_included( 'object_id', $fields ) ) {
			// Usually is a string, but lets expose as an integer.
			$data['object_id'] = absint( $menu_item->object_id );
		}

		if ( rest_is_field_included( 'content', $fields ) ) {
			$data['content'] = array();
		}
		if ( rest_is_field_included( 'content.raw', $fields ) ) {
			$data['content']['raw'] = $menu_item->content;
		}
		if ( rest_is_field_included( 'content.rendered', $fields ) ) {
			/** This filter is documented in wp-includes/post-template.php */
			$data['content']['rendered'] = apply_filters( 'the_content', $menu_item->content );
		}
		if ( rest_is_field_included( 'content.block_version', $fields ) ) {
			$data['content']['block_version'] = block_version( $menu_item->content );
		}

		if ( rest_is_field_included( 'parent', $fields ) ) {
			// Same as post_parent, expose as integer.
			$data['parent'] = (int) $menu_item->menu_item_parent;
		}

		if ( rest_is_field_included( 'menu_order', $fields ) ) {
			// Same as post_parent, expose as integer.
			$data['menu_order'] = (int) $menu_item->menu_order;
		}

		if ( rest_is_field_included( 'menu_id', $fields ) ) {
			$data['menu_id'] = $this->get_menu_id( $menu_item->ID );
		}

		if ( rest_is_field_included( 'target', $fields ) ) {
			$data['target'] = $menu_item->target;
		}

		if ( rest_is_field_included( 'classes', $fields ) ) {
			$data['classes'] = (array) $menu_item->classes;
		}

		if ( rest_is_field_included( 'xfn', $fields ) ) {
			$data['xfn'] = array_map( 'sanitize_html_class', explode( ' ', $menu_item->xfn ) );
		}

		if ( rest_is_field_included( 'invalid', $fields ) ) {
			$data['invalid'] = (bool) $menu_item->_invalid;
		}

		if ( rest_is_field_included( 'meta', $fields ) ) {
			$data['meta'] = $this->meta->get_value( $menu_item->ID, $request );
		}

		$taxonomies = wp_list_filter( get_object_taxonomies( $this->post_type, 'objects' ), array( 'show_in_rest' => true ) );

		foreach ( $taxonomies as $taxonomy ) {
			$base = ! empty( $taxonomy->rest_base ) ? $taxonomy->rest_base : $taxonomy->name;

			if ( rest_is_field_included( $base, $fields ) ) {
				$terms    = get_the_terms( $post, $taxonomy->name );
				$term_ids = $terms ? array_values( wp_list_pluck( $terms, 'term_id' ) ) : array();
				if ( 'nav_menu' === $taxonomy->name ) {
					$data[ $base ] = $term_ids ? array_shift( $term_ids ) : 0;
				} else {
					$data[ $base ] = $term_ids;
				}
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		$links = $this->prepare_links( $menu_item );
		$response->add_links( $links );

		if ( ! empty( $links['self']['href'] ) ) {
			$actions = $this->get_available_actions( $menu_item, $request );

			$self = $links['self']['href'];

			foreach ( $actions as $rel ) {
				$response->add_link( $rel, $self );
			}
		}

		/**
		 * Filters the post data for a response.
		 *
		 * The dynamic portion of the hook name, `$this->post_type`, refers to the post type slug.
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param object           $post     Post object.
		 * @param WP_REST_Request  $request  Request object.
		 */
		return apply_filters( "rest_prepare_{$this->post_type}", $response, $post, $request );
	}

	/**
	 * Prepares links for the request.
	 *
	 * @param object $menu_item Menu object.
	 *
	 * @return array Links for the given post.
	 */
	protected function prepare_links( $menu_item ) {
		$links = parent::prepare_links( $menu_item );

		if ( 'post_type' === $menu_item->type && ! empty( $menu_item->object_id ) ) {
			$post_type_object = get_post_type_object( $menu_item->object );
			if ( $post_type_object->show_in_rest ) {
				$rest_base                           = ! empty( $post_type_object->rest_base ) ? $post_type_object->rest_base : $post_type_object->name;
				$url                                 = rest_url( sprintf( 'wp/v2/%s/%d', $rest_base, $menu_item->object_id ) );
				$links['https://api.w.org/object'][] = array(
					'href'       => $url,
					'post_type'  => $menu_item->type,
					'embeddable' => true,
				);
			}
		} elseif ( 'taxonomy' === $menu_item->type && ! empty( $menu_item->object_id ) ) {
			$taxonomy_object = get_taxonomy( $menu_item->object );
			if ( $taxonomy_object->show_in_rest ) {
				$rest_base                           = ! empty( $taxonomy_object->rest_base ) ? $taxonomy_object->rest_base : $taxonomy_object->name;
				$url                                 = rest_url( sprintf( 'wp/v2/%s/%d', $rest_base, $menu_item->object_id ) );
				$links['https://api.w.org/object'][] = array(
					'href'       => $url,
					'taxonomy'   => $menu_item->type,
					'embeddable' => true,
				);
			}
		}

		return $links;
	}

	/**
	 * Retrieve Link Description Objects that should be added to the Schema for the posts collection.
	 *
	 * @return array
	 */
	protected function get_schema_links() {
		$links   = parent::get_schema_links();
		$href    = rest_url( "{$this->namespace}/{$this->rest_base}/{id}" );
		$links[] = array(
			'rel'          => 'https://api.w.org/object',
			'title'        => __( 'Get linked object.', 'gutenberg' ),
			'href'         => $href,
			'targetSchema' => array(
				'type'       => 'object',
				'properties' => array(
					'object' => array(
						'type' => 'integer',
					),
				),
			),
		);

		return $links;
	}

	/**
	 * Retrieves the term's schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title'   => $this->post_type,
			'type'    => 'object',
		);

		$schema['properties']['title'] = array(
			'description' => __( 'The title for the object.', 'gutenberg' ),
			'type'        => 'object',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				// Note: sanitization implemented in self::prepare_item_for_database().
				'sanitize_callback' => null,
				// Note: validation implemented in self::prepare_item_for_database().
				'validate_callback' => null,
			),
			'properties'  => array(
				'raw'      => array(
					'description' => __( 'Title for the object, as it exists in the database.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'edit' ),
				),
				'rendered' => array(
					'description' => __( 'HTML title for the object, transformed for display.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
			),
		);

		$schema['properties']['id'] = array(
			'description' => __( 'Unique identifier for the object.', 'gutenberg' ),
			'type'        => 'integer',
			'default'     => 0,
			'minimum'     => 0,
			'context'     => array( 'view', 'edit', 'embed' ),
			'readonly'    => true,
		);

		$schema['properties']['type_label'] = array(
			'description' => __( 'Name of type.', 'gutenberg' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'readonly'    => true,
		);

		$schema['properties']['type'] = array(
			'description' => __( 'The family of objects originally represented, such as "post_type" or "taxonomy".', 'gutenberg' ),
			'type'        => 'string',
			'enum'        => array( 'taxonomy', 'post_type', 'post_type_archive', 'custom', 'block' ),
			'context'     => array( 'view', 'edit', 'embed' ),
			'default'     => 'custom',
		);

		$schema['properties']['status'] = array(
			'description' => __( 'A named status for the object.', 'gutenberg' ),
			'type'        => 'string',
			'enum'        => array_keys( get_post_stati( array( 'internal' => false ) ) ),
			'default'     => 'publish',
			'context'     => array( 'view', 'edit', 'embed' ),
		);

		$schema['properties']['parent'] = array(
			'description' => __( 'The ID for the parent of the object.', 'gutenberg' ),
			'type'        => 'integer',
			'minimum'     => 0,
			'default'     => 0,
			'context'     => array( 'view', 'edit', 'embed' ),
		);

		$schema['properties']['attr_title'] = array(
			'description' => __( 'Text for the title attribute of the link element for this menu item.', 'gutenberg' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
		);

		$schema['properties']['classes'] = array(
			'description' => __( 'Class names for the link element of this menu item.', 'gutenberg' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
			),
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => function ( $value ) {
					return array_map( 'sanitize_html_class', wp_parse_list( $value ) );
				},
			),
		);

		$schema['properties']['description'] = array(
			'description' => __( 'The description of this menu item.', 'gutenberg' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_text_field',
			),
		);

		$schema['properties']['menu_order'] = array(
			'description' => __( 'The DB ID of the nav_menu_item that is this item\'s menu parent, if any, otherwise 0.', 'gutenberg' ),
			'context'     => array( 'view', 'edit', 'embed' ),
			'type'        => 'integer',
			'minimum'     => 1,
			'default'     => 1,
		);

		$schema['properties']['object'] = array(
			'description' => __( 'The type of object originally represented, such as "category," "post", or "attachment."', 'gutenberg' ),
			'context'     => array( 'view', 'edit', 'embed' ),
			'type'        => 'string',
		);

		$schema['properties']['object_id'] = array(
			'description' => __( 'The DB ID of the original object this menu item represents, e . g . ID for posts and term_id for categories.', 'gutenberg' ),
			'context'     => array( 'view', 'edit', 'embed' ),
			'type'        => 'integer',
			'minimum'     => 0,
			'default'     => 0,
		);

		$schema['properties']['content'] = array(
			'description' => __( 'HTML content to display for this block menu item.', 'gutenberg' ),
			'context'     => array( 'view', 'edit', 'embed' ),
			'type'        => 'object',
			'arg_options' => array(
				'sanitize_callback' => null, // Note: sanitization implemented in self::prepare_item_for_database().
				'validate_callback' => null, // Note: validation implemented in self::prepare_item_for_database().
			),
			'properties'  => array(
				'raw'           => array(
					'description' => __( 'HTML content, as it exists in the database.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'edit' ),
				),
				'rendered'      => array(
					'description' => __( 'HTML content, transformed for display.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'block_version' => array(
					'description' => __( 'Version of the block format used in the HTML content.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
			),
		);

		$schema['properties']['target'] = array(
			'description' => __( 'The target attribute of the link element for this menu item.', 'gutenberg' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			'enum'        => array(
				'_blank',
				'',
			),
		);

		$schema['properties']['type_label'] = array(
			'description' => __( 'The singular label used to describe this type of menu item.', 'gutenberg' ),
			'context'     => array( 'view', 'edit', 'embed' ),
			'type'        => 'string',
			'readonly'    => true,
		);

		$schema['properties']['url'] = array(
			'description' => __( 'The URL to which this menu item points.', 'gutenberg' ),
			'type'        => 'string',
			'format'      => 'uri',
			'context'     => array( 'view', 'edit', 'embed' ),
		);

		$schema['properties']['xfn'] = array(
			'description' => __( 'The XFN relationship expressed in the link of this menu item.', 'gutenberg' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
			),
			'context'     => array( 'view', 'edit', 'embed' ),
			'arg_options' => array(
				'sanitize_callback' => function ( $value ) {
					return array_map( 'sanitize_html_class', wp_parse_list( $value ) );
				},
			),
		);

		$schema['properties']['invalid'] = array(
			'description' => __( 'Whether the menu item represents an object that no longer exists.', 'gutenberg' ),
			'context'     => array( 'view', 'edit', 'embed' ),
			'type'        => 'boolean',
			'readonly'    => true,
		);

		$taxonomies = wp_list_filter( get_object_taxonomies( $this->post_type, 'objects' ), array( 'show_in_rest' => true ) );

		foreach ( $taxonomies as $taxonomy ) {
			$base                          = ! empty( $taxonomy->rest_base ) ? $taxonomy->rest_base : $taxonomy->name;
			$schema['properties'][ $base ] = array(
				/* translators: %s: taxonomy name */
				'description' => sprintf( __( 'The terms assigned to the object in the %s taxonomy.', 'gutenberg' ), $taxonomy->name ),
				'type'        => 'array',
				'items'       => array(
					'type' => 'integer',
				),
				'context'     => array( 'view', 'edit' ),
			);

			if ( 'nav_menu' === $taxonomy->name ) {
				$schema['properties'][ $base ]['type'] = 'integer';
				unset( $schema['properties'][ $base ]['items'] );
			}
		}

		$schema['properties']['meta'] = $this->meta->get_field_schema();

		$schema_links = $this->get_schema_links();

		if ( $schema_links ) {
			$schema['links'] = $schema_links;
		}

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Retrieves the query params for the posts collection.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();

		$query_params['menu_order'] = array(
			'description' => __( 'Limit result set to posts with a specific menu_order value.', 'gutenberg' ),
			'type'        => 'integer',
		);

		$query_params['order'] = array(
			'description' => __( 'Order sort attribute ascending or descending.', 'gutenberg' ),
			'type'        => 'string',
			'default'     => 'asc',
			'enum'        => array( 'asc', 'desc' ),
		);

		$query_params['orderby'] = array(
			'description' => __( 'Sort collection by object attribute.', 'gutenberg' ),
			'type'        => 'string',
			'default'     => 'menu_order',
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
				'menu_order',
			),
		);
		// Change default to 100 items.
		$query_params['per_page']['default'] = 100;

		return $query_params;
	}

	/**
	 * Determines the allowed query_vars for a get_items() response and prepares
	 * them for WP_Query.
	 *
	 * @param array           $prepared_args Optional. Prepared WP_Query arguments. Default empty array.
	 * @param WP_REST_Request $request       Optional. Full details about the request.
	 *
	 * @return array Items query arguments.
	 */
	protected function prepare_items_query( $prepared_args = array(), $request = null ) {
		$query_args = parent::prepare_items_query( $prepared_args, $request );

		// Map to proper WP_Query orderby param.
		if ( isset( $query_args['orderby'] ) && isset( $request['orderby'] ) ) {
			$orderby_mappings = array(
				'id'            => 'ID',
				'include'       => 'post__in',
				'slug'          => 'post_name',
				'include_slugs' => 'post_name__in',
				'menu_order'    => 'menu_order',
			);

			if ( isset( $orderby_mappings[ $request['orderby'] ] ) ) {
				$query_args['orderby'] = $orderby_mappings[ $request['orderby'] ];
			}
		}

		return $query_args;
	}

	/**
	 * Checks whether current user can assign all terms sent with the current request.
	 *
	 * @param WP_REST_Request $request The request object with post and terms data.
	 *
	 * @return bool Whether the current user can assign the provided terms.
	 */
	protected function check_assign_terms_permission( $request ) {
		$taxonomies = wp_list_filter( get_object_taxonomies( $this->post_type, 'objects' ), array( 'show_in_rest' => true ) );
		foreach ( $taxonomies as $taxonomy ) {
			$base = ! empty( $taxonomy->rest_base ) ? $taxonomy->rest_base : $taxonomy->name;

			if ( ! isset( $request[ $base ] ) ) {
				continue;
			}

			foreach ( (array) $request[ $base ] as $term_id ) {
				if ( ! $term_id ) {
					continue;
				}

				// Invalid terms will be rejected later.
				if ( ! get_term( $term_id, $taxonomy->name ) ) {
					continue;
				}

				if ( ! current_user_can( 'assign_term', (int) $term_id ) ) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Get menu id of current menu item.
	 *
	 * @param int $menu_item_id Menu item id.
	 *
	 * @return int
	 */
	protected function get_menu_id( $menu_item_id ) {
		$menu_ids = wp_get_post_terms( $menu_item_id, 'nav_menu', array( 'fields' => 'ids' ) );
		$menu_id  = 0;
		if ( $menu_ids && ! is_wp_error( $menu_ids ) ) {
			$menu_id = array_shift( $menu_ids );
		}

		return $menu_id;
	}
}
