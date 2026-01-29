<?php
/**
 * Gutenberg_Sync_Post_Meta_Storage class
 *
 * @package Gutenberg
 */

/**
 * Gutenberg class that provides an interface for storing and retrieving sync
 * updates and awareness data during a collaborative session.
 *
 * Data is stored as post meta on a singleton post of a custom post type.
 *
 * @access private
 * @internal
 */
class Gutenberg_Sync_Post_Meta_Storage implements Gutenberg_Sync_Storage {
	/**
	 * Post type for sync storage
	 */
	const POST_TYPE = 'sync_storage';

	/**
	 * Singleton post ID for storing sync data
	 *
	 * @var int|null
	 */
	private static $storage_post_id = null;

	/**
	 * Register the custom post type for sync storage.
	 */
	public function init(): void {
		register_post_type(
			self::POST_TYPE,
			array(
				'label'              => 'Gutenberg Sync Storage',
				'public'             => false,
				'publicly_queryable' => false,
				'show_in_menu'       => false,
				'show_in_rest'       => false,
				'show_ui'            => false,
				'supports'           => array( 'custom-fields' ),
			)
		);
	}

	/**
	 * Add a sync update to a given room.
	 *
	 * @param string $room   Room identifier.
	 * @param array  $update Sync update.
	 */
	public function add_update( string $room, array $update ): void {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_room_meta_key( $room );

		add_post_meta( $post_id, $meta_key, $update, false );
	}

	/**
	 * Retrieve sync updates for a given room.
	 *
	 * @param string $room Room identifier.
	 * @return array Array of sync updates.
	 */
	public function get_all_updates( string $room ): array {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_room_meta_key( $room );
		$updates  = get_post_meta( $post_id, $meta_key, false );

		if ( ! is_array( $updates ) ) {
			$updates = array();
		}

		return $updates;
	}

	/**
	 * Get the meta key for a room's awareness state.
	 *
	 * @param string $room Room identifier.
	 * @return string Meta key.
	 */
	private function get_awareness_meta_key( string $room ): string {
		return 'sync_awareness_' . md5( $room );
	}

	/**
	 * Get awareness state for a given room.
	 *
	 * @param string $room Room identifier.
	 * @return array Merged awarenessstate.
	 */
	public function get_awareness_state( string $room ): array {
		$post_id   = $this->get_storage_post_id();
		$meta_key  = $this->get_awareness_meta_key( $room );
		$awareness = get_post_meta( $post_id, $meta_key, true );

		if ( ! is_array( $awareness ) ) {
			return array();
		}

		return $awareness;
	}

	/**
	 * Get the meta key for a room's updates.
	 *
	 * @param string $room Room identifier.
	 * @return string Meta key.
	 */
	private function get_room_meta_key( string $room ): string {
		return 'sync_update_' . md5( $room );
	}

	/**
	 * Get or create the singleton post for storing sync data.
	 *
	 * @return int Post ID.
	 */
	private function get_storage_post_id(): int {
		if ( is_int( self::$storage_post_id ) ) {
			return self::$storage_post_id;
		}

		// Try to find existing post
		$posts = get_posts(
			array(
				'post_type'      => self::POST_TYPE,
				'posts_per_page' => 1,
				'post_status'    => 'publish',
				'orderby'        => 'ID',
				'order'          => 'ASC',
			)
		);

		if ( ! empty( $posts ) ) {
			self::$storage_post_id = $posts[0]->ID;
			return self::$storage_post_id;
		}

		// Create new post if none exists
		$post_id = wp_insert_post(
			array(
				'post_type'   => self::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => 'Gutenberg Sync Storage',
			)
		);

		if ( ! is_wp_error( $post_id ) ) {
			self::$storage_post_id = $post_id;
		}

		return self::$storage_post_id;
	}

	/**
	 * Remove all sync updates for a given room.
	 *
	 * @param string $room Room identifier.
	 */
	public function remove_all_updates( string $room ): void {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_room_meta_key( $room );

		delete_post_meta( $post_id, $meta_key );
	}

	/**
	 * Set awareness state for a given room.
	 *
	 * @param string $room      Room identifier.
	 * @param array  $awareness Merged awareness state.
	 */
	public function set_awareness_state( string $room, array $awareness ): void {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_awareness_meta_key( $room );

		update_post_meta( $post_id, $meta_key, $awareness );
	}
}
