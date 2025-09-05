<?php
/**
 * A custom REST server for Gutenberg.
 *
 * @package gutenberg
 * @since   6.8.0
 */

// Create a new class that extends WP_REST_Comments_Controller
class Gutenberg_REST_Comment_Controller extends WP_REST_Comments_Controller {

	public function create_item_permissions_check( $request ) {
		if ( empty( $request['comment_type'] ) || 'comment' === $request['comment_type'] ) {
			return parent::create_item_permissions_check( $request );
		}

		if ( ! is_user_logged_in() ) {
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

		return true;
	}
}

add_action(
	'rest_api_init',
	function () {
		$controller = new Gutenberg_REST_Comment_Controller();
		$controller->register_routes();
	}
);
