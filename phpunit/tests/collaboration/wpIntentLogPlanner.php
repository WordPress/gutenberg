<?php
/**
 * Tests for the intent-log planner PHP twin against the frozen
 * cross-language vectors generated from the JS engine.
 *
 * @package Gutenberg
 */

class Tests_Collaboration_WpIntentLogPlanner extends WP_UnitTestCase {
	/**
	 * Loads a frozen vector file from the sync prototype.
	 *
	 * @param string $name Vector file name.
	 * @return array Decoded vectors.
	 */
	private static function load_vectors( string $name ): array {
		$path = dirname( __DIR__, 3 ) . '/packages/sync/src/engines/intent-log/test-vectors/' . $name;
		if ( ! file_exists( $path ) ) {
			self::fail( "Missing vector file: $path" );
		}
		$decoded = json_decode( file_get_contents( $path ), true );
		self::assertIsArray( $decoded, "Malformed vector file: $path" );

		return $decoded;
	}

	/**
	 * The simulator's genesis document, ported from makeGenesisDoc() in
	 * prototypes/sync/src/simulator.js. Must stay in sync with it — the
	 * planner vectors are generated against this document.
	 *
	 * @param int $post_id     Post ID.
	 * @param int $revision_id Revision ID.
	 * @return array Document.
	 */
	private static function make_genesis_doc( int $post_id, int $revision_id ): array {
		$id = static function ( array $path ) use ( $post_id, $revision_id ): string {
			return WP_Intent_Log_Planner::genesis_sync_id( $post_id, $revision_id, $path );
		};

		return WP_Intent_Log_Document::create_document(
			array(
				array(
					'syncId'    => $id( array( 0 ) ),
					'blockType' => 'core/paragraph',
					'text'      => 'It was a dark and stormy night.',
				),
				array(
					'syncId'    => $id( array( 1 ) ),
					'blockType' => 'core/quote',
					'fields'    => array(
						'content'  => array( 'text' => 'The rain fell in torrents.' ),
						'citation' => array( 'text' => 'Bulwer-Lytton' ),
					),
				),
				array(
					'syncId'    => $id( array( 2 ) ),
					'blockType' => 'core/group',
					'children'  => array(
						array(
							'syncId'    => $id( array( 2, 0 ) ),
							'blockType' => 'core/paragraph',
							'text'      => 'Except at occasional intervals.',
						),
						array(
							'syncId'    => $id( array( 2, 1 ) ),
							'blockType' => 'core/paragraph',
							'text'      => 'When it was checked by a violent gust.',
						),
					),
				),
				array(
					'syncId'    => $id( array( 3 ) ),
					'blockType' => 'core/paragraph',
					'text'      => 'Which swept up the streets.',
				),
			)
		);
	}

	public function test_genesis_sync_id_matches_every_frozen_vector() {
		$vectors = self::load_vectors( 'sync-id.json' );
		$this->assertNotEmpty( $vectors['vectors'] );

		foreach ( $vectors['vectors'] as $vector ) {
			$this->assertSame(
				$vector['syncId'],
				WP_Intent_Log_Planner::genesis_sync_id(
					$vector['postId'],
					$vector['revisionId'],
					$vector['path']
				),
				"genesis id mismatch for input {$vector['canonicalInput']}"
			);
		}
	}

	public function test_planner_reproduces_every_frozen_transcript() {
		$vectors = self::load_vectors( 'planner.json' );
		$this->assertNotEmpty( $vectors['cases'] );

		foreach ( $vectors['cases'] as $case ) {
			$server = WP_Intent_Log_Planner::create_server(
				self::make_genesis_doc(
					$case['genesis']['postId'],
					$case['genesis']['revisionId']
				)
			);

			foreach ( $case['batches'] as $batch ) {
				WP_Intent_Log_Planner::server_ingest_batch( $server, $batch );
			}

			$name = $case['name'];
			$this->assertEquals(
				$case['expected']['dispositions'],
				$server['dispositions'],
				"$name: dispositions diverged"
			);
			$this->assertEquals(
				$case['expected']['proposals'],
				array_map(
					static function ( $proposal ) {
						return array(
							'intentId' => $proposal['intent']['intentId'],
							'actorId'  => $proposal['actorId'],
							'reason'   => $proposal['reason'],
						);
					},
					$server['proposals']
				),
				"$name: proposal lane diverged"
			);
			$this->assertEquals(
				$case['expected']['log'],
				$server['log'],
				"$name: accepted log diverged"
			);
			$this->assertEquals(
				$case['expected']['finalDoc'],
				WP_Intent_Log_Document::canonicalize(
					WP_Intent_Log_Planner::server_doc_at( $server, count( $server['log'] ) )
				),
				"$name: final document diverged"
			);
		}
	}

	public function test_replaying_a_transcript_twice_is_idempotent() {
		$vectors = self::load_vectors( 'planner.json' );
		$case    = $vectors['cases'][0];

		$server = WP_Intent_Log_Planner::create_server(
			self::make_genesis_doc( $case['genesis']['postId'], $case['genesis']['revisionId'] )
		);
		foreach ( $case['batches'] as $batch ) {
			WP_Intent_Log_Planner::server_ingest_batch( $server, $batch );
		}
		$log_length     = count( $server['log'] );
		$proposal_count = count( $server['proposals'] );

		// Redeliver every batch: nothing may change.
		foreach ( $case['batches'] as $batch ) {
			WP_Intent_Log_Planner::server_ingest_batch( $server, $batch );
		}
		$this->assertCount( $log_length, $server['log'] );
		$this->assertCount( $proposal_count, $server['proposals'] );
		$this->assertEquals( $case['expected']['dispositions'], $server['dispositions'] );
	}

