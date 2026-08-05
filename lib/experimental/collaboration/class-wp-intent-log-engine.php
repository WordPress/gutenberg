<?php
/**
 * WP_Intent_Log_Engine class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Intent_Log_Engine' ) ) {

	/**
	 * The intent-log sync engine: a server-sequenced log of typed intents
	 * with server-side rebase, per-intent dispositions, and an escalation
	 * lane — the server half of the architecture prototyped in
	 * `packages/sync/src/engines/intent-log/` and planned in
	 * `prototypes/sync/ARCHITECTURE.md`.
	 *
	 * Wire protocol over the transport's typed updates:
	 *
	 * - `snapshot` (server → client): JSON `{ doc }` — the genesis document,
	 *   stored as the room's first row when the room initializes from post
	 *   content. Clients bootstrap from it and treat its position as seq 0.
	 * - `intent` (client → server → clients): JSON intent envelope. Clients
	 *   send authored intents; the server plans them (WP_Intent_Log_Planner),
	 *   stores ACCEPTED intents with their transformed payloads, and relays
	 *   those rows to every client (including the author, who needs the
	 *   authoritative transformed form). The engine log = intent rows in
	 *   storage order; an intent's `baseSeq` counts intent rows.
	 * - `proposal` (server → clients): JSON `{ intent, actorId, reason }` —
	 *   an escalated intent parked for review (the proposal lane).
	 * - `voided` (server → clients): JSON `{ intentId, reason }` — a voided
	 *   disposition marker, persisted so redelivered intents settle
	 *   identically (exactly-once semantics over at-least-once transports).
	 *
	 * Ingest responds with a per-intent `dispositions` array through the
	 * transport (applied / escalated / voided), which is the client's ack.
	 *
	 * Attribution: `actorId` is stamped server-side as
	 * `u{user_id}c{client_id}` — the user half is authenticated, the client
	 * half is bound by the transport's client-id ownership check, and the
	 * per-tab client id preserves the planner's one-session-per-actor
	 * authoring model. Client-sent actorId values are ignored.
	 *
	 * Prototype simplifications (Phase 2a): no compaction (the log replays
	 * from genesis; maybe_compact is a no-op), and genesis/materialization
	 * map a block's inner HTML opaquely onto the engine's `content` field —
	 * rich-text-coordinate capture is the client bridge's job.
	 *
	 * @since 7.2.0
	 * @access private
	 */
	class WP_Intent_Log_Engine implements WP_Sync_Engine {
		/**
		 * Engine slug.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const SLUG = 'intent-log';

		/**
		 * Engine protocol version.
		 *
		 * @since 7.2.0
		 * @var int
		 */
		const PROTOCOL_VERSION = 1;

		/**
		 * Update type: client-authored intent (stored transformed).
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const UPDATE_TYPE_INTENT = 'intent';

		/**
		 * Update type: room genesis snapshot.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const UPDATE_TYPE_SNAPSHOT = 'snapshot';

		/**
		 * Update type: escalated intent in the proposal lane.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const UPDATE_TYPE_PROPOSAL = 'proposal';

		/**
		 * Update type: persisted voided-disposition marker.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const UPDATE_TYPE_VOIDED = 'voided';

		/**
		 * Storage backend.
		 *
		 * @since 7.2.0
		 */
		private WP_Sync_Storage $storage;

		/**
		 * Per-request cache of room state, keyed by room.
		 *
		 * @since 7.2.0
		 * @var array<string, array>
		 */
		private array $room_state = array();

		/**
		 * Constructor.
		 *
		 * @since 7.2.0
		 *
		 * @param WP_Sync_Storage $storage Storage backend.
		 */
		public function __construct( WP_Sync_Storage $storage ) {
			$this->storage = $storage;
		}

		/**
		 * Returns the engine slug.
		 *
		 * @since 7.2.0
		 *
		 * @return string Engine slug.
		 */
		public function get_slug(): string {
			return self::SLUG;
		}

		/**
		 * Returns the engine protocol version.
		 *
		 * @since 7.2.0
		 *
		 * @return int Protocol version.
		 */
		public function get_protocol_version(): int {
			return self::PROTOCOL_VERSION;
		}

		/**
		 * Returns the update types this engine accepts on the route. Clients
		 * may only SEND `intent`; the rest are server-emitted (enforced in
		 * handle_updates).
		 *
		 * @since 7.2.0
		 *
		 * @return string[] Accepted update types.
		 */
		public function get_update_types(): array {
			return array(
				self::UPDATE_TYPE_INTENT,
				self::UPDATE_TYPE_SNAPSHOT,
				self::UPDATE_TYPE_PROPOSAL,
				self::UPDATE_TYPE_VOIDED,
			);
		}

		/**
		 * The server-stamped actor id for a request.
		 *
		 * @since 7.2.0
		 *
		 * @param int $client_id Transport client id.
		 * @return string Actor id.
		 */
		public static function actor_id( int $client_id ): string {
			return 'u' . get_current_user_id() . 'c' . $client_id;
		}

		/**
		 * Ingests a batch of intent updates from one client.
		 *
		 * @since 7.2.0
		 *
		 * @param string $room      Room identifier.
		 * @param int    $client_id Client identifier.
		 * @param int    $cursor    Client transport cursor (unused; intents
		 *                          carry their own baseSeq).
		 * @param array  $updates   Typed updates.
		 * @param array  $context   Transport context.
		 * @return array|WP_Error array( 'dispositions' => array ) or error.
		 */
		public function handle_updates( string $room, int $client_id, int $cursor, array $updates, array $context ) {
			if ( array() === $updates ) {
				return array( 'dispositions' => null );
			}

			$state = $this->load_room( $room );
			if ( is_wp_error( $state ) ) {
				return $state;
			}

			$actor_id = self::actor_id( $client_id );
			$intents  = array();
			foreach ( $updates as $update ) {
				if ( self::UPDATE_TYPE_INTENT !== $update['type'] ) {
					return new WP_Error(
						'rest_invalid_update_type',
						__( 'Clients may only send intent updates to an intent-log room.', 'gutenberg' ),
						array( 'status' => 400 )
					);
				}
				$intent = json_decode( $update['data'], true );
				if (
					! is_array( $intent ) ||
					! is_string( $intent['intentId'] ?? null ) || '' === $intent['intentId'] ||
					! is_int( $intent['baseSeq'] ?? null ) || $intent['baseSeq'] < 0 ||
					$intent['baseSeq'] > count( $state['log'] ) ||
					! is_string( $intent['type'] ?? null ) ||
					! is_array( $intent['payload'] ?? null ) ||
					! ( null === ( $intent['txnId'] ?? null ) || is_string( $intent['txnId'] ) )
				) {
					return new WP_Error(
						'rest_sync_invalid_intent',
						__( 'Malformed intent envelope.', 'gutenberg' ),
						array( 'status' => 400 )
					);
				}
				// Attribution is a server-side fact: stamp, never trust.
				$intent['actorId'] = $actor_id;
				$intent['txnId']   = $intent['txnId'] ?? null;
				$intents[]         = $intent;
			}

			// Group first, then drop already-settled intents within units, so
			// a redelivered prefix cannot fuse two distinct units (mirrors the
			// JS engine's serverIngestBatch).
			$units = array();
			foreach ( WP_Intent_Log_Planner::group_units( $intents ) as $unit ) {
				$fresh = array_values(
					array_filter(
						$unit,
						function ( $intent ) use ( $state ) {
							return ! isset( $state['settled'][ $intent['intentId'] ] );
						}
					)
				);
				if ( count( $fresh ) > 0 ) {
					$units[] = $fresh;
				}
			}

			$log       = $state['log'];
			$doc_cache = array( 0 => $state['genesis'] );
			$doc_at    = function ( int $seq ) use ( $log, &$doc_cache ): array {
				if ( isset( $doc_cache[ $seq ] ) ) {
					return $doc_cache[ $seq ];
				}
				$nearest = 0;
				foreach ( array_keys( $doc_cache ) as $key ) {
					if ( $key <= $seq && $key > $nearest ) {
						$nearest = $key;
					}
				}
				$doc               = WP_Intent_Log_Document::replay(
					$doc_cache[ $nearest ],
					array_slice( $log, $nearest, $seq - $nearest )
				);
				$doc_cache[ $seq ] = $doc;
				return $doc;
			};

			$plan = WP_Intent_Log_Planner::plan_batch( $units, $state['log'], $doc_at );

			// Commit the plan to storage.
			foreach ( $plan['rows'] as $row ) {
				$intent_id = $row['intent']['intentId'];
				if ( null !== $row['accepted'] ) {
					$stored = $this->add_row( $room, $client_id, self::UPDATE_TYPE_INTENT, $row['accepted'] );
				} elseif ( null !== $row['proposal'] ) {
					$stored = $this->add_row( $room, $client_id, self::UPDATE_TYPE_PROPOSAL, $row['proposal'] );
				} else {
					$stored = true;
				}
				// Apply-time voids live in the log AND get a marker; pure
				// rebase voids get only the marker.
				if ( 'voided' === $row['disposition']['status'] ) {
					$stored = $stored && $this->add_row(
						$room,
						$client_id,
						self::UPDATE_TYPE_VOIDED,
						array(
							'intentId' => $intent_id,
							'reason'   => $row['disposition']['reason'],
						)
					);
				}
				if ( ! $stored ) {
					return new WP_Error(
						'rest_sync_storage_error',
						__( 'Failed to store sync update.', 'gutenberg' ),
						array( 'status' => 500 )
					);
				}
				$state['settled'][ $intent_id ] = $row['disposition'];
			}
			$this->room_state[ $room ] = null; // Invalidate: rows changed.

			$dispositions = array();
			foreach ( $intents as $intent ) {
				$dispositions[] = array_merge(
					array( 'intentId' => $intent['intentId'] ),
					$state['settled'][ $intent['intentId'] ] ?? array( 'status' => 'unknown' )
				);
			}

			return array( 'dispositions' => $dispositions );
		}

		/**
		 * Returns rows after the cursor for a catching-up client.
		 *
		 * Unlike the relay engine, a client's OWN rows are not filtered out:
		 * the author needs the authoritative transformed form of its accepted
		 * intents in its local log copy for prediction parity.
		 *
		 * @since 7.2.0
		 *
		 * @param string $room      Room identifier.
		 * @param int    $client_id Client identifier.
		 * @param int    $cursor    Return rows after this cursor.
		 * @param array  $context   Transport context.
		 * @return array Room response data.
		 */
		public function get_updates_since( string $room, int $client_id, int $cursor, array $context ): array {
			// Ensure genesis exists so first pollers receive the snapshot.
			$this->load_room( $room );

			$rows          = $this->storage->get_updates_after_cursor( $room, $cursor );
			$typed_updates = array();
			foreach ( $rows as $row ) {
				$typed_updates[] = array(
					'data' => $row['data'],
					'type' => $row['type'],
				);
			}

			return array(
				'end_cursor'     => $this->storage->get_cursor( $room ),
				'room'           => $room,
				'should_compact' => false,
				'total_updates'  => $this->storage->get_update_count( $room ),
				'updates'        => $typed_updates,
			);
		}

		/**
		 * Serializes the room's current document back to post content.
		 *
		 * @since 7.2.0
		 *
		 * @param string $room Room identifier.
		 * @return string|null Serialized block content, or null on failure.
		 */
		public function materialize( string $room ): ?string {
			$state = $this->load_room( $room );
			if ( is_wp_error( $state ) ) {
				return null;
			}
			$doc = WP_Intent_Log_Document::replay( $state['genesis'], $state['log'] );

			$serialized = array();
			foreach ( $doc['root'] as $block ) {
				$serialized[] = serialize_block( self::to_serializable_block( $block ) );
			}

			return implode( "\n\n", $serialized );
		}

		/**
		 * Loads (and lazily initializes) a room's engine state from storage.
		 *
		 * @since 7.2.0
		 *
		 * @param string $room Room identifier.
		 * @return array|WP_Error array( 'genesis', 'log', 'settled' ).
		 */
		private function load_room( string $room ) {
			if ( isset( $this->room_state[ $room ] ) && null !== $this->room_state[ $room ] ) {
				return $this->room_state[ $room ];
			}

			$rows    = $this->storage->get_updates_after_cursor( $room, 0 );
			$genesis = null;
			$log     = array();
			$settled = array();

			foreach ( $rows as $row ) {
				$decoded = json_decode( $row['data'], true );
				if ( ! is_array( $decoded ) ) {
					continue;
				}
				switch ( $row['type'] ) {
					case self::UPDATE_TYPE_SNAPSHOT:
						// First snapshot wins (a concurrent-initialization
						// duplicate is ignored deterministically).
						if ( null === $genesis ) {
							$genesis = $decoded['doc'];
						}
						break;
					case self::UPDATE_TYPE_INTENT:
						$log[]                           = $decoded;
						$settled[ $decoded['intentId'] ] = array( 'status' => 'applied' );
						break;
					case self::UPDATE_TYPE_PROPOSAL:
						$settled[ $decoded['intent']['intentId'] ] = array(
							'status' => 'escalated',
							'reason' => $decoded['reason'],
						);
						break;
					case self::UPDATE_TYPE_VOIDED:
						// Overrides an intent row's 'applied': apply-time
						// voids are in the log but settled as voided.
						$settled[ $decoded['intentId'] ] = array(
							'status' => 'voided',
							'reason' => $decoded['reason'],
						);
						break;
				}
			}

			if ( null === $genesis ) {
				$genesis = $this->initialize_room( $room );
				if ( is_wp_error( $genesis ) ) {
					return $genesis;
				}
			}

			$state                     = array(
				'genesis' => $genesis,
				'log'     => $log,
				'settled' => $settled,
			);
			$this->room_state[ $room ] = $state;

			return $state;
		}

		/**
		 * Builds and stores the room's genesis snapshot.
		 *
		 * For a single post-type entity room, genesis derives from the post's
		 * current content: parsed blocks map onto the engine document, block
		 * identity comes from `metadata.syncId` when present and a
		 * deterministic genesis id otherwise. Other room kinds start empty.
		 *
		 * @since 7.2.0
		 *
		 * @param string $room Room identifier.
		 * @return array|WP_Error Genesis document.
		 */
		private function initialize_room( string $room ) {
			$parsed  = WP_Sync_Config::parse_room( $room );
			$genesis = array( 'root' => array() );

			if ( null !== $parsed && 'postType' === $parsed['entity_kind'] && ! empty( $parsed['object_id'] ) ) {
				$post = get_post( (int) $parsed['object_id'] );
				if ( $post instanceof WP_Post && '' !== $post->post_content ) {
					$specs   = self::blocks_to_specs(
						parse_blocks( $post->post_content ),
						(int) $post->ID,
						array()
					);
					$genesis = WP_Intent_Log_Document::create_document( $specs );
				}
			}

			if ( ! $this->add_row( $room, 0, self::UPDATE_TYPE_SNAPSHOT, array( 'doc' => $genesis ) ) ) {
				return new WP_Error(
					'rest_sync_storage_error',
					__( 'Failed to store the room genesis snapshot.', 'gutenberg' ),
					array( 'status' => 500 )
				);
			}

			return $genesis;
		}

		/**
		 * Maps parsed blocks onto engine block specs.
		 *
		 * @since 7.2.0
		 *
		 * @param array $blocks  Output of parse_blocks().
		 * @param int   $post_id Post ID (genesis id input).
		 * @param array $path    Block path within the post.
		 * @return array Block specs for WP_Intent_Log_Document.
		 */
		private static function blocks_to_specs( array $blocks, int $post_id, array $path ): array {
			$specs = array();
			$index = 0;
			foreach ( $blocks as $block ) {
				if ( empty( $block['blockName'] ) ) {
					continue; // Freeform/whitespace fragments.
				}
				$block_path = array_merge( $path, array( $index ) );
				$attrs      = is_array( $block['attrs'] ) ? $block['attrs'] : array();

				$sync_id = $attrs['metadata']['syncId'] ?? null;
				if ( ! is_string( $sync_id ) || '' === $sync_id ) {
					$sync_id = WP_Intent_Log_Planner::genesis_sync_id( $post_id, 0, $block_path );
				} else {
					unset( $attrs['metadata']['syncId'] );
					if ( array() === $attrs['metadata'] ) {
						unset( $attrs['metadata'] );
					}
				}

				$specs[] = array(
					'syncId'    => $sync_id,
					'blockType' => $block['blockName'],
					'attrs'     => $attrs,
					'text'      => trim( $block['innerHTML'] ),
					'children'  => self::blocks_to_specs( $block['innerBlocks'], $post_id, $block_path ),
				);
				++$index;
			}

			return $specs;
		}

		/**
		 * Maps an engine block back to a serialize_block()-compatible array.
		 *
		 * @since 7.2.0
		 *
		 * @param array $block Engine block.
		 * @return array WP_Block_Parser_Block-shaped array.
		 */
		private static function to_serializable_block( array $block ): array {
			$attrs                       = $block['attrs'];
			$attrs['metadata']           = is_array( $attrs['metadata'] ?? null ) ? $attrs['metadata'] : array();
			$attrs['metadata']['syncId'] = $block['syncId'];

			$inner_blocks  = array_map( array( __CLASS__, 'to_serializable_block' ), $block['children'] );
			$text          = $block['fields']['content']['text'] ?? '';
			$inner_content = array();
			if ( '' !== $text ) {
				$inner_content[] = $text;
			}
			foreach ( $inner_blocks as $unused ) {
				$inner_content[] = null;
			}

			return array(
				'blockName'    => $block['blockType'],
				'attrs'        => $attrs,
				'innerBlocks'  => $inner_blocks,
				'innerHTML'    => $text,
				'innerContent' => $inner_content,
			);
		}

		/**
		 * Stores one typed row for a room.
		 *
		 * @since 7.2.0
		 *
		 * @param string $room      Room identifier.
		 * @param int    $client_id Originating client id (0 = server).
		 * @param string $type      Row type.
		 * @param array  $payload   JSON-serializable payload.
		 * @return bool Whether the row was stored.
		 */
		private function add_row( string $room, int $client_id, string $type, array $payload ): bool {
			return $this->storage->add_update(
				$room,
				array(
					'client_id' => $client_id,
					'data'      => wp_json_encode( $payload ),
					'type'      => $type,
				)
			);
		}
	}
}
