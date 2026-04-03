<?php
/**
 * REST API comment controller with reaction support for WordPress 7.1 compatibility.
 *
 * Extends the 6.9 comment controller to add support for the 'reaction'
 * comment type, enabling emoji reactions on notes.
 *
 * @package gutenberg
 * @since   7.1.0
 */

class Gutenberg_REST_Comment_Controller_7_1 extends Gutenberg_REST_Comment_Controller_6_9 {

	/**
	 * Retrieves the comment schema, adding reaction_emojis.
	 *
	 * Extends the parent schema with a read-only `reaction_emojis`
	 * property whose default value exposes the filtered emoji list.
	 * Clients can read this from the OPTIONS response to discover
	 * which reaction emojis the server accepts.
	 *
	 * @since 7.1.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['reaction_emojis'] = array(
			'description' => __( 'Allowed emoji reactions for notes.', 'gutenberg' ),
			'type'        => 'array',
			'items'       => array(
				'type'       => 'object',
				'properties' => array(
					'emoji' => array(
						'description' => __( 'The emoji character.', 'gutenberg' ),
						'type'        => 'string',
					),
					'label' => array(
						'description' => __( 'A human-readable label for the emoji.', 'gutenberg' ),
						'type'        => 'string',
					),
					'value' => array(
						'description' => __( 'The slug used as the storage key.', 'gutenberg' ),
						'type'        => 'string',
					),
				),
			),
			'default'     => gutenberg_get_note_reaction_emojis(),
			'context'     => array( 'view', 'edit' ),
			'readonly'    => true,
		);

		$schema['properties']['reaction_summary'] = array(
			'description'          => __( 'Aggregated reaction counts for this note, keyed by emoji slug.', 'gutenberg' ),
			'type'                 => 'object',
			'context'              => array( 'view', 'edit' ),
			'readonly'             => true,
			'additionalProperties' => array(
				'type'       => 'object',
				'properties' => array(
					'count'          => array(
						'description' => __( 'Total number of reactions with this emoji.', 'gutenberg' ),
						'type'        => 'integer',
					),
					'reacted'        => array(
						'description' => __( 'Whether the current user reacted with this emoji.', 'gutenberg' ),
						'type'        => 'boolean',
					),
					'my_reaction_id' => array(
						'description' => __( 'The current user\'s reaction comment ID, or 0 if not reacted.', 'gutenberg' ),
						'type'        => 'integer',
					),
				),
			),
		);

		return $schema;
	}

	/**
	 * Checks whether the request type is a note or reaction.
	 *
	 * @param string $type The comment type from the request.
	 * @return bool True if the type is 'note' or 'reaction'.
	 */
	protected function is_note_or_reaction( $type ) {
		return in_array( $type, array( 'note', 'reaction' ), true );
	}

