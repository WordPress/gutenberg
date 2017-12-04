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
	 * Constructs the controller.
	 *
	 * @since [version]
	 * @access public
	 */
	public function __construct() {
		parent::__construct( gutenberg_annotation_post_type() );

		// `rest_base` is already configured via register_post_type().
		$this->namespace = 'gutenberg/v1'; // @codingStandardsIgnoreLine - PHPCS false positive on 'namespace'.

	}

	/*
     * @TODO hierarchical responses like comments.
	 */

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
			return $parent_check; // parent class ;-).
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

		foreach ( $parent_ids as $parent_id ) {
			if ( ! WP_Annotation_Utils::user_can_edit_parent_post( $parent_id ) ) {
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
