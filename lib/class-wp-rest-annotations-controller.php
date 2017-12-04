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
 * Annotations are stored as comments with a custom comment type.
 *
 * @since [version]
 *
 * @see WP_REST_Controller
 * @see WP_REST_Comments_Controller
 */
class WP_REST_Annotations_Controller extends WP_REST_Comments_Controller {
	/**
	 * Constructor.
	 *
	 * Overrides parent method and sets a custom REST base.
	 *
	 * @since [version]
	 *
	 * @see WP_REST_Comments_Controller::__construct()
	 */
	public function __construct() {
		// phpcs:ignore PHPCompatibility.PHP.NewKeywords.t_namespaceFound — mistaken as 'namespace' keyword.
		$this->namespace = 'wp/v2'; // @codingStandardsIgnoreLine
		$this->rest_base = 'annotations';

		$this->meta = new WP_REST_Comment_Meta_Fields();
	}

	/**
	 * Retrieves annotation schema.
	 *
	 * Overrides parent method and makes 'type' writable. Also adds default values &
	 * validators for the 'type' and 'status' fields.
	 *
	 * @since [version]
	 *
	 * @return array Annotation schema.
	 *
	 * @see WP_REST_Comments_Controller::get_item_schema()
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['type']     = array(
			'type'        => 'string',
			'arg_options' => array(
				'validate_callback' => 'WP_Annotation_Utils::is_valid_type',
			),
			'context'     => array( 'view', 'edit', 'embed' ),
			'description' => __( 'Annotation comment type.', 'gutenberg' ),
			'default'     => get_default_annotation_type(),
		);
		$schema['properties']['status']   = array(
			'type'        => 'string',
			'arg_options' => array(
				'validate_callback' => 'WP_Annotation_Utils::is_valid_status_or_action',
			),
			'context'     => array( 'view', 'edit' ),
			'description' => __( 'Annotation status.', 'gutenberg' ),
			'default'     => get_default_annotation_status(),
		);
		$schema['properties']['children'] = array(
			'readonly'    => true,
			'type'        => 'array',
			'items'       => array(
				'type' => 'object',
			),
			'context'     => array( 'view', 'edit' ),
			'description' => __( 'Hierarchical children in threaded format.', 'gutenberg' ),
		);

		return $schema;
	}

	/**
	 * Retrieves additional fields.
	 *
	 * Overrides parent method and adds additional fields specific to annotation comment
	 * types. Note: Intentionally *not* using {@see register_rest_field()} because that
	 * would affect all comment types.
	 *
	 * @since [version]
	 *
	 * @param  string $object_type Optional object type.
	 *
	 * @return array               Additional fields.
	 *
	 * @see WP_REST_Controller::get_collection_params()
	 */
	protected function get_additional_fields( $object_type = null ) {
		$fields = parent::get_additional_fields( $object_type );

		$fields['via'] = array(
			'get_callback'    => array( $this, 'on_get_additional_field' ),
			'update_callback' => array( $this, 'on_update_additional_field' ),
			'schema'          => array(
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
				'description' => __( 'W3C annotation client identifier.', 'gutenberg' ),
				'default'     => '',
			),
		);

		$fields['selector'] = array(
			'get_callback'    => array( $this, 'on_get_additional_field' ),
			'update_callback' => array( $this, 'on_update_additional_field' ),
			'schema'          => array(
				'type'        => 'object',
				'context'     => array( 'view', 'edit' ),
				'description' => __( 'W3C annotation selector.', 'gutenberg' ),

				'properties'  => array(
					'type'                 => array(
						'type'        => 'string',
						'context'     => array( 'view', 'edit' ),
						'enum'        => array(
							'FragmentSelector',
							'CssSelector',
							'XPathSelector',
							'TextQuoteSelector',
							'TextPositionSelector',
							'DataPositionSelector',
							'SvgSelector',
							'RangeSelector',
						),
						'description' => __( 'Type of selector.', 'gutenberg' ),
					),
					'additionalProperties' => true,
				),
				'default'     => array(),
			),
		);

		return $fields;
	}

