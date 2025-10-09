<?php
/**
 * A custom REST server for Gutenberg.
 *
 * @package gutenberg
 * @since   6.8.0
 */

// Create a new class that extends WP_REST_Comments_Controller
class Gutenberg_REST_Comment_Controller extends WP_REST_Comments_Controller {

	public function get_items_permissions_check( $request ) {
		$is_block_comment = ! empty( $request['type'] ) && 'block_comment' === $request['type'];
		$is_edit_context  = ! empty( $request['context'] ) && 'edit' === $request['context'];

		if ( ! empty( $request['post'] ) ) {
			foreach ( (array) $request['post'] as $post_id ) {
				$post = get_post( $post_id );

				// Note: This is only relevant change for the backport.
				if ( $post && $is_block_comment && ! $this->check_post_type_supports_block_comments( $post->post_type ) ) {
					return new WP_Error(
						'rest_comment_not_supported_post_type',
						__( 'Sorry, this post type does not support block comments.', 'gutenberg' ),
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

		// Re-map edit context capabilities when requesting `block_comment` for a post.
		// Note: This is only relevant change for the backport.
		if ( $is_edit_context && $is_block_comment && ! empty( $request['post'] ) ) {
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

		// Re-map edit context capabilities when requesting `block_comment` type.
		// Note: This is only relevant change for the backport.
		$edit_cap = 'block_comment' === $comment->comment_type ? array( 'edit_comment', $comment->comment_ID ) : array( 'moderate_comments' );
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
		$is_block_comment = ! empty( $request['comment_type'] ) && 'block_comment' === $request['comment_type'];

		// Note: This is only relevant change for the backport.
		if ( ! is_user_logged_in() && ! $is_block_comment ) {
			if ( get_option( 'comment_registration' ) ) {
				return new WP_Error(
					'rest_comment_login_required',
					__( 'Sorry, you must be logged in to comment.', 'gutenberg' ),
					array( 'status' => 401 )
				);
			}

			/**
			 * Filters whether comments can be created via the REST API without authentication.
			 *
			 * Enables creating comments for anonymous users.
			 *
			 * @since 4.7.0
			 *
			 * @param bool $allow_anonymous Whether to allow anonymous comments to
			 *                              be created. Default `false`.
			 * @param WP_REST_Request $request Request used to generate the
			 *                                 response.
			 */
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

		if ( isset( $request['status'] ) && ! current_user_can( 'moderate_comments' ) ) {
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

		// Note: This is only relevant change for the backport.
		if ( $is_block_comment && ! $this->check_post_type_supports_block_comments( $post->post_type ) ) {
			return new WP_Error(
				'rest_comment_not_supported_post_type',
				__( 'Sorry, this post type does not support block comments.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}

		// Note: This is only relevant change for the backport.
		if ( 'draft' === $post->post_status && ! $is_block_comment ) {
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

		// Note: This is only relevant change for the backport.
		if ( ! comments_open( $post->ID ) && ! $is_block_comment ) {
			return new WP_Error(
				'rest_comment_closed',
				__( 'Sorry, comments are closed for this item.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Check if post type supports block comments.
	 *
	 * @param string $post_type Post type name.
	 * @return bool True if post type supports block comments, false otherwise.
	 */
	private function check_post_type_supports_block_comments( $post_type ) {
		$supports = get_all_post_type_supports( $post_type );
		if ( ! isset( $supports['editor'] ) ) {
			return false;
		}
		if ( ! is_array( $supports['editor'] ) ) {
			return false;
		}
		foreach ( $supports['editor'] as $item ) {
			if ( is_array( $item ) && isset( $item['block-comments'] ) && true === $item['block-comments'] ) {
				return true;
			}
		}
		return true;
	}

	/**
	 * Override the schema to change `type` property.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema                       = parent::get_item_schema();
		$schema['properties']['type'] = array(
			'description' => __( 'Type of the comment.', 'gutenberg' ),
			'type'        => 'string',
			'context'     => array( 'view', 'edit', 'embed' ),
			// Note: This is only relevant change for the backport.
			'arg_options' => array(
				'sanitize_callback' => 'sanitize_key',
			),
		);

		return $schema;
	}
}

add_action(
	'rest_api_init',
	function () {
		$controller = new Gutenberg_REST_Comment_Controller();
		$controller->register_routes();
	}
);
