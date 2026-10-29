<?php
/**
 * REST API comment controller with reaction support for WordPress 7.2 compatibility.
 *
 * Overrides core's WP_REST_Comments_Controller to add the 'reaction' comment
 * type, enabling emoji reactions on notes on older WordPress versions.
 *
 * Methods that only extend core call the parent. Where a change is needed
 * inside a core method, the whole method is copied from WordPress 7.1.0 and
 * every line that differs from core is wrapped in START CHANGE / END CHANGE
 * comments, so the rest of the method can be read as unmodified core code.
 * Code added around a parent call is wrapped the same way, and members that
 * core does not have are wrapped as a whole.
 *
 * @package gutenberg
 */

class Gutenberg_REST_Comment_Controller_7_2 extends WP_REST_Comments_Controller {

	// START CHANGE: New method, added in 7.2.
	/**
	 * Retrieves the hex keys of the emoji a note reaction accepts.
	 *
	 * Each key is the emoji's lowercase code points, padded to four digits,
	 * matching the client's `emojiToHexKey()`. A reaction stores its key in
	 * `comment_content`.
	 *
	 * @since 7.2.0
	 *
	 * @return string[] Hex keys for thumbs up, plus, heart, celebration, smile, eyes and rocket.
	 *
	 * @phpstan-return non-empty-list<lowercase-string&non-falsy-string>
	 */
	private static function get_note_reaction_keys(): array {
		return array( '1f44d', '2795', '2764', '1f389', '1f604', '1f440', '1f680' );
	}
	// END CHANGE.

	/**
	 * Retrieves the comment schema, adding reaction_summary.
	 *
	 * Extends the parent schema with a read-only `reaction_summary`
	 * property exposing aggregated reaction counts for each note.
	 *
	 * @since 7.2.0
	 *
	 * @return array<string, mixed> Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		// START CHANGE: Add `reaction_summary`.
		$schema['properties']['reaction_summary'] = array(
			'description'          => __( 'Aggregated reaction counts for this note, keyed by emoji hex key.', 'gutenberg' ),
			'type'                 => 'object',
			'context'              => array( 'view', 'edit' ),
			'readonly'             => true,
			'additionalProperties' => array(
				'type'       => 'object',
				'properties' => array(
					'count'                 => array(
						'description' => __( 'Total number of reactions with this emoji.', 'gutenberg' ),
						'type'        => 'integer',
						'minimum'     => 0,
					),
					'current_user_reaction' => array(
						'description' => __( 'The current user\'s reaction comment ID for this emoji, or 0 if they have not reacted.', 'gutenberg' ),
						'type'        => 'integer',
						'minimum'     => 0,
					),
				),
			),
		);
		// END CHANGE.

		return $schema;
	}

	// START CHANGE: New Gutenberg-only helper, not in core.
	/**
	 * Checks whether the request type is an internal comment type (note or reaction).
	 *
	 * @since 7.2.0
	 *
	 * @param mixed $type The comment type from the request.
	 * @return bool True if the type is one of the internal comment types.
	 */
	protected function is_note_or_reaction( $type ): bool {
		return in_array( $type, array( 'note', 'reaction' ), true );
	}
	// END CHANGE.

	/**
	 * Check if post type supports notes.
	 *
	 * Copied from core, where it is private and cannot be called from this subclass.
	 *
	 * @param string $post_type Post type name.
	 * @return bool True if post type supports notes, false otherwise.
	 */
	protected function check_post_type_supports_notes( $post_type ) {
		$supports = get_all_post_type_supports( $post_type );

		if ( ! isset( $supports['editor'] ) ) {
			return false;
		}

		if ( ! is_array( $supports['editor'] ) ) {
			return false;
		}

		return array_any( $supports['editor'], fn( $item ) => ! empty( $item['notes'] ) );
	}

