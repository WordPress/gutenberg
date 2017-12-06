<?php
/**
 * Annotations API: WP_Annotation_Utils class
 *
 * @package gutenberg
 * @since [version]
 */

/**
 * Annotation utilities.
 *
 * @since [version]
 */
final class WP_Annotation_Utils {

	/**
	 * Valid annotation substatuses.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @var string[]
	 */
	public static $substatuses = array(
		'',         // Open.
		'archived', // Archived.
	);

	/**
	 * Registers annotations as a custom post type.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @see gutenberg_register_post_types()
	 */
	public static function register_post_type() {
		register_post_type( gutenberg_annotation_post_type(), array(
			'public'                => false,
			'delete_with_user'      => false,
			'hierarchical'          => true,
			'supports'              => array(
				'author',
				'editor',
				'custom-fields',
			),
			'rest_base'             => 'annotations',
			'rest_controller_class' => 'WP_REST_Annotations_Controller',
			'show_in_rest'          => false, // Gutenberg registers routes.

			'map_meta_cap'          => true,
			'capabilities'          => array(
				// Meta caps.
				'read_post'              => 'read_post',
				'edit_post'              => 'edit_post',
				'delete_post'            => 'delete_post',

				// Primitive/meta caps.
				'create_posts'           => 'edit_posts',

				// Primitive caps used outside map_meta_cap().
				'edit_posts'             => 'edit_posts',
				'edit_others_posts'      => 'edit_others_posts',
				'publish_posts'          => 'edit_posts',            // non-default.
				'read_private_posts'     => 'read_private_posts',

				// Primitive caps used in map_meta_cap().
				'read'                   => 'read',
				'delete_posts'           => 'delete_posts',
				'delete_private_posts'   => 'delete_private_posts',
				'delete_published_posts' => 'delete_posts',          // non-default.
				'delete_others_posts'    => 'delete_others_posts',
				'edit_private_posts'     => 'edit_private_posts',
				'edit_published_posts'   => 'edit_posts',            // non-default.
			),
		) );

		add_filter( 'user_has_cap', array( __CLASS__, 'on_user_has_cap' ), 10, 4 );
	}

	/**
	 * Maybe filter a user's capabilities when checking annotation meta caps.
	 *
	 * An annotation is a post type, so the checks below are in addition to those registered with the post type.
	 * Here, we're focused on meta cap checks and the annotation's parent post ID, because an annotation can be a
	 * child of all other post types. Make sure the non-annotation parent post ID is editable by the user.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param array   $filtered_caps     Associative array of user's filtered caps; e.g., ['edit_posts' => true, ...].
	 * @param array   $required_map_caps Mapped capabilities for possible underlying meta capability.
	 * @param array   $has_cap_args      Numerically indexed array arranged by WP_User::has_cap().
	 * @param WP_User $user              The user object.
	 */
	public static function on_user_has_cap( $filtered_caps, $required_map_caps, $has_cap_args, $user ) {
		$original_cap    = $has_cap_args[0]; // Possible meta cap.
		$meta_cap_obj_id = isset( $has_cap_args[2] ) ? $has_cap_args[2] : 0;

		if ( $meta_cap_obj_id instanceof WP_Post ) {
			$meta_cap_obj_id = $meta_cap_obj_id->ID;
		}
		$meta_cap_obj_id = absint( $meta_cap_obj_id );

		// From map_meta_cap().
		$relevant_meta_caps = array(
			'read_post',
			'read_page',

			'edit_post',
			'edit_page',
			'publish_post',

			'delete_post',
			'delete_page',

			'add_post_meta',
			'edit_post_meta',
			'delete_post_meta',
		);

		// Only dealing with meta caps.
		if ( ! $meta_cap_obj_id || ! in_array( $original_cap, $relevant_meta_caps, true ) ) {
			return $filtered_caps;
		}

		// Only dealing with annotations.
		$post = get_post( $meta_cap_obj_id );
		if ( ! $post || gutenberg_annotation_post_type() !== $post->post_type ) {
			return $filtered_caps;
		}

		// Check if user can edit the annotation's parent post ID.
		if ( ! self::user_can_edit_parent_post( $post, $user ) ) {
			return array(); // Deny; revoke all caps in this check.
		}

		return $filtered_caps;
	}