	/**
	 * Retrieves collection parameters.
	 *
	 * Overrides parent method and adds additional params specific to annotation comment
	 * types. Note: Intentionally *not* using REST API filters because that would affect
	 * all comment types.
	 *
	 * @since [version]
	 *
	 * @return array Collection parameters.
	 *
	 * @see WP_REST_Comments_Controller::get_collection_params()
	 */
	public function get_collection_params() {
		$params = parent::get_collection_params();

		$params['post'] = array(
			'type'              => 'array',
			'description'       => __( 'Post ID(s).', 'gutenberg' ),
			'items'             => array(
				'type' => 'integer',
			),
			'required'          => true,
			'validate_callback' => array( $this, 'validate_post_collection_param' ),
		);

		$params['type'] = array(
			'type'              => 'array',
			'description'       => __( 'Annotation type(s).', 'gutenberg' ),
			'items'             => array(
				'type' => 'string',
				'enum' => get_annotation_types(),
			),
			'default'           => array( get_default_annotation_type() ),
			'validate_callback' => array( $this, 'validate_type_collection_param' ),
		);

		$params['status'] = array(
			'type'              => 'array',
			'description'       => __( 'Annotation status(es).', 'gutenberg' ),
			'items'             => array(
				'type' => 'string',
			),
			'default'           => array( 'approve' ),
			'validate_callback' => array( $this, 'validate_status_collection_param' ),
		);

		$params['via'] = array(
			'type'              => 'array',
			'description'       => __( 'W3C annotation client identifier(s).', 'gutenberg' ),
			'items'             => array(
				'type' => 'string',
			),
			'validate_callback' => array( $this, 'validate_via_collection_param' ),
		);

		$params['hierarchical'] = array(
			'type'        => 'string',
			'description' => __( 'Results in hierarchical format?', 'gutenberg' ),
			'enum'        => array( '', 'flat', 'threaded' ),
		);

		return $params;
	}

	/**
	 * Validates 'post' collection parameter.
	 *
	 * @since [version]
	 *
	 * @param  int|array $posts Post IDs.
	 *
	 * @return WP_Error|bool    True if valid, {@see WP_Error} otherwise.
	 */
	public function validate_post_collection_param( $posts ) {
		if ( ! is_array( $posts ) ) {
			$posts = preg_split( '/[\s,]+/', (string) $posts );
		}

		if ( ! $posts || ! wp_is_numeric_array( $posts ) ) {
			return new WP_Error( 'rest_annotation_invalid_array_param_post', __( 'Invalid post(s).', 'gutenberg' ) );
		}

		foreach ( $posts as $post ) {
			if ( (string) absint( $post ) !== (string) $post || 0 >= $post ) {
				return new WP_Error( 'rest_annotation_invalid_param_post', __( 'Invalid post.', 'gutenberg' ) );
			}
		}

		return true;
	}

	/**
	 * Validates 'type' collection parameter.
	 *
	 * @since [version]
	 *
	 * @param  string|array $types Annotation comment types.
	 *
	 * @return WP_Error|bool       True if valid, {@see WP_Error} otherwise.
	 */
	public function validate_type_collection_param( $types ) {
		if ( ! is_array( $types ) ) {
			$types = preg_split( '/[\s,]+/', (string) $types );
		}

		if ( ! $types || ! wp_is_numeric_array( $types ) ) {
			return new WP_Error( 'rest_annotation_invalid_array_param_type', __( 'Invalid type(s).', 'gutenberg' ) );
		}

		foreach ( $types as $type ) {
			if ( ! WP_Annotation_Utils::is_valid_type( $type ) ) {
				return new WP_Error( 'rest_annotation_invalid_param_type', __( 'Invalid type.', 'gutenberg' ) );
			}
		}

		return true;
	}

	/**
	 * Validates 'status' collection parameter.
	 *
	 * @since [version]
	 *
	 * @param  string|array $statuses Annotation comment statuses.
	 *
	 * @return WP_Error|bool          True if valid, {@see WP_Error} otherwise.
	 */
	public function validate_status_collection_param( $statuses ) {
		if ( ! is_array( $statuses ) ) {
			$statuses = preg_split( '/[\s,]+/', (string) $statuses );
		}

		if ( ! $statuses || ! wp_is_numeric_array( $statuses ) ) {
			return new WP_Error( 'rest_annotation_invalid_array_param_status', __( 'Invalid status(es).', 'gutenberg' ) );
		}

		foreach ( $statuses as $status ) {
			if ( ! WP_Annotation_Utils::is_valid_status( $status ) ) {
				return new WP_Error( 'rest_annotation_invalid_param_status', __( 'Invalid status.', 'gutenberg' ) );
			}
		}

		return true;
	}

