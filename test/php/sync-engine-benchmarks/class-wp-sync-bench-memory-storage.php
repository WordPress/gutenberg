<?php
/**
 * In-memory WP_Sync_Storage for the sync-engine benchmark.
 *
 * The production engines are benchmarked THROUGH THE REAL SEAM
 * (handle_updates / get_updates_since); only storage is swapped for an
 * in-memory implementation. This isolates engine CPU (the intent-log
 * planner/replay, the yjs relay's append) from database I/O — which is the
 * SAME transport-level cost for either engine and would otherwise dominate
 * and blur the comparison. Storage GROWTH (row count and byte size) is
 * still measured exactly, because that is a real differentiator: the
 * intent log compacts, a naive relay grows unbounded.
 *
 * Markers mirror the postmeta store's `meta_id`: a per-room monotonic
 * counter, never reset by trimming (so cursors stay stable across
 * compaction). The engine's checkpoint path reads `$wpdb->insert_id`
 * directly, so add_update mirrors the last marker there.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Bench_Memory_Storage' ) ) {

	/**
	 * Fast in-memory storage backend for benchmarking.
	 */
	class WP_Sync_Bench_Memory_Storage implements WP_Sync_Storage {
		/**
		 * Per-room ordered updates: marker => JSON string (stored the way the
		 * postmeta store persists them, so byte accounting matches the wire).
		 *
		 * @var array<string, array<int, string>>
		 */
		private $rows = array();

		/**
		 * Per-room monotonic marker counter (meta_id analog).
		 *
		 * @var array<string, int>
		 */
		private $next_marker = array();

		/**
		 * Per-room highest marker observed by the last read (cursor cache).
		 *
		 * @var array<string, int>
		 */
		private $cursor = array();

		/**
		 * Per-room awareness state.
		 *
		 * @var array<string, array>
		 */
		private $awareness = array();

		/**
		 * Per-room engine lineage.
		 *
		 * @var array<string, string>
		 */
		private $engine = array();

		/**
		 * Per-room arbitrary metadata (checkpoint bookkeeping).
		 *
		 * @var array<string, array>
		 */
		private $meta = array();

		public function add_update( string $room, $update ): bool {
			$marker                         = ( $this->next_marker[ $room ] ?? 0 ) + 1;
			$this->next_marker[ $room ]     = $marker;
			$this->rows[ $room ][ $marker ] = wp_json_encode( $update );
			// The engine reads $wpdb->insert_id for the checkpoint cursor.
			if ( isset( $GLOBALS['wpdb'] ) ) {
				$GLOBALS['wpdb']->insert_id = $marker;
			}
			return true;
		}

		public function get_awareness_state( string $room ): array {
			return $this->awareness[ $room ] ?? array();
		}

		public function set_awareness_state( string $room, array $awareness ): bool {
			$this->awareness[ $room ] = $awareness;
			return true;
		}

		public function get_cursor( string $room ): int {
			return $this->cursor[ $room ] ?? 0;
		}

		public function get_update_count( string $room ): int {
			return count( $this->rows[ $room ] ?? array() );
		}

		public function get_updates_after_cursor( string $room, int $cursor ): array {
			$max = $this->next_marker[ $room ] ?? 0;
			// Match the postmeta store: the read caches the room cursor at the
			// highest marker, even when nothing is newer than $cursor.
			$this->cursor[ $room ] = $max;
			if ( $max <= $cursor ) {
				return array();
			}
			$updates = array();
			foreach ( $this->rows[ $room ] ?? array() as $marker => $json ) {
				if ( $marker > $cursor ) {
					$decoded = json_decode( $json, true );
					if ( null !== $decoded ) {
						$updates[] = $decoded;
					}
				}
			}
			return $updates;
		}

		public function remove_updates_before_cursor( string $room, int $cursor ): bool {
			foreach ( array_keys( $this->rows[ $room ] ?? array() ) as $marker ) {
				if ( $marker < $cursor ) {
					unset( $this->rows[ $room ][ $marker ] );
				}
			}
			return true;
		}

		public function get_room_engine( string $room ): ?string {
			return $this->engine[ $room ] ?? null;
		}

		public function set_room_engine( string $room, string $engine ): bool {
			// Lineage is write-once, like the production store.
			if ( ! isset( $this->engine[ $room ] ) ) {
				$this->engine[ $room ] = $engine;
			}
			return true;
		}

		/**
		 * Reads room metadata (checkpoint bookkeeping). Feature-detected by
		 * the engine via method_exists.
		 *
		 * @param string $room Room identifier.
		 * @param string $key  Meta key.
		 * @return mixed Stored value, or null.
		 */
		public function get_room_meta( string $room, string $key ) {
			return $this->meta[ $room ][ $key ] ?? null;
		}

		/**
		 * Writes room metadata.
		 *
		 * @param string $room  Room identifier.
		 * @param string $key   Meta key.
		 * @param mixed  $value Serializable value.
		 * @return bool True on success.
		 */
		public function set_room_meta( string $room, string $key, $value ): bool {
			$this->meta[ $room ][ $key ] = $value;
			return true;
		}

		/**
		 * Total stored bytes for a room (sum of persisted update JSON) — the
		 * on-disk footprint the room would occupy.
		 *
		 * @param string $room Room identifier.
		 * @return int Byte size.
		 */
		public function stored_bytes( string $room ): int {
			$bytes = 0;
			foreach ( $this->rows[ $room ] ?? array() as $json ) {
				$bytes += strlen( $json );
			}
			return $bytes;
		}
	}
}
