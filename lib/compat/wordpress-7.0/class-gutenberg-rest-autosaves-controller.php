<?php
/**
 * REST API: Gutenberg_REST_Autosaves_Controller class
 *
 * @package gutenberg
 */

/**
 * Controller which provides REST endpoint for autosaves.
 * This overrides the core WP_REST_Autosaves_Controller to add support for
 * real-time collaboration fixes on draft posts.
 *
 * @see WP_REST_Autosaves_Controller
 */
class Gutenberg_REST_Autosaves_Controller extends WP_REST_Autosaves_Controller {

	/**
	 * Parent post controller.
	 *
	 * @since 5.0.0
	 * @var WP_REST_Controller
	 */
	private $gutenberg_parent_controller;

	/**
	 * Constructor.
	 *
	 * @since 5.0.0
	 *
	 * @param string $parent_post_type Post type of the parent.
	 */
	public function __construct( $parent_post_type ) {
		parent::__construct( $parent_post_type );

		// Create an instance of the parent post type controller that is accessible
		// by this extended class.
		$post_type_object  = get_post_type_object( $parent_post_type );
		$parent_controller = $post_type_object->get_rest_controller();

		if ( ! $parent_controller ) {
			$parent_controller = new WP_REST_Posts_Controller( $parent_post_type );
		}

		$this->gutenberg_parent_controller = $parent_controller;
	}

	/**
	 * Creates, updates or deletes an autosave revision.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {

		if ( ! defined( 'WP_RUN_CORE_TESTS' ) && ! defined( 'DOING_AUTOSAVE' ) ) {
			define( 'DOING_AUTOSAVE', true );
		}

		$post = $this->get_parent( $request['id'] );

		if ( is_wp_error( $post ) ) {
			return $post;
		}

		$prepared_post     = $this->gutenberg_parent_controller->prepare_item_for_database( $request );
		$prepared_post->ID = $post->ID;
		$user_id           = get_current_user_id();

		// We need to check post lock to ensure the original author didn't leave their browser tab open.
		if ( ! function_exists( 'wp_check_post_lock' ) ) {
			require_once ABSPATH . 'wp-admin/includes/post.php';
		}

		$post_lock = wp_check_post_lock( $post->ID );
		$is_draft  = 'draft' === $post->post_status || 'auto-draft' === $post->post_status;

		/**
		 * In the context of real-time collaboration, all peers are effectively
		 * authors and we don't want to vary behavior based on whether they are the
		 * original author. Always target an autosave revision.
		 *
		 * This avoids the following issue when real-time collaboration is enabled:
		 *
		 * - Autosaves from the original author (if they have the post lock) will
		 *   target the saved post.
		 *
		 * - Autosaves from other users are applied to a post revision.
		 *
		 * - If any user reloads a post, they load changes from the author's autosave.
		 *
		 * - The saved post has now diverged from the persisted CRDT document. The
		 *   content (and/or title or excerpt) are now "ahead" of the persisted CRDT
		 *   document.
		 *
		 * - When the persisted CRDT document is loaded, a diff is computed against
		 *   the saved post. This diff is then applied to the in-memory CRDT
		 *   document, which can lead to duplicate inserts or deletions.
		 *
		 * Load the real-time collaboration setting and, when enabled, ensure that an
		 * an autosave revision is always targeted.
		 */
		$is_collaboration_enabled = get_option( 'enable_real_time_collaboration' );

		if ( $is_draft && (int) $post->post_author === $user_id && ! $post_lock && ! $is_collaboration_enabled ) {
			/*
			 * Draft posts for the same author: autosaving updates the post and does not create a revision.
			 * Convert the post object to an array and add slashes, wp_update_post() expects escaped array.
			 */
			$autosave_id = wp_update_post( wp_slash( (array) $prepared_post ), true );
		} else {
			// Non-draft posts: create or update the post autosave. Pass the meta data.
			$autosave_id = $this->create_post_autosave( (array) $prepared_post, (array) $request->get_param( 'meta' ) );
		}

		if ( is_wp_error( $autosave_id ) ) {
			return $autosave_id;
		}

		$autosave = get_post( $autosave_id );
		$request->set_param( 'context', 'edit' );

		$response = $this->prepare_item_for_response( $autosave, $request );
		$response = rest_ensure_response( $response );

		return $response;
	}
}