	/**
	 * Validates the 'via' collection parameter.
	 *
	 * @since [version]
	 *
	 * @param  string|array $vias W3C annotation client identifier(s).
	 *
	 * @return WP_Error|bool      True if valid, {@see WP_Error} otherwise.
	 */
	public function validate_via_collection_param( $vias ) {
		if ( ! is_array( $vias ) ) {
			$vias = preg_split( '/[\s,]+/', (string) $vias );
		}

		if ( ! $vias || ! wp_is_numeric_array( $vias ) ) {
			return new WP_Error( 'rest_annotation_invalid_array_param_via', __( 'Invalid client identifier(s).', 'gutenberg' ) );
		}

		foreach ( $vias as $via ) {
			if ( ! WP_Annotation_Utils::is_valid_client( $via ) ) {
				return new WP_Error( 'rest_annotation_invalid_param_via', __( 'Invalid client identifier.', 'gutenberg' ) );
			}
		}

		return true;
	}

	/**
	 * Gets an additional field value.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment|array $comment Comment data.
	 * @param  string           $field   Name of the field to get.
	 * @param  WP_Rest_Request  $request Full REST API request details.
	 *
	 * @return mixed|null                Current value, null otherwise.
	 *
	 * @see WP_REST_Annotations_Controller::get_additional_fields()
	 */
	public function on_get_additional_field( $comment, $field, $request ) {
		if ( $comment instanceof WP_Comment ) {
			$comment_id = $comment->comment_ID;
		} elseif ( ! empty( $comment['id'] ) ) {
			$comment_id = $comment['id'];
		}

		if ( empty( $comment_id ) ) {
			return null;
		}

		$value = get_comment_meta( $comment_id, '_' . $field, true );

		switch ( $field ) {
			case 'via':
				return is_string( $value ) ? $value : '';

			case 'selector':
				return is_array( $value ) ? $value : array();
		}

		return null;
	}

	/**
	 * Updates an additional field value.
	 *
	 * @since [version]
	 *
	 * @param  string           $value   New field value.
	 * @param  WP_Comment|array $comment Comment data.
	 * @param  string           $field   Name of the field to update.
	 * @param  WP_Rest_Request  $request Full REST API request details.
	 *
	 * @return bool|WP_Error             {@see WP_Error} on failure, null otherwise.
	 *
	 * @see WP_REST_Annotations_Controller::get_additional_fields()
	 */
	public function on_update_additional_field( $value, $comment, $field, $request ) {
		// translators: %s is a REST API field name associated with failure.
		$error = __( 'Validation failure. Failed to update: %s.', 'gutenberg' );
		$error = new WP_Error( 'rest_annotation_field_validation_update_failure', sprintf( $error, $field ), array( 'status' => 400 ) );

		if ( $comment instanceof WP_Comment ) {
			$comment_id = $comment->comment_ID;
		} elseif ( ! empty( $comment['id'] ) ) {
			$comment_id = $comment['id'];
		}

		if ( empty( $comment_id ) ) {
			return $error;
		}

		switch ( $field ) {
			case 'via':
				if ( ! WP_Annotation_Utils::is_valid_client( $value ) ) {
					return $error;
				}
				return update_comment_meta( $comment_id, '_' . $field, $value );

			case 'selector':
				if ( ! WP_Annotation_Utils::is_valid_selector( $value ) ) {
					return $error;
				}
				return update_comment_meta( $comment_id, '_' . $field, $value );
		}

		return $error;
	}

	/**
	 * Prepares a comment for DB insertion.
	 *
	 * Overrides parent method and handles 'comment_type'.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request Full REST API request details.
	 *
	 * @return array|WP_Error           Prepared comment, {@see WP_Error} otherwise.
	 *
	 * @see WP_REST_Comments_Controller::prepare_item_for_database()
	 */
	protected function prepare_item_for_database( $request ) {
		$prepared_comment = parent::prepare_item_for_database( $request );

		if ( is_wp_error( $prepared_comment ) ) {
			return $prepared_comment;
		}

		if ( isset( $request['type'] ) ) {
			$prepared_comment['comment_type'] = $request['type'];
		}

		if ( isset( $prepared_comment['comment_content'] ) ) {
			/** This filter is documented in wp-includes/comment.php */
			$filtered_content = wp_slash( $prepared_comment['comment_content'] );
			$filtered_content = apply_filters( 'pre_comment_content', $filtered_content );
			$filtered_content = wp_unslash( $filtered_content );

			if ( WP_Annotation_Utils::is_content_empty( $prepared_comment['comment_content'] )
					|| WP_Annotation_Utils::is_content_empty( $filtered_content ) ) {
				return new WP_Error( 'rest_missing_annotation_content', __( 'Content empty.', 'gutenberg' ), array( 'status' => 400 ) );
			}
		}

		return $prepared_comment;
	}

