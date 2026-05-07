<?php
/**
 * WP_Collaboration_Table_Storage class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Collaboration_Table_Storage' ) ) {

	/**
	 * Core class that provides an interface for storing and retrieving
	 * updates and awareness data during a collaborative session.
	 *
	 * All data is stored in the single `collaboration` database table,
	 * discriminated by the `type` column. Awareness reads are served from
	 * the persistent object cache when available, falling back to the
	 * database — similar to the transient pattern but without wp_options.
	 *
	 * This class intentionally fires no actions or filters. Collaboration
	 * queries run on every poll (0.5–1 s per editor tab), so hook overhead
	 * would degrade the real-time editing loop for all active sessions.
	 *
	 * @since 7.0.0
	 *
	 * @access private
	 *
	 * @phpstan-type AwarenessState array{client_id: string, state: array<mixed, mixed>, user_id: int, timestamp: int}
	 */
	class WP_Collaboration_Table_Storage implements WP_Collaboration_Storage {
		/**
		 * Cache of cursors by room.
		 *
		 * @since 7.0.0
		 * @var array<string, int>
		 */
		private array $room_cursors = array();

		/**
		 * Cache of update counts by room.
		 *
		 * @since 7.0.0
		 * @var array<string, int>
		 */
		private array $room_update_counts = array();

		/**
		 * Adds an update to a given room.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room   Room identifier.
		 * @param mixed  $update Update data.
		 * @return bool True on success, false on failure.
		 */
		public function add_update( string $room, $update ): bool {
			global $wpdb;

			if ( '' === $room || ! is_array( $update ) || empty( $update['type'] ) || empty( $update['client_id'] ) ) {
				return false;
			}

			$result = $wpdb->insert(
				$wpdb->collaboration,
				array(
					'room'      => $room,
					'type'      => $update['type'],
					'client_id' => $update['client_id'],
					'data'      => wp_json_encode( $update ),
					'date_gmt'  => gmdate( 'Y-m-d H:i:s' ),
					'user_id'   => get_current_user_id(),
				),
				array( '%s', '%s', '%s', '%s', '%s', '%d' )
			);

			return false !== $result;
		}

		/**
		 * Generates a cache key for awareness data for a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room Room identifier.
		 * @return string Cache key for the room's awareness data.
		 */
		public function get_awareness_cache_key( string $room ): string {
			return 'awareness::' . str_replace( '/', ':', $room );
		}

		/**
		 * Gets awareness state for a given room.
		 *
		 * Checks the persistent object cache first. On a cache miss, queries
		 * the collaboration table for awareness rows and primes the cache
		 * with the result. When no persistent cache is available the in-memory
		 * WP_Object_Cache is used, which provides no cross-request benefit
		 * but keeps the code path identical.
		 *
		 * Expired rows are filtered by the WHERE clause on cache miss;
		 * actual deletion is handled by cron via
		 * wp_delete_old_collaboration_data().
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room    Room identifier.
		 * @param int    $timeout Seconds before an awareness entry is considered expired.
		 * @return array<int, array> Awareness entries.
		 * @phpstan-return list<AwarenessState>
		 */
		public function get_awareness_state( string $room, int $timeout = 30 ): array {
			global $wpdb;

			$cutoff_timestamp = time() - $timeout;
			$cutoff_mysql     = gmdate( 'Y-m-d H:i:s', $cutoff_timestamp );
			$cache_key        = $this->get_awareness_cache_key( $room );
			$cached           = wp_cache_get( $cache_key, 'collaboration' );

			if ( false !== $cached && is_array( $cached ) ) {
				// Deterministic ordering.
				/** @var AwarenessState[] $cached_awareness */
				$cached_awareness = wp_list_sort( $cached, 'client_id' );

				// Remove out of date entries and duplicate entries.
				$entries = array();
				foreach ( $cached_awareness as $client_awareness ) {
					if ( empty( $client_awareness['timestamp'] ) || $client_awareness['timestamp'] < $cutoff_timestamp ) {
						continue;
					}
					// Account for duplicates added by race conditions.
					$entries[ $client_awareness['client_id'] ] = $client_awareness;
				}

				return array_values( $entries );
			} elseif ( false !== $cached ) {
				// Cache is corrupted, delete it.
				wp_cache_delete( $cache_key, 'collaboration' );
			}

			if ( wp_using_ext_object_cache() ) {
				// Sites with a persistent cache do not use the database.
				return array();
			}

			/** @var array<object{ client_id: string, user_id: string, date_gmt: string, data: string }> $rows */
			$rows = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT client_id, user_id, date_gmt, data FROM {$wpdb->collaboration} WHERE room = %s AND type = 'awareness' AND date_gmt >= %s ORDER BY collaboration_id ASC",
					$room,
					$cutoff_mysql
				)
			);

			$entries = array();
			foreach ( $rows as $row ) {
				$date_time     = date_create_from_format( 'Y-m-d H:i:s', $row->date_gmt, new DateTimeZone( 'UTC' ) );
				$decoded_state = json_decode( $row->data, true );
				if ( is_array( $decoded_state ) && false !== $date_time ) {
					$entries[ $row->client_id ] = array(
						'client_id' => $row->client_id,
						'state'     => $decoded_state,
						'user_id'   => (int) $row->user_id,
						'timestamp' => $date_time->getTimestamp(),
					);
				}
			}

			$entries = array_values( $entries );
			// Deterministic ordering.
			$entries = wp_list_sort( $entries, 'client_id' );
			wp_cache_set( $cache_key, $entries, 'collaboration', HOUR_IN_SECONDS );
			return $entries;
		}

		/**
		 * Gets the current cursor for a given room.
		 *
		 * The cursor is set during get_updates_after_cursor() and represents the
		 * maximum row ID at the time updates were retrieved.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room Room identifier.
		 * @return int Current cursor for the room.
		 */
		public function get_cursor( string $room ): int {
			return $this->room_cursors[ $room ] ?? 0;
		}

		/**
		 * Gets the number of updates stored for a given room.
		 *
		 * @since 7.0.0
		 *
		 * @param string $room Room identifier.
		 * @return int Number of updates stored for the room.
		 */
		public function get_update_count( string $room ): int {
			return $this->room_update_counts[ $room ] ?? 0;
		}

		/**
		 * Retrieves updates from a room after a given cursor.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room   Room identifier.
		 * @param int    $cursor Return updates after this cursor.
		 * @return array<int, mixed> Updates.
		 */
		public function get_updates_after_cursor( string $room, int $cursor ): array {
			global $wpdb;

			/*
			 * Uses a snapshot approach: captures MAX(id) and COUNT(*) in a single
			 * query, then fetches rows WHERE id > cursor AND id <= max_id. Updates
			 * arriving after the snapshot are deferred to the next poll, never lost.
			 *
			 * Only retrieves non-awareness rows — awareness rows are handled
			 * separately via get_awareness_state().
			 */

			// Snapshot the current max ID and total row count in a single query.
			/** @var object{ max_id: string, total: string } $snapshot */
			$snapshot = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT COALESCE( MAX( collaboration_id ), 0 ) AS max_id, COUNT(*) AS total FROM {$wpdb->collaboration} WHERE room = %s AND type != 'awareness'",
					$room
				)
			);

			$max_id = (int) $snapshot->max_id;
			$total  = (int) $snapshot->total;

			$this->room_cursors[ $room ] = $max_id;

			$this->room_update_counts[ $room ] = $total;

			if ( 0 === $max_id || $max_id <= $cursor ) {
				/*
				 * Preserve the real row count so the server can still
				 * trigger compaction when updates have accumulated but
				 * no new ones arrived since the client's last poll.
				 */
				return array();
			}

			// Fetch updates after the cursor up to the snapshot boundary.
			/** @var array<object{ data: string }> $rows */
			$rows = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT data FROM {$wpdb->collaboration} WHERE room = %s AND type != 'awareness' AND collaboration_id > %d AND collaboration_id <= %d ORDER BY collaboration_id ASC",
					$room,
					$cursor,
					$max_id
				)
			);

			$updates = array();
			foreach ( $rows as $row ) {
				$decoded = json_decode( $row->data, true );
				if ( is_array( $decoded ) ) {
					$updates[] = $decoded;
				}
			}

			return $updates;
		}

		/**
		 * Removes updates from a room up to and including the given cursor.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room   Room identifier.
		 * @param int    $cursor Remove updates up to and including this cursor.
		 * @return bool True on success, false on failure.
		 */
		public function remove_updates_through_cursor( string $room, int $cursor ): bool {
			global $wpdb;

			// Uses a single atomic DELETE query, avoiding the race-prone
			// "delete all, re-add some" pattern.
			$result = $wpdb->query(
				$wpdb->prepare(
					"DELETE FROM {$wpdb->collaboration} WHERE room = %s AND type != 'awareness' AND collaboration_id <= %d",
					$room,
					$cursor
				)
			);

			return false !== $result;
		}

		/**
		 * Sets awareness state for a given client in a room.
		 *
		 * Uses SELECT-then-UPDATE/INSERT: checks for an existing row by
		 * primary key, then updates or inserts accordingly. Each client
		 * writes only its own row, eliminating the race condition inherent
		 * in shared-state approaches.
		 *
		 * After writing, the cached awareness entries for the room are updated
		 * in-place so that subsequent get_awareness_state() calls from other
		 * clients hit the cache instead of the database. This is application-
		 * level deduplication: the shared collaboration table cannot carry a
		 * UNIQUE KEY on (room, client_id) because sync rows need multiple
		 * entries per room+client pair.
		 *
		 * @since 7.0.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string               $room      Room identifier.
		 * @param string               $client_id Client identifier.
		 * @param array<string, mixed> $state     Serializable awareness state for this client.
		 * @param int                  $user_id   WordPress user ID that owns this client.
		 * @return bool True on success, false on failure.
		 */
		public function set_awareness_state( string $room, string $client_id, array $state, int $user_id ): bool {
			global $wpdb;

			if ( '' === $room || '' === $client_id ) {
				return false;
			}

			wp_recursive_ksort( $state );

			/**
			 * Filters granularity used for rounding up a client's awareness timestamp.
			 *
			 * Modifies the granularity used when recording the latest time a client updates their
			 * awareness state. This allows implementations to increase or reduce the granularity
			 * of awareness updates for the desired balance of real-time updates and server load.
			 *
			 * The default awareness granularity of 10 seconds limits the number of writes to the
			 * database/object cache as the awareness state is only updated if the time has changed.
			 *
			 * @since 7.0.0
			 *
			 * @param int $granularity Granularity in seconds. Default 10.
			 */
			$granularity = absint( apply_filters( 'wp_sync_awareness_timestamp_granularity', 10 ) );
			if ( 0 === $granularity ) {
				$granularity = 1;
			}

			$now_timestamp = (int) ceil( time() / $granularity ) * $granularity;
			$now_mysql     = gmdate( 'Y-m-d H:i:s', $now_timestamp );
			$cache_key     = $this->get_awareness_cache_key( $room );

			if ( wp_using_ext_object_cache() ) {
				$awareness = $this->get_awareness_state( $room );

				foreach ( $awareness as $index => $client_awareness ) {
					if (
					$client_awareness['client_id'] === $client_id
					&& $client_awareness['timestamp'] === $now_timestamp
					&& $client_awareness['state'] === $state
					) {
						// Cache already has the current client expiry and state, consider update a success (avoids cache thrashing).
						return true;
					}

					if ( $client_awareness['client_id'] === $client_id ) {
						// Remove stale cache entry for the current client.
						unset( $awareness[ $index ] );
						break;
					}
				}

				$client_awareness = array(
					'client_id' => $client_id,
					'state'     => $state,
					'user_id'   => $user_id,
					'timestamp' => $now_timestamp,
				);

				$awareness[] = $client_awareness;

				// Sort awareness entries by client_id.
				$awareness = wp_list_sort( $awareness, 'client_id' );
				wp_cache_set( $cache_key, $awareness, 'collaboration', HOUR_IN_SECONDS );

				return true;
			}

			$data = wp_json_encode( $state );

			/*
			 * Check if a row already exists.
			 *
			 * In the event of a race condition, the latest row will be returned as the update target.
			 */
			/** @var object{ collaboration_id: string, date_gmt: string, data: string }|null $exists */
			$exists = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT collaboration_id, date_gmt, data FROM {$wpdb->collaboration} WHERE room = %s AND type = 'awareness' AND client_id = %s  ORDER BY collaboration_id DESC LIMIT 1",
					$room,
					$client_id
				)
			);

			if ( $exists && $exists->date_gmt === $now_mysql && $exists->data === $data ) {
				// Row already has the current date & state, consider update a success.
				return true;
			}

			if ( $exists ) {
				$result = $wpdb->update(
					$wpdb->collaboration,
					array(
						'user_id'  => $user_id,
						'data'     => $data,
						'date_gmt' => $now_mysql,
					),
					array( 'collaboration_id' => $exists->collaboration_id )
				);
			} else {
				$result = $wpdb->insert(
					$wpdb->collaboration,
					array(
						'room'      => $room,
						'type'      => 'awareness',
						'client_id' => $client_id,
						'user_id'   => $user_id,
						'data'      => $data,
						'date_gmt'  => $now_mysql,
					)
				);
			}

			if ( false === $result ) {
				return false;
			}

			// Clear in memory cache.
			wp_cache_delete( $cache_key, 'collaboration' );
			return true;
		}
	}
}
