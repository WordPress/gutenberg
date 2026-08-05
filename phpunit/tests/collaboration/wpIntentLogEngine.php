<?php
/**
 * Route-level tests for the intent-log sync engine over the polling
 * transport.
 *
 * @package Gutenberg
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

		$malformed = $this->poll(
			array(
				array(
					'type' => WP_Intent_Log_Engine::UPDATE_TYPE_INTENT,
					'data' => wp_json_encode( array( 'intentId' => 'x' ) ),
				),
			)
		);
		$this->assertErrorResponse( 'rest_sync_invalid_intent', $malformed, 400 );

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
		$this->assertErrorResponse( 'rest_sync_invalid_intent', $future, 400 );
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
								'text'      => '<p>Appended</p>',
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
		$this->assertStringContainsString( '<p>Appended</p>', $content );
		$this->assertStringContainsString( self::paragraph_id(), $content );
		$this->assertStringContainsString( 'fresh-block', $content );
		$this->assertStringContainsString( 'wp:paragraph', $content );

		// The materialized content re-parses into the same document.
		$reparsed = parse_blocks( $content );
		$this->assertCount( 2, array_values( array_filter( array_column( $reparsed, 'blockName' ) ) ) );
	}
}
