<?php
/**
 * Notes-aware REST comments controller.
 *
 * @package gutenberg
 */

/**
 * Extends the core comments controller so that the `read_post_notes` and
 * `create_post_notes` meta capabilities can stand in for `edit_post` when a
 * request is about notes.
 *
 * Core gates every note operation on `edit_post` for the parent post. This
 * subclass leaves those checks in place and adds a second, narrower path
 * alongside them: a request that core rejects is re-examined, and allowed only
 * when it is a well-formed note request from someone holding the matching note
 * capability on every post involved.
 *
 * Three rules keep the extra path tight:
 *
 * - It never grants anything in `edit` context. Edit context exposes raw
 *   content and moderation fields, and stays on `edit_post`.
 * - It never applies to logged-out visitors. Notes are private editorial
 *   discussion and every branch below requires a user.
 * - It never covers editing, deleting, resolving or reopening. Those keep
 *   core's `edit_comment` rules untouched.
 *
 * @see WP_REST_Comments_Controller
 */
class Gutenberg_REST_Comments_Controller_Notes extends WP_REST_Comments_Controller {

	/**
	 * Whether a post can carry reviewer-visible notes at all.
	 *
	 * This is everything except the capability itself, so that the read and the
	 * create paths share one definition of "eligible post".
	 *
	 * @param WP_Post|null $post Post object.
	 * @return bool True when the post is eligible, false otherwise.
	 */
	protected function post_accepts_reviewer_notes( $post ) {
		if ( ! $post instanceof WP_Post ) {
			return false;
		}

		// Notes are never exposed to anonymous visitors.
		if ( ! is_user_logged_in() ) {
			return false;
		}

		if ( ! $this->post_type_supports_notes( $post->post_type ) ) {
			return false;
		}

		if ( 'trash' === $post->post_status ) {
			return false;
		}

		// Do not hand out a way around the post password.
		if ( post_password_required( $post ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Whether the current user may read the notes on a post as a reviewer.
	 *
	 * @param WP_Post|null $post Post object.
	 * @return bool True when the current user may read notes, false otherwise.
	 */
	protected function reviewer_can_read_notes( $post ) {
		return $this->post_accepts_reviewer_notes( $post )
			&& current_user_can( 'read_post_notes', $post->ID );
	}

	/**
	 * Whether the current user may add notes to a post as a reviewer.
	 *
	 * @param WP_Post|null $post Post object.
	 * @return bool True when the current user may create notes, false otherwise.
	 */
	protected function reviewer_can_create_notes( $post ) {
		return $this->post_accepts_reviewer_notes( $post )
			&& current_user_can( 'create_post_notes', $post->ID );
	}

	/**
	 * Whether a request is about notes rather than ordinary comments.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool True when the request targets notes, false otherwise.
	 */
	protected function request_targets_notes( $request ) {
		if ( 'note' === $request['type'] ) {
			return true;
		}

		if ( ! empty( $request['id'] ) ) {
			$comment = get_comment( (int) $request['id'] );

			return $comment && 'note' === $comment->comment_type;
		}

		return false;
	}

	/**
	 * Checks whether a post type opts in to notes.
	 *
	 * Mirrors WP_REST_Comments_Controller::check_post_type_supports_notes(),
	 * which is private and so cannot be reached from a subclass.
	 *
	 * @param string $post_type Post type name.
	 * @return bool True if the post type supports notes, false otherwise.
	 */
	protected function post_type_supports_notes( $post_type ) {
		$supports = get_all_post_type_supports( $post_type );

		if ( ! isset( $supports['editor'] ) || ! is_array( $supports['editor'] ) ) {
			return false;
		}

		foreach ( $supports['editor'] as $item ) {
			if ( ! empty( $item['notes'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Checks if the post can be read.
	 *
	 * Adds the reviewer path: a note reader may reach the parent post of the
	 * notes they are entitled to read, which is how a draft under review
	 * becomes readable to someone without `edit_post`.
	 *
	 * @param WP_Post         $post    Post object.
	 * @param WP_REST_Request $request Request data to check.
	 * @return bool Whether post can be read.
	 */
	protected function check_read_post_permission( $post, $request ) {
		if ( parent::check_read_post_permission( $post, $request ) ) {
			return true;
		}

		if ( ! $this->request_targets_notes( $request ) ) {
			return false;
		}

		return $this->reviewer_can_read_notes( $post );
	}

	/**
	 * Checks if the comment can be read.
	 *
	 * This is the gate that matters most for listing: WP_REST_Comments_Controller::get_items()
	 * runs every matched comment through it, so a note the reviewer is not
	 * entitled to is dropped from the collection here.
	 *
	 * @param WP_Comment      $comment Comment object.
	 * @param WP_REST_Request $request Request data to check.
	 * @return bool Whether the comment can be read.
	 */
	protected function check_read_permission( $comment, $request ) {
		if ( parent::check_read_permission( $comment, $request ) ) {
			return true;
		}

		if ( 'note' !== $comment->comment_type || empty( $comment->comment_post_ID ) ) {
			return false;
		}

		return $this->reviewer_can_read_notes( get_post( (int) $comment->comment_post_ID ) );
	}

	/**
	 * Checks if a given request has access to read notes.
	 *
	 * Core requires the site-wide `edit_posts` capability before the `type` and
	 * `status` query parameters may be used at all, which stops a reviewer from
	 * asking for `type=note&status=all` however the per-post capabilities are
	 * granted. Requests that core turns down are allowed through when they are
	 * a plain per-post note read and the reviewer holds `read_post_notes` on
	 * every post named.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$result = parent::get_items_permissions_check( $request );

		if ( ! is_wp_error( $result ) || ! $this->is_reviewer_notes_read_request( $request ) ) {
			return $result;
		}

		return true;
	}

	/**
	 * Whether a collection request is a note read this controller may permit.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool True when the request may be permitted, false otherwise.
	 */
	protected function is_reviewer_notes_read_request( $request ) {
		if ( 'note' !== $request['type'] || 'edit' === $request['context'] ) {
			return false;
		}

		/*
		 * Reviewers get `type` and `status`, nothing else from core's protected
		 * parameter list. The author filters would let them probe who wrote
		 * what across the site.
		 */
		foreach ( array( 'author', 'author_exclude', 'author_email' ) as $param ) {
			if ( ! empty( $request[ $param ] ) ) {
				return false;
			}
		}

		// The per-post capability is the whole grant, so a post is required.
		if ( empty( $request['post'] ) ) {
			return false;
		}

		foreach ( (array) $request['post'] as $post_id ) {
			if ( ! $this->reviewer_can_read_notes( get_post( (int) $post_id ) ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Checks if a given request has access to create a note.
	 *
	 * Requests core turns down are retried once with `edit_post` granted for
	 * the single post being replied to, so that every other rule core applies
	 * to note creation - author and author_ip limits, post type support, trash
	 * and password handling, content filtering - still runs verbatim rather
	 * than being restated here and drifting out of step.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		$result = parent::create_item_permissions_check( $request );

		if ( ! is_wp_error( $result ) || ! $this->is_reviewer_reply_request( $request ) ) {
			return $result;
		}

		$post_id        = (int) $request['post'];
		$current_user   = get_current_user_id();
		$grant_for_post = static function ( $caps, $cap, $user_id, $args ) use ( $post_id, $current_user ) {
			if ( 'edit_post' === $cap
				&& (int) $user_id === $current_user
				&& isset( $args[0] )
				&& (int) $args[0] === $post_id
			) {
				// 'exist' is granted to every real user by WP_User::has_cap().
				return array( 'exist' );
			}

			return $caps;
		};

		add_filter( 'map_meta_cap', $grant_for_post, 20, 4 );

		try {
			return parent::create_item_permissions_check( $request );
		} finally {
			remove_filter( 'map_meta_cap', $grant_for_post, 20 );
		}
	}

	/**
	 * Whether a create request is a reviewer reply this controller may permit.
	 *
	 * Replies only. Starting a new thread writes `metadata.noteId` into the
	 * block delimiter in `post_content`, which is exactly the write a reviewer
	 * must not be able to make.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool True when the request may be permitted, false otherwise.
	 */
	protected function is_reviewer_reply_request( $request ) {
		if ( 'note' !== $request['type'] ) {
			return false;
		}

		$parent_id = (int) $request['parent'];

		if ( $parent_id <= 0 ) {
			return false;
		}

		// Notes are created unresolved; any other status is a moderation action.
		if ( ! empty( $request['status'] ) && 'hold' !== $request['status'] ) {
			return false;
		}

		// Resolving and reopening stay on edit_comment.
		if ( ! empty( $request['meta']['_wp_note_status'] ) ) {
			return false;
		}

		if ( empty( $request['post'] ) ) {
			return false;
		}

		$post = get_post( (int) $request['post'] );

		if ( ! $post || ! $this->reviewer_can_create_notes( $post ) ) {
			return false;
		}

		// The parent must be a note already on this post.
		$parent = get_comment( $parent_id );

		return $parent
			&& 'note' === $parent->comment_type
			&& (int) $parent->comment_post_ID === $post->ID;
	}
}
