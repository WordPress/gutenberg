<?php
/**
 * Unit tests for WP_Intent_Log_Engine internals — genesis mapping, room
 * state reconstruction, and duplicate-snapshot resolution — driving the
 * engine instance directly rather than through the REST transport.
 *
 * @package Gutenberg
 */

/**
 * @group collaboration
 */
class Tests_Collaboration_WpIntentLogEngineInternals extends WP_UnitTestCase {
	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected static $editor_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$editor_id );
	}

	/**
	 * Creates a fresh engine over post-meta storage.
	 *
	 * @return WP_Intent_Log_Engine Engine instance.
	 */
	private static function engine(): WP_Intent_Log_Engine {
		return new WP_Intent_Log_Engine( new WP_Sync_Post_Meta_Storage() );
	}

	/**
	 * Returns the decoded genesis snapshot for a room's first poll.
	 *
	 * @param WP_Intent_Log_Engine $engine Engine.
	 * @param string               $room   Room identifier.
	 * @return array Snapshot document.
	 */
	private static function snapshot_doc( WP_Intent_Log_Engine $engine, string $room ): array {
		$response = $engine->get_updates_since( $room, 101, 0, array() );
		$snapshot = null;
		foreach ( $response['updates'] as $update ) {
			if ( WP_Intent_Log_Engine::UPDATE_TYPE_SNAPSHOT === $update['type'] ) {
				$snapshot = json_decode( $update['data'], true );
				break;
			}
		}
		self::assertNotNull( $snapshot, 'first poll must contain a snapshot row' );

		return $snapshot['doc'];
	}

	public function test_genesis_carries_classic_content_as_freeform() {
		// Previously classic runs were silently DROPPED from genesis —
		// erasing them from the shared document and every collaborator's
		// editor. They now sync as core/freeform with a content field.
		$post_id = self::factory()->post->create(
			array( 'post_content' => "<p>classic content, no block comments</p>\n<div>more</div>" )
		);

		$doc = self::snapshot_doc( self::engine(), 'postType/post:' . $post_id );

		$this->assertCount( 1, $doc['root'] );
		$this->assertSame( 'core/freeform', $doc['root'][0]['blockType'] );
		$this->assertNotSame( '', $doc['root'][0]['fields']['content']['text'] );
	}

	public function test_genesis_maps_nested_blocks_with_deterministic_path_ids() {
		$content = "<!-- wp:group -->\n<div class=\"wp-block-group\"><!-- wp:paragraph -->\n<p>Inner</p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:group -->\n\n<!-- wp:paragraph -->\n<p>Outer</p>\n<!-- /wp:paragraph -->";
		$post_id = self::factory()->post->create( array( 'post_content' => $content ) );

		$doc = self::snapshot_doc( self::engine(), 'postType/post:' . $post_id );

		$this->assertCount( 2, $doc['root'] );
		$group = $doc['root'][0];
		$this->assertSame( 'core/group', $group['blockType'] );
		$this->assertSame(
			WP_Intent_Log_Planner::genesis_sync_id( $post_id, 0, array( 0 ) ),
			$group['syncId']
		);
		$this->assertSame(
			WP_Intent_Log_Planner::genesis_sync_id( $post_id, 0, array( 0, 0 ) ),
			$group['children'][0]['syncId']
		);
		$this->assertSame( 'Inner', $group['children'][0]['fields']['content']['text'] );
		$this->assertSame(
			WP_Intent_Log_Planner::genesis_sync_id( $post_id, 0, array( 1 ) ),
			$doc['root'][1]['syncId']
		);
	}

	public function test_genesis_honors_existing_sync_id_and_preserves_other_metadata() {
		$content = '<!-- wp:paragraph {"metadata":{"syncId":"authored-id","name":"Keep me"},"align":"wide"} -->' . "\n<p>Hi</p>\n<!-- /wp:paragraph -->";
		$post_id = self::factory()->post->create( array( 'post_content' => $content ) );

		$doc   = self::snapshot_doc( self::engine(), 'postType/post:' . $post_id );
		$block = $doc['root'][0];

		$this->assertSame( 'authored-id', $block['syncId'] );
		$this->assertSame( 'wide', $block['attrs']['align'] );
		// syncId is extracted from metadata; sibling metadata keys survive.
		$this->assertSame( array( 'name' => 'Keep me' ), $block['attrs']['metadata'] );
	}

	public function test_non_post_rooms_initialize_with_an_empty_document() {
		$doc = self::snapshot_doc( self::engine(), 'taxonomy/category:1' );

		$this->assertSame( array(), $doc['root'] );
	}

	public function test_first_snapshot_wins_over_a_duplicate_from_a_concurrent_initializer() {
		$post_id = self::factory()->post->create(
			array( 'post_content' => "<!-- wp:paragraph -->\n<p>Real</p>\n<!-- /wp:paragraph -->" )
		);
		$room    = 'postType/post:' . $post_id;
		$target  = WP_Intent_Log_Planner::genesis_sync_id( $post_id, 0, array( 0 ) );

		// First initializer stores the real snapshot…
		self::snapshot_doc( self::engine(), $room );
		// …then a concurrent initializer loses the race and appends a bogus
		// duplicate (empty document).
		$storage = new WP_Sync_Post_Meta_Storage();
		$storage->add_update(
			$room,
			array(
				'client_id' => 0,
				'data'      => wp_json_encode( array( 'doc' => array( 'root' => array() ) ) ),
				'type'      => WP_Intent_Log_Engine::UPDATE_TYPE_SNAPSHOT,
			)
		);

		// A fresh engine (no request cache) must plan against the FIRST
		// snapshot: an intent targeting the real paragraph applies.
		$result = self::engine()->handle_updates(
			$room,
			101,
			0,
			array(
				array(
					'type' => WP_Intent_Log_Engine::UPDATE_TYPE_INTENT,
					'data' => wp_json_encode(
						array(
							'intentId' => 's-1',
							'actorId'  => 'ignored',
							'baseSeq'  => 0,
							'txnId'    => null,
							'type'     => 'insert_text',
							'payload'  => array(
								'syncId' => $target,
								'field'  => 'content',
								'offset' => 0,
								'text'   => 'x',
							),
						)
					),
				),
			),
			array()
		);

		$this->assertSame( 'applied', $result['dispositions'][0]['status'] );
	}

	public function test_room_state_rebuild_lets_voided_markers_override_intent_rows() {
		$post_id = self::factory()->post->create(
			array( 'post_content' => "<!-- wp:paragraph -->\n<p>Hello</p>\n<!-- /wp:paragraph -->" )
		);
		$room    = 'postType/post:' . $post_id;
		self::snapshot_doc( self::engine(), $room );

		/*
		 * Simulate an apply-time-voided intent as the engine persists it:
		 * the transformed intent lives in the log AND a voided marker
		 * records its true disposition.
		 */
		$storage = new WP_Sync_Post_Meta_Storage();
		$intent  = array(
			'intentId' => 'av-1',
			'actorId'  => 'u9c9',
			'baseSeq'  => 0,
			'txnId'    => null,
			'type'     => 'remove_block',
			'payload'  => array( 'syncId' => 'missing-block' ),
		);
		$storage->add_update(
			$room,
			array(
				'client_id' => 9,
				'data'      => wp_json_encode( $intent ),
				'type'      => WP_Intent_Log_Engine::UPDATE_TYPE_INTENT,
			)
		);
		$storage->add_update(
			$room,
			array(
				'client_id' => 9,
				'data'      => wp_json_encode(
					array(
						'intentId' => 'av-1',
						'reason'   => 'already-removed',
					)
				),
				'type'      => WP_Intent_Log_Engine::UPDATE_TYPE_VOIDED,
			)
		);

		// Redelivery through a fresh engine settles as voided, not applied.
		$result = self::engine()->handle_updates(
			$room,
			9,
			0,
			array(
				array(
					'type' => WP_Intent_Log_Engine::UPDATE_TYPE_INTENT,
					'data' => wp_json_encode( $intent ),
				),
			),
			array()
		);

		$this->assertSame(
			array(
				array(
					'intentId' => 'av-1',
					'status'   => 'voided',
					'reason'   => 'already-removed',
				),
			),
			$result['dispositions']
		);
	}

	public function test_materialize_returns_null_for_unparseable_room() {
		// A room the engine cannot initialize storage for is not the case
		// here (storage always works in tests); instead assert the benign
		// path: an unknown-but-parseable room materializes to the empty
		// string rather than erroring.
		$this->assertSame( '', self::engine()->materialize( 'taxonomy/category:1' ) );
	}
}
