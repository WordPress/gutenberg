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
		// Gutenberg selects this controller only when RTC is enabled. Preserve
		// Core behavior if it is registered explicitly or instantiated directly.
		if ( ! wp_is_collaboration_enabled() ) {
			return parent::create_item( $request );
		}

		if ( ! defined( 'WP_RUN_CORE_TESTS' ) && ! defined( 'DOING_AUTOSAVE' ) ) {
			define( 'DOING_AUTOSAVE', true );
		}

		$post = $this->get_parent( $request['id'] );

		if ( is_wp_error( $post ) ) {
			return $post;
		}

		$prepared_post     = $this->gutenberg_parent_controller->prepare_item_for_database( $request );
		$prepared_post->ID = $post->ID;
		$post_data         = (array) $prepared_post;
		$meta              = (array) $request->get_param( 'meta' );

		// create_post_autosave() may fire this callback for revisioned post meta.
		if ( ! function_exists( 'wp_autosave_post_revisioned_meta_fields' ) ) {
			require_once ABSPATH . 'wp-admin/includes/post.php';
		}

		/*
		 * Regular draft autosaves must not update the parent post directly under
		 * RTC. All peers share a persisted editing state in the CRDT, so their
		 * autosaved changes must be stored in revisions. Applying those edits to
		 * the parent post would make them appear to be external changes when the
		 * editor next reloads, causing the same changes to be reapplied to the
		 * CRDT and duplicated.
		 *
		 * The first peer to store an edit must still promote an auto-draft into
		 * a real draft. Otherwise, peers could continue editing while the post
		 * remains an unlisted auto-draft and may be lost.
		 */
		$should_promote_auto_draft = (
			'auto-draft' === $post->post_status &&
			current_user_can( 'edit_post', $post->ID )
		);

		if ( $should_promote_auto_draft ) {
			$autosave_id = wp_update_post( wp_slash( $post_data ), true );
		} elseif ( $this->is_redundant_autosave( $post, $post_data, $meta ) ) {
			/*
			 * Nothing changed from the latest shared state, so storing a
			 * revision would only create an identical one. Avoid a no-op
			 * revision because WordPress decides whether to warn about "a more
			 * recent autosave" by comparing timestamps.
			 */
			$autosave_id = $post->ID;
		} else {
			$autosave_id = $this->create_post_autosave( $post_data, $meta );
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

	/**
	 * Determines whether an incoming autosave would be a redundant no-op.
	 *
	 * Core's WP_REST_Autosaves_Controller::create_post_autosave() avoids a
	 * redundant write by comparing the incoming autosave against the parent post.
	 * That baseline is wrong under RTC. The parent draft is intentionally never
	 * updated, so peer autosaves can accumulate as revisions while the parent stays
	 * stale. An autosave that matches the latest shared revision still looks different
	 * from the parent, so core stores another revision identical to the previous
	 * one, which renders as a blank diff on the revisions page.
	 *
	 * The correct baseline is the most recent revision when it is newer
	 * than the parent (the RTC case), falling back to the parent when no revision
	 * exists yet. The revisioned post fields (title, content, excerpt) and
	 * revisioned meta (e.g. `footnotes`) are compared, matching the fields core
	 * itself diffs. Non-revisioned meta (e.g. `_crdt_document`) is excluded.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_Post $post      The saved parent post.
	 * @param array   $post_data Prepared autosave post data.
	 * @param array   $meta      Meta values submitted with the autosave.
	 * @return bool Whether the autosave can be skipped without losing anything.
	 */
	private function is_redundant_autosave( $post, $post_data, $meta ) {
		$baseline = $this->get_autosave_comparison_baseline( $post );

		$new_autosave    = _wp_post_revision_data( $post_data, true );
		$revision_fields = _wp_post_revision_fields( $baseline );

		foreach ( array_intersect( array_keys( $new_autosave ), array_keys( $revision_fields ) ) as $field ) {
			if ( normalize_whitespace( $new_autosave[ $field ] ) !== normalize_whitespace( $baseline->$field ) ) {
				return false;
			}
		}

		foreach ( wp_post_revision_meta_keys( $post->post_type ) as $meta_key ) {
			// get_metadata_raw avoids the registered default. Treat an unset value
			// and an empty string as equivalent so the editor's empty default for
			// an unset key is not mistaken for a change.
			$old_meta = get_metadata_raw( 'post', $baseline->ID, $meta_key, true ) ?? '';
			$new_meta = $meta[ $meta_key ] ?? '';

			if ( $old_meta !== $new_meta ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Returns the post to compare an incoming autosave against.
	 *
	 * Under RTC the parent draft is not updated with an autosave, so its latest content
	 * lives in the most recent revision. When that revision is newer than the parent it is
	 * the correct baseline; otherwise (no revisions yet, or the parent was updated
	 * directly) the parent post is used.
	 *
	 * @since 7.2.0
	 *
	 * @param WP_Post $post The saved parent post.
	 * @return WP_Post The post or revision to compare against.
	 */
	private function get_autosave_comparison_baseline( $post ) {
		// wp_get_post_revisions() returns revisions newest-first by default, and
		// includes per-user autosaves (they are revisions), so the first entry is
		// the most recent shared content.
		$revisions       = wp_get_post_revisions( $post->ID, array( 'posts_per_page' => 1 ) );
		$latest_revision = empty( $revisions ) ? null : array_shift( $revisions );

		// Note that a draft which has never been updated keeps the floating
		// post_modified_gmt of '0000-00-00 00:00:00', so any revision compares
		// as newer than it. That is the desired outcome: under RTC the
		// revisions hold newer content than the untouched parent draft.
		if (
			$latest_revision &&
			$latest_revision->post_modified_gmt >= $post->post_modified_gmt
		) {
			return $latest_revision;
		}

		return $post;
	}
}
