<?php
/**
 * Route-level tests for the intent-log sync engine over the polling
 * transport.
 *
 * @package Gutenberg
 */

/**
 * @group collaboration
 */
class Tests_Collaboration_WpIntentLogEngine extends WP_Test_REST_TestCase {
	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Post ID used for room targets.
	 *
	 * @var int
	 */
	protected static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$post_id   = $factory->post->create(
			array(
				'post_author'  => self::$editor_id,
				'post_content' => "<!-- wp:paragraph -->\n<p>Hello world</p>\n<!-- /wp:paragraph -->",
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		wp_delete_post( self::$post_id, true );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$editor_id );
		update_option( 'wp_sync_engine', 'intent-log' );

		global $wp_rest_server;
		$wp_rest_server = new Spy_REST_Server();
		do_action( 'rest_api_init', $wp_rest_server );
	}

	public function tear_down() {
		delete_option( 'wp_sync_engine' );
		global $wp_rest_server;
		$wp_rest_server = null;
		parent::tear_down();
	}

	private function room(): string {
		return 'postType/post:' . self::$post_id;
	}

	/**
	 * Dispatches one room request and returns the room response.
	 *
	 * @param array $updates   Typed updates to send.
	 * @param array $overrides Room payload overrides.
	 * @return array|WP_REST_Response Room response array, or the full
	 *                                response object on non-200.
	 */
	private function poll( array $updates = array(), array $overrides = array() ) {
		$room    = array_merge(
			array(
				'after'     => 0,
				'awareness' => array( 'user' => 'test' ),
				'client_id' => 101,
				'room'      => $this->room(),
				'updates'   => $updates,
			),
			$overrides
		);
		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/updates' );
		$request->set_body_params( array( 'rooms' => array( $room ) ) );
		$response = rest_get_server()->dispatch( $request );

		if ( 200 !== $response->get_status() ) {
			return $response;
		}

		return $response->get_data()['rooms'][0];
	}

	/**
	 * Builds one intent update row.
	 *
	 * @param array $intent Intent envelope fields.
	 * @return array Typed update.
	 */
	private static function intent_update( array $intent ): array {
		return array(
			'type' => WP_Intent_Log_Engine::UPDATE_TYPE_INTENT,
			'data' => wp_json_encode(
				array_merge(
					array(
						'actorId' => 'client-supplied-and-ignored',
						'txnId'   => null,
					),
					$intent
				)
			),
		);
	}

	/**
	 * The deterministic syncId of the seeded paragraph.
	 */
	private static function paragraph_id(): string {
		return WP_Intent_Log_Planner::genesis_sync_id( self::$post_id, 0, array( 0 ) );
	}

	public function test_first_poll_returns_genesis_snapshot_from_post_content() {
		$room_response = $this->poll();

		$this->assertSame( WP_Intent_Log_Engine::UPDATE_TYPE_SNAPSHOT, $room_response['updates'][0]['type'] );
		$snapshot = json_decode( $room_response['updates'][0]['data'], true );
		$block    = $snapshot['doc']['root'][0];
		$this->assertSame( 'core/paragraph', $block['blockType'] );
		$this->assertSame( self::paragraph_id(), $block['syncId'] );
		// Attribute-form content (wrapper stripped into the internal attr),
		// matching what the client bridge captures.
		$this->assertSame( 'Hello world', $block['fields']['content']['text'] );
		$this->assertSame(
			array(
				'open'  => '<p>',
				'close' => '</p>',
			),
			$block['attrs']['_wrapper']
		);
		$this->assertArrayNotHasKey( 'dispositions', $room_response );
	}

	public function test_applied_intent_returns_disposition_and_reaches_other_clients_transformed() {
		$insert        = self::intent_update(
			array(
				'intentId' => 'i-1',
				'baseSeq'  => 0,
				'type'     => 'insert_text',
				'payload'  => array(
					'syncId' => self::paragraph_id(),
					'field'  => 'content',
					'offset' => 0,
					'text'   => 'x',
				),
			)
		);
		$room_response = $this->poll( array( $insert ) );

		$this->assertSame(
			array(
				array(
					'intentId' => 'i-1',
					'status'   => 'applied',
				),
			),
			$room_response['dispositions']
		);

		// A second client (and the author) receive snapshot + the intent row
		// with the server-stamped actor.
		$other = $this->poll( array(), array( 'client_id' => 202 ) );
		$types = array_column( $other['updates'], 'type' );
		$this->assertSame(
			array( WP_Intent_Log_Engine::UPDATE_TYPE_SNAPSHOT, WP_Intent_Log_Engine::UPDATE_TYPE_INTENT ),
			$types
		);
		$stored = json_decode( $other['updates'][1]['data'], true );
		$this->assertSame( 'u' . self::$editor_id . 'c101', $stored['actorId'] );
	}