	public function test_final_document_equals_fresh_replay_of_accepted_log() {
		$vectors = self::load_vectors( 'planner.json' );

		foreach ( $vectors['cases'] as $case ) {
			$genesis = self::make_genesis_doc(
				$case['genesis']['postId'],
				$case['genesis']['revisionId']
			);
			$this->assertEquals(
				$case['expected']['finalDoc'],
				WP_Intent_Log_Document::canonicalize(
					WP_Intent_Log_Document::replay( $genesis, $case['expected']['log'] )
				),
				"{$case['name']}: fresh replay diverged from frozen final document"
			);
		}
	}

	/**
	 * Builds an intent envelope for the adversarial-id tests.
	 *
	 * @param string $actor    Actor id.
	 * @param string $id       Intent id.
	 * @param int    $base_seq Base sequence.
	 * @param string $type     Intent type.
	 * @param array  $payload  Payload.
	 * @param string|null $txn Transaction id.
	 * @return array Intent envelope.
	 */
	private static function intent( string $actor, string $id, int $base_seq, string $type, array $payload, ?string $txn = null ): array {
		return array(
			'intentId' => $id,
			'actorId'  => $actor,
			'baseSeq'  => $base_seq,
			'txnId'    => $txn,
			'type'     => $type,
			'payload'  => $payload,
		);
	}

	/**
	 * PHP silently casts numeric-string array keys to integers. The frozen
	 * vectors never contain purely numeric syncIds, so the frame-state maps
	 * (`broken`, keyed by bare block id) are only exercised here with
	 * adversarial ids. The lookups must behave identically to the JS engine's
	 * string-keyed Maps.
	 */
	public function test_frame_rules_survive_purely_numeric_sync_ids_in_broken_map() {
		$server = WP_Intent_Log_Planner::create_server(
			WP_Intent_Log_Document::create_document(
				array(
					array(
						'syncId'    => '111',
						'blockType' => 'core/group',
						'children'  => array(
							array(
								'syncId'    => '222',
								'blockType' => 'core/paragraph',
								'text'      => 'Numeric ids',
							),
						),
					),
				)
			)
		);

		// alice removes the group; accepted at seq 1.
		WP_Intent_Log_Planner::server_ingest_batch(
			$server,
			array(
				self::intent( 'alice', 'a-1', 0, 'remove_block', array( 'syncId' => '111' ) ),
			)
		);

		// bob, offline from seq 0: inserts a numeric-id block INTO the
		// deleted group (escalates target-deleted, poisoning created id
		// '333' in the broken map), then edits the phantom block.
		$dispositions = WP_Intent_Log_Planner::server_ingest_batch(
			$server,
			array(
				self::intent(
					'bob',
					'b-1',
					0,
					'insert_block',
					array(
						'block'          => array(
							'syncId'    => '333',
							'blockType' => 'core/paragraph',
						),
						'parentId'       => '111',
						'afterSiblingId' => null,
					)
				),
				self::intent(
					'bob',
					'b-2',
					0,
					'insert_text',
					array(
						'syncId' => '333',
						'field'  => 'content',
						'offset' => 0,
						'text'   => 'lost',
					)
				),
			)
		);

		$this->assertSame( 'escalated', $dispositions[0]['status'] );
		$this->assertSame( 'target-deleted', $dispositions[0]['reason'] );
		$this->assertSame( 'escalated', $dispositions[1]['status'] );
		$this->assertSame( 'dependent-on-escalated', $dispositions[1]['reason'] );
	}

	/**
	 * A merge writes a bare block-level frame key for the absorbed block.
	 * With a purely numeric absorbed id that key int-casts in `ownWrites`;
	 * the overlap check must still match the string field key
	 * `222::content` of a later intent.
	 */
	public function test_frame_rules_survive_purely_numeric_sync_ids_in_own_writes_map() {
		$server = WP_Intent_Log_Planner::create_server(
			WP_Intent_Log_Document::create_document(
				array(
					array(
						'syncId'    => '111',
						'blockType' => 'core/paragraph',
						'text'      => 'First',
					),
					array(
						'syncId'    => '222',
						'blockType' => 'core/paragraph',
						'text'      => 'Second',
					),
				)
			)
		);

		// alice removes block 222; accepted at seq 1.
		WP_Intent_Log_Planner::server_ingest_batch(
			$server,
			array(
				self::intent( 'alice', 'a-1', 0, 'remove_block', array( 'syncId' => '222' ) ),
			)
		);

		// bob, offline from seq 0: merges 222 into 111 (escalates
		// target-deleted; ownWrites gains phantom keys including the bare
		// numeric '222'), then edits 222's content — authored on a frame
		// containing the phantom merge, so it must follow it into review.
		$dispositions = WP_Intent_Log_Planner::server_ingest_batch(
			$server,
			array(
				self::intent(
					'bob',
					'b-1',
					0,
					'merge_blocks',
					array(
						'survivorId' => '111',
						'absorbedId' => '222',
						'field'      => 'content',
						'joinOffset' => 5,
					)
				),
				self::intent(
					'bob',
					'b-2',
					0,
					'insert_text',
					array(
						'syncId' => '222',
						'field'  => 'content',
						'offset' => 0,
						'text'   => 'x',
					)
				),
			)
		);

		$this->assertSame( 'escalated', $dispositions[0]['status'] );
		$this->assertSame( 'target-deleted', $dispositions[0]['reason'] );
		$this->assertSame( 'escalated', $dispositions[1]['status'] );
		$this->assertSame( 'dependent-on-escalated', $dispositions[1]['reason'] );
	}
}