	/**
	 * Prepares an annotation response.
	 *
	 * Overrides parent method and handles 'children'.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment      $comment Comment object.
	 * @param  WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response         Response object.
	 */
	public function prepare_item_for_response( $comment, $request ) {
		$response = parent::prepare_item_for_response( $comment, $request );

		if ( 'threaded' === $request['hierarchical'] ) {
			$data             = $response->get_data();
			$data['children'] = array();

			foreach ( $comment->get_children() as $child_comment ) {
				$child_response       = $this->prepare_item_for_response( $child_comment, $request );
				$child_data           = $child_response->get_data();
				$child_data['_links'] = $child_response->get_links();
				$data['children'][]   = $child_data;
			}

			$response->set_data( $data );
		}

		return $response;
	}

	/**
	 * Sets a comment's status.
	 *
	 * Overrides parent method and handles custom statuses.
	 *
	 * @since [version]
	 *
	 * @param  string|int $new_status New status.
	 * @param  int        $comment_id Comment ID.
	 *
	 * @return bool                   True if status changed.
	 *
	 * @see WP_REST_Comments_Controller::handle_status_param()
	 */
	protected function handle_status_param( $new_status, $comment_id ) {
		$old_status = WP_Annotation_Utils::get_comment_status( $comment_id );

		if ( $new_status === $old_status ) {
			return false;
		}

		switch ( $new_status ) {
			case 'approved':
			case 'approve':
			case '1':
				return wp_set_comment_status( $comment_id, 'approve' );

			case 'hold':
			case '0':
				return wp_set_comment_status( $comment_id, 'hold' );

			case 'spam':
				return wp_spam_comment( $comment_id );

			case 'unspam': // Supports custom restoration statuses.
				return WP_Annotation_Utils::unspam_comment( $comment_id );

			case 'trash':
				return wp_trash_comment( $comment_id );

			case 'untrash': // Supports custom restoration statuses.
				return WP_Annotation_Utils::untrash_comment( $comment_id );

			default: // Supports custom statuses.
				return WP_Annotation_Utils::set_comment_status( $comment_id, $new_status );
		}

		return false;
	}

