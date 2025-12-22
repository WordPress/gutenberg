<?php
/**
 * Gutenberg_Sync_Post_Meta_Storage class
 *
 * @package Gutenberg
 */

/**
 * Gutenberg class that provides an interface for storing and retrieving sync
 * messages during a collaborative session. By default it uses post meta but can
 * be filtered to use other storage mechanisms.
 *
 * @access private
 * @internal
 */
class Gutenberg_Sync_Post_Meta_Storage implements Gutenberg_Sync_Storage {
	/**
	 * Post type for sync storage
	 */
	const POST_TYPE = 'sync_messages';

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
				'public'             => false,
				'publicly_queryable' => false,
				'show_ui'            => false,
				'show_in_menu'       => false,
				'show_in_rest'       => false,
				'capability_type'    => 'post',
				'map_meta_cap'       => true,
				'supports'           => array( 'custom-fields' ),
				'label'              => 'Gutenberg Sync Storage',
			)
		);
	}

	public function add_message_to_room( string $room, array $message ): void {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_room_meta_key( $room );

		add_post_meta( $post_id, $meta_key, $message, false );
	}

	public function get_messages_for_room( string $room ): array {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_room_meta_key( $room );
		$messages = get_post_meta( $post_id, $meta_key, false );

		if ( ! is_array( $messages ) ) {
			$messages = array();
		}

		return $messages;
	}

	/**
	 * Get the meta key for a room's messages.
	 *
	 * @param string $room Room identifier.
	 * @return string Meta key.
	 */
	private function get_room_meta_key( string $room ): string {
		return 'sync_message_' . $room;
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

	public function remove_all_messages_for_room( string $room ): void {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_room_meta_key( $room );

		delete_post_meta( $post_id, $meta_key );
	}

	public function update_client_last_seen( string $room, int $client_id, int $message_id ): void {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_client_tracking_meta_key( $room );

		// Get existing client tracking data
		$tracking = get_post_meta( $post_id, $meta_key, true );
		if ( ! is_array( $tracking ) ) {
			$tracking = array();
		}

		// Update this client's info
		$tracking[ $client_id ] = array(
			'last_seen_message_id' => $message_id,
			'last_activity'        => time(),
		);

		update_post_meta( $post_id, $meta_key, $tracking );
	}

	public function get_client_last_seen( string $room, int $client_id ): int {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_client_tracking_meta_key( $room );

		$tracking = get_post_meta( $post_id, $meta_key, true );
		if ( ! is_array( $tracking ) || ! isset( $tracking[ $client_id ] ) ) {
			return 0;
		}

		return (int) $tracking[ $client_id ]['last_seen_message_id'];
	}

	public function get_active_clients( string $room, int $since_timestamp ): array {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_client_tracking_meta_key( $room );

		$tracking = get_post_meta( $post_id, $meta_key, true );
		if ( ! is_array( $tracking ) ) {
			return array();
		}

		$active_clients = array();
		foreach ( $tracking as $client_id => $info ) {
			if ( $info['last_activity'] >= $since_timestamp ) {
				$active_clients[] = array(
					'client_id'            => $client_id,
					'last_seen_message_id' => $info['last_seen_message_id'],
					'last_activity'        => $info['last_activity'],
				);
			}
		}

		return $active_clients;
	}

	public function delete_messages_before( string $room, int $before_message_id ): void {
		$post_id  = $this->get_storage_post_id();
		$meta_key = $this->get_room_meta_key( $room );

		$messages = $this->get_messages_for_room( $room );

		// Delete all messages
		delete_post_meta( $post_id, $meta_key );

		// Re-add messages with ID >= before_message_id
		foreach ( $messages as $message ) {
			if ( isset( $message['id'] ) && $message['id'] >= $before_message_id ) {
				add_post_meta( $post_id, $meta_key, $message, false );
			}
		}
	}

	/**
	 * Get the meta key for client tracking in a room.
	 *
	 * @param string $room Room identifier.
	 * @return string Meta key.
	 */
	private function get_client_tracking_meta_key( string $room ): string {
		return 'sync_clients_' . $room;
	}
}
