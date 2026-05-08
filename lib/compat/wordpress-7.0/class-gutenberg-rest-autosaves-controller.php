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

		$post_lock_is_active      = wp_check_post_lock( $post->ID );
		$is_auto_draft            = 'auto-draft' === $post->post_status;
		$is_draft                 = 'draft' === $post->post_status || $is_auto_draft;
		$is_collaboration_enabled = wp_is_collaboration_enabled();

		/*
		 * When a post is still in draft form, updates from the author can directly update the post.
		 * Other autosaves must be stored as per-user autosave revisions.
		 *
		 * When RTC is active, however, regular draft autosaves must not update the parent post directly.
		 * Since all peers are sharing a persisted editing state (a shared CRDT), it’s important that
		 * they all store updates in a revision. If edits were applied to the post, then upon the next
		 * editor reload, it would appear as though the post had been updated externally, and those same
		 * changes would be re-applied to the CRDT, duplicating the edits.
		 *
		 * The one caveat for RTC is that the first peer to store an edit must promote an auto-draft
		 * into a real draft post. If this doesn’t happen then the peers may continue to make edits
		 * but the draft will be lost, as auto-drafts are not listed in post views.
		 */
		$can_update_author_draft_post = (
			$is_draft &&
			(int) $post->post_author === $user_id &&
			! $is_collaboration_enabled
		);
		$can_promote_auto_draft_post  = (
			$is_auto_draft &&
			$is_collaboration_enabled &&
			current_user_can( 'edit_post', $post->ID )
		);

		$should_update_parent_draft_post = (
			$can_promote_auto_draft_post ||
			( ! $post_lock_is_active && $can_update_author_draft_post )
		);

		if ( $should_update_parent_draft_post ) {
			$autosave_id = wp_update_post( wp_slash( (array) $prepared_post ), true );
		} else {
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