	/**
	 * Creates a comment; i.e., an annotation.
	 *
	 * Overrides parent method and allows comment 'type'. Excludes the front-end {@see
	 * wp_allow_comment()} check paranoia. Handles response 'context' differently by
	 * checking annotation permissions.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request  Full REST API request details.
	 *
	 * @return WP_Error|WP_REST_Response Response object, {@see WP_Error} otherwise.
	 *
	 * @see WP_REST_Comments_Controller::create_item()
	 */
	public function create_item( $request ) {
		if ( $request['id'] ) {
			return new WP_Error( 'rest_readonly_annotation_param_id', __( 'ID is read-only.', 'gutenberg' ), array( 'status' => 400 ) );
		}

		$prepared_comment = $this->prepare_item_for_database( $request );

		if ( is_wp_error( $prepared_comment ) ) {
			return $prepared_comment;
		}

		if ( empty( $prepared_comment['comment_content'] ) ) {
			return new WP_Error( 'rest_missing_annotation_content', __( 'Content empty.', 'gutenberg' ), array( 'status' => 400 ) );
		}

		if ( ! isset( $prepared_comment['comment_date_gmt'] ) ) {
			$prepared_comment['comment_date_gmt'] = current_time( 'mysql', true );
		}

		$missing_author = empty( $prepared_comment['user_id'] )
			&& empty( $prepared_comment['comment_author'] )
			&& empty( $prepared_comment['comment_author_email'] )
			&& empty( $prepared_comment['comment_author_url'] );

		if ( $missing_author && is_user_logged_in() ) {
			$user = wp_get_current_user();

			$prepared_comment['user_id']              = $user->ID;
			$prepared_comment['comment_author']       = $user->display_name;
			$prepared_comment['comment_author_email'] = $user->user_email;
			$prepared_comment['comment_author_url']   = $user->user_url;
		}

		if ( empty( $prepared_comment['comment_author'] ) || empty( $prepared_comment['comment_author_email'] ) ) {
			if ( get_option( 'require_name_email' ) ) {
				return new WP_Error( 'rest_missing_annotation_author_data', __( 'Missing author data.', 'gutenberg' ), array( 'status' => 400 ) );
			}
		}

		if ( ! isset( $prepared_comment['comment_author_email'] ) ) {
			$prepared_comment['comment_author_email'] = '';
		}

		if ( ! isset( $prepared_comment['comment_author_url'] ) ) {
			$prepared_comment['comment_author_url'] = '';
		}

		if ( ! isset( $prepared_comment['comment_agent'] ) ) {
			$prepared_comment['comment_agent'] = '';
		}

		$check_comment_lengths = wp_check_comment_data_max_lengths( $prepared_comment );

		if ( is_wp_error( $check_comment_lengths ) ) {
			return new WP_Error( $check_comment_lengths->get_error_code(), __( 'Comment field exceeds maximum length allowed.', 'gutenberg' ), array( 'status' => 400 ) );
		}

		/** This filter is documented in wp-includes/rest-api/class-wp-rest-comments-controller.php */
		$prepared_comment = apply_filters( 'rest_pre_insert_comment', $prepared_comment, $request );

		if ( is_wp_error( $prepared_comment ) ) {
			return $prepared_comment;
		}

		$comment_id = wp_insert_comment( wp_filter_comment( wp_slash( (array) $prepared_comment ) ) );

		if ( ! $comment_id ) {
			return new WP_Error( 'rest_annotation_insert_failure', __( 'Annotation insertion failure.', 'gutenberg' ), array( 'status' => 500 ) );
		}

		if ( isset( $request['status'] ) ) {
			$this->handle_status_param( $request['status'], $comment_id );
		}

		$comment = get_comment( $comment_id );

		if ( ! $comment ) {
			return new WP_Error( 'rest_annotation_insert_retrieve_failure', __( 'Annotation insert/retrieve failure.', 'gutenberg' ), array( 'status' => 500 ) );
		}

		/** This action is documented in wp-includes/rest-api/class-wp-rest-comments-controller.php */
		do_action( 'rest_insert_comment', $comment, $request, true );

		$schema = $this->get_item_schema();

		if ( ! empty( $schema['properties']['meta'] ) && isset( $request['meta'] ) ) {
			$meta_update = $this->meta->update_value( $request['meta'], $comment_id );

			if ( is_wp_error( $meta_update ) ) {
				return $meta_update;
			}
		}

		$fields_update = $this->update_additional_fields_for_object( $comment, $request );

		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		$request->set_param( 'context', current_user_can( 'edit_annotation', $comment->comment_ID ) ? 'edit' : 'view' );

		$response = $this->prepare_item_for_response( $comment, $request );
		$response = rest_ensure_response( $response );

		$response->set_status( 201 );

		// phpcs:ignore PHPCompatibility.PHP.NewKeywords.t_namespaceFound — mistaken as 'namespace' keyword.
		$response->header( 'Location', rest_url( sprintf( '%s/%s/%d', $this->namespace, $this->rest_base, $comment_id ) ) ); // @codingStandardsIgnoreLine

		return $response;
	}

