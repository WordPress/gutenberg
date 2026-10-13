<?php

/**
 * Core class used to access synced patterns via the REST API before WordPress 7.2.
 *
 * This class extension lets users who can read a synced pattern, but not edit
 * it, load it in the `edit` context. That is the only context with the
 * pattern's content, so it is how the editor renders `core/block` and lists
 * patterns in the inserter. Core gates it on editing the pattern, so an author
 * using an administrator's pattern sees "Block has been deleted or is
 * unavailable" once the post is reloaded, and a plugin can't make a pattern
 * read-only without hiding it from everyone.
 *
 * Writes are unchanged: they still require editing the pattern, and the
 * `Allow` header and target hints still leave out the write methods, so the
 * editor shows the pattern as read-only. Target hints are built inside
 * `get_items()` by running every permission check, so the write check clears
 * the read flag while it runs.
 *
 * @see WP_REST_Blocks_Controller
 */
class Gutenberg_REST_Blocks_Controller_7_2 extends WP_REST_Blocks_Controller {
	/**
	 * Whether the controller is answering a read, while it decides which
	 * patterns the `edit` context may return. Saved and restored around each
	 * check, since checks nest: a collection's target hints run every
	 * permission check for each item.
	 *
	 * @var bool
	 */
	private $is_reading = false;

	/**
	 * Checks if a given request has access to read a synced pattern.
	 *
	 * @since 7.2.0 Lets users who can read the pattern use the `edit` context.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		$was_reading      = $this->is_reading;
		$this->is_reading = true;
		try {
			return parent::get_item_permissions_check( $request );
		} finally {
			$this->is_reading = $was_reading;
		}
	}

	/**
	 * Retrieves a collection of synced patterns.
	 *
	 * @since 7.2.0 Includes patterns the user can read but not edit in the `edit` context.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$was_reading      = $this->is_reading;
		$this->is_reading = true;
		try {
			return parent::get_items( $request );
		} finally {
			$this->is_reading = $was_reading;
		}
	}

	/**
	 * Checks if a given request has access to update a synced pattern.
	 *
	 * @since 7.2.0 Always asks for the edit permission, even within a read.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to update the item, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		$was_reading      = $this->is_reading;
		$this->is_reading = false;
		try {
			return parent::update_item_permissions_check( $request );
		} finally {
			$this->is_reading = $was_reading;
		}
	}

	/**
	 * Checks if a synced pattern can be edited, or, while reading, read in the
	 * `edit` context.
	 *
	 * @since 7.2.0 Answers with the read permission while reading.
	 *
	 * @param WP_Post $post Post object.
	 * @return bool Whether the post can be edited.
	 */
	protected function check_update_permission( $post ) {
		//////////////////////////////
		// START CORE MODIFICATIONS //
		//////////////////////////////
		/*
		 * Core's reads call this to gate the `edit` context. A pattern's
		 * content is only in that context, and anyone who can read a pattern
		 * may use it, so reading it there needs only the read permission.
		 * The `edit` context ignores post passwords, so a password-protected
		 * pattern still needs the edit permission.
		 */
		if ( $this->is_reading && '' === $post->post_password ) {
			return $this->check_read_permission( $post );
		}
		////////////////////////////
		// END CORE MODIFICATIONS //
		////////////////////////////

		return parent::check_update_permission( $post );
	}
}