	public function test_conflicting_intent_escalates_into_a_delivered_proposal() {
		$target = self::paragraph_id();
		$this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'a-1',
						'baseSeq'  => 0,
						'type'     => 'set_attr',
						'payload'  => array(
							'syncId'          => $target,
							'key'             => 'align',
							'value'           => 'wide',
							'observedVersion' => 0,
						),
					)
				),
			)
		);
		// A second client writes the same register from the same baseSeq.
		$room_response = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'b-1',
						'baseSeq'  => 0,
						'type'     => 'set_attr',
						'payload'  => array(
							'syncId'          => $target,
							'key'             => 'align',
							'value'           => 'full',
							'observedVersion' => 0,
						),
					)
				),
			),
			array( 'client_id' => 202 )
		);

		$this->assertSame( 'escalated', $room_response['dispositions'][0]['status'] );
		$this->assertSame( 'attr-conflict', $room_response['dispositions'][0]['reason'] );

		$catchup   = $this->poll( array(), array( 'client_id' => 303 ) );
		$proposals = array_values(
			array_filter(
				$catchup['updates'],
				static function ( $update ) {
					return WP_Intent_Log_Engine::UPDATE_TYPE_PROPOSAL === $update['type'];
				}
			)
		);
		$this->assertCount( 1, $proposals );
		$proposal = json_decode( $proposals[0]['data'], true );
		$this->assertSame( 'b-1', $proposal['intent']['intentId'] );
		$this->assertSame( 'u' . self::$editor_id . 'c202', $proposal['actorId'] );
	}

	public function test_redelivered_intent_settles_identically_without_growing_the_log() {
		$delete = self::intent_update(
			array(
				'intentId' => 'd-1',
				'baseSeq'  => 0,
				'type'     => 'delete_text',
				'payload'  => array(
					'syncId'      => self::paragraph_id(),
					'field'       => 'content',
					'start'       => 0,
					'end'         => 3,
					'removedText' => 'Hel',
				),
			)
		);
		$first  = $this->poll( array( $delete ) );
		$this->assertSame( 'applied', $first['dispositions'][0]['status'] );
		$total = $first['total_updates'];

		$second = $this->poll( array( $delete ) );
		$this->assertSame( $first['dispositions'], $second['dispositions'] );
		$this->assertSame( $total, $second['total_updates'] );
	}

	public function test_voided_disposition_is_persistent_across_redelivery() {
		$target = self::paragraph_id();
		$this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'r-1',
						'baseSeq'  => 0,
						'type'     => 'remove_block',
						'payload'  => array( 'syncId' => $target ),
					)
				),
			)
		);
		// Another client's concurrent remove of the same block voids clean.
		$void  = self::intent_update(
			array(
				'intentId' => 'r-2',
				'baseSeq'  => 0,
				'type'     => 'remove_block',
				'payload'  => array( 'syncId' => $target ),
			)
		);
		$first = $this->poll( array( $void ), array( 'client_id' => 202 ) );
		$this->assertSame( 'voided', $first['dispositions'][0]['status'] );
		$this->assertSame( 'already-removed', $first['dispositions'][0]['reason'] );

		$second = $this->poll( array( $void ), array( 'client_id' => 202 ) );
		$this->assertSame( $first['dispositions'], $second['dispositions'] );
	}

	public function test_malformed_intent_and_server_emitted_types_are_rejected() {
		$bad_type = $this->poll(
			array(
				array(
					'type' => WP_Intent_Log_Engine::UPDATE_TYPE_SNAPSHOT,
					'data' => wp_json_encode( array( 'doc' => array( 'root' => array() ) ) ),
				),
			)
		);
		$this->assertErrorResponse( 'rest_invalid_update_type', $bad_type, 400 );

		// A malformed envelope voids PER-INTENT (a request-level 400 would
		// let one bad row starve every valid edit in the batch and wedge
		// the author's outbox in a permanent retry loop).
		$malformed = $this->poll(
			array(
				array(
					'type' => WP_Intent_Log_Engine::UPDATE_TYPE_INTENT,
					'data' => wp_json_encode( array( 'intentId' => 'x' ) ),
				),
			)
		);
		$this->assertSame(
			array(
				'intentId' => 'x',
				'status'   => 'voided',
				'reason'   => 'invalid-payload',
			),
			$malformed['dispositions'][0]
		);

		// baseSeq beyond the log head is malformed, not a crash.
		$future = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'f-1',
						'baseSeq'  => 99,
						'type'     => 'remove_block',
						'payload'  => array( 'syncId' => self::paragraph_id() ),
					)
				),
			)
		);
		$this->assertSame( 'invalid-payload', $future['dispositions'][0]['reason'] );

		// A valid intent in the SAME batch as a malformed one still lands.
		$mixed    = $this->poll(
			array(
				array(
					'type' => WP_Intent_Log_Engine::UPDATE_TYPE_INTENT,
					'data' => wp_json_encode( array( 'intentId' => 'bad-1' ) ),
				),
				self::intent_update(
					array(
						'intentId' => 'good-1',
						'baseSeq'  => 0,
						'type'     => 'insert_text',
						'payload'  => array(
							'syncId' => self::paragraph_id(),
							'field'  => 'content',
							'offset' => 0,
							'text'   => 'still lands ',
						),
					)
				),
			)
		);
		$statuses = array_column( $mixed['dispositions'], 'status', 'intentId' );
		$this->assertSame( 'voided', $statuses['bad-1'] );
		$this->assertSame( 'applied', $statuses['good-1'] );
	}

	public function test_payload_schema_violations_void_per_intent_not_500() {
		// Unknown vocabulary type.
		$unknown = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'v-1',
						'baseSeq'  => 0,
						'type'     => 'teleport_block',
						'payload'  => array( 'syncId' => self::paragraph_id() ),
					)
				),
			)
		);
		$this->assertSame( 'invalid-payload', $unknown['dispositions'][0]['reason'] );

		// Known type, wrong-typed field (offset must be a non-negative int).
		// Pre-validation this fataled inside typed planner code.
		$wrong_type = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'v-2',
						'baseSeq'  => 0,
						'type'     => 'insert_text',
						'payload'  => array(
							'syncId' => self::paragraph_id(),
							'field'  => 'content',
							'offset' => 'NaN',
							'text'   => 'x',
						),
					)
				),
			)
		);
		$this->assertSame( 'invalid-payload', $wrong_type['dispositions'][0]['reason'] );

		// Missing required field.
		$missing = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'v-3',
						'baseSeq'  => 0,
						'type'     => 'delete_text',
						'payload'  => array(
							'syncId' => self::paragraph_id(),
							'field'  => 'content',
							'start'  => 0,
							'end'    => 2,
						),
					)
				),
			)
		);
		$this->assertSame( 'invalid-payload', $missing['dispositions'][0]['reason'] );

		// A syncId containing `::` would silently break the frame-key
		// algebra (frame keys are `syncId::field`).
		$frame_breaker = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'v-4',
						'baseSeq'  => 0,
						'type'     => 'insert_block',
						'payload'  => array(
							'block'          => array(
								'syncId'    => 'evil::content',
								'blockType' => 'core/paragraph',
							),
							'parentId'       => null,
							'afterSiblingId' => null,
						),
					)
				),
			)
		);
		$this->assertSame( 'invalid-payload', $frame_breaker['dispositions'][0]['reason'] );

		// Extraneous payload fields are rejected (closed vocabulary).
		$extraneous = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'v-5',
						'baseSeq'  => 0,
						'type'     => 'remove_block',
						'payload'  => array(
							'syncId' => self::paragraph_id(),
							'sneaky' => true,
						),
					)
				),
			)
		);
		$this->assertSame(
			'invalid-payload',
			$extraneous['dispositions'][0]['reason']
		);
	}

	/**
	 * Sends N applied single-character inserts from one client.
	 *
	 * @param int $count     How many intents.
	 * @param int $base_seq  Engine seq the first intent observes.
	 * @param int $client_id Sending client.
	 */
	private function type_intents( int $count, int $base_seq, int $client_id = 101 ): void {
		for ( $i = 0; $i < $count; $i++ ) {
			$response = $this->poll(
				array(
					self::intent_update(
						array(
							'intentId' => "type-{$client_id}-" . ( $base_seq + $i ),
							'baseSeq'  => $base_seq + $i,
							'type'     => 'insert_text',
							'payload'  => array(
								'syncId' => self::paragraph_id(),
								'field'  => 'content',
								'offset' => 0,
								'text'   => 'x',
							),
						)
					),
				),
				array( 'client_id' => $client_id )
			);
			$this->assertSame( 'applied', $response['dispositions'][0]['status'], "intent at seq {$base_seq}+{$i}" );
		}
	}

	public function test_checkpoints_bound_history_preserve_proposals_and_reset_stale_clients() {
		$interval = static function () {
			return 3;
		};
		add_filter( 'wp_sync_intent_log_checkpoint_interval', $interval );

		try {
			// An early escalation parks a proposal (pre-floor content that
			// must survive compaction).
			$this->poll(); // Genesis.
			$target = self::paragraph_id();
			$this->poll(
				array(
					self::intent_update(
						array(
							'intentId' => 'early-a',
							'baseSeq'  => 0,
							'type'     => 'set_attr',
							'payload'  => array(
								'syncId'          => $target,
								'key'             => 'align',
								'value'           => 'wide',
								'observedVersion' => 0,
							),
						)
					),
				)
			);
			$escalated = $this->poll(
				array(
					self::intent_update(
						array(
							'intentId' => 'early-b',
							'baseSeq'  => 0,
							'type'     => 'set_attr',
							'payload'  => array(
								'syncId'          => $target,
								'key'             => 'align',
								'value'           => 'full',
								'observedVersion' => 0,
							),
						)
					),
				),
				array( 'client_id' => 202 )
			);
			$this->assertSame( 'escalated', $escalated['dispositions'][0]['status'] );

			// Cross the interval twice: two checkpoints, one trim.
			$this->type_intents( 4, 1 );
			$this->type_intents( 4, 5 );

			// A fresh joiner bootstraps from a CHECKPOINT, not genesis.
			$join  = $this->poll( array(), array( 'client_id' => 303 ) );
			$types = array_column( $join['updates'], 'type' );
			$first = json_decode( $join['updates'][0]['data'], true );
			$this->assertSame( WP_Intent_Log_Engine::UPDATE_TYPE_SNAPSHOT, $join['updates'][0]['type'] );
			$this->assertNotEmpty( $first['checkpoint'] );
			$this->assertGreaterThan( 0, $first['seq'] );

			// The parked proposal SURVIVED the trim.
			$proposals = array();
			foreach ( $join['updates'] as $update ) {
				if ( WP_Intent_Log_Engine::UPDATE_TYPE_PROPOSAL === $update['type'] ) {
					$proposals[] = json_decode( $update['data'], true );
				}
			}
			$this->assertCount( 1, $proposals );
			$this->assertSame( 'early-b', $proposals[0]['intent']['intentId'] );

			// History is bounded: far fewer rows than the 11+ ever written.
			$this->assertLessThan( 11, count( $join['updates'] ) );

			// A STALE cursor (below the trim floor) receives the retained
			// checkpoint as its first row — the reset bootstrap.
			$stale = $this->poll(
				array(),
				array(
					'client_id' => 404,
					'after'     => 1,
				)
			);
			$this->assertSame( WP_Intent_Log_Engine::UPDATE_TYPE_SNAPSHOT, $stale['updates'][0]['type'] );
			$reset = json_decode( $stale['updates'][0]['data'], true );
			$this->assertNotEmpty( $reset['checkpoint'] );

			// An intent authored below the retention horizon settles as a
			// stale void instead of failing the request or mis-rebasing.
			$stale_write = $this->poll(
				array(
					self::intent_update(
						array(
							'intentId' => 'stale-1',
							'baseSeq'  => 0,
							'type'     => 'insert_text',
							'payload'  => array(
								'syncId' => $target,
								'field'  => 'content',
								'offset' => 0,
								'text'   => 'late',
							),
						)
					),
				),
				array( 'client_id' => 404 )
			);
			$this->assertSame(
				array(
					'intentId' => 'stale-1',
					'status'   => 'voided',
					'reason'   => 'stale-base',
				),
				$stale_write['dispositions'][0]
			);
		} finally {
			remove_filter( 'wp_sync_intent_log_checkpoint_interval', $interval );
		}
	}

	/**
	 * Escalates one attr conflict and returns the losing intent id.
	 *
	 * @param string $suffix Unique id suffix.
	 * @return string The escalated proposal id.
	 */
	private function escalate_attr_conflict( string $suffix ): string {
		$target = self::paragraph_id();
		$this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => "win-$suffix",
						'baseSeq'  => 0,
						'type'     => 'set_attr',
						'payload'  => array(
							'syncId'          => $target,
							'key'             => "k$suffix",
							'value'           => 'a',
							'observedVersion' => 0,
						),
					)
				),
			)
		);
		$response = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => "lose-$suffix",
						'baseSeq'  => 0,
						'type'     => 'set_attr',
						'payload'  => array(
							'syncId'          => $target,
							'key'             => "k$suffix",
							'value'           => 'b',
							'observedVersion' => 0,
						),
					)
				),
			),
			array( 'client_id' => 202 )
		);
		$this->assertSame( 'escalated', $response['dispositions'][0]['status'] );
		return "lose-$suffix";
	}

	/**
	 * Builds one resolution update row.
	 *
	 * @param string $proposal_id Proposal id.
	 * @param string $resolution  restored|dismissed.
	 * @return array Typed update.
	 */
	private static function resolution_update( string $proposal_id, string $resolution ): array {
		return array(
			'type' => WP_Intent_Log_Engine::UPDATE_TYPE_RESOLVED,
			'data' => wp_json_encode(
				array(
					'proposalId' => $proposal_id,
					'resolution' => $resolution,
				)
			),
		);
	}

	public function test_proposals_carry_review_context_and_resolve_idempotently() {
		$proposal_id = $this->escalate_attr_conflict( '1' );

		// The proposal row carries review context: settlement seq, server
		// time, and a content excerpt of the target block.
		$catchup   = $this->poll( array(), array( 'client_id' => 303 ) );
		$proposals = array_values(
			array_filter(
				$catchup['updates'],
				static function ( $update ) {
					return WP_Intent_Log_Engine::UPDATE_TYPE_PROPOSAL === $update['type'];
				}
			)
		);
		$this->assertCount( 1, $proposals );
		$proposal = json_decode( $proposals[0]['data'], true );
		$this->assertSame( $proposal_id, $proposal['intent']['intentId'] );
		$this->assertArrayHasKey( 'at', $proposal );
		$this->assertArrayHasKey( 'time', $proposal );
		$this->assertSame( 'Hello world', $proposal['context']['excerpt'] );

		// Resolving appends ONE row, stamped server-side, acked as resolved.
		$resolve = $this->poll(
			array( self::resolution_update( $proposal_id, 'dismissed' ) ),
			array( 'client_id' => 303 )
		);
		$this->assertSame(
			array(
				'intentId' => $proposal_id,
				'status'   => 'resolved',
			),
			$resolve['dispositions'][0]
		);
		$after       = $this->poll( array(), array( 'client_id' => 404 ) );
		$resolutions = array_values(
			array_filter(
				$after['updates'],
				static function ( $update ) {
					return WP_Intent_Log_Engine::UPDATE_TYPE_RESOLVED === $update['type'];
				}
			)
		);
		$this->assertCount( 1, $resolutions );
		$resolution = json_decode( $resolutions[0]['data'], true );
		$this->assertSame( 'dismissed', $resolution['resolution'] );
		$this->assertSame( 'u' . self::$editor_id . 'c303', $resolution['resolvedBy'] );

		// Idempotent: re-resolving (or resolving an unknown id) acks
		// without growing the row count.
		$total    = $after['total_updates'];
		$again    = $this->poll(
			array(
				self::resolution_update( $proposal_id, 'restored' ),
				self::resolution_update( 'never-existed', 'dismissed' ),
			),
			array( 'client_id' => 303 )
		);
		$statuses = array_column( $again['dispositions'], 'status' );
		$this->assertSame( array( 'resolved', 'resolved' ), $statuses );
		$this->assertSame( $total, $again['total_updates'] );
	}

	public function test_compaction_drops_resolved_proposals_and_keeps_open_ones() {
		$interval = static function () {
			return 3;
		};
		add_filter( 'wp_sync_intent_log_checkpoint_interval', $interval );

		try {
			$this->poll(); // Genesis.
			$kept_id     = $this->escalate_attr_conflict( 'kept' );
			$resolved_id = $this->escalate_attr_conflict( 'done' );
			$this->poll(
				array( self::resolution_update( $resolved_id, 'dismissed' ) ),
				array( 'client_id' => 505 )
			);

			// Cross the interval twice: checkpoint + trim.
			$this->type_intents( 4, 2 );
			$this->type_intents( 4, 6 );

			$join         = $this->poll( array(), array( 'client_id' => 606 ) );
			$proposal_ids = array();
			foreach ( $join['updates'] as $update ) {
				if ( WP_Intent_Log_Engine::UPDATE_TYPE_PROPOSAL === $update['type'] ) {
					$decoded        = json_decode( $update['data'], true );
					$proposal_ids[] = $decoded['intent']['intentId'];
				}
			}
			// The open proposal survives compaction; the resolved pair aged
			// out with the trim.
			$this->assertContains( $kept_id, $proposal_ids );
			$this->assertNotContains( $resolved_id, $proposal_ids );
		} finally {
			remove_filter( 'wp_sync_intent_log_checkpoint_interval', $interval );
		}
	}

	public function test_debug_envelope_is_opt_in_and_gated() {
		$intent = static function ( string $id ) {
			return self::intent_update(
				array(
					'intentId' => $id,
					'baseSeq'  => 0,
					'type'     => 'insert_text',
					'payload'  => array(
						'syncId' => self::paragraph_id(),
						'field'  => 'content',
						'offset' => 0,
						'text'   => 'x',
					),
				)
			);
		};

		// Opt-in without the site gate: no envelope.
		$deny = static function () {
			return false;
		};
		add_filter( 'wp_sync_debug_enabled', $deny );
		$response = $this->poll( array( $intent( 'dbg-1' ) ), array( 'debug' => true ) );
		$this->assertArrayNotHasKey( '_debug', $response );
		remove_filter( 'wp_sync_debug_enabled', $deny );

		// Gate open + opt-in: engine facts attached.
		$allow = static function () {
			return true;
		};
		add_filter( 'wp_sync_debug_enabled', $allow );
		try {
			$response = $this->poll( array( $intent( 'dbg-2' ) ), array( 'debug' => true ) );
			$this->assertArrayHasKey( '_debug', $response );
			$debug = $response['_debug'];
			$this->assertSame( 1, $debug['plan']['applied'] );
			$this->assertSame( 0, $debug['plan']['escalated'] );
			$this->assertFalse( $debug['checkpoint'] );
			$this->assertArrayHasKey( 'lock_wait_ms', $debug );
			$this->assertArrayHasKey( 'head_seq', $debug );
			$this->assertArrayHasKey( 'rows_returned', $debug );
			$this->assertArrayHasKey( 'total_rows', $debug );

			// Gate open but no opt-in: still no envelope.
			$response = $this->poll( array(), array( 'client_id' => 202 ) );
			$this->assertArrayNotHasKey( '_debug', $response );
		} finally {
			remove_filter( 'wp_sync_debug_enabled', $allow );
		}
	}

	public function test_genesis_stamps_engine_lineage_on_a_read_poll() {
		// A pure READ initializes the room (genesis snapshot row). That
		// server-initiated first write must stamp the engine lineage, or a
		// site-level engine flip would let another engine append rows into
		// this room (the lineage check passes on null).
		$this->poll();

		$storage = new WP_Sync_Post_Meta_Storage();
		$this->assertSame(
			WP_Intent_Log_Engine::SLUG,
			$storage->get_room_engine( $this->room() )
		);
	}

	public function test_room_lineage_fences_an_engine_flip_with_409() {
		// Write under intent-log, then flip the site back to yjs-relay.
		$this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'l-1',
						'baseSeq'  => 0,
						'type'     => 'set_attr',
						'payload'  => array(
							'syncId'          => self::paragraph_id(),
							'key'             => 'align',
							'value'           => 'wide',
							'observedVersion' => 0,
						),
					)
				),
			)
		);
		update_option( 'wp_sync_engine', 'yjs-relay' );

		$response = $this->poll(
			array(
				array(
					'type' => 'update',
					'data' => base64_encode( 'yjs-bytes' ),
				),
			)
		);
		$this->assertErrorResponse( 'rest_sync_engine_mismatch', $response, 409 );
	}

	public function test_materialize_round_trips_content_with_sync_ids() {
		$engine = new WP_Intent_Log_Engine( new WP_Sync_Post_Meta_Storage() );
		$this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'm-1',
						'baseSeq'  => 0,
						'type'     => 'insert_block',
						'payload'  => array(
							'block'          => array(
								'syncId'    => 'fresh-block',
								'blockType' => 'core/paragraph',
								// Codec model: plain text + spans; the
								// wrapper element rides the internal attr.
								'text'      => 'Appended boldly',
								'formats'   => array(
									array(
										'start'  => 9,
										'end'    => 15,
										'format' => 'strong',
									),
								),
								'attrs'     => array(
									'_wrapper' => array(
										'open'  => '<p>',
										'close' => '</p>',
									),
								),
							),
							'parentId'       => null,
							'afterSiblingId' => self::paragraph_id(),
						),
					)
				),
			)
		);

		$content = $engine->materialize( $this->room() );
		$this->assertStringContainsString( '<p>Hello world</p>', $content );
		// Formats serialize back to markup through the codec.
		$this->assertStringContainsString( '<p>Appended <strong>boldly</strong></p>', $content );
		$this->assertStringContainsString( self::paragraph_id(), $content );
		$this->assertStringContainsString( 'fresh-block', $content );
		$this->assertStringContainsString( 'wp:paragraph', $content );

		// The materialized content re-parses into the same document.
		$reparsed = parse_blocks( $content );
		$this->assertCount( 2, array_values( array_filter( array_column( $reparsed, 'blockName' ) ) ) );
	}

	/**
	 * Proposal rows currently in the room feed, decoded.
	 *
	 * @param int $client_id Polling client.
	 * @return array Decoded proposal payloads.
	 */
	private function proposal_rows( int $client_id = 909 ): array {
		$catchup = $this->poll( array(), array( 'client_id' => $client_id ) );
		$rows    = array();
		foreach ( $catchup['updates'] as $update ) {
			if ( WP_Intent_Log_Engine::UPDATE_TYPE_PROPOSAL === $update['type'] ) {
				$rows[] = json_decode( $update['data'], true );
			}
		}
		return $rows;
	}

	/**
	 * A format_text intent update carrying the given span format id.
	 *
	 * @param string $intent_id Intent id.
	 * @param string $format    Span format id.
	 * @return array Typed update.
	 */
	private static function format_intent( string $intent_id, string $format ): array {
		return self::intent_update(
			array(
				'intentId' => $intent_id,
				'baseSeq'  => 0,
				'type'     => 'format_text',
				'payload'  => array(
					'syncId' => self::paragraph_id(),
					'field'  => 'content',
					'start'  => 0,
					'end'    => 5,
					'format' => $format,
					'on'     => true,
				),
			)
		);
	}

	/**
	 * Revokes unfiltered_html from the current user via map_meta_cap
	 * (deterministic across single site and multisite; the test framework
	 * restores hooks between tests).
	 */
	private function revoke_unfiltered_html() {
		add_filter(
			'map_meta_cap',
			static function ( $caps, $cap ) {
				return 'unfiltered_html' === $cap ? array( 'do_not_allow' ) : $caps;
			},
			10,
			2
		);
		$this->assertFalse( current_user_can( 'unfiltered_html' ) );
	}

	/**
	 * Grants unfiltered_html to the current user (multisite normally
	 * reserves it for super admins).
	 */
	private function grant_unfiltered_html() {
		add_filter(
			'map_meta_cap',
			static function ( $caps, $cap ) {
				return 'unfiltered_html' === $cap ? array( 'exist' ) : $caps;
			},
			10,
			2
		);
		$this->assertTrue( current_user_can( 'unfiltered_html' ) );
	}

	/**
	 * An insert_block intent whose spec smuggles verbatim HTML through an
	 * object span.
	 *
	 * @param string $intent_id Intent id.
	 * @param string $html      The embedded fragment.
	 * @param string $txn_id    Optional unit id.
	 * @return array Typed update.
	 */
	private static function object_block_intent( string $intent_id, string $html, ?string $txn_id = null ): array {
		return self::intent_update(
			array(
				'intentId' => $intent_id,
				'txnId'    => $txn_id,
				'baseSeq'  => 0,
				'type'     => 'insert_block',
				'payload'  => array(
					'block'          => array(
						'syncId'    => 'kses-nb',
						'blockType' => 'core/paragraph',
						'fields'    => array(
							'content' => array(
								'text'    => "\u{FFFC}",
								'formats' => array(
									array(
										'start'  => 0,
										'end'    => 1,
										'format' => 'obj|' . wp_json_encode( array( 'html' => $html ), JSON_UNESCAPED_SLASHES ),
									),
								),
							),
						),
					),
					'parentId'       => null,
					'afterSiblingId' => self::paragraph_id(),
				),
			)
		);
	}

	public function test_protected_markup_from_filtered_author_parks_for_approval() {
		$this->revoke_unfiltered_html();

		$response = $this->poll(
			array( self::object_block_intent( 'kses-1', '<script>alert(1)</script>' ) )
		);
		$this->assertSame(
			array(
				'intentId' => 'kses-1',
				'status'   => 'escalated',
				'reason'   => WP_Intent_Log_Engine::ESCALATION_REQUIRES_APPROVAL,
			),
			$response['dispositions'][0]
		);

		// The parked proposal is delivered like any other, with the reason,
		// server-side attribution, and review context.
		$proposals = $this->proposal_rows();
		$this->assertCount( 1, $proposals );
		$this->assertSame( 'requires-approval', $proposals[0]['reason'] );
		$this->assertSame( 'u' . self::$editor_id . 'c101', $proposals[0]['actorId'] );
		$this->assertArrayHasKey( 'at', $proposals[0] );
		$this->assertArrayHasKey( 'time', $proposals[0] );

		// Nothing reached the document.
		$engine = new WP_Intent_Log_Engine( new WP_Sync_Post_Meta_Storage() );
		$this->assertStringNotContainsString( '<script>', (string) $engine->materialize( $this->room() ) );

		// Redelivery acks identically without a second proposal row.
		$again = $this->poll(
			array( self::object_block_intent( 'kses-1', '<script>alert(1)</script>' ) )
		);
		$this->assertSame( 'escalated', $again['dispositions'][0]['status'] );
		$this->assertCount( 1, $this->proposal_rows( 910 ) );

		// The proposal resolves like any other (a discard here).
		$resolve = $this->poll( array( self::resolution_update( 'kses-1', 'dismissed' ) ) );
		$this->assertSame( 'resolved', $resolve['dispositions'][0]['status'] );
	}

	public function test_benign_formats_from_filtered_author_apply() {
		$this->revoke_unfiltered_html();

		$response = $this->poll(
			array( self::format_intent( 'kses-ok', 'a|{"href":"https://example.com/"}' ) )
		);
		$this->assertSame( 'applied', $response['dispositions'][0]['status'] );

		$engine  = new WP_Intent_Log_Engine( new WP_Sync_Post_Meta_Storage() );
		$content = $engine->materialize( $this->room() );
		$this->assertStringContainsString( '<a href="https://example.com/">Hello</a>', $content );
	}

	public function test_plain_text_markup_is_entity_encoded_and_applies() {
		$this->revoke_unfiltered_html();

		$response = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'kses-text',
						'baseSeq'  => 0,
						'type'     => 'insert_text',
						'payload'  => array(
							'syncId' => self::paragraph_id(),
							'field'  => 'content',
							'offset' => 0,
							'text'   => '<script>x</script> ',
						),
					)
				),
			)
		);
		$this->assertSame( 'applied', $response['dispositions'][0]['status'] );

		$engine  = new WP_Intent_Log_Engine( new WP_Sync_Post_Meta_Storage() );
		$content = $engine->materialize( $this->room() );
		$this->assertStringNotContainsString( '<script>', $content );
		$this->assertStringContainsString( '&lt;script&gt;', $content );
	}

	public function test_protected_insert_block_parks_its_whole_unit() {
		$this->revoke_unfiltered_html();

		$response = $this->poll(
			array(
				self::object_block_intent( 'kses-b1', '<script>x</script>', 'kses-txn' ),
				self::intent_update(
					array(
						'intentId' => 'kses-b2',
						'txnId'    => 'kses-txn',
						'baseSeq'  => 0,
						'type'     => 'insert_text',
						'payload'  => array(
							'syncId' => 'kses-nb',
							'field'  => 'content',
							'offset' => 1,
							'text'   => ' benign tail',
						),
					)
				),
			)
		);

		// The WHOLE unit parks: the benign member depends on the escalated
		// block existing, so applying it alone would be meaningless.
		$reasons = array_column( $response['dispositions'], 'reason' );
		$this->assertSame( array( 'requires-approval', 'requires-approval' ), $reasons );
		$this->assertCount( 2, $this->proposal_rows() );

		$engine = new WP_Intent_Log_Engine( new WP_Sync_Post_Meta_Storage() );
		$this->assertStringNotContainsString( 'kses-nb', (string) $engine->materialize( $this->room() ) );
	}

	public function test_wrapper_attr_injection_parks_for_approval() {
		$this->revoke_unfiltered_html();

		$response = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'kses-w1',
						'baseSeq'  => 0,
						'type'     => 'set_attr',
						'payload'  => array(
							'syncId'          => self::paragraph_id(),
							'key'             => '_wrapper',
							'value'           => array(
								'open'  => '<script>',
								'close' => '</script>',
							),
							'observedVersion' => 0,
						),
					)
				),
			)
		);
		$this->assertSame( 'escalated', $response['dispositions'][0]['status'] );
		$this->assertSame( 'requires-approval', $response['dispositions'][0]['reason'] );

		// A benign wrapper (the codec's own shape for wrapped blocks) is
		// fine.
		$benign = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'kses-w2',
						'baseSeq'  => 0,
						'type'     => 'set_attr',
						'payload'  => array(
							'syncId'          => self::paragraph_id(),
							'key'             => '_wrapper',
							'value'           => array(
								'open'  => '<pre class="wp-block-code">',
								'close' => '</pre>',
							),
							'observedVersion' => 0,
						),
					)
				),
			)
		);
		$this->assertSame( 'applied', $benign['dispositions'][0]['status'] );
	}

	public function test_unfiltered_html_users_author_protected_markup_directly() {
		$this->grant_unfiltered_html();

		$response = $this->poll(
			array( self::object_block_intent( 'kses-priv', '<script>x</script>' ) )
		);
		$this->assertSame( 'applied', $response['dispositions'][0]['status'] );

		$engine = new WP_Intent_Log_Engine( new WP_Sync_Post_Meta_Storage() );
		$this->assertStringContainsString( '<script>x</script>', (string) $engine->materialize( $this->room() ) );
	}

	public function test_raw_attr_markup_parks_for_approval_core_html_shape() {
		$this->revoke_unfiltered_html();

		// A Custom HTML block travels the ATTR lane, not the codec field
		// lane (its content attribute has no html/rich-text source): the
		// script rides insert_block attrs and would be re-emitted as raw
		// markup by the block's save() in every collaborator's editor.
		$response = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'kses-raw1',
						'baseSeq'  => 0,
						'type'     => 'insert_block',
						'payload'  => array(
							'block'          => array(
								'syncId'    => 'kses-raw-nb',
								'blockType' => 'core/html',
								'attrs'     => array(
									'content' => '<script>alert(1)</script>',
								),
							),
							'parentId'       => null,
							'afterSiblingId' => self::paragraph_id(),
						),
					)
				),
			)
		);
		$this->assertSame( 'escalated', $response['dispositions'][0]['status'] );
		$this->assertSame( 'requires-approval', $response['dispositions'][0]['reason'] );

		// Editing an existing block's raw attr is gated the same way.
		$set_attr = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'kses-raw2',
						'baseSeq'  => 0,
						'type'     => 'set_attr',
						'payload'  => array(
							'syncId'          => self::paragraph_id(),
							'key'             => 'content',
							'value'           => '<script>alert(2)</script>',
							'observedVersion' => 0,
						),
					)
				),
			)
		);
		$this->assertSame( 'escalated', $set_attr['dispositions'][0]['status'] );
		$this->assertSame( 'requires-approval', $set_attr['dispositions'][0]['reason'] );

		// Benign attr strings — including kses-allowed markup and nested
		// values — still apply for filtered users.
		$benign = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'kses-raw3',
						'baseSeq'  => 0,
						'type'     => 'set_attr',
						'payload'  => array(
							'syncId'          => self::paragraph_id(),
							'key'             => 'metadata',
							'value'           => array(
								'name'    => 'My block',
								'caption' => '<em>fine</em>',
							),
							'observedVersion' => 0,
						),
					)
				),
			)
		);
		$this->assertSame( 'applied', $benign['dispositions'][0]['status'] );
	}

	public function test_attr_value_transitions_are_judged_whole_not_as_deltas() {
		$this->revoke_unfiltered_html();

		// A "near-script" is kses-clean text: it applies for anyone.
		$near = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'kses-t1',
						'baseSeq'  => 0,
						'type'     => 'insert_block',
						'payload'  => array(
							'block'          => array(
								'syncId'    => 'kses-t-nb',
								'blockType' => 'core/html',
								'attrs'     => array(
									'content' => '[script]alert(1);[/script]',
								),
							),
							'parentId'       => null,
							'afterSiblingId' => self::paragraph_id(),
						),
					)
				),
			)
		);
		$this->assertSame( 'applied', $near['dispositions'][0]['status'] );

		/*
		 * Another (filtered) user swaps the square brackets for angle
		 * brackets. Attr writes are register writes carrying the COMPLETE
		 * new value — there is no delta lane for attrs — so the edit is
		 * judged on its full bytes and parks, even though every prior
		 * state of the attr was benign.
		 */
		$swapped = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'kses-t2',
						'baseSeq'  => 1,
						'type'     => 'set_attr',
						'payload'  => array(
							'syncId'          => 'kses-t-nb',
							'key'             => 'content',
							'value'           => '<script>alert(1);</script>',
							'observedVersion' => 0,
						),
					)
				),
			),
			array( 'client_id' => 202 )
		);
		$this->assertSame( 'escalated', $swapped['dispositions'][0]['status'] );
		$this->assertSame( 'requires-approval', $swapped['dispositions'][0]['reason'] );

		// The document still holds the benign value.
		$engine  = new WP_Intent_Log_Engine( new WP_Sync_Post_Meta_Storage() );
		$content = (string) $engine->materialize( $this->room() );
		$this->assertStringContainsString( '[script]alert(1);[/script]', $content );
		$this->assertStringNotContainsString( '<script>alert(1);</script>', $content );

		// Even a PARTIAL bracket swap parks: kses alters incomplete
		// tag-like fragments too, and any alteration means protected.
		$partial = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'kses-t3',
						'baseSeq'  => 1,
						'type'     => 'set_attr',
						'payload'  => array(
							'syncId'          => 'kses-t-nb',
							'key'             => 'content',
							'value'           => '<script]alert(1);[/script]',
							'observedVersion' => 0,
						),
					)
				),
			),
			array( 'client_id' => 303 )
		);
		$this->assertSame( 'escalated', $partial['dispositions'][0]['status'] );
	}

	public function test_classic_content_syncs_as_freeform_and_materializes_bare() {
		// A post mixing a block with a CLASSIC (comment-less) run.
		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$editor_id,
				'post_content' => "<!-- wp:paragraph -->\n<p>Block one</p>\n<!-- /wp:paragraph -->\n\n<div>classic <strong>legacy</strong> run</div>",
			)
		);
		$room    = 'postType/post:' . $post_id;

		// Genesis carries the classic run as a core/freeform spec with a
		// content field (previously it was silently dropped).
		$response = $this->poll( array(), array( 'room' => $room ) );
		$snapshot = json_decode( $response['updates'][0]['data'], true );
		$types    = array_column( $snapshot['doc']['root'], 'blockType' );
		$this->assertSame( array( 'core/paragraph', 'core/freeform' ), $types );
		$freeform = $snapshot['doc']['root'][1];
		$this->assertArrayNotHasKey( '_wrapper', $freeform['attrs'] );
		$this->assertNotSame( '', $freeform['fields']['content']['text'] );

		// Materialize emits the classic run BARE: no comment delimiters,
		// content byte-preserved.
		$engine  = new WP_Intent_Log_Engine( new WP_Sync_Post_Meta_Storage() );
		$content = (string) $engine->materialize( $room );
		$this->assertStringContainsString( '<div>classic <strong>legacy</strong> run</div>', $content );
		$this->assertStringNotContainsString( 'wp:freeform', $content );
		$this->assertStringContainsString( 'wp:paragraph', $content );

		// The materialized content re-parses into the same shapes.
		$reparsed = array_values(
			array_filter(
				parse_blocks( $content ),
				static function ( $block ) {
					return '' !== trim( $block['innerHTML'] );
				}
			)
		);
		$this->assertCount( 2, $reparsed );
		$this->assertNull( $reparsed[1]['blockName'] );

		wp_delete_post( $post_id, true );
	}

	public function test_block_names_outside_the_grammar_are_voided_for_everyone() {
		// Block names materialize into comment delimiters unescaped; a
		// crafted name could close the comment and inject markup.
		$insert = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'name-1',
						'baseSeq'  => 0,
						'type'     => 'insert_block',
						'payload'  => array(
							'block'          => array(
								'syncId'    => 'name-nb',
								'blockType' => 'core/x --><script>',
							),
							'parentId'       => null,
							'afterSiblingId' => null,
						),
					)
				),
			)
		);
		$this->assertSame( 'invalid-payload', $insert['dispositions'][0]['reason'] );

		$transform = $this->poll(
			array(
				self::intent_update(
					array(
						'intentId' => 'name-2',
						'baseSeq'  => 0,
						'type'     => 'transform_block',
						'payload'  => array(
							'syncId'       => self::paragraph_id(),
							'newBlockType' => 'evil -->',
						),
					)
				),
			)
		);
		$this->assertSame( 'invalid-payload', $transform['dispositions'][0]['reason'] );
	}
}