	/**
	 * Checks if request has access to create an item.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request Full REST API request details.
	 *
	 * @return bool|WP_Error            True if request has access to create,
	 *                                  {@see WP_Error} otherwise.
	 *
	 * @see WP_REST_Comments_Controller::create_item_permissions_check()
	 */
	public function create_item_permissions_check( $request ) {
		$post_id        = (int) $request['post'];
		$type           = (string) $request['type'];
		$status         = (string) $request['status'];
		$parent_id      = (int) $request['parent'];
		$default_params = $request->get_default_params();

		/*
		 * Check request method in case of {@see rest_send_allow_header()}.
		 */
		if ( 'POST' !== $request->get_method() ) {
			return new WP_Error( 'rest_annotation_unexpected_request', __( 'Unexpected request.', 'gutenberg' ), array( 'status' => 400 ) );
		}

		/*
		 * Check basic permissions.
		 */
		if ( ! $post_id || ! $this->check_read_post_permission( $post_id, $request ) ) {
			return new WP_Error( 'rest_cannot_read_annotation_post', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		if ( ! $type || ! current_user_can( 'create_annotation', $post_id, $type ) ) {
			return new WP_Error( 'rest_cannot_create_annotation', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		if ( $parent_id && ! current_user_can( 'read_annotation', $parent_id ) ) {
			return new WP_Error( 'rest_cannot_read_annotation_parent', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		/*
		 * These fields are readonly.
		 */
		foreach ( array(
			'id',
		) as $param ) {
			if ( isset( $request[ $param ] ) && ( ! isset( $default_params[ $param ] ) || $request[ $param ] !== $default_params[ $param ] ) ) {
				return new WP_Error( 'rest_readonly_annotation_param_' . $param, __( 'Read-only param.', 'gutenberg' ), array( 'status' => 400 ) );
			}
		}

		/*
		 * In case of a plugin altering permissions in such a way that annotations can be
		 * created but not edited. If you can't edit annotations, we don't allow the date to be
		 * set when creating an annotation.
		 */
		if ( ! current_user_can( 'edit_annotations', $type ) ) {
			foreach ( array(
				'date',
				'date_gmt',
			) as $param ) {
				if ( isset( $request[ $param ] ) && ( ! isset( $default_params[ $param ] ) || $request[ $param ] !== $default_params[ $param ] ) ) {
					return new WP_Error( 'rest_forbidden_annotation_param_' . $param, __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
				}
			}
		}

		/*
		 * Impersonating a user requires the ability to edit the annotations of others. Note
		 * that it's still possible to set `author_name`, `author_email`, `author_url` though.
		 */
		if ( ! current_user_can( 'edit_others_annotations', $type ) ) {
			foreach ( array(
				'author',
				'author_ip',
				'author_user_agent',
			) as $param ) {
				if ( isset( $request[ $param ] ) && ( ! isset( $default_params[ $param ] ) || $request[ $param ] !== $default_params[ $param ] ) ) {
					return new WP_Error( 'rest_forbidden_annotation_param_' . $param, __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
				}
			}

			$allow_statuses = array( 'approved', 'approve', '1' );
			$allow_statuses = array_merge( $allow_statuses, get_annotation_statuses( 'custom' ) );

			if ( ! in_array( $status, $allow_statuses, true ) ) {
				return new WP_Error( 'rest_forbidden_annotation_param_status', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
			}
		}

		return true;
	}

	/**
	 * Checks if request has access to read items.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request Full REST API request details.
	 *
	 * @return bool|WP_Error            True if request has access to read,
	 *                                  {@see WP_Error} otherwise.
	 *
	 * @see WP_REST_Comments_Controller::get_items_permissions_check()
	 */
	public function get_items_permissions_check( $request ) {
		$post_ids       = (array) $request['post'];
		$types          = (array) $request['type'];
		$statuses       = (array) $request['status'];
		$default_params = $request->get_default_params();

		/*
		 * Check request method in case of {@see rest_send_allow_header()}.
		 */
		if ( 'GET' !== $request->get_method() ) {
			return new WP_Error( 'rest_annotation_unexpected_request', __( 'Unexpected request.', 'gutenberg' ), array( 'status' => 400 ) );
		}

		/*
		 * Collection params required to check permissions. These should not be empty given
		 * schema validations, but it's good to do a sanity check before going any further.
		 */
		if ( ! $post_ids || ! $types || ! $statuses ) {
			return new WP_Error( 'rest_missing_annotation_params', __( 'Unexpected request.', 'gutenberg' ), array( 'status' => 400 ) );
		}

		/*
		 * Check all post and annotation type combinations.
		 */
		foreach ( $post_ids as $post_id ) {
			if ( ! $post_id || ! $this->check_read_post_permission( $post_id, $request ) ) {
				return new WP_Error( 'rest_cannot_read_annotations_post', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
			}

			foreach ( $types as $type ) {
				if ( ! $type || ! current_user_can( 'read_annotations', $post_id, $type ) ) {
					return new WP_Error( 'rest_cannot_read_annotations', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
				}
			}
		}

		/*
		 * Check permissions against all annotation types.
		 */
		foreach ( $types as $type ) {
			/*
			 * Guards `context` and some restricted statuses.
			 */
			if ( ! current_user_can( 'edit_annotations', $type ) ) {
				if ( 'edit' === $request['context'] ) {
					return new WP_Error( 'rest_forbidden_annotations_context', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
				}

				$allow_statuses = array( 'approved', 'approve', '1' );
				$allow_statuses = array_merge( $allow_statuses, get_annotation_statuses( 'custom' ) );

				if ( array_diff( $statuses, $allow_statuses ) ) {
					return new WP_Error( 'rest_forbidden_annotation_param_status', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
				}
			}

			/*
			 * The goal here is to prevent non-administrative users from looking at another user's
			 * history. The `author`, `author_exclude`, and `author_email` parameters are also
			 * guarded in core, in a similar way for comments. A useful exception to this rule is
			 * that any user who can edit, can list their own annotations. Note the
			 * `$is_current_user_query` variable below.
			 *
			 * In addition, some statuses are restricted too.
			 */
			if ( ! current_user_can( 'edit_others_annotations', $type ) ) {
				$current_user_id       = get_current_user_id();
				$current_user_can_edit = current_user_can( 'edit_annotations', $type );
				$is_current_user_query = $current_user_id && array( $current_user_id ) === $request['author'];

				foreach ( array(
					'author',
					'author_exclude',
					'author_email',
				) as $param ) {
					if ( ! isset( $request[ $param ] ) ) {
						continue;
					} elseif ( isset( $default_params[ $param ] )
							&& $request[ $param ] === $default_params[ $param ] ) {
						continue;
					}
					if ( 'author' === $param ) {
						if ( ! $is_current_user_query || ! $current_user_can_edit ) {
							return new WP_Error( 'rest_forbidden_annotations_param_' . $param, __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
						}
					} else {
						return new WP_Error( 'rest_forbidden_annotations_param_' . $param, __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
					}
				}

				$allow_statuses = array( 'approved', 'approve', '1' );
				$allow_statuses = array_merge( $allow_statuses, get_annotation_statuses( 'custom' ) );

				if ( $is_current_user_query && $current_user_can_edit ) {
					$allow_statuses[] = 'trash'; // A user can view their own trash.
				}

				if ( array_diff( $statuses, $allow_statuses ) ) {
					return new WP_Error( 'rest_forbidden_annotations_param_status', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
				}
			}
		}

		return true;
	}

	/**
	 * Checks if request has access to read an item.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request Full REST API request details.
	 *
	 * @return bool|WP_Error            True if request has read access,
	 *                                  {@see WP_Error} otherwise.
	 *
	 * @see WP_REST_Comments_Controller::get_item_permissions_check()
	 */
	public function get_item_permissions_check( $request ) {
		$id      = $request['id'];
		$comment = $id ? get_comment( $id ) : null;
		$post_id = $comment ? absint( $comment->comment_post_ID ) : 0;

		/*
		 * Check basic permissions.
		 */
		if ( ! $post_id || ! $this->check_read_post_permission( $post_id, $request ) ) {
			return new WP_Error( 'rest_cannot_read_annotation_post', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		if ( ! $comment || ! current_user_can( 'read_annotation', $comment->comment_ID ) ) {
			return new WP_Error( 'rest_cannot_read_annotation', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		if ( 'edit' === $request['context'] && ! current_user_can( 'edit_annotation', $comment->comment_ID ) ) {
			return new WP_Error( 'rest_forbidden_annotation_context', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	/**
	 * Checks if request has access to update an item.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request Full REST API request details.
	 *
	 * @return bool|WP_Error            True if request has access to update,
	 *                                  {@see WP_Error} otherwise.
	 *
	 * @see WP_REST_Comments_Controller::update_item_permissions_check()
	 */
	public function update_item_permissions_check( $request ) {
		$id      = $request['id'];
		$comment = $id ? get_comment( $id ) : null;
		$post_id = $comment ? absint( $comment->comment_post_ID ) : 0;

		/*
		 * Check basic permissions.
		 */
		if ( ! $post_id || ! $this->check_read_post_permission( $post_id, $request ) ) {
			return new WP_Error( 'rest_cannot_read_annotation_post', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		if ( ! $comment || ! current_user_can( 'edit_annotation', $comment->comment_ID ) ) {
			return new WP_Error( 'rest_cannot_update_annotation', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		/*
		 * These fields are readonly.
		 */
		foreach ( array(
			'id'     => 'comment_ID',
			'post'   => 'comment_post_ID',
			'type'   => 'comment_type',
			'parent' => 'comment_parent',
		) as $param => $prop ) {
			if ( in_array( $param, array( 'id', 'post', 'parent' ), true ) ) {
				if ( isset( $request[ $param ] ) && $request[ $param ] !== (int) $comment->{$prop} ) {
					return new WP_Error( 'rest_cannot_update_annotation_param_' . $param, __( 'Read-only param.', 'gutenberg' ), array( 'status' => 400 ) );
				}
			} elseif ( isset( $request[ $param ] ) && $request[ $param ] !== $comment->{$prop} ) {
				return new WP_Error( 'rest_cannot_update_annotation_param_' . $param, __( 'Read-only param.', 'gutenberg' ), array( 'status' => 400 ) );
			}
		}

		/*
		 * These fields are restricted to admins/editors only
		 */
		if ( ! current_user_can( 'edit_others_annotations', $comment->comment_type ) ) {
			foreach ( array(
				'author'            => 'user_id',
				'author_name'       => 'comment_author',
				'author_email'      => 'comment_author_email',
				'author_ip'         => 'comment_author_IP',
				'author_user_agent' => 'comment_agent',
				'author_url'        => 'comment_author_url',
			) as $param => $prop ) {
				if ( isset( $request[ $param ] ) && $request[ $param ] !== $comment->{$prop} ) {
					return new WP_Error( 'rest_forbidden_annotation_param_' . $param, __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
				}
			}

			if ( isset( $request['status'] ) ) {
				$allow_statuses = array( 'approved', 'approve', '1' );
				$allow_statuses = array_merge( $allow_statuses, get_annotation_statuses( 'custom' ) );

				if ( current_user_can( 'delete_annotation', $comment->comment_ID ) ) {
					$allow_statuses[] = 'trash'; // The user can trash also.
				}

				if ( ! in_array( $request['status'], $allow_statuses, true ) ) {
					return new WP_Error( 'rest_forbidden_annotation_param_status', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
				}
			}
		}

		return true;
	}

	/**
	 * Checks if request has access to delete an item.
	 *
	 * @since [version]
	 *
	 * @param  WP_REST_Request $request Full REST API request details.
	 *
	 * @return bool|WP_Error            True if request has access to delete,
	 *                                  {@see WP_Error} otherwise.
	 *
	 * @see WP_REST_Comments_Controller::delete_item_permissions_check()
	 */
	public function delete_item_permissions_check( $request ) {
		$id      = $request['id'];
		$comment = $id ? get_comment( $id ) : null;
		$post_id = $comment ? absint( $comment->comment_post_ID ) : 0;

		/*
		 * Check basic permissions.
		 */
		if ( ! $post_id || ! $this->check_read_post_permission( $post_id, $request ) ) {
			return new WP_Error( 'rest_cannot_read_annotation_post', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		if ( ! $comment || ! current_user_can( 'delete_annotation', $comment->comment_ID ) ) {
			return new WP_Error( 'rest_cannot_delete_annotation', __( 'Sorry, you are not allowed as this user.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	/**
	 * Checks if the post can be read.
	 *
	 * Overrides parent method and supports post object or ID.
	 *
	 * @since [version]
	 *
	 * @param  WP_Post|int     $post    Post object or ID.
	 * @param  WP_REST_Request $request Request data to check.
	 *
	 * @return bool                     True if post can be read.
	 */
	protected function check_read_post_permission( $post, $request ) {
		$post = $post ? get_post( $post ) : null;
		return $post ? parent::check_read_post_permission( $post, $request ) : false;
	}

	/**
	 * Checks if a comment can be read.
	 *
	 * @since [version]
	 *
	 * @param WP_Comment      $comment Comment object.
	 * @param WP_REST_Request $request Full REST API request details.
	 *
	 * @return bool                    True if comment can be read.
	 *
	 * @see WP_REST_Comments_Controller::check_read_permission()
	 */
	protected function check_read_permission( $comment, $request ) {
		return current_user_can( 'read_annotation', $comment->comment_ID );
	}

	/**
	 * Checks if a comment can be edited.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment $comment Comment object.
	 *
	 * @return bool                True if comment can be edited.
	 *
	 * @see WP_REST_Comments_Controller::check_edit_permission()
	 */
	protected function check_edit_permission( $comment ) {
		return current_user_can( 'edit_annotation', $comment->comment_ID );
	}
}
