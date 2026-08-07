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
		 * Update type: a proposal's terminal state (client-sendable).
		 * `{ proposalId, resolution: restored|dismissed }`, server-stamped
		 * with `resolvedBy` and `time`. Idempotent by proposalId.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const UPDATE_TYPE_RESOLVED = 'resolved';

		/**
		 * Escalation reason for intents whose payload carries markup the
		 * authoring user may not publish (per `wp_kses_post`): the intent is
		 * parked for review instead of applied, and only a user with
		 * `unfiltered_html` can meaningfully restore it (a restore re-authors
		 * the content as ordinary intents under the RESTORER's capability, so
		 * an unprivileged restore simply re-escalates).
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const ESCALATION_REQUIRES_APPROVAL = 'requires-approval';

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
		 * Per-request debug info stash, keyed by room (ingest fills it,
		 * get_updates_since attaches it as the `_debug` envelope when the
		 * request opted in).
		 *
		 * @since 7.2.0
		 * @var array<string, array>
		 */
		private array $debug_stash = array();

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
				self::UPDATE_TYPE_RESOLVED,
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
		 * Acquires the per-room ingest lock (MySQL GET_LOCK, held by this
		 * request's database connection).
		 *
		 * @since 7.2.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room Room identifier.
		 * @return true|WP_Error True when held, retryable error otherwise.
		 */
		private function acquire_room_lock( string $room ) {
			global $wpdb;

			$acquired = $wpdb->get_var(
				$wpdb->prepare(
					'SELECT GET_LOCK(%s, %d)',
					$this->room_lock_name( $room ),
					5 // Seconds; a plan is milliseconds, so contention clears fast.
				)
			);
			if ( '1' === (string) $acquired ) {
				return true;
			}

			// Timeout or connection error: the client retries on its normal
			// poll cadence.
			return new WP_Error(
				'rest_sync_room_busy',
				__( 'The room is busy processing another request. Retry shortly.', 'gutenberg' ),
				array( 'status' => 503 )
			);
		}

		/**
		 * Releases the per-room ingest lock.
		 *
		 * @since 7.2.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room Room identifier.
		 */
		private function release_room_lock( string $room ): void {
			global $wpdb;

			$wpdb->query(
				$wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $this->room_lock_name( $room ) )
			);
		}

		/**
		 * The MySQL user-lock name for a room, prefixed for multisite/table
		 * isolation and hashed to stay under the 64-character lock-name cap.
		 *
		 * @since 7.2.0
		 *
		 * @global wpdb $wpdb WordPress database abstraction object.
		 *
		 * @param string $room Room identifier.
		 * @return string Lock name.
		 */
		private function room_lock_name( string $room ): string {
			global $wpdb;

			return $wpdb->prefix . 'sync_ingest_' . md5( $room );
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

			/*
			 * Serialize ingest per room: the whole design rests on a single
			 * server-assigned total order, and load→plan→commit is not
			 * atomic. Two concurrent pollers planning against the same log
			 * length would commit transformed payloads with conflicting
			 * bases and diverge every replica. The lock is per-room, so
			 * rooms never contend with each other.
			 */
			$lock_started = microtime( true );
			$lock         = $this->acquire_room_lock( $room );
			$lock_wait_ms = round( ( microtime( true ) - $lock_started ) * 1000, 1 );
			if ( is_wp_error( $lock ) ) {
				do_action( 'qm/debug', "wp-sync: ingest lock timeout for {$room} after {$lock_wait_ms}ms" );
				return $lock;
			}
			try {
				return $this->handle_updates_locked( $room, $client_id, $updates, $context, $lock_wait_ms );
			} finally {
				$this->release_room_lock( $room );
			}
		}

		/**
		 * The body of handle_updates(), run under the per-room ingest lock.
		 *
		 * @since 7.2.0
		 *
		 * @param string $room         Room identifier.
		 * @param int    $client_id    Client identifier.
		 * @param array  $updates      Typed updates.
		 * @param array  $context      Transport context (debug opt-in).
		 * @param float  $lock_wait_ms Time spent acquiring the ingest lock.
		 * @return array|WP_Error array( 'dispositions' => array ) or error.
		 */
		private function handle_updates_locked( string $room, int $client_id, array $updates, array $context = array(), float $lock_wait_ms = 0 ) {
			$state = $this->load_room( $room );
			if ( is_wp_error( $state ) ) {
				return $state;
			}

			$actor_id      = self::actor_id( $client_id );
			$base_seq      = (int) ( $state['base_seq'] ?? 0 );
			$head_seq      = $base_seq + count( $state['log'] );
			$intents       = array();
			$resolutions   = array();
			$invalid       = array();
			$submitted_ids = array();
			foreach ( $updates as $update ) {
				if ( self::UPDATE_TYPE_RESOLVED === $update['type'] ) {
					$resolution = json_decode( $update['data'], true );
					if (
						! is_array( $resolution ) ||
						! is_string( $resolution['proposalId'] ?? null ) || '' === $resolution['proposalId'] ||
						! in_array( $resolution['resolution'] ?? null, array( 'restored', 'dismissed' ), true )
					) {
						return new WP_Error(
							'rest_sync_invalid_intent',
							__( 'Malformed proposal resolution.', 'gutenberg' ),
							array( 'status' => 400 )
						);
					}
					$resolutions[] = $resolution;
					continue;
				}
				if ( self::UPDATE_TYPE_INTENT !== $update['type'] ) {
					return new WP_Error(
						'rest_invalid_update_type',
						__( 'Clients may only send intent or resolution updates to an intent-log room.', 'gutenberg' ),
						array( 'status' => 400 )
					);
				}
				$intent    = json_decode( $update['data'], true );
				$intent_id = is_array( $intent ) && is_string( $intent['intentId'] ?? null ) && '' !== $intent['intentId']
					? $intent['intentId']
					: null;
				/*
				 * Malformed rows settle PER-INTENT as `invalid-payload`
				 * voids instead of failing the whole request: a request-
				 * level 400 would let one bad row (a client bug, or a
				 * hostile crafted row) starve every valid edit in the batch
				 * and wedge the author's outbox in a permanent retry loop.
				 * Rows without even a recoverable intentId are dropped —
				 * nothing could correlate their disposition anyway.
				 */
				$envelope_ok = null !== $intent_id &&
					is_int( $intent['baseSeq'] ?? null ) && $intent['baseSeq'] >= 0 &&
					$intent['baseSeq'] <= $head_seq &&
					is_string( $intent['type'] ?? null ) &&
					is_array( $intent['payload'] ?? null ) &&
					( null === ( $intent['txnId'] ?? null ) || is_string( $intent['txnId'] ) );
				// Payloads reach typed planner/document code: validate the
				// full vocabulary schema up front so a malformed intent
				// voids cleanly instead of fataling mid-plan.
				if ( ! $envelope_ok || ! WP_Intent_Log_Planner::is_valid_payload( $intent['type'], $intent['payload'] ) ) {
					if ( null !== $intent_id ) {
						$submitted_ids[]       = $intent_id;
						$invalid[ $intent_id ] = array(
							'status' => 'voided',
							'reason' => 'invalid-payload',
						);
					}
					continue;
				}
				// Attribution is a server-side fact: stamp, never trust.
				$intent['actorId'] = $actor_id;
				$intent['txnId']   = $intent['txnId'] ?? null;
				$intents[]         = $intent;
				$submitted_ids[]   = $intent_id;
			}
			if ( count( $invalid ) > 0 ) {
				do_action( 'qm/debug', 'wp-sync: ' . count( $invalid ) . " invalid intent(s) voided in {$room}" );
			}

			// Group first, then drop already-settled intents within units, so
			// a redelivered prefix cannot fuse two distinct units (mirrors the
			// JS engine's serverIngestBatch). The in-batch set extends the
			// idempotency to duplicates WITHIN one request: the settled map
			// is only populated after planning. Intents authored BELOW the
			// retention horizon (baseSeq < base_seq — the priors they need
			// were compacted away, so a one-sided transform is impossible)
			// settle immediately as stale voids without planning; the client
			// re-derives the work from its editor tree after its reset.
			$seen_in_batch = array();
			$stale         = array();
			$units         = array();
			foreach ( WP_Intent_Log_Planner::group_units( $intents ) as $unit ) {
				$fresh = array_values(
					array_filter(
						$unit,
						function ( $intent ) use ( $state, $base_seq, &$seen_in_batch, &$stale ) {
							$intent_id = $intent['intentId'];
							if ( isset( $state['settled'][ $intent_id ] ) || isset( $seen_in_batch[ $intent_id ] ) ) {
								return false;
							}
							$seen_in_batch[ $intent_id ] = true;
							if ( $intent['baseSeq'] < $base_seq ) {
								$stale[ $intent_id ] = array(
									'status' => 'voided',
									'reason' => 'stale-base',
								);
								return false;
							}
							return true;
						}
					)
				);
				if ( count( $fresh ) > 0 ) {
					$units[] = $fresh;
				}
			}

			/*
			 * Capability enforcement (the kses lane): when the authoring user
			 * lacks `unfiltered_html`, an intent whose payload carries
			 * protected markup never reaches the planner — its WHOLE unit (a
			 * batch of edits made together) parks as a `requires-approval`
			 * proposal instead. This closes the laundering hole where a
			 * filtered user's markup would otherwise materialize into every
			 * collaborator's editor and then persist under a privileged
			 * saver's capability. Restoring the proposal re-authors the
			 * content as ordinary intents under the RESTORER's capability, so
			 * approval semantics need no separate machinery.
			 */
			$requires_approval = array();
			if ( ! current_user_can( 'unfiltered_html' ) ) {
				$kept = array();
				foreach ( $units as $unit ) {
					$protected = false;
					foreach ( $unit as $intent ) {
						if ( self::intent_requires_unfiltered_html( $intent ) ) {
							$protected = true;
							break;
						}
					}
					if ( $protected ) {
						$requires_approval[] = $unit;
					} else {
						$kept[] = $unit;
					}
				}
				$units = $kept;
			}

			$log       = $state['log'];
			$doc_cache = array( $base_seq => $state['genesis'] );
			$doc_at    = function ( int $seq ) use ( $log, $base_seq, &$doc_cache ): array {
				if ( isset( $doc_cache[ $seq ] ) ) {
					return $doc_cache[ $seq ];
				}
				$nearest = $base_seq;
				foreach ( array_keys( $doc_cache ) as $key ) {
					if ( $key <= $seq && $key > $nearest ) {
						$nearest = $key;
					}
				}
				$doc               = WP_Intent_Log_Document::replay(
					$doc_cache[ $nearest ],
					array_slice( $log, $nearest - $base_seq, $seq - $nearest )
				);
				$doc_cache[ $seq ] = $doc;
				return $doc;
			};

			// Park capability-gated units as proposals (same row shape as
			// planner escalations, so replay/retention/resolution machinery
			// applies unchanged).
			foreach ( $requires_approval as $unit ) {
				foreach ( $unit as $intent ) {
					$intent_id = $intent['intentId'];
					$stored    = $this->add_row(
						$room,
						$client_id,
						self::UPDATE_TYPE_PROPOSAL,
						array(
							'intent'  => $intent,
							'actorId' => $intent['actorId'],
							'reason'  => self::ESCALATION_REQUIRES_APPROVAL,
							'at'      => $head_seq,
							'time'    => time(),
							'context' => array(
								'excerpt' => self::proposal_excerpt( $doc_at( $head_seq ), $intent ),
							),
						)
					);
					if ( ! $stored ) {
						return new WP_Error(
							'rest_sync_storage_error',
							__( 'Failed to store sync update.', 'gutenberg' ),
							array( 'status' => 500 )
						);
					}
					$state['proposals_open'][ $intent_id ] = true;
					$state['settled'][ $intent_id ]        = array(
						'status' => 'escalated',
						'reason' => self::ESCALATION_REQUIRES_APPROVAL,
					);
				}
			}

			$plan = WP_Intent_Log_Planner::plan_batch( $units, $state['log'], $doc_at, $base_seq );

			// Commit the plan to storage.
			foreach ( $plan['rows'] as $row ) {
				$intent_id = $row['intent']['intentId'];
				if ( null !== $row['accepted'] ) {
					$stored = $this->add_row( $room, $client_id, self::UPDATE_TYPE_INTENT, $row['accepted'] );
				} elseif ( null !== $row['proposal'] ) {
					/*
					 * Review context, captured while the document is at hand:
					 * offsets go stale the moment the log moves on, so the
					 * row carries a content excerpt of the target field for
					 * content-centric rendering (see PROPOSAL-REVIEW.md).
					 */
					$proposal            = $row['proposal'];
					$proposal['at']      = $head_seq;
					$proposal['time']    = time();
					$proposal['context'] = array(
						'excerpt' => self::proposal_excerpt( $doc_at( $head_seq ), $row['intent'] ),
					);
					$stored              = $this->add_row( $room, $client_id, self::UPDATE_TYPE_PROPOSAL, $proposal );
					// Same-request resolutions can target it.
					$state['proposals_open'][ $intent_id ] = true;
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

			// Growth bound: append a compaction checkpoint (and trim behind
			// the previous one) once the retained window is large enough.
			$accepted_count = 0;
			foreach ( $plan['rows'] as $row ) {
				if ( null !== $row['accepted'] ) {
					++$accepted_count;
				}
			}
			$checkpointed = $this->maybe_checkpoint(
				$room,
				$client_id,
				count( $state['log'] ) + $accepted_count,
				$head_seq + $accepted_count,
				$plan['headDoc']
			);

			// Breadcrumbs + the debug envelope stash (attached by the read
			// half of this same request when the client opted in).
			$plan_counts = array(
				'applied'   => 0,
				'escalated' => 0,
				'voided'    => 0,
			);
			foreach ( $plan['rows'] as $row ) {
				$status = $row['disposition']['status'];
				if ( isset( $plan_counts[ $status ] ) ) {
					++$plan_counts[ $status ];
				}
			}
			$plan_counts['stale']    = count( $stale );
			$plan_counts['approval'] = array_sum( array_map( 'count', $requires_approval ) );
			if ( $plan_counts['escalated'] > 0 ) {
				do_action( 'qm/debug', "wp-sync: {$plan_counts['escalated']} intent(s) escalated for review in {$room}" );
			}
			if ( $plan_counts['approval'] > 0 ) {
				do_action( 'qm/debug', "wp-sync: {$plan_counts['approval']} intent(s) parked for approval in {$room} (author lacks unfiltered_html)" );
			}
			if ( $plan_counts['stale'] > 0 ) {
				do_action( 'qm/debug', "wp-sync: {$plan_counts['stale']} stale-base intent(s) voided in {$room} (client below retention horizon)" );
			}
			if ( ! empty( $context['debug'] ) ) {
				$this->debug_stash[ $room ] = array(
					'lock_wait_ms' => $lock_wait_ms,
					'window_rows'  => count( $state['log'] ),
					'head_seq'     => $head_seq + $accepted_count,
					'plan'         => $plan_counts,
					'checkpoint'   => $checkpointed,
				);
			}

			/*
			 * Resolutions, after intents: close open proposals. Idempotent by
			 * proposalId — a redelivered, concurrent, or trimmed-and-resolved
			 * (unknown) id acks as resolved without a new row; only a
			 * currently-open proposal appends one.
			 */
			foreach ( $resolutions as $resolution ) {
				$proposal_id = $resolution['proposalId'];
				if ( isset( $state['proposals_open'][ $proposal_id ] ) && ! isset( $state['resolved'][ $proposal_id ] ) ) {
					$stored = $this->add_row(
						$room,
						$client_id,
						self::UPDATE_TYPE_RESOLVED,
						array(
							'proposalId' => $proposal_id,
							'resolution' => $resolution['resolution'],
							'resolvedBy' => $actor_id,
							'time'       => time(),
						)
					);
					if ( ! $stored ) {
						return new WP_Error(
							'rest_sync_storage_error',
							__( 'Failed to store sync update.', 'gutenberg' ),
							array( 'status' => 500 )
						);
					}
					$state['resolved'][ $proposal_id ] = true;
				}
			}

			$this->room_state[ $room ] = null; // Invalidate: rows changed.

			$dispositions = array();
			foreach ( $submitted_ids as $intent_id ) {
				$dispositions[] = array_merge(
					array( 'intentId' => $intent_id ),
					$state['settled'][ $intent_id ]
						?? $stale[ $intent_id ]
						?? $invalid[ $intent_id ]
						?? array( 'status' => 'unknown' )
				);
			}
			foreach ( $resolutions as $resolution ) {
				$dispositions[] = array(
					'intentId' => $resolution['proposalId'],
					'status'   => 'resolved',
				);
			}

			return array( 'dispositions' => $dispositions );
		}

		/**
		 * Whether an HTML fragment carries markup the kses post filter would
		 * alter — content a user without `unfiltered_html` could not have
		 * authored through a normal filtered save.
		 *
		 * @since 7.2.0
		 *
		 * @param string $html Fragment.
		 * @return bool True when protected.
		 */
		private static function fragment_requires_unfiltered_html( string $html ): bool {
			return wp_kses_post( $html ) !== $html;
		}

		/**
		 * Whether a rich-text span format id would emit protected markup.
		 *
		 * Object formats (`obj|{"html":…}`) re-emit their HTML verbatim, so
		 * the embedded fragment is checked directly. Element formats are run
		 * through the codec's own serializer so the exact emitted bytes are
		 * what kses judges. Malformed ids are protected: never trust what
		 * cannot be fully understood.
		 *
		 * @since 7.2.0
		 *
		 * @param string $format Span format id.
		 * @return bool True when protected.
		 */
		private static function format_requires_unfiltered_html( string $format ): bool {
			$pipe = strpos( $format, '|' );
			$tag  = false === $pipe ? $format : substr( $format, 0, $pipe );
			if ( 'obj' === $tag ) {
				$args = json_decode( substr( $format, $pipe + 1 ), true );
				if ( ! is_array( $args ) || ! is_string( $args['html'] ?? null ) ) {
					return true;
				}
				return self::fragment_requires_unfiltered_html( $args['html'] );
			}
			$decoded = WP_Intent_Log_Rich_Text::decode_format( $format );
			if (
				null === $decoded ||
				! is_array( $decoded['attrs'] ) ||
				! preg_match( '/^[a-z][a-z0-9-]*$/', $decoded['tag'] )
			) {
				return true;
			}
			foreach ( $decoded['attrs'] as $name => $value ) {
				if ( ! is_string( $name ) || ! is_string( $value ) ) {
					return true;
				}
			}
			$html = WP_Intent_Log_Rich_Text::field_to_html(
				array(
					'text'    => 'x',
					'formats' => array(
						array(
							'start'  => 0,
							'end'    => 1,
							'format' => $format,
						),
					),
				)
			);
			return self::fragment_requires_unfiltered_html( $html );
		}

		/**
		 * Whether an inserted block spec (recursively) carries protected
		 * markup. Field text is entity-encoded by the serializer so only
		 * span formats can smuggle markup; block attributes serialize into
		 * the block comment (no more power than a kses-filtered save, which
		 * preserves comments) and are not judged here.
		 *
		 * @since 7.2.0
		 *
		 * @param array $block Block spec from an insert_block payload.
		 * @return bool True when protected.
		 */
		/**
		 * Whether a `_wrapper` internal attr would emit protected markup.
		 * materialize() rebuilds the wrapper's open/close fragments VERBATIM
		 * around the field content, so they are judged as a fragment.
		 *
		 * @since 7.2.0
		 *
		 * @param mixed $wrapper The _wrapper attr value.
		 * @return bool True when protected.
		 */
		private static function wrapper_requires_unfiltered_html( $wrapper ): bool {
			if ( ! is_array( $wrapper ) ) {
				return true;
			}
			$open  = $wrapper['open'] ?? '';
			$close = $wrapper['close'] ?? '';
			if ( ! is_string( $open ) || ! is_string( $close ) ) {
				return true;
			}
			return self::fragment_requires_unfiltered_html( $open . 'x' . $close );
		}

		/**
		 * Whether an attribute value carries protected markup in any string
		 * leaf (recursively).
		 *
		 * Attribute strings are NOT merely comment-JSON: blocks whose save()
		 * emits an attribute as raw markup (core/html `content` being the
		 * canonical case — it has no html/rich-text source, so it rides the
		 * attr lane, not the codec field lane) round-trip attr strings
		 * straight into post_content on the next privileged save.
		 *
		 * @since 7.2.0
		 *
		 * @param mixed $value Attribute value.
		 * @return bool True when protected.
		 */
		private static function attr_value_requires_unfiltered_html( $value ): bool {
			if ( is_string( $value ) ) {
				return self::fragment_requires_unfiltered_html( $value );
			}
			if ( is_array( $value ) ) {
				foreach ( $value as $item ) {
					if ( self::attr_value_requires_unfiltered_html( $item ) ) {
						return true;
					}
				}
			}
			// Numbers, booleans, and null carry no markup.
			return false;
		}

		private static function block_spec_requires_unfiltered_html( array $block ): bool {
			/*
			 * Attributes: the _wrapper internal attr re-emits as raw markup
			 * on materialize; every OTHER attr's string leaves are judged
			 * too, because blocks like core/html render an attr as raw
			 * markup client-side (see attr_value_requires_unfiltered_html).
			 */
			$attrs = is_array( $block['attrs'] ?? null ) ? $block['attrs'] : array();
			foreach ( $attrs as $key => $value ) {
				$protected = '_wrapper' === $key
					? self::wrapper_requires_unfiltered_html( $value )
					: self::attr_value_requires_unfiltered_html( $value );
				if ( $protected ) {
					return true;
				}
			}
			// make_block() also accepts block-level text/formats shorthand
			// (they become the content field); judge both shapes.
			$span_lists = array( $block['formats'] ?? array() );
			foreach ( $block['fields'] ?? array() as $field ) {
				$span_lists[] = is_array( $field ) ? ( $field['formats'] ?? array() ) : array();
			}
			foreach ( $span_lists as $spans ) {
				foreach ( $spans as $span ) {
					$format = is_array( $span ) ? ( $span['format'] ?? null ) : null;
					if ( ! is_string( $format ) || self::format_requires_unfiltered_html( $format ) ) {
						return true;
					}
				}
			}
			foreach ( $block['children'] ?? array() as $child ) {
				if ( self::block_spec_requires_unfiltered_html( $child ) ) {
					return true;
				}
			}
			return false;
		}

		/**
		 * Whether applying this intent would introduce markup its author may
		 * not publish without `unfiltered_html`.
		 *
		 * Markup-bearing payload surfaces: format_text (the span format id,
		 * when turning a format ON), insert_block (the block spec's field
		 * formats, plus every attr's string leaves), and set_attr (string
		 * leaves; blocks like core/html render an attr as raw markup).
		 * Plain text payloads (field text) are entity-encoded by the
		 * serializer and are always safe.
		 *
		 * @since 7.2.0
		 *
		 * @param array $intent Validated intent envelope.
		 * @return bool True when the intent requires the capability.
		 */
		public static function intent_requires_unfiltered_html( array $intent ): bool {
			$payload = $intent['payload'];
			switch ( $intent['type'] ) {
				case 'format_text':
					return ! empty( $payload['on'] )
						&& self::format_requires_unfiltered_html( $payload['format'] );
				case 'insert_block':
					return self::block_spec_requires_unfiltered_html( $payload['block'] );
				case 'set_attr':
					// _wrapper re-emits as raw markup on materialize; other
					// attrs can be rendered raw by the block's own save()
					// (core/html) — judge their string leaves.
					return '_wrapper' === $payload['key']
						? self::wrapper_requires_unfiltered_html( $payload['value'] )
						: self::attr_value_requires_unfiltered_html( $payload['value'] );
				default:
					return false;
			}
		}

		/**
		 * A short plain-text excerpt of an escalated intent's target field,
		 * for content-centric review rendering.
		 *
		 * @since 7.2.0
		 *
		 * @param array $doc    Document at settlement.
		 * @param array $intent The escalated intent (transformed form).
		 * @return string Excerpt (possibly empty).
		 */
		private static function proposal_excerpt( array $doc, array $intent ): string {
			$payload = $intent['payload'];
			$sync_id = $payload['syncId'] ?? $payload['survivorId'] ?? null;
			if ( ! is_string( $sync_id ) ) {
				return '';
			}
			$block = WP_Intent_Log_Document::get_block( $doc, $sync_id );
			if ( null === $block ) {
				return '';
			}
			$field = $payload['field'] ?? 'content';
			$text  = $block['fields'][ $field ]['text'] ?? '';
			return WP_Intent_Log_Document::text_slice( $text, 0, 80 );
		}

		/**
		 * Appends a compaction checkpoint and trims history behind the
		 * PREVIOUS checkpoint once the retained window reaches the interval.
		 *
		 * Retention invariant: rows from the previous checkpoint onward are
		 * always kept, so any client within one full checkpoint interval of
		 * the head resumes normally. Older clients hit the floor and receive
		 * the retained checkpoint as a reset snapshot. Proposal rows that
		 * would fall behind the floor are re-appended first — escalated work
		 * parked for review must survive compaction.
		 *
		 * Requires the storage to expose per-room metadata (the post-meta
		 * storage does); silently skips checkpointing otherwise.
		 *
		 * @since 7.2.0
		 *
		 * @param string $room               Room identifier.
		 * @param int    $client_id          Requesting client id (row attribution).
		 * @param int    $window_intent_rows Intent rows since the reconstructed
		 *                                   genesis, after this commit.
		 * @param int    $head_seq           Engine seq at the new head.
		 * @param array  $head_doc           Document at the new head.
		 * @return bool Whether a checkpoint was appended.
		 */
		private function maybe_checkpoint( string $room, int $client_id, int $window_intent_rows, int $head_seq, array $head_doc ): bool {
			if ( ! method_exists( $this->storage, 'get_room_meta' ) || ! method_exists( $this->storage, 'set_room_meta' ) ) {
				return false;
			}

			/**
			 * Filters the intent-log checkpoint interval: a compaction
			 * checkpoint is appended once this many intent rows accumulate
			 * since the previous one.
			 *
			 * @since 7.2.0
			 *
			 * @param int    $interval Interval in intent rows.
			 * @param string $room     Room identifier.
			 */
			$interval = (int) apply_filters( 'wp_sync_intent_log_checkpoint_interval', 100, $room );
			if ( $interval < 1 || $window_intent_rows < $interval ) {
				return false;
			}

			$previous = $this->storage->get_room_meta( $room, 'intent_log_checkpoint' );

			// UNRESOLVED escalated work parked below the future floor
			// survives by re-appending it above the new checkpoint's
			// predecessor; resolved pairs age out with the trim (the
			// retention rule — see PROPOSAL-REVIEW.md).
			if ( is_array( $previous ) && isset( $previous['cursor'] ) ) {
				$rows           = $this->storage->get_updates_after_cursor( $room, 0 );
				$below          = array();
				$resolved_ids   = array();
				$found_previous = false;
				foreach ( $rows as $row ) {
					$decoded = json_decode( $row['data'], true );
					if ( is_array( $decoded ) && self::UPDATE_TYPE_RESOLVED === $row['type'] && isset( $decoded['proposalId'] ) ) {
						$resolved_ids[ $decoded['proposalId'] ] = true;
					}
				}
				foreach ( $rows as $row ) {
					$decoded = json_decode( $row['data'], true );
					if ( ! is_array( $decoded ) ) {
						continue;
					}
					if (
						self::UPDATE_TYPE_SNAPSHOT === $row['type'] &&
						! empty( $decoded['checkpoint'] ) &&
						(int) ( $decoded['seq'] ?? -1 ) === (int) ( $previous['seq'] ?? -2 )
					) {
						$found_previous = true;
						break;
					}
					if (
						self::UPDATE_TYPE_PROPOSAL === $row['type'] &&
						! isset( $resolved_ids[ $decoded['intent']['intentId'] ?? '' ] )
					) {
						$below[] = $decoded;
					}
				}
				if ( $found_previous ) {
					foreach ( $below as $proposal ) {
						$this->add_row( $room, 0, self::UPDATE_TYPE_PROPOSAL, $proposal );
					}
				}
			}

			$stored = $this->add_row(
				$room,
				$client_id,
				self::UPDATE_TYPE_SNAPSHOT,
				array(
					'doc'        => $head_doc,
					'seq'        => $head_seq,
					'checkpoint' => true,
				)
			);
			if ( ! $stored ) {
				return false; // Non-fatal: the next commit retries.
			}
			// The checkpoint row's own transport cursor: the storage writes
			// postmeta directly, so the connection's last insert id IS the
			// row's meta_id (the storage's cached get_cursor() is stale
			// until the next read).
			global $wpdb;
			$cursor = (int) $wpdb->insert_id;
			if ( $cursor <= 0 ) {
				return true;
			}
			do_action( 'qm/debug', "wp-sync: checkpoint at seq {$head_seq} for {$room}" );
			$this->storage->set_room_meta(
				$room,
				'intent_log_checkpoint',
				array(
					'seq'    => $head_seq,
					'cursor' => $cursor,
				)
			);

			if ( is_array( $previous ) && isset( $previous['cursor'] ) ) {
				// Trim everything BELOW the previous checkpoint row (it
				// stays: it is the reset bootstrap for stale cursors) and
				// record the floor for the read path.
				$this->storage->remove_updates_before_cursor( $room, (int) $previous['cursor'] );
				$this->storage->set_room_meta( $room, 'intent_log_floor', (int) $previous['cursor'] );
				do_action( 'qm/debug', "wp-sync: trimmed history below cursor {$previous['cursor']} for {$room}" );
			}
			return true;
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
			/*
			 * Ensure genesis exists so first pollers receive the snapshot —
			 * WITHOUT reconstructing full engine state: a pure read only
			 * needs the stored rows. Reconstruction (load_room) is an
			 * ingest-path concern; running it here made every poll
			 * O(session length).
			 */
			if ( 0 === $this->storage->get_cursor( $room ) ) {
				$this->load_room( $room );
			}

			/*
			 * Compaction floor: a cursor below the trimmed history cannot be
			 * caught up row-by-row (its missing rows are gone). Serve from
			 * the retained checkpoint row instead — the client receives it
			 * as a reset snapshot and re-bootstraps.
			 */
			if ( $cursor > 0 && method_exists( $this->storage, 'get_room_meta' ) ) {
				$floor = $this->storage->get_room_meta( $room, 'intent_log_floor' );
				if ( is_numeric( $floor ) && $cursor < (int) $floor ) {
					$cursor = (int) $floor - 1;
				}
			}

			$rows          = $this->storage->get_updates_after_cursor( $room, $cursor );
			$typed_updates = array();
			foreach ( $rows as $row ) {
				$typed_updates[] = array(
					'data' => $row['data'],
					'type' => $row['type'],
				);
			}

			$response = array(
				'end_cursor'     => $this->storage->get_cursor( $room ),
				'room'           => $room,
				'should_compact' => false,
				'total_updates'  => $this->storage->get_update_count( $room ),
				'updates'        => $typed_updates,
			);

			// The debug envelope: engine facts from this request's ingest
			// half (the stash) plus read-side counts. Attached only when
			// the request opted in AND the site allows it (transport gate).
			if ( ! empty( $context['debug'] ) ) {
				$response['_debug'] = array_merge(
					$this->debug_stash[ $room ] ?? array(),
					array(
						'rows_returned' => count( $typed_updates ),
						'total_rows'    => $response['total_updates'],
					)
				);
				unset( $this->debug_stash[ $room ] );
			}

			return $response;
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

			$rows           = $this->storage->get_updates_after_cursor( $room, 0 );
			$genesis        = null;
			$log            = array();
			$settled        = array();
			$proposals_open = array();
			$resolved       = array();
			$base_seq       = 0;

			foreach ( $rows as $row ) {
				$decoded = json_decode( $row['data'], true );
				if ( ! is_array( $decoded ) ) {
					continue;
				}
				switch ( $row['type'] ) {
					case self::UPDATE_TYPE_SNAPSHOT:
						if ( ! empty( $decoded['checkpoint'] ) ) {
							// A compaction checkpoint supersedes everything
							// before it: reconstruct from here. Settled
							// state for the retained window rebuilds from
							// the rows that follow.
							$genesis  = $decoded['doc'];
							$base_seq = (int) ( $decoded['seq'] ?? 0 );
							$log      = array();
							$settled  = array();
						} elseif ( null === $genesis ) {
							// Genesis: first snapshot wins (a concurrent-
							// initialization duplicate is ignored
							// deterministically).
							$genesis = $decoded['doc'];
						}
						break;
					case self::UPDATE_TYPE_INTENT:
						$log[]                           = $decoded;
						$settled[ $decoded['intentId'] ] = array( 'status' => 'applied' );
						break;
					case self::UPDATE_TYPE_PROPOSAL:
						$settled[ $decoded['intent']['intentId'] ]        = array(
							'status' => 'escalated',
							'reason' => $decoded['reason'],
						);
						$proposals_open[ $decoded['intent']['intentId'] ] = true;
						break;
					case self::UPDATE_TYPE_RESOLVED:
						unset( $proposals_open[ $decoded['proposalId'] ] );
						$resolved[ $decoded['proposalId'] ] = true;
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
				'genesis'        => $genesis,
				'log'            => $log,
				'settled'        => $settled,
				// Review lifecycle: open proposals (escalations minus
				// resolutions) and resolved ids, for resolution validation.
				'proposals_open' => $proposals_open,
				'resolved'       => $resolved,
				// Engine seq of the reconstructed genesis (0, or the
				// checkpoint's seq): log[i] is engine seq base_seq + i.
				'base_seq'       => $base_seq,
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
				if ( $post instanceof WP_Post ) {
					$specs = '' === $post->post_content
						? array()
						: self::blocks_to_specs(
							parse_blocks( $post->post_content ),
							(int) $post->ID,
							array()
						);
					// Entity properties are per-name registers on the
					// document; genesis seeds them from the post so a
					// joining client sees the current title.
					$genesis = WP_Intent_Log_Document::create_document(
						$specs,
						array( 'title' => $post->post_title )
					);
				}
			}

			if ( ! $this->add_row( $room, 0, self::UPDATE_TYPE_SNAPSHOT, array( 'doc' => $genesis ) ) ) {
				return new WP_Error(
					'rest_sync_storage_error',
					__( 'Failed to store the room genesis snapshot.', 'gutenberg' ),
					array( 'status' => 500 )
				);
			}

			/*
			 * The genesis snapshot is the room's FIRST stored row, so it must
			 * stamp the engine lineage: the transport only stamps lineage on
			 * client-supplied updates, and a room whose first write is this
			 * server-initiated genesis would otherwise pass the lineage check
			 * (null) after a site-level engine flip — letting another engine
			 * append rows into a room already containing intent-log rows.
			 */
			$this->storage->set_room_engine( $room, $this->get_slug() );

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
					/*
					 * Null-name fragments: whitespace between blocks is
					 * noise, but a run with real content is CLASSIC
					 * content — the editor models it as core/freeform, and
					 * dropping it here would erase it from the shared
					 * document (and from every collaborator's editor).
					 * Freeform content is arbitrary multi-fragment HTML, so
					 * no wrapper stripping: the full run goes through the
					 * codec.
					 */
					$text = trim( $block['innerHTML'] );
					if ( '' === $text ) {
						continue;
					}
					$specs[] = array(
						'syncId'    => WP_Intent_Log_Planner::genesis_sync_id( $post_id, 0, array_merge( $path, array( $index ) ) ),
						'blockType' => 'core/freeform',
						'attrs'     => array(),
						'fields'    => array(
							'content' => WP_Intent_Log_Rich_Text::html_to_field( $text ),
						),
						'children'  => array(),
					);
					++$index;
					continue;
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

				/*
				 * The editor's `content` attribute is the INNER HTML of a
				 * block's single wrapper element ('<p>Hi</p>' → 'Hi'), and
				 * the client bridge captures in that form — then through the
				 * rich-text codec into plain text + format spans (THE text
				 * coordinate space). Genesis must store the same form or
				 * every text offset disagrees between client and server.
				 * The stripped wrapper is kept in an internal `_wrapper`
				 * attr (excluded from client capture) so materialize() can
				 * rebuild the full markup.
				 */
				$text    = trim( $block['innerHTML'] );
				$wrapper = null;
				if ( preg_match( '/^<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?>(.*)<\/\1>$/s', $text, $matches ) ) {
					$wrapper = array(
						'open'  => '<' . $matches[1] . ( $matches[2] ?? '' ) . '>',
						'close' => '</' . $matches[1] . '>',
					);
					$text    = $matches[3];
				}
				if ( null !== $wrapper ) {
					$attrs['_wrapper'] = $wrapper;
				}

				$specs[] = array(
					'syncId'    => $sync_id,
					'blockType' => $block['blockName'],
					'attrs'     => $attrs,
					'fields'    => array(
						'content' => WP_Intent_Log_Rich_Text::html_to_field( $text ),
					),
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
			// Classic content serializes BARE (null block name → no comment
			// delimiters, so no attrs and no persisted identity either —
			// freeform ids re-derive deterministically from genesis paths).
			if ( 'core/freeform' === $block['blockType'] ) {
				$text = WP_Intent_Log_Rich_Text::field_to_html(
					$block['fields']['content'] ?? array(
						'text'    => '',
						'formats' => array(),
					)
				);
				return array(
					'blockName'    => null,
					'attrs'        => array(),
					'innerBlocks'  => array(),
					'innerHTML'    => $text,
					'innerContent' => '' === $text ? array() : array( $text ),
				);
			}
			$attrs   = $block['attrs'];
			$wrapper = $attrs['_wrapper'] ?? null;
			unset( $attrs['_wrapper'] );
			$attrs['metadata']           = is_array( $attrs['metadata'] ?? null ) ? $attrs['metadata'] : array();
			$attrs['metadata']['syncId'] = $block['syncId'];

			$inner_blocks = array_map( array( __CLASS__, 'to_serializable_block' ), $block['children'] );
			$text         = WP_Intent_Log_Rich_Text::field_to_html(
				$block['fields']['content'] ?? array(
					'text'    => '',
					'formats' => array(),
				)
			);
			if ( is_array( $wrapper ) ) {
				$text = ( $wrapper['open'] ?? '' ) . $text . ( $wrapper['close'] ?? '' );
			}
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
