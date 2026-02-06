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
	 * Stored separately because the parent class property is private.
	 *
	 * @var WP_REST_Controller
	 */
	private $gutenberg_parent_controller;

	/**
	 * Constructor.
	 *
	 * @param string $parent_post_type Post type of the parent.
	 */
	public function __construct( $parent_post_type ) {
		parent::__construct( $parent_post_type );

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
	 * This overrides the parent method to add support for real-time
	 * collaboration on draft posts. When RTC is enabled for a post type,
	 * all users' autosaves on drafts update the post directly instead of
	 * creating separate autosave revisions per user.
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

		$is_real_time_collaboration_enabled = true;

		if ( $is_real_time_collaboration_enabled && $is_draft ) {
			/*
			 * In the context of RTC, we don't care if a user has the post lock or is
			 * the original author when `$is_draft` is true. In both cases, update the
			 * post content directly instead of creating an autosave revision.
			 *
			 * Otherwise:
			 * - Autosaves from the original author (if they have the post lock) will become
			 *   part of the saved post content automatically.
			 * - Autosaves from other users are applied to a post revision.
			 * - If any user reloads a post, they see the content from the author's
			 *   autosave as it's applied direcly to the document via wp_update_post().
			 *   All other users are treated differently and their autosaved edits won't
			 *   be applied to the post.
			 *
			 * This change ensures the behavior is consistent for all users as post lock
			 * is not relevant in the context of RTC.
			 *
			 * Note that autosaves for other post statuses are still separated per-user,
			 * because this wp_update_post() conditional is the only place where there is
			 * an autosave distinction based on author and post lock status.
			 */
			$autosave_id = wp_update_post( wp_slash( (array) $prepared_post ), true );
		} elseif ( $is_draft && (int) $post->post_author === $user_id && ! $post_lock ) {
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
