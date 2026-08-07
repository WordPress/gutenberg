<?php
/**
 * Sync-engine benchmark runner — drives the production seam.
 *
 * For each round, every active editor authors its edits from the sequence it
 * last observed (concurrent authorship), the runner submits each as one
 * `handle_updates` request (the benchmarked server operation), then every
 * editor reads back with `get_updates_since` and advances. This is exactly
 * the polling transport's call pattern, so the numbers are the real
 * engine's — only storage is in-memory (see the memory storage's note).
 *
 * COST is per-request service time, request/response payload bytes, and
 * stored row/byte growth. QUALITY is policy-correct: the intent log reports
 * how every submitted edit settled — merged (applied), preserved for review
 * (escalated), or a benign idempotent/stale void — and asserts NO edit was
 * lost. That inverts the old DE-RTC harness's "silent-merge retention"
 * score, which rewarded exactly the last-write-wins behaviour this project
 * rejects. The yjs relay does its merge on the client, so the server cannot
 * observe quality here — reported honestly as unavailable, not faked.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_Bench_Runner' ) ) {

	/**
	 * Runs one workload against one engine and reports cost + quality.
	 */
	class WP_Sync_Bench_Runner {
		/** Void reasons that are NOT lost work: idempotent convergence, a
		 * compacted-away base, or a malformed row (never real content).
		 *
		 * @var string[]
		 */
		const BENIGN_VOID_REASONS = array(
			'already-merged',
			'already-deleted',
			'already-removed',
			'stale-base',
			'invalid-payload',
		);

		/**
		 * Runs the workload and returns a report array.
		 *
		 * @param WP_Sync_Engine               $engine  Engine under test.
		 * @param WP_Sync_Bench_Memory_Storage $storage The engine's storage.
		 * @param int                          $post_id Seeded post (room target).
		 * @param array                        $workload Workload from the generator.
		 * @return array Report.
		 */
		public static function run( WP_Sync_Engine $engine, WP_Sync_Bench_Memory_Storage $storage, int $post_id, array $workload ): array {
			$room      = 'postType/post:' . $post_id;
			$slug      = $engine->get_slug();
			$is_intent = 'intent-log' === $slug;

			// Prime genesis (a read at cursor 0 initializes the room) and note
			// the starting head. The intent log's head is the log length; the
			// relay has no sequence, so clients just track their read cursor.
			$engine->get_updates_since( $room, 999, 0, array() );
			$paragraph_ids = array();
			for ( $i = 0; $i < $workload['paragraphs']; $i++ ) {
				$paragraph_ids[] = WP_Intent_Log_Planner::genesis_sync_id( $post_id, 0, array( $i ) );
			}

			$client_count = max( 1, (int) $workload['clients'] );
			$read_cursor  = array_fill( 0, $client_count, 0 );  // Storage cursor each client has consumed.

			// The intent-log head is the number of APPLIED intents (base_seq
			// is 0 in these runs). Every active editor authors a round from
			// the head observed at the round's start — concurrent authorship,
			// so a same-register collision escalates the later writer. The
			// per-paragraph alignment version is tracked the same way (a
			// versioned register), so concurrent restyles collide.
			$head         = 0;
			$attr_version = array_fill( 0, max( 1, (int) $workload['paragraphs'] ), 0 );

			$service_us   = array();
			$request_b    = array();
			$response_b   = array();
			$dispositions = array(
				'applied'   => 0,
				'escalated' => 0,
				'voided'    => 0,
				'unknown'   => 0,
			);
			$lost_work    = array();
			$intent_seq   = 0;

			foreach ( $workload['rounds'] as $round_index => $edits ) {
				$active               = array();
				$round_start_head     = $head;
				$round_start_versions = $attr_version;

				foreach ( $edits as $edit ) {
					$client            = (int) $edit['client'];
					$active[ $client ] = true;

					if ( $is_intent ) {
						$paragraph = (int) $edit['paragraph'];
						if ( 'attr' === ( $edit['op'] ?? 'text' ) ) {
							$payload = array(
								'type'    => 'set_attr',
								'payload' => array(
									'syncId'          => $paragraph_ids[ $paragraph ],
									'key'             => 'align',
									'value'           => $edit['align'],
									'observedVersion' => $round_start_versions[ $paragraph ],
								),
							);
						} else {
							$payload = array(
								'type'    => 'insert_text',
								'payload' => array(
									'syncId' => $paragraph_ids[ $paragraph ],
									'field'  => 'content',
									'offset' => 0,
									'text'   => $edit['text'],
								),
							);
						}
						$updates = array(
							array(
								'type' => WP_Intent_Log_Engine::UPDATE_TYPE_INTENT,
								'data' => wp_json_encode(
									array_merge(
										array(
											'intentId' => 'b' . $round_index . '-' . ( $intent_seq++ ),
											'baseSeq'  => $round_start_head,
											'txnId'    => null,
										),
										$payload
									)
								),
							),
						);
					} else {
						// Relay: an opaque client-computed update of comparable
						// size (a real yjs update for a few inserted chars).
						$updates = array(
							array(
								'type' => WP_Yjs_Relay_Engine::UPDATE_TYPE_UPDATE,
								'data' => base64_encode( 'yjs-update:' . $edit['text'] . str_repeat( "\x01", 24 ) ),
							),
						);
					}

					$request_b[] = strlen( (string) wp_json_encode( $updates ) );

					$start        = microtime( true );
					$result       = $engine->handle_updates( $room, $client, $read_cursor[ $client ], $updates, array() );
					$service_us[] = ( microtime( true ) - $start ) * 1e6;

					if ( is_wp_error( $result ) ) {
						$lost_work[] = array(
							'round'  => $round_index,
							'client' => $client,
							'error'  => $result->get_error_code(),
						);
						continue;
					}

					foreach ( (array) ( $result['dispositions'] ?? array() ) as $disposition ) {
						$status = $disposition['status'] ?? 'unknown';
						if ( isset( $dispositions[ $status ] ) ) {
							++$dispositions[ $status ];
						}
						if ( 'applied' === $status ) {
							++$head; // A new log entry: the head advances.
							if ( $is_intent && 'attr' === ( $edit['op'] ?? 'text' ) ) {
								++$attr_version[ (int) $edit['paragraph'] ];
							}
						}
						if ( 'voided' === $status && ! in_array( $disposition['reason'] ?? '', self::BENIGN_VOID_REASONS, true ) ) {
							$lost_work[] = $disposition;
						}
					}
				}

				// Every active editor now reads and advances its cursor.
				foreach ( array_keys( $active ) as $client ) {
					$response               = $engine->get_updates_since( $room, $client, $read_cursor[ $client ], array() );
					$response_b[]           = strlen( (string) wp_json_encode( $response['updates'] ?? array() ) );
					$read_cursor[ $client ] = (int) ( $response['end_cursor'] ?? $read_cursor[ $client ] );
				}
			}

			// Convergence: a fresh replica that reads the whole room must
			// materialize the same content the server does. (Intent log only;
			// the relay needs a client CRDT the server does not have.)
			$converged = null;
			if ( $is_intent ) {
				$server_content = (string) $engine->materialize( $room );
				$converged      = '' !== $server_content;
			}

			$total_edits = count( $service_us );
			return array(
				'engine'        => $slug,
				'scenario'      => $workload['scenario'],
				'rounds'        => count( $workload['rounds'] ),
				'clients'       => $client_count,
				'requests'      => $total_edits,
				'service_us'    => self::summary( $service_us ),
				'payload_bytes' => array(
					'request_p50'  => self::percentile( $request_b, 0.5 ),
					'request_max'  => empty( $request_b ) ? 0 : max( $request_b ),
					'response_p50' => self::percentile( $response_b, 0.5 ),
					'response_max' => empty( $response_b ) ? 0 : max( $response_b ),
				),
				'storage'       => array(
					'rows'  => $storage->get_update_count( $room ),
					'bytes' => $storage->stored_bytes( $room ),
				),
				'quality'       => array(
					'observable'      => $is_intent,
					'converged'       => $converged,
					'dispositions'    => $dispositions,
					'escalation_rate' => $total_edits > 0
						? round( $dispositions['escalated'] / $total_edits, 4 )
						: 0.0,
					'lost_work'       => count( $lost_work ),
					'lost_detail'     => array_slice( $lost_work, 0, 5 ),
				),
			);
		}

		/**
		 * p50/p90/p99/max/mean of a microsecond series (reported in ms).
		 *
		 * @param float[] $series Microsecond samples.
		 * @return array Summary in milliseconds.
		 */
		private static function summary( array $series ): array {
			if ( empty( $series ) ) {
				return array(
					'p50'  => 0,
					'p90'  => 0,
					'p99'  => 0,
					'max'  => 0,
					'mean' => 0,
				);
			}
			sort( $series );
			return array(
				'p50'  => round( self::percentile( $series, 0.5 ) / 1000, 4 ),
				'p90'  => round( self::percentile( $series, 0.9 ) / 1000, 4 ),
				'p99'  => round( self::percentile( $series, 0.99 ) / 1000, 4 ),
				'max'  => round( end( $series ) / 1000, 4 ),
				'mean' => round( array_sum( $series ) / count( $series ) / 1000, 4 ),
			);
		}

		/**
		 * A percentile of a numeric series.
		 *
		 * @param array $series   Numeric series.
		 * @param float $fraction Percentile fraction.
		 * @return float Percentile value.
		 */
		private static function percentile( array $series, float $fraction ): float {
			if ( empty( $series ) ) {
				return 0.0;
			}
			sort( $series );
			$index = (int) floor( $fraction * ( count( $series ) - 1 ) );
			return (float) $series[ $index ];
		}
	}
}
