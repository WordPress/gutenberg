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
		$path = dirname( __DIR__, 3 ) . '/prototypes/sync/test-vectors/' . $name;
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
}