	/**
	 * Checks if a user can edit an annotation's parent post ID.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  int|WP_Post|null $post      Post ID or object. Defaults to current post.
	 * @param  int|WP_User|null $user      User ID or object. Defaults to current user.
	 * @param  bool             $is_parent Set to true if the $post *is* the parent post you're checking.
	 * @return bool                        True if $post is an annotation, it has a parent post ID,
	 *                                     and the user can edit the annotation's parent post ID.
	 *                                     Or, if $is_parent, $post is not annotation, and user can edit $post.
	 *
	 * @see on_user_has_cap()
	 * @see WP_REST_Annotations_Controller
	 */
	public static function user_can_edit_parent_post( $post = null, $user = null, $is_parent = false ) {
		if ( null === $post ) {
			$post = get_post();
		} elseif ( is_int( $post ) && $post > 0 ) {
			$post = get_post( $post );
		}
		if ( ! ( $post instanceof WP_Post ) ) {
			return false;
		}

		if ( null === $user ) {
			$user = wp_get_current_user();
		} elseif ( is_int( $user ) && $user > 0 ) {
			$user = get_user_by( 'id', $user );
		}
		if ( ! ( $user instanceof WP_User ) ) {
			return false;
		}

		if ( ! $is_parent && gutenberg_annotation_post_type() !== $post->post_type ) {
			return false; // If it's not a known parent, require an annotation.
		} elseif ( $is_parent && gutenberg_annotation_post_type() === $post->post_type ) {
			return false; // If it's a known parent, it shouldn't be an annotation.
		}

		if ( $is_parent ) {
			$parent_post      = $post; // It *is* the parent.
			$parent_post_type = get_post_type_object( $parent_post->post_type );

			if ( $parent_post_type && $user->has_cap( $parent_post_type->cap->edit_post, $parent_post->ID ) ) {
				return true;
			}
		} else {
			$parent_post_id   = (int) get_post_meta( $post->ID, '_parent_post_id', true );
			$parent_post      = $parent_post_id ? get_post( $parent_post_id ) : null;
			$parent_post_type = $parent_post ? get_post_type_object( $parent_post->post_type ) : null;

			if ( $parent_post_id && $parent_post && $parent_post_type
					&& $user->has_cap( $parent_post_type->cap->edit_post, $parent_post->ID ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Registers additional fields.
	 *
	 * @since [version]
	 * @access public
	 */
	public static function register_additional_rest_fields() {
		$post_type = gutenberg_annotation_post_type();
		$contexts  = array( 'view', 'edit' );

		/*
		 * Register additional REST API fields.
		 */

		register_rest_field( $post_type, 'parent_post_id', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'required'    => true,
				'type'        => 'integer',
				'context'     => $contexts,
				'description' => __( 'Parent post ID.', 'gutenberg' ),
			),
		) );

		register_rest_field( $post_type, 'annotator', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'type'        => 'string',
				'context'     => $contexts,
				'description' => sprintf(
					// translators: %s is a regular expression pattern to clarify data requirements.
					__( 'Annotator (plugin, service, other). Requires a non-numeric slug: %s', 'gutenberg' ),
					'^[a-z][a-z0-9_-]*[a-z0-9]$'
				),
			),
		) );

		register_rest_field( $post_type, 'annotator_meta', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'type'        => 'object',
				'context'     => $contexts,
				'description' => __( 'Annotator metadata.', 'gutenberg' ),

				'properties'  => array(
					'display_name' => array(
						'type'        => 'string',
						'context'     => $contexts,
						'description' => __( 'Display name.', 'gutenberg' ),
					),
					'md5_email'    => array(
						'type'        => 'string',
						'context'     => $contexts,
						'description' => __( 'MD5 hash of lowercase email address.', 'gutenberg' ),
					),
				),
			),
		) );

		register_rest_field( $post_type, 'selection', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'type'        => 'object',
				'context'     => $contexts,
				'description' => __( 'Block selection range(s), if applicable.', 'gutenberg' ),

				'properties'  => array(
					'ranges' => array(
						'type'        => 'array',
						'context'     => $contexts,
						'description' => __( 'One or more selection range(s).', 'gutenberg' ),

						'items'       => array(
							'type'        => 'object',
							'context'     => $contexts,
							'description' => __( 'Selection range.', 'gutenberg' ),

							'properties'  => array(
								'begin' => array(
									'type'        => 'object',
									'context'     => $contexts,
									'description' => __( 'Beginning of selection range.', 'gutenberg' ),

									'properties'  => array(
										'offset' => array(
											'type'        => 'integer',
											'context'     => $contexts,
											'description' => __( 'Offset.', 'gutenberg' ),
										),
									),
								),
								'end'   => array(
									'type'        => 'object',
									'context'     => $contexts,
									'description' => __( 'End of selection range.', 'gutenberg' ),

									'properties'  => array(
										'offset' => array(
											'type'        => 'integer',
											'context'     => $contexts,
											'description' => __( 'Offset.', 'gutenberg' ),
										),
									),
								),
							),
						),
					),
				),
			),
		) );

		register_rest_field( $post_type, 'substatus', array(
			'get_callback'    => array( __CLASS__, 'on_get_additional_rest_field' ),
			'update_callback' => array( __CLASS__, 'on_update_additional_rest_field' ),
			'schema'          => array(
				'type'        => 'string',
				'context'     => $contexts,
				'enum'        => self::$substatuses,
				'description' => __( 'Current substatus.', 'gutenberg' ),
			),
		) );

		register_rest_field( $post_type, 'last_substatus_time', array(
			'get_callback' => array( __CLASS__, 'on_get_additional_rest_field' ),
			'schema'       => array(
				'readonly'    => true,
				'type'        => 'integer',
				'context'     => $contexts,
				'description' => __( 'Last substatus change (GMT/UTC timestamp).', 'gutenberg' ),
			),
		) );

		register_rest_field( $post_type, 'substatus_history', array(
			'get_callback' => array( __CLASS__, 'on_get_additional_rest_field' ),
			'schema'       => array(
				'readonly'    => true,
				'type'        => 'array',
				'context'     => $contexts,
				'description' => __( 'Substatus history.', 'gutenberg' ),

				'items'       => array(
					'type'        => 'object',
					'context'     => $contexts,
					'description' => __( 'History entry.', 'gutenberg' ),

					'properties'  => array(
						'identity'      => array(
							'type'        => 'string',
							'context'     => $contexts,
							'description' => sprintf(
								// translators: %s is a regular expression pattern to clarify data requirements.
								__( 'Identity (user or annotator). Numeric ID for a user, or a non-numeric slug for an annotator: %s', 'gutenberg' ),
								'^([0-9]+|[a-z][a-z0-9_-]*[a-z0-9])$'
							),
						),
						'identity_meta' => array(
							'type'        => 'object',
							'context'     => $contexts,
							'description' => __( 'Identity metadata.', 'gutenberg' ),

							'properties'  => array(
								'display_name' => array(
									'type'        => 'string',
									'context'     => $contexts,
									'description' => __( 'Display name.', 'gutenberg' ),
								),
								'md5_email'    => array(
									'type'        => 'string',
									'context'     => $contexts,
									'description' => __( 'MD5 hash of lowercase email address.', 'gutenberg' ),
								),
							),
						),
						'time'          => array(
							'type'        => 'integer',
							'context'     => $contexts,
							'description' => __( 'When substatus changed (GMT/UTC timestamp).', 'gutenberg' ),
						),
						'old'           => array(
							'type'        => 'string',
							'context'     => $contexts,
							'enum'        => self::$substatuses,
							'description' => __( 'Old substatus.', 'gutenberg' ),
						),
						'new'           => array(
							'type'        => 'string',
							'context'     => $contexts,
							'enum'        => self::$substatuses,
							'description' => __( 'New substatus.', 'gutenberg' ),
						),
					),
				),
			),
		) );

		/*
		 * Filters that further implement the fields above.
		 */

		add_filter( 'rest_' . $post_type . '_collection_params', array( __CLASS__, 'on_rest_collection_params' ) );
		add_filter( 'rest_' . $post_type . '_query', array( __CLASS__, 'on_rest_collection_query' ), 10, 2 );
	}

	/**
	 * Adds additional collection parameters to WP_REST_Posts_Controller.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  array $params JSON Schema-formatted collection parameters.
	 * @return array         Filtered JSON Schema-formatted collection parameters.
	 *
	 * @see register_additional_rest_fields()
	 */
	public static function on_rest_collection_params( $params ) {
		$contexts = array( 'view', 'edit' );

		$params['hierarchical'] = array(
			'type'        => 'string',
			'description' => __( 'Results in hierarchical format?', 'gutenberg' ),
			'enum'        => array( '', 'flat', 'threaded' ),
			'default'     => '',
		);

		$params['parent_post_id'] = array(
			'type'        => 'array',
			'description' => __( 'Limit result set to those with one or more parent post IDs.', 'gutenberg' ),
			'items'       => array(
				'type'    => 'integer',
				'context' => $contexts,
			),
			'default'     => array(),
		);

		$params['annotator'] = array(
			'type'        => 'array',
			'description' => __( 'Limit result set to those by one or more annotator IDs.', 'gutenberg' ),
			'items'       => array(
				'type'    => 'string',
				'context' => $contexts,
			),
			'default'     => array(),
		);

		$params['substatus'] = array(
			'type'        => 'array',
			'description' => __( 'Limit result set to those assigned one or more substatuses.', 'gutenberg' ),
			'items'       => array(
				'type'    => 'string',
				'context' => $contexts,
				'enum'    => self::$substatuses,
			),
			'default'     => array( '' ),
		);

		return $params;
	}

	/**
	 * Queries additional collection parameters in WP_REST_Posts_Controller.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param array           $query_vars WP_Query vars.
	 * @param WP_REST_Request $request    REST API request.
	 * @return array                      Filtered query args.
	 *
	 * @see register_additional_rest_fields()
	 */
	public static function on_rest_collection_query( $query_vars, $request ) {
		/*
		 * A hierarchical request sets post_parent to 0 by default.
		 * This behavior matches that found in WP_Comment_Query.
		 */
		if ( $request['hierarchical'] && ! $request['parent'] ) {
			$query_vars['post_parent'] = 0;
		}

		/*
		 * Build meta queries.
		 */
		$meta_queries = array();

		$parent_post_ids = $request['parent_post_id'];
		$parent_post_ids = $parent_post_ids ? (array) $parent_post_ids : array();
		$parent_post_ids = array_map( 'absint', $parent_post_ids );

		if ( $parent_post_ids ) {
			$meta_queries[] = array(
				'key'     => '_parent_post_id',
				'value'   => $parent_post_ids,
				'compare' => 'IN',
			);
		}

		$annotators = $request['annotator'];
		$annotators = $annotators ? (array) $annotators : array();
		$annotators = array_map( 'sanitize_key', $annotators );

		if ( $annotators ) {
			$meta_queries[] = array(
				'key'     => '_annotator',
				'value'   => $annotators,
				'compare' => 'IN',
			);
		}

		$substatuses = $request['substatus'];
		$substatuses = $substatuses ? (array) $substatuses : array();
		$substatuses = array_map( 'sanitize_key', $substatuses );

		if ( $substatuses ) {
			$meta_queries[] = array(
				'key'     => '_substatus',
				'value'   => $substatuses,
				'compare' => 'IN',
			);
		}

		/*
		 * Preserve an existing meta query.
		 */
		if ( $meta_queries ) {
			if ( ! empty( $query_vars['meta_query'] ) ) {
				$query_vars['meta_query'] = array(
					'relation' => 'AND',
					$query_vars['meta_query'],
					array(
						'relation' => 'AND',
						$meta_queries,
					),
				);
			} else {
				$query_vars['meta_query'] = array(
					'relation' => 'AND',
					$meta_queries,
				);
			}
		}

		return $query_vars;
	}

	/**
	 * Callback that gets an additional REST API field value.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  array|WP_Post   $post    Post (annotation).
	 * @param  string          $field   Field name.
	 * @param  WP_Rest_Request $request REST API request.
	 * @return mixed|null               Current value, null otherwise.
	 *
	 * @see register_additional_rest_fields()
	 */
	public static function on_get_additional_rest_field( $post, $field, $request ) {
		/*
		 * There is some inconsistency (array|WP_Post) in the REST API hooks.
		 * Double-checking the $post data type before we begin here.
		 */
		if ( is_array( $post ) ) {
			if ( ! empty( $post['id'] ) ) {
				$post = get_post( $post['id'] );
			} elseif ( ! empty( $post['ID'] ) ) {
				$post = get_post( $post['ID'] );
			}
		}

		$value = get_post_meta( $post->ID, '_' . $field, true );

		switch ( $field ) {
			case 'parent_post_id':
				if ( is_string( $value ) || is_int( $value ) ) {
					return absint( $value );
				}
				return 0;

			case 'annotator':
				if ( is_string( $value ) || is_int( $value ) ) {
					return (string) $value;
				}
				return '';

			case 'annotator_meta':
				/**
				 * Filters default annotator meta.
				 *
				 * @since [version]
				 *
				 * @param array           $defaults As [key => value] pairs.
				 * @param WP_Post         $post     Post (annotation).
				 * @param WP_Rest_Request $request  Current REST API request data.
				 * @param string          $ctx      'get' or 'update' context ('get' in this case).
				 *
				 * @see validate_rest_field_annotator_on_update()
				 */
				$defaults  = apply_filters( 'gutenberg_rest_annotator_meta_defaults', array(), $post, $request, 'get' );
				$defaults += array(
					'display_name' => '',
					'md5_email'    => '',
				);

				if ( is_array( $value ) ) {
					return array_merge( $defaults, $value );
				}
				return $defaults;

			case 'selection':
				return is_array( $value ) ? $value : array();

			case 'substatus':
				return is_string( $value ) ? $value : '';

			case 'last_substatus_time':
				return is_numeric( $value ) ? absint( $value ) : 0;

			case 'substatus_history':
				return is_array( $value ) ? $value : array();

			default:
				return null; // To be clear.
		}
	}

	/**
	 * Callback that updates an additional REST API field value.
	 *
	 * @since [version]
	 * @access public
	 *
	 * @param  string          $value   New value.
	 * @param  array|WP_Post   $post    Post (annotation).
	 * @param  string          $field   Field name.
	 * @param  WP_Rest_Request $request REST API request.
	 * @return WP_Error|null            Error on failure, null otherwise.
	 *
	 * @see register_additional_rest_fields()
	 */
	public static function on_update_additional_rest_field( $value, $post, $field, $request ) {
		/*
		 * There is some inconsistency (array|WP_Post) in the REST API hooks.
		 * Double-checking the $post data type before we begin here.
		 */
		if ( is_array( $post ) ) {
			if ( ! empty( $post['id'] ) ) {
				$post = get_post( $post['id'] );
			} elseif ( ! empty( $post['ID'] ) ) {
				$post = get_post( $post['ID'] );
			}
		}

		switch ( $field ) {
			case 'parent_post_id':
				$parent_post_id = self::validate_rest_field_parent_post_id_on_update( $value, $post, $request );

				if ( is_wp_error( $parent_post_id ) ) {
					return $parent_post_id;
				}
				update_post_meta( $post->ID, '_' . $field, $parent_post_id );

				break;

			case 'annotator':
				$annotator = self::validate_rest_field_annotator_on_update(
					$value, $request['annotator_meta'], $post, $request
				);

				if ( is_wp_error( $annotator ) ) {
					return $annotator;
				}
				update_post_meta( $post->ID, '_' . $field, $annotator['id'] );

				break;

			case 'annotator_meta':
				$annotator = self::validate_rest_field_annotator_on_update(
					$request['annotator'], $value, $post, $request
				);

				if ( is_wp_error( $annotator ) ) {
					return $annotator;
				}
				update_post_meta( $post->ID, '_' . $field, $annotator['meta'] );

				break;

			case 'selection':
				$selection = self::validate_rest_field_selection_on_update( $value, $post, $request );

				if ( is_wp_error( $selection ) ) {
					return $selection;
				}
				update_post_meta( $post->ID, '_' . $field, $selection );

				break;

			case 'substatus':
				$substatus     = self::validate_rest_field_substatus_on_update( $value, $post, $request );
				$old_substatus = (string) get_post_meta( $post->ID, '_' . $field, true );

				if ( is_wp_error( $substatus ) ) {
					return $substatus;
				}
				update_post_meta( $post->ID, '_' . $field, $substatus );
				self::maybe_update_rest_field_substatus_history( $substatus, $old_substatus, $post, $request );

				break;

			default:
				return self::rest_field_unexpected_update_error( $field );
		}
	}

	/**
	 * Validates a parent post ID update.
	 *
	 * @since [version]
	 * @access protected
	 *
	 * @param  int|string      $parent_post_id Parent post ID.
	 * @param  WP_Post         $post           Post (annotation).
	 * @param  WP_Rest_Request $request        REST API request.
	 * @return int|WP_Error                    Parent post ID, else WP_Error on validation failure.
	 *
	 * @see on_update_additional_rest_field()
	 */
	protected static function validate_rest_field_parent_post_id_on_update( $parent_post_id, $post, $request ) {
		$error = self::rest_field_validation_update_error( 'parent_post_id' );

		if ( (int) $parent_post_id <= 0 ) {
			return $error;
		}
		$parent_post_id = (int) $parent_post_id;
		$post           = get_post( $parent_post_id );

		if ( ! $post || gutenberg_annotation_post_type() === $post->post_type ) {
			return $error; // Must be a child of a non-annotation post type.
		}

		/*
		 * Parent permissions are checked in WP_REST_Annotations_Controller already.
		 */
		return $parent_post_id;
	}

	/**
	 * Validates an annotator update in the REST API (ID *and* meta together).
	 *
	 * @since [version]
	 * @access protected
	 *
	 * @param  string          $id        Arbitrary annotator ID.
	 * @param  array           $meta      Annotator meta values.
	 * @param  WP_Post         $post      Post (annotation).
	 * @param  WP_Rest_Request $request   REST API request.
	 * @return array|WP_Error             Associative array (`id` and `meta`), else WP_Error on validation failure.
	 *
	 * @see on_update_additional_rest_field()
	 */
	protected static function validate_rest_field_annotator_on_update( $id, $meta, $post, $request ) {
		$error = self::rest_field_validation_update_error( array( 'annotator', 'annotator_meta' ) );

		if ( ! $id || ! is_string( $id ) ) {
			return $error;
		} elseif ( ! $meta || ! is_array( $meta ) ) {
			return $error;
		}

		$id     = (string) $id;
		$raw_id = $id; // Original value.

		$id = sanitize_key( $id );
		$id = mb_substr( trim( $id, '_-' ), 0, 250 );

		/*
		 * Numeric IDs point to real WP_User's and we need to distinguish.
		 * So an annotator cannot use a numeric ID. Just start with a letter.
		 */
		if ( ! $id || is_numeric( $id ) || $id !== $raw_id ) {
			return $error;
		}

		/**
		 * Filters default annotator meta.
		 *
		 * @since [version]
		 *
		 * @param array           $defaults As [key => value] pairs.
		 * @param WP_Post         $post     Post (annotation).
		 * @param WP_Rest_Request $request  Current REST API request data.
		 * @param string          $ctx      'get' or 'update' context ('update' in this case).
		 *
		 * @see on_get_additional_rest_field()
		 */
		$default_meta  = apply_filters( 'gutenberg_rest_annotator_meta_defaults', array(), $post, $request, 'update' );
		$default_meta += array(
			'display_name' => '',
			'md5_email'    => '',
		);

		$raw_meta = $meta; // Original input meta.

		$existing_meta = get_post_meta( $post->ID, '_annotator_meta', true );
		$existing_meta = is_array( $existing_meta ) ? $existing_meta : array();

		$meta = array_merge( $default_meta, $existing_meta, $meta );
		$meta = array_intersect_key( $meta, $default_meta );

		if ( ! is_string( $meta['display_name'] ) ) {
			return $error;
		}
		$meta['display_name'] = sanitize_text_field( $meta['display_name'] );
		$meta['display_name'] = mb_substr( $meta['display_name'], 0, 250 );

		if ( ! $meta['display_name'] ) {
			return $error;
		} elseif ( $meta['display_name'] !== $raw_meta['display_name'] ) {
			return $error;
		}

		if ( ! is_string( $meta['md5_email'] ) ) {
			return $error;
		} elseif ( ! preg_match( '/^[0-9a-f]{32}$/i', $meta['md5_email'] ) ) {
			return $error;
		}

		/**
		 * Allows for custom sanitization/validation handlers.
		 *
		 * Returning an array (possibly sanitized) allows you to check/set/approve the update values.
		 * Returning a WP_Error reports a validation failure, which is passed back to the REST API controller.
		 *
		 * @since [version]
		 *
		 * @param array           $meta          Proposed update as [key => value] pairs.
		 * @param WP_Post         $post          Post (annotation) being updated.
		 * @param WP_Rest_Request $request       The current REST API request.
		 * @param string          $id            Arbitrary annotator ID.
		 * @param array           $raw_meta      Raw meta values in request.
		 * @param array           $existing_meta Existing meta values.
		 * @param array           $default_meta  Default meta values.
		 */
		$meta = apply_filters(
			'gutenberg_rest_annotator_sanitize_validate_update',
			$meta, $post, $request, $id, $raw_meta, $existing_meta, $default_meta
		);

		if ( is_wp_error( $meta ) ) {
			return $meta;
		} elseif ( ! is_array( $meta ) ) {
			return $error;
		}

		return compact( 'id', 'meta' );
	}

	/**
	 * Validates a selection update in the REST API.
	 *
	 * @since [version]
	 * @access protected
	 *
	 * @param  array           $selection Selection data.
	 * @param  WP_Post         $post      Post (annotation).
	 * @param  WP_Rest_Request $request   REST API request.
	 * @return array|WP_Error             Selection array, else WP_Error on validation failure.
	 *
	 * @see on_update_additional_rest_field()
	 */
	protected static function validate_rest_field_selection_on_update( $selection, $post, $request ) {
		$error = self::rest_field_validation_update_error( 'selection' );

		if ( ! $selection ) {
			return array(); // Empty is OK.
		} elseif ( ! is_array( $selection ) ) {
			return $error;
		} elseif ( ! isset( $selection['ranges'] ) ) {
			return $error;
		} elseif ( 1 !== count( array_keys( $selection ) ) ) {
			return $error;
		}

		foreach ( $selection['ranges'] as $range ) {
			if ( ! is_array( $range ) ) {
				return $error;
			} elseif ( ! isset( $range['begin']['offset'], $range['end']['offset'] ) ) {
				return $error;
			} elseif ( ! is_int( $range['begin']['offset'] ) || ! is_int( $range['end']['offset'] ) ) {
				return $error;
			} elseif ( 2 !== count( array_keys( $range ) ) ) {
				return $error;
			}
		}

		return $selection;
	}

	/**
	 * Validates a substatus update.
	 *
	 * @since [version]
	 * @access protected
	 *
	 * @param  string          $substatus Substatus.
	 * @param  WP_Post         $post      Post (annotation).
	 * @param  WP_Rest_Request $request   REST API request.
	 * @return string|WP_Error            Substatus, else WP_Error on validation failure.
	 *
	 * @see on_update_additional_rest_field()
	 */
	protected static function validate_rest_field_substatus_on_update( $substatus, $post, $request ) {
		if ( ! in_array( $substatus, self::$substatuses, true ) ) {
			return self::rest_field_validation_update_error( 'substatus' );
		}

		return $substatus;
	}

	/**
	 * Maybe update substatus history following a substatus change.
	 *
	 * @since [version]
	 * @access protected
	 *
	 * @param  string          $new     New substatus.
	 * @param  string          $old     Old substatus.
	 * @param  WP_Post         $post    Post (annotation).
	 * @param  WP_Rest_Request $request REST API request.
	 *
	 * @see on_update_additional_rest_field()
	 */
	protected static function maybe_update_rest_field_substatus_history( $new, $old, $post, $request ) {
		if ( $new === $old ) {
			return; // No change.
		}

		$current_time      = time();
		$user              = wp_get_current_user();
		$new_history_entry = array(); // Initialize.

		$history = get_post_meta( $post->ID, '_substatus_history', true );
		$history = is_array( $history ) ? $history : array();

		$annotator = self::validate_rest_field_annotator_on_update(
			$request['annotator'], $request['annotator_meta'], $post, $request
		);

		if ( ! is_wp_error( $annotator ) ) {
			$new_history_entry = array(
				'identity'      => $annotator['id'],
				'identity_meta' => array(
					'display_name' => $annotator['meta']['display_name'],
					'md5_email'    => $annotator['meta']['md5_email'],
				),
				'time'          => $current_time,
				'old'           => $old,
				'new'           => $new,
			);
		} elseif ( $user->exists() ) {
			$new_history_entry = array(
				'identity'      => (string) $user->ID,
				'identity_meta' => array(
					'display_name' => $user->display_name,
					'md5_email'    => md5( strtolower( $user->user_email ) ),
				),
				'time'          => $current_time,
				'old'           => $old,
				'new'           => $new,
			);
		}

		if ( $new_history_entry ) {
			$history[] = $new_history_entry;
			$history   = array_slice( $history, -25 ); // Last 25 changes only.

			update_post_meta( $post->ID, '_last_substatus_time', $current_time );
			update_post_meta( $post->ID, '_substatus_history', $history );
		}
	}

	/**
	 * Returns a new WP_Error suitable for REST API field, update, validation errors.
	 *
	 * @since [version]
	 * @access protected
	 *
	 * @param  string|string[] $field The problematic field name(s).
	 * @return WP_Error               WP_Error object instance.
	 */
	protected static function rest_field_validation_update_error( $field ) {
		if ( is_array( $field ) ) {
			$field = implode( ', ', array_map( 'strval', $field ) );
		}
		$field = (string) $field;

		return new WP_Error( 'gutenberg_annotation_field_validation_update_failure', sprintf(
			// translators: %s is a comma-delimited list of REST API field names associated with failure.
			__( 'Failed to update: %s (validation failure).', 'gutenberg' ), $field
		), array( 'status' => 400 ) );
	}

	/**
	 * Returns a new WP_Error suitable for unexpected REST API field update errors.
	 *
	 * @since [version]
	 * @access protected
	 *
	 * @param  string $field The problematic field name.
	 * @return WP_Error      WP_Error object instance.
	 */
	protected static function rest_field_unexpected_update_error( $field ) {
		if ( is_array( $field ) ) {
			$field = implode( ', ', array_map( 'strval', $field ) );
		}
		$field = (string) $field;

		return new WP_Error( 'gutenberg_annotation_field_unexpected_update_failure', sprintf(
			// translators: %s is a comma-delimited list of REST API field names associated with failure.
			__( 'Failed to update: %s (unexpected failure).', 'gutenberg' ), $field
		), array( 'status' => 400 ) );
	}
}