	public function get_items_permissions_check( $request ) {
		$is_note         = $this->is_note_or_reaction( $request['type'] );
		$is_edit_context = 'edit' === $request['context'];

		if ( ! empty( $request['post'] ) ) {
			foreach ( (array) $request['post'] as $post_id ) {
				$post = get_post( $post_id );

				if ( $post && $is_note && ! $this->check_post_type_supports_notes( $post->post_type ) ) {
					return new WP_Error(
						'rest_comment_not_supported_post_type',
						__( 'Sorry, this post type does not support notes.', 'gutenberg' ),
						array( 'status' => 403 )
					);
				}

				if ( ! empty( $post_id ) && $post && ! $this->check_read_post_permission( $post, $request ) ) {
					return new WP_Error(
						'rest_cannot_read_post',
						__( 'Sorry, you are not allowed to read the post for this comment.', 'gutenberg' ),
						array( 'status' => rest_authorization_required_code() )
					);
				} elseif ( 0 === $post_id && ! current_user_can( 'moderate_comments' ) ) {
					return new WP_Error(
						'rest_cannot_read',
						__( 'Sorry, you are not allowed to read comments without a post.', 'gutenberg' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}
		}

		if ( $is_edit_context && $is_note && ! empty( $request['post'] ) ) {
			foreach ( (array) $request['post'] as $post_id ) {
				if ( ! current_user_can( 'edit_post', $post_id ) ) {
					return new WP_Error(
						'rest_forbidden_context',
						__( 'Sorry, you are not allowed to edit comments.', 'gutenberg' ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}
		} elseif ( $is_edit_context && ! current_user_can( 'moderate_comments' ) ) {
			return new WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to edit comments.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( ! current_user_can( 'edit_posts' ) ) {
			$protected_params = array( 'author', 'author_exclude', 'author_email', 'type', 'status' );
			$forbidden_params = array();

			foreach ( $protected_params as $param ) {
				if ( 'status' === $param ) {
					if ( 'approve' !== $request[ $param ] ) {
						$forbidden_params[] = $param;
					}
				} elseif ( 'type' === $param ) {
					if ( 'comment' !== $request[ $param ] ) {
						$forbidden_params[] = $param;
					}
				} elseif ( ! empty( $request[ $param ] ) ) {
					$forbidden_params[] = $param;
				}
			}

			if ( ! empty( $forbidden_params ) ) {
				return new WP_Error(
					'rest_forbidden_param',
					/* translators: %s: List of forbidden parameters. */
					sprintf( __( 'Query parameter not permitted: %s', 'gutenberg' ), implode( ', ', $forbidden_params ) ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
		}

		return true;
	}

	public function get_item_permissions_check( $request ) {
		$comment = $this->get_comment( $request['id'] );
		if ( is_wp_error( $comment ) ) {
			return $comment;
		}

		// Re-map edit context capabilities when requesting `note` or `reaction` type.
		$edit_cap = $this->is_note_or_reaction( $comment->comment_type ) ? array( 'edit_comment', $comment->comment_ID ) : array( 'moderate_comments' );
		if ( ! empty( $request['context'] ) && 'edit' === $request['context'] && ! current_user_can( ...$edit_cap ) ) {
			return new WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to edit comments.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$post = get_post( $comment->comment_post_ID );

		if ( ! $this->check_read_permission( $comment, $request ) ) {
			return new WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to read this comment.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( $post && ! $this->check_read_post_permission( $post, $request ) ) {
			return new WP_Error(
				'rest_cannot_read_post',
				__( 'Sorry, you are not allowed to read the post for this comment.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	public function create_item_permissions_check( $request ) {
		$is_note = ! empty( $request['type'] ) && $this->is_note_or_reaction( $request['type'] );

		if ( ! is_user_logged_in() && $is_note ) {
			return new WP_Error(
				'rest_comment_login_required',
				__( 'Sorry, you must be logged in to comment.', 'gutenberg' ),
				array( 'status' => 401 )
			);
		}

		if ( ! is_user_logged_in() ) {
			if ( get_option( 'comment_registration' ) ) {
				return new WP_Error(
					'rest_comment_login_required',
					__( 'Sorry, you must be logged in to comment.', 'gutenberg' ),
					array( 'status' => 401 )
				);
			}

			/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-comments-controller.php */
			$allow_anonymous = apply_filters( 'rest_allow_anonymous_comments', false, $request );

			if ( ! $allow_anonymous ) {
				return new WP_Error(
					'rest_comment_login_required',
					__( 'Sorry, you must be logged in to comment.', 'gutenberg' ),
					array( 'status' => 401 )
				);
			}
		}

		if ( isset( $request['author'] ) && get_current_user_id() !== $request['author'] && ! current_user_can( 'moderate_comments' ) ) {
			return new WP_Error(
				'rest_comment_invalid_author',
				/* translators: %s: Request parameter. */
				sprintf( __( "Sorry, you are not allowed to edit '%s' for comments.", 'gutenberg' ), 'author' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( isset( $request['author_ip'] ) && ! current_user_can( 'moderate_comments' ) ) {
			if ( empty( $_SERVER['REMOTE_ADDR'] ) || $request['author_ip'] !== $_SERVER['REMOTE_ADDR'] ) {
				return new WP_Error(
					'rest_comment_invalid_author_ip',
					/* translators: %s: Request parameter. */
					sprintf( __( "Sorry, you are not allowed to edit '%s' for comments.", 'gutenberg' ), 'author_ip' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
		}

		$edit_cap = $is_note ? array( 'edit_post', (int) $request['post'] ) : array( 'moderate_comments' );
		if ( isset( $request['status'] ) && ! current_user_can( ...$edit_cap ) ) {
			return new WP_Error(
				'rest_comment_invalid_status',
				/* translators: %s: Request parameter. */
				sprintf( __( "Sorry, you are not allowed to edit '%s' for comments.", 'gutenberg' ), 'status' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( empty( $request['post'] ) ) {
			return new WP_Error(
				'rest_comment_invalid_post_id',
				__( 'Sorry, you are not allowed to create this comment without a post.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}

		$post = get_post( (int) $request['post'] );

		if ( ! $post ) {
			return new WP_Error(
				'rest_comment_invalid_post_id',
				__( 'Sorry, you are not allowed to create this comment without a post.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}

		if ( $is_note && ! $this->check_post_type_supports_notes( $post->post_type ) ) {
			return new WP_Error(
				'rest_comment_not_supported_post_type',
				__( 'Sorry, this post type does not support notes.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}

		if ( 'draft' === $post->post_status && ! $is_note ) {
			return new WP_Error(
				'rest_comment_draft_post',
				__( 'Sorry, you are not allowed to create a comment on this post.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}

		if ( 'trash' === $post->post_status ) {
			return new WP_Error(
				'rest_comment_trash_post',
				__( 'Sorry, you are not allowed to create a comment on this post.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}

		if ( ! $this->check_read_post_permission( $post, $request ) ) {
			return new WP_Error(
				'rest_cannot_read_post',
				__( 'Sorry, you are not allowed to read the post for this comment.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( ! comments_open( $post->ID ) && ! $is_note ) {
			return new WP_Error(
				'rest_comment_closed',
				__( 'Sorry, comments are closed for this item.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Creates a comment.
	 *
	 * Extends the 6.9 implementation to support 'reaction' comment type
	 * with validation for parent note, valid emoji slugs, and uniqueness.
	 *
	 * @since 7.1.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or error object on failure.
	 */
	public function create_item( $request ) {
		if ( ! empty( $request['id'] ) ) {
			return new WP_Error(
				'rest_comment_exists',
				__( 'Cannot create existing comment.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// Allow 'comment', 'note', and 'reaction' types.
		if ( ! empty( $request['type'] ) && ! in_array( $request['type'], array( 'comment', 'note', 'reaction' ), true ) ) {
			return new WP_Error(
				'rest_invalid_comment_type',
				__( 'Cannot create a comment with that type.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// Validate reaction-specific requirements.
		if ( ! empty( $request['type'] ) && 'reaction' === $request['type'] ) {
			// Validate parent is a note.
			if ( empty( $request['parent'] ) ) {
				return new WP_Error(
					'rest_comment_invalid_parent',
					__( 'A reaction must have a parent note.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

			$parent_comment = get_comment( $request['parent'] );
			if ( ! $parent_comment || 'note' !== $parent_comment->comment_type ) {
				return new WP_Error(
					'rest_comment_invalid_parent',
					__( 'A reaction must be attached to a note.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

			// Validate content is a valid emoji slug.
			$emojis      = gutenberg_get_note_reaction_emojis();
			$valid_slugs = wp_list_pluck( $emojis, 'value' );
			$emoji_slug  = isset( $request['content'] ) ? wp_strip_all_tags( $request['content'] ) : '';
			if ( ! in_array( $emoji_slug, $valid_slugs, true ) ) {
				return new WP_Error(
					'rest_comment_invalid_reaction',
					__( 'Invalid reaction emoji.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

			// Enforce uniqueness: prevent duplicate emoji per user per note.
			$existing = get_comments(
				array(
					'parent'  => $request['parent'],
					'user_id' => get_current_user_id(),
					'type'    => 'reaction',
					'status'  => 'any',
				)
			);

			foreach ( $existing as $existing_reaction ) {
				if ( wp_strip_all_tags( $existing_reaction->comment_content ) === $emoji_slug ) {
					return new WP_Error(
						'rest_comment_duplicate_reaction',
						__( 'You have already reacted with this emoji.', 'gutenberg' ),
						array( 'status' => 409 )
					);
				}
			}
		}

		$prepared_comment = $this->prepare_item_for_database( $request );
		if ( is_wp_error( $prepared_comment ) ) {
			return $prepared_comment;
		}

		$prepared_comment['comment_type'] = $request['type'];

		if ( ! isset( $prepared_comment['comment_content'] ) ) {
			$prepared_comment['comment_content'] = '';
		}

		// Include note metadata into check_is_comment_content_allowed [backport].
		if ( isset( $request['meta']['_wp_note_status'] ) ) {
			$prepared_comment['meta']['_wp_note_status'] = $request['meta']['_wp_note_status'];
		}

		if ( ! $this->check_is_comment_content_allowed( $prepared_comment ) ) {
			return new WP_Error(
				'rest_comment_content_invalid',
				__( 'Invalid comment content.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// Setting remaining values before wp_insert_comment so we can use wp_allow_comment().
		if ( ! isset( $prepared_comment['comment_date_gmt'] ) ) {
			$prepared_comment['comment_date_gmt'] = current_time( 'mysql', true );
		}

		// Set author data if the user's logged in.
		$missing_author = empty( $prepared_comment['user_id'] )
			&& empty( $prepared_comment['comment_author'] )
			&& empty( $prepared_comment['comment_author_email'] )
			&& empty( $prepared_comment['comment_author_url'] );

		if ( is_user_logged_in() && $missing_author ) {
			$user = wp_get_current_user();

			$prepared_comment['user_id']              = $user->ID;
			$prepared_comment['comment_author']       = $user->display_name;
			$prepared_comment['comment_author_email'] = $user->user_email;
			$prepared_comment['comment_author_url']   = $user->user_url;
		}

		// Honor the discussion setting that requires a name and email address of the comment author.
		if ( get_option( 'require_name_email' ) ) {
			if ( empty( $prepared_comment['comment_author'] ) || empty( $prepared_comment['comment_author_email'] ) ) {
				return new WP_Error(
					'rest_comment_author_data_required',
					__( 'Creating a comment requires valid author name and email values.', 'gutenberg' ),
					array( 'status' => 400 )
				);
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
			$error_code = $check_comment_lengths->get_error_code();
			return new WP_Error(
				$error_code,
				__( 'Comment field exceeds maximum length allowed.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// Don't check for duplicates or flooding for notes and reactions.
		$prepared_comment['comment_approved'] =
			$this->is_note_or_reaction( $prepared_comment['comment_type'] ) ?
			'1' :
			wp_allow_comment( $prepared_comment, true );

		if ( is_wp_error( $prepared_comment['comment_approved'] ) ) {
			$error_code    = $prepared_comment['comment_approved']->get_error_code();
			$error_message = $prepared_comment['comment_approved']->get_error_message();

			if ( 'comment_duplicate' === $error_code ) {
				return new WP_Error(
					$error_code,
					$error_message,
					array( 'status' => 409 )
				);
			}

			if ( 'comment_flood' === $error_code ) {
				return new WP_Error(
					$error_code,
					$error_message,
					array( 'status' => 400 )
				);
			}

			return $prepared_comment['comment_approved'];
		}

		/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-comments-controller.php */
		$prepared_comment = apply_filters( 'rest_pre_insert_comment', $prepared_comment, $request );
		if ( is_wp_error( $prepared_comment ) ) {
			return $prepared_comment;
		}

		$comment_id = wp_insert_comment( wp_filter_comment( wp_slash( (array) $prepared_comment ) ) );

		if ( ! $comment_id ) {
			return new WP_Error(
				'rest_comment_failed_create',
				__( 'Creating comment failed.', 'gutenberg' ),
				array( 'status' => 500 )
			);
		}

		if ( isset( $request['status'] ) ) {
			$this->handle_status_param( $request['status'], $comment_id );
		}

		$comment = get_comment( $comment_id );

		/** This action is documented in wp-includes/rest-api/endpoints/class-wp-rest-comments-controller.php */
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

		$context = current_user_can( 'moderate_comments' ) ? 'edit' : 'view';
		$request->set_param( 'context', $context );

		/** This action is documented in wp-includes/rest-api/endpoints/class-wp-rest-comments-controller.php */
		do_action( 'rest_after_insert_comment', $comment, $request, true );

		$response = $this->prepare_item_for_response( $comment, $request );
		$response = rest_ensure_response( $response );

		$response->set_status( 201 );
		$response->header( 'Location', rest_url( sprintf( '%s/%s/%d', $this->namespace, $this->rest_base, $comment_id ) ) );

		return $response;
	}

	/**
	 * Pre-fetched reaction summaries for batch queries.
	 *
	 * Populated by get_items() to avoid N+1 queries when returning
	 * multiple note comments.
	 *
	 * @since 7.1.0
	 * @var array|null
	 */
	protected $reaction_summaries = null;

	/**
	 * Retrieves a collection of comments.
	 *
	 * Extends the parent to pre-fetch reaction summaries for all returned
	 * note comments in a single batch query, avoiding N+1 queries.
	 *
	 * @since 7.1.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or error object on failure.
	 */
	public function get_items( $request ) {
		$fields = $this->get_fields_for_response( $request );

		// Pre-fetch reaction summaries when requesting notes with reaction_summary field.
		if (
			! empty( $request['type'] ) &&
			'note' === $request['type'] &&
			rest_is_field_included( 'reaction_summary', $fields )
		) {
			// Run the same query logic as parent to get the comment IDs.
			$registered         = $this->get_collection_params();
			$parameter_mappings = array(
				'author'         => 'author__in',
				'author_email'   => 'author_email',
				'author_exclude' => 'author__not_in',
				'exclude'        => 'comment__not_in',
				'include'        => 'comment__in',
				'offset'         => 'offset',
				'order'          => 'order',
				'parent'         => 'parent__in',
				'parent_exclude' => 'parent__not_in',
				'per_page'       => 'number',
				'post'           => 'post__in',
				'search'         => 'search',
				'status'         => 'status',
				'type'           => 'type',
			);

			$prepared_args = array();
			foreach ( $parameter_mappings as $api_param => $wp_param ) {
				if ( isset( $registered[ $api_param ], $request[ $api_param ] ) ) {
					$prepared_args[ $wp_param ] = $request[ $api_param ];
				}
			}

			// Only fetch IDs for the pre-fetch query.
			$prepared_args['fields'] = 'ids';

			$query    = new WP_Comment_Query();
			$note_ids = $query->query( $prepared_args );

			if ( ! empty( $note_ids ) ) {
				$this->prefetch_reaction_summaries( array_map( 'intval', $note_ids ) );
			}
		}

		$response = parent::get_items( $request );

		$this->reaction_summaries = null;

		return $response;
	}

	/**
	 * Pre-fetches reaction summaries for a set of note IDs.
	 *
	 * Runs a single aggregated query to build summaries for all notes,
	 * avoiding N+1 queries in prepare_item_for_response().
	 *
	 * @since 7.1.0
	 *
	 * @param int[] $note_ids Array of note comment IDs.
	 */
	protected function prefetch_reaction_summaries( $note_ids ) {
		global $wpdb;

		$this->reaction_summaries = array();

		if ( empty( $note_ids ) ) {
			return;
		}

		$current_user_id = get_current_user_id();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$results = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT comment_parent, comment_content, COUNT(*) AS reaction_count,
				GROUP_CONCAT(CONCAT(comment_ID, ':', user_id) SEPARATOR ',') AS details
				FROM {$wpdb->comments}
				WHERE comment_parent IN (" . implode( ',', array_fill( 0, count( $note_ids ), '%d' ) ) . ')
				AND comment_type = %s
				AND comment_approved = %s
				GROUP BY comment_parent, comment_content',
				...array_merge( $note_ids, array( 'reaction', '1' ) )
			)
		);

		// Initialize empty summaries for all note IDs.
		foreach ( $note_ids as $note_id ) {
			$this->reaction_summaries[ $note_id ] = array();
		}

		if ( ! $results ) {
			return;
		}

		foreach ( $results as $row ) {
			$note_id = (int) $row->comment_parent;
			$slug    = wp_strip_all_tags( $row->comment_content );

			$my_reaction_id = 0;
			if ( $current_user_id && ! empty( $row->details ) ) {
				$pairs = explode( ',', $row->details );
				foreach ( $pairs as $pair ) {
					list( $comment_id, $user_id ) = explode( ':', $pair );
					if ( (int) $user_id === $current_user_id ) {
						$my_reaction_id = (int) $comment_id;
						break;
					}
				}
			}

			$this->reaction_summaries[ $note_id ][ $slug ] = array(
				'count'          => (int) $row->reaction_count,
				'reacted'        => $my_reaction_id > 0,
				'my_reaction_id' => $my_reaction_id,
			);
		}
	}

	/**
	 * Prepares a single comment output for response.
	 *
	 * Extends the parent to include reaction_summary for note comments.
	 *
	 * @since 7.1.0
	 *
	 * @param WP_Comment      $item    Comment object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );
		$fields   = $this->get_fields_for_response( $request );

		if ( 'note' === $item->comment_type && rest_is_field_included( 'reaction_summary', $fields ) ) {
			// Use pre-fetched data if available, otherwise query individually.
			if ( null !== $this->reaction_summaries && isset( $this->reaction_summaries[ (int) $item->comment_ID ] ) ) {
				$summary = $this->reaction_summaries[ (int) $item->comment_ID ];
			} else {
				$this->prefetch_reaction_summaries( array( (int) $item->comment_ID ) );
				$summary = $this->reaction_summaries[ (int) $item->comment_ID ] ?? array();
				// Reset so the next call also queries individually.
				$this->reaction_summaries = null;
			}

			$data                     = $response->get_data();
			$data['reaction_summary'] = $summary;
			$response->set_data( $data );
		}

		return $response;
	}

	/**
	 * Prepares links for the request.
	 *
	 * Extends the 6.9 implementation to also handle 'reaction' type
	 * for children link embedding.
	 *
	 * @since 7.1.0
	 *
	 * @param WP_Comment $comment Comment object.
	 * @return array Links for the given comment.
	 */
	protected function prepare_links( $comment ) {
		$links = WP_REST_Comments_Controller::prepare_links( $comment );

		// Embedding children for notes and reactions requires `type` and `status` inheritance.
		if ( isset( $links['children'] ) && $this->is_note_or_reaction( $comment->comment_type ) ) {
			// Notes have reaction children; reactions don't have children.
			$child_type = 'note' === $comment->comment_type ? 'reaction' : $comment->comment_type;
			$args       = array(
				'parent' => $comment->comment_ID,
				'type'   => $child_type,
				'status' => 'all',
			);

			$rest_url = add_query_arg( $args, rest_url( $this->namespace . '/' . $this->rest_base ) );

			$links['children'] = array(
				'href'       => $rest_url,
				'embeddable' => true,
			);
		}

		return $links;
	}

	/**
	 * Checks if comment content is allowed.
	 *
	 * Extends the 6.9 implementation to also allow reaction content
	 * (emoji slugs are always valid content).
	 *
	 * @since 7.1.0
	 *
	 * @param array $prepared_comment The prepared comment data.
	 * @return bool True if the content is allowed, false otherwise.
	 */
	protected function check_is_comment_content_allowed( $prepared_comment ) {
		// Note reactions always have content (the emoji slug).
		if ( isset( $prepared_comment['comment_type'] ) && 'reaction' === $prepared_comment['comment_type'] ) {
			return true;
		}

		return parent::check_is_comment_content_allowed( $prepared_comment );
	}
}

/**
 * Registers the Gutenberg REST comment controller for WordPress 7.1 compatibility.
 *
 * Replaces the 6.9 controller registration to use the 7.1 controller
 * which adds reaction support.
 */
function gutenberg_register_comment_controller_7_1() {
	$controller = new Gutenberg_REST_Comment_Controller_7_1();
	$controller->register_routes();
}
remove_action( 'rest_api_init', 'gutenberg_register_comment_controller_6_9' );
add_action( 'rest_api_init', 'gutenberg_register_comment_controller_7_1' );