	/**
	 * Checks if a given request has access to read comments.
	 *
	 * Copied from core, extended to the 'reaction' type.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		// START CHANGE: Treat `reaction` like `note`.
		$is_note = $this->is_note_or_reaction( $request['type'] );
		// END CHANGE.
		$is_edit_context  = 'edit' === $request['context'];
		$protected_params = array( 'author', 'author_exclude', 'author_email', 'type', 'status' );
		$forbidden_params = array();

		if ( ! empty( $request['post'] ) ) {
			foreach ( (array) $request['post'] as $post_id ) {
				$post = get_post( $post_id );

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

				if ( $post && $is_note && ! $this->check_post_type_supports_notes( $post->post_type ) ) {
					if ( current_user_can( 'edit_post', $post->ID ) ) {
						return new WP_Error(
							'rest_comment_not_supported_post_type',
							__( 'Sorry, this post type does not support notes.', 'gutenberg' ),
							array( 'status' => 403 )
						);
					}

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
					return new WP_Error(
						'rest_forbidden_param',
						/* translators: %s: List of forbidden parameters. */
						sprintf( __( 'Query parameter not permitted: %s', 'gutenberg' ), implode( ', ', $forbidden_params ) ),
						array( 'status' => rest_authorization_required_code() )
					);
				}
			}
		}

		// Re-map edit context capabilities when requesting `note` for a post.
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

	/**
	 * Checks if a given request has access to read the comment.
	 *
	 * Copied from core, extended to the 'reaction' type.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		$comment = $this->get_comment( $request['id'] );
		if ( is_wp_error( $comment ) ) {
			return $comment;
		}

		// START CHANGE: Treat `reaction` like `note`.
		// Re-map edit context capabilities when requesting `note` or `reaction` type.
		$edit_cap = $this->is_note_or_reaction( $comment->comment_type ) ? array( 'edit_comment', $comment->comment_ID ) : array( 'moderate_comments' );
		// END CHANGE.
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

	/**
	 * Checks if the current user can read the comment.
	 *
	 * Core's implementation only excludes the 'note' type from the public read
	 * path, where an approved comment on a readable post is world-readable.
	 * Reactions are an internal comment type too, so without this override a
	 * direct request such as GET /wp/v2/comments/{reaction_id} would expose
	 * reaction rows - including the reacting user's identity - to any reader of
	 * the post. Give reactions the same restriction core gives notes: never
	 * public, readable only by their author or users who can edit the comment.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_Comment      $comment Comment object.
	 * @param WP_REST_Request $request Request data to check.
	 * @return bool True if the user can read the comment, false otherwise.
	 */
	protected function check_read_permission( $comment, $request ) {
		// START CHANGE: Treat `reaction` like `note`.
		if ( ! $this->is_note_or_reaction( $comment->comment_type ) && ! empty( $comment->comment_post_ID ) ) {
			// END CHANGE.
			$post = get_post( $comment->comment_post_ID );
			if ( $post ) {
				if ( $this->check_read_post_permission( $post, $request ) && 1 === (int) $comment->comment_approved ) {
					return true;
				}
			}
		}

		if ( 0 === get_current_user_id() ) {
			return false;
		}

		if ( empty( $comment->comment_post_ID ) && ! current_user_can( 'moderate_comments' ) ) {
			return false;
		}

		if ( ! empty( $comment->user_id ) && get_current_user_id() === (int) $comment->user_id ) {
			return true;
		}

		return current_user_can( 'edit_comment', $comment->comment_ID );
	}

	/**
	 * Checks if a given request has access to update a comment.
	 *
	 * Reactions are immutable: they carry an author, a parent note and a
	 * canonical emoji hex key that `create_item()` validates as a set, and the
	 * generic update route re-validates none of it. Allowing updates would
	 * let anyone who can edit the note's post reattribute a reaction to
	 * another user, move it to a note on a post they cannot edit, or store a
	 * duplicate or invalid key. Toggling a reaction off is a delete.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to update the item, error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		$comment = $this->get_comment( $request['id'] );
		if ( is_wp_error( $comment ) ) {
			return $comment;
		}

		// START CHANGE: Reactions cannot be edited.
		if ( 'reaction' === $comment->comment_type ) {
			return new WP_Error(
				'rest_comment_update_not_allowed',
				__( 'Reactions cannot be edited. Remove the reaction and add a new one instead.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}
		// END CHANGE.

		return parent::update_item_permissions_check( $request );
	}

	/**
	 * Checks if a given request has access to create a comment.
	 *
	 * Copied from core, extended to the 'reaction' type. A reaction can only
	 * be added by the current user, never on behalf of someone else.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		// START CHANGE: Treat `reaction` like `note`.
		$is_note = $this->is_note_or_reaction( $request['type'] );
		// END CHANGE.

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

		// Limit who can set comment `author`, `author_ip` or `status` to anything other than the default.
		if ( isset( $request['author'] ) && get_current_user_id() !== $request['author'] && ! current_user_can( 'moderate_comments' ) ) {
			return new WP_Error(
				'rest_comment_invalid_author',
				/* translators: %s: Request parameter. */
				sprintf( __( "Sorry, you are not allowed to edit '%s' for comments.", 'gutenberg' ), 'author' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		// START CHANGE: Reject a reaction on behalf of another user.
		/*
		 * A reaction is always first-person: the uniqueness check and the
		 * reaction summary key on the current user, so one stored against
		 * somebody else could never be counted or removed.
		 */
		if (
			'reaction' === $request['type'] &&
			isset( $request['author'] ) && get_current_user_id() !== (int) $request['author']
		) {
			return new WP_Error(
				'rest_comment_invalid_author',
				__( 'Sorry, you are not allowed to add a reaction on behalf of another user.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		// END CHANGE.

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

		if ( $is_note && ! empty( $request['post'] ) && ! current_user_can( 'edit_post', (int) $request['post'] ) ) {
			return new WP_Error(
				'rest_cannot_create_note',
				__( 'Sorry, you are not allowed to create notes for this post.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
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
	 * Copied from core, extended to support the 'reaction' comment type
	 * with validation for parent note, valid emoji hex keys, and uniqueness.
	 *
	 * @since 7.2.0
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

		// START CHANGE: Allow the `reaction` type.
		// Do not allow comments to be created with a non-core type.
		if ( ! empty( $request['type'] ) && ! in_array( $request['type'], array( 'comment', 'note', 'reaction' ), true ) ) {
			return new WP_Error(
				'rest_invalid_comment_type',
				__( 'Cannot create a comment with that type.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}
		// END CHANGE.

		// START CHANGE: Validate reactions.
		/*
		 * The canonical reaction key, populated once validated below so the
		 * stored content matches what was validated (not the raw input).
		 */
		$reaction_key = null;

		// Validate reaction-specific requirements.
		if ( 'reaction' === $request['type'] ) {
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

			/*
			 * The parent note must belong to the post the reaction targets. Check
			 * this before the note's status, which would otherwise leak to a user
			 * who can only edit some other post.
			 */
			if ( ! empty( $request['post'] ) && (int) $parent_comment->comment_post_ID !== (int) $request['post'] ) {
				return new WP_Error(
					'rest_comment_invalid_parent',
					__( 'A reaction must be attached to a note on the same post.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

			// A reaction under a hidden note would escape the trash cascade.
			if ( in_array( $parent_comment->comment_approved, array( 'trash', 'spam' ), true ) ) {
				return new WP_Error(
					'rest_comment_invalid_parent',
					__( 'A reaction cannot be added to a trashed or spam note.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

			/*
			 * Resolving a thread approves its root note, and the editor
			 * disables reactions from then on; hold stale tabs to that too.
			 */
			$thread_root = $parent_comment;
			$visited     = array( (int) $thread_root->comment_ID => true );
			while ( $thread_root->comment_parent ) {
				$ancestor = get_comment( $thread_root->comment_parent );
				// Stop at a missing ancestor or a corrupt, cyclic chain.
				if ( ! $ancestor || isset( $visited[ (int) $ancestor->comment_ID ] ) ) {
					break;
				}
				$visited[ (int) $ancestor->comment_ID ] = true;
				$thread_root                            = $ancestor;
			}
			if ( '1' === $thread_root->comment_approved ) {
				return new WP_Error(
					'rest_comment_invalid_parent',
					__( 'A reaction cannot be added to a resolved note.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

			/*
			 * Validate the reaction content: the hex key of one of the
			 * curated reaction emoji, lowercase code points padded to four
			 * digits (e.g. "2764" for ❤️). Raw emoji bytes are rejected
			 * because the comments table is not guaranteed to be utf8mb4
			 * across all WordPress installs; clients normalize before
			 * submitting.
			 */
			$raw_content = '';

			// Accept `content` as a string or `{ raw }`, like prepare_item_for_database().
			if ( isset( $request['content'] ) && is_string( $request['content'] ) ) {
				$raw_content = $request['content'];
			} elseif ( isset( $request['content']['raw'] ) && is_string( $request['content']['raw'] ) ) {
				$raw_content = $request['content']['raw'];
			}

			$emoji_key = trim( wp_strip_all_tags( $raw_content ) );

			if ( ! in_array( $emoji_key, self::get_note_reaction_keys(), true ) ) {
				return new WP_Error(
					'rest_comment_invalid_reaction',
					__( 'Invalid reaction emoji.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

			/*
			 * A reaction is always approved. The uniqueness check, the race
			 * cleanup below and the reaction summary only see approved rows, so
			 * a reaction created in any other status could never be counted,
			 * deduplicated or, since reactions cannot be updated, fixed.
			 */
			if ( isset( $request['status'] ) && ! in_array( $request['status'], array( 'approve', 'approved', '1' ), true ) ) {
				return new WP_Error(
					'rest_comment_invalid_status',
					__( 'A reaction cannot be created with that status.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}

			/*
			 * Enforce uniqueness: prevent duplicate emoji per user per note.
			 * Limit to active reactions - trashed reactions are invisible and
			 * must not block the user from re-adding the same emoji.
			 */
			$existing = get_comments(
				array(
					'parent'  => $request['parent'],
					'user_id' => get_current_user_id(),
					'type'    => 'reaction',
					'status'  => 'approve',
				)
			);

			foreach ( $existing as $existing_reaction ) {
				if ( wp_strip_all_tags( $existing_reaction->comment_content ) === $emoji_key ) {
					return new WP_Error(
						'rest_comment_duplicate_reaction',
						__( 'You have already reacted with this emoji.', 'gutenberg' ),
						array( 'status' => 409 )
					);
				}
			}

			$reaction_key = $emoji_key;
		}
		// END CHANGE.

		$prepared_comment = $this->prepare_item_for_database( $request );
		if ( is_wp_error( $prepared_comment ) ) {
			return $prepared_comment;
		}

		$prepared_comment['comment_type'] = $request['type'];

		// START CHANGE: Store the canonical reaction key.
		/*
		 * Persist the validated, canonical reaction key rather than the raw
		 * request content, so stored values stay consistent for grouping and
		 * counting (e.g. "<b>2764</b>" is stored as "2764").
		 */
		if ( null !== $reaction_key ) {
			$prepared_comment['comment_content'] = $reaction_key;
		}
		// END CHANGE.

		if ( ! isset( $prepared_comment['comment_content'] ) ) {
			$prepared_comment['comment_content'] = '';
		}

		// Include note metadata into check_is_comment_content_allowed.
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

		// START CHANGE: Pin a reaction to the current user.
		/*
		 * Pin a reaction to the current user, whatever author details the
		 * request carried. Author fields alone leave `user_id` at 0, which
		 * the uniqueness check and the reaction summary both key on.
		 */
		if ( null !== $reaction_key ) {
			$user = wp_get_current_user();

			$prepared_comment['user_id']              = $user->ID;
			$prepared_comment['comment_author']       = $user->display_name;
			$prepared_comment['comment_author_email'] = $user->user_email;
			$prepared_comment['comment_author_url']   = $user->user_url;
		}
		// END CHANGE.

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

		// START CHANGE: Treat `reaction` like `note`.
		// Don't check for duplicates or flooding for notes and reactions.
		$prepared_comment['comment_approved'] =
			$this->is_note_or_reaction( $prepared_comment['comment_type'] ) ?
			'1' :
			wp_allow_comment( $prepared_comment, true );
		// END CHANGE.

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

		// START CHANGE: Remove duplicate reactions from concurrent requests.
		/*
		 * The pre-insert uniqueness check is not atomic, so two concurrent
		 * requests for the same user/note/emoji can both insert an approved
		 * row. Converge on a single row deterministically: keep the earliest
		 * matching reaction (lowest comment ID) and delete any later
		 * duplicates. Every concurrent request applies the same rule, so they
		 * all settle on the same surviving row. If this request's own row lost
		 * the race, repoint the response to the survivor.
		 */
		if ( null !== $reaction_key ) {
			$matching   = get_comments(
				array(
					'parent'  => $request['parent'],
					'user_id' => get_current_user_id(),
					'type'    => 'reaction',
					'status'  => 'approve',
					'orderby' => 'comment_ID',
					'order'   => 'ASC',
				)
			);
			$duplicates = array();
			foreach ( $matching as $candidate ) {
				if ( wp_strip_all_tags( $candidate->comment_content ) === $reaction_key ) {
					$duplicates[] = (int) $candidate->comment_ID;
				}
			}

			/*
			 * Repoint whenever any matching row survives, not only when this
			 * request still sees its own duplicate: a competing request may
			 * already have deleted this request's row, leaving a single
			 * survivor that is not `$comment_id`.
			 */
			if ( ! empty( $duplicates ) ) {
				$survivor_id = array_shift( $duplicates );
				foreach ( $duplicates as $duplicate_id ) {
					wp_delete_comment( $duplicate_id, true );
				}
				$comment_id = $survivor_id;
			}
		}
		// END CHANGE.

		// START CHANGE: Skip the status param for reactions.
		/*
		 * Reactions are inserted approved and their status was validated above.
		 * Skipping them here also keeps a request from changing the status of a
		 * row that the race cleanup above may have handed it from another request.
		 */
		if ( isset( $request['status'] ) && null === $reaction_key ) {
			$this->handle_status_param( $request['status'], $comment_id );
		}
		// END CHANGE.

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

	// START CHANGE: New property, added in 7.2.
	/**
	 * Pre-fetched reaction summaries for batch queries.
	 *
	 * Populated by get_items() to avoid N+1 queries when returning
	 * multiple note comments.
	 *
	 * @since 7.2.0
	 * @var array<int, array<string, array{count: int, current_user_reaction: int}>>|null
	 */
	protected $reaction_summaries = null;
	// END CHANGE.

	/**
	 * Retrieves a collection of comments.
	 *
	 * Extends the parent to pre-fetch reaction summaries for all returned
	 * note comments in a single batch query, avoiding N+1 queries.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or error object on failure.
	 */
	public function get_items( $request ) {
		// START CHANGE: Pre-fetch reaction summaries.
		$fields = $this->get_fields_for_response( $request );

		/*
		 * Pre-fetch reaction summaries for the notes the parent query actually
		 * returns, so pagination, ordering, and `rest_comment_query` filters
		 * all apply. The filter removes itself after the first query.
		 *
		 * WordPress 7.2 pre-fetches in core's get_items(), so skip it there
		 * to avoid running the summary queries twice.
		 */
		$prefetch = null;
		if (
			! method_exists( 'WP_REST_Comments_Controller', 'prefetch_reaction_summaries' ) &&
			'note' === $request['type'] &&
			rest_is_field_included( 'reaction_summary', $fields )
		) {
			$prefetch = function ( $comments ) use ( &$prefetch ) {
				remove_filter( 'the_comments', $prefetch );
				$note_ids = array();
				foreach ( (array) $comments as $comment ) {
					if ( $comment instanceof WP_Comment && 'note' === $comment->comment_type ) {
						$note_ids[] = (int) $comment->comment_ID;
					}
				}
				$this->prefetch_reaction_summaries( $note_ids );
				return $comments;
			};
			add_filter( 'the_comments', $prefetch );
		}
		// END CHANGE.

		$response = parent::get_items( $request );

		// START CHANGE: Clear the pre-fetched reaction summaries.
		if ( $prefetch ) {
			remove_filter( 'the_comments', $prefetch );
		}
		$this->reaction_summaries = null;
		// END CHANGE.

		return $response;
	}

	// START CHANGE: New method, added in 7.2.
	/**
	 * Pre-fetches reaction summaries for a set of note IDs.
	 *
	 * Runs a single aggregated query to build summaries for all notes,
	 * avoiding N+1 queries in prepare_item_for_response().
	 *
	 * @since 7.2.0
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

		$parent_in = $wpdb->prepare(
			'comment_parent IN (' . implode( ',', array_fill( 0, count( $note_ids ), '%d' ) ) . ')',
			...$note_ids
		);

		// Query 1: Get aggregated counts per emoji per note.
		$query  = "SELECT comment_parent, comment_content, COUNT(*) AS reaction_count FROM $wpdb->comments WHERE comment_type = 'reaction' AND comment_approved = '1' AND ";
		$query .= $parent_in;
		$query .= ' GROUP BY comment_parent, comment_content';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
		$counts = $wpdb->get_results( $query );

		// Query 2: Get the current user's own reaction IDs (if logged in).
		$my_reactions = array();
		if ( $current_user_id ) {
			$query  = "SELECT comment_ID, comment_parent, comment_content FROM $wpdb->comments WHERE comment_type = 'reaction' AND comment_approved = '1' AND ";
			$query .= $parent_in;
			$query .= $wpdb->prepare( ' AND user_id = %d', $current_user_id );
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
			$user_rows = $wpdb->get_results( $query );

			if ( $user_rows ) {
				foreach ( $user_rows as $row ) {
					$key                  = (int) $row->comment_parent . ':' . wp_strip_all_tags( $row->comment_content );
					$my_reactions[ $key ] = (int) $row->comment_ID;
				}
			}
		}

		// Initialize empty summaries for all note IDs.
		foreach ( $note_ids as $note_id ) {
			$this->reaction_summaries[ $note_id ] = array();
		}

		if ( ! $counts ) {
			return;
		}

		foreach ( $counts as $row ) {
			$note_id = (int) $row->comment_parent;
			$slug    = wp_strip_all_tags( $row->comment_content );
			$key     = $note_id . ':' . $slug;

			$this->reaction_summaries[ $note_id ][ $slug ] = array(
				'count'                 => (int) $row->reaction_count,
				'current_user_reaction' => $my_reactions[ $key ] ?? 0,
			);
		}
	}
	// END CHANGE.

	/**
	 * Prepares a single comment output for response.
	 *
	 * Extends the parent to include reaction_summary for note comments.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_Comment      $item    Comment object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );

		// START CHANGE: Add `reaction_summary` to notes.
		$fields = $this->get_fields_for_response( $request );

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
		// END CHANGE.

		return $response;
	}

	/**
	 * Prepares links for the request.
	 *
	 * Core counts every child type when deciding whether to add a `children`
	 * link. Reactions are left out: they are summarized in `reaction_summary`,
	 * and counting them would advertise a `children` link on a note that has
	 * no replies.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_Comment $comment Comment object.
	 * @return array Links for the given comment.
	 */
	protected function prepare_links( $comment ) {
		$links = parent::prepare_links( $comment );

		// START CHANGE: Leave reactions out of the `children` link.
		if ( isset( $links['children'] ) ) {
			/*
			 * Query directly: before WordPress 7.1, `get_children()` caches a
			 * count, so it would return the count core just took.
			 * See https://core.trac.wordpress.org/changeset/62822.
			 */
			$comment_children = get_comments(
				array(
					'parent'       => $comment->comment_ID,
					'count'        => true,
					'orderby'      => 'none',
					'type'         => 'all',
					'type__not_in' => array( 'reaction' ),
				)
			);

			if ( empty( $comment_children ) ) {
				unset( $links['children'] );
			}
		}
		// END CHANGE.

		return $links;
	}
}

/**
 * Registers the Gutenberg REST comment controller for WordPress 7.2 compatibility.
 *
 * Replaces the 6.9 controller registration to use the 7.2 controller
 * which adds reaction support.
 */
function gutenberg_register_comment_controller_7_2() {
	$controller = new Gutenberg_REST_Comment_Controller_7_2();
	$controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_comment_controller_7_2' );
