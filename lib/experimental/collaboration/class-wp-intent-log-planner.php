<?php
/**
 * WP_Intent_Log_Planner class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Intent_Log_Planner' ) ) {

	/**
	 * The intent-log engine's batch planner — the PHP twin of
	 * `prototypes/sync/src/rebase.js` (and `sync-id.js` for genesis
	 * identity).
	 *
	 * plan_batch() is THE shared deterministic core: a pure function of
	 * (units, log, doc-at) that decides, for one client's batch, which
	 * intents apply (with transformed payloads), which escalate to the
	 * proposal lane, and which void. The server commits a plan at ingest; a
	 * caught-up JS client runs the same planner over its log copy to predict
	 * dispositions — so this implementation must match the JS one exactly.
	 * The frozen transcripts in `prototypes/sync/test-vectors/planner.json`
	 * and the identity vectors in `sync-id.json` are the contract.
	 *
	 * @since 7.2.0
	 * @access private
	 */
	class WP_Intent_Log_Planner {
		/**
		 * Every reason an intent can escalate.
		 *
		 * @since 7.2.0
		 * @var string[]
		 */
		const ESCALATION_REASONS = array(
			'target-deleted',
			'range-crosses-split',
			'concurrent-insert-in-range',
			'position-in-deleted-range',
			'concurrent-replace-overlap',
			'content-replaced',
			'merge-dropped-field',
			'attr-conflict',
			'property-conflict',
			'frame-conflict',
			'dependent-on-escalated',
		);

		const TEXT_INTENT_TYPES = array( 'insert_text', 'delete_text', 'format_text', 'replace_text' );

		/**
		 * Deterministic genesis syncId:
		 * base64url( sha256( "postId:revisionId:path.join('.')" )[0..16) ).
		 *
		 * @since 7.2.0
		 *
		 * @param int   $post_id     Post ID.
		 * @param int   $revision_id Revision ID.
		 * @param int[] $path        Block path (child indices from the root).
		 * @return string 22-character base64url syncId.
		 */
		public static function genesis_sync_id( int $post_id, int $revision_id, array $path ): string {
			$input  = $post_id . ':' . $revision_id . ':' . implode( '.', $path );
			$digest = substr( hash( 'sha256', $input, true ), 0, 16 );

			return rtrim( strtr( base64_encode( $digest ), '+/', '-_' ), '=' );
		}

		/**
		 * Groups a batch into atomic units: contiguous runs sharing a txnId,
		 * singletons otherwise.
		 *
		 * @since 7.2.0
		 *
		 * @param array $intents Intents in authoring order.
		 * @return array Units.
		 */
		public static function group_units( array $intents ): array {
			$units = array();
			foreach ( $intents as $intent ) {
				$last_index = count( $units ) - 1;
				if (
					null !== ( $intent['txnId'] ?? null ) &&
					$last_index >= 0 &&
					( $units[ $last_index ][0]['txnId'] ?? null ) === $intent['txnId']
				) {
					$units[ $last_index ][] = $intent;
				} else {
					$units[] = array( $intent );
				}
			}

			return $units;
		}

		/**
		 * Frame key for one named field of a block.
		 *
		 * @since 7.2.0
		 *
		 * @param string $sync_id Block id.
		 * @param string $field   Field name.
		 * @return string Frame key.
		 */
		private static function field_frame_key( string $sync_id, string $field ): string {
			return $sync_id . '::' . $field;
		}

		/**
		 * Whether two frame keys address overlapping text state (a bare
		 * block-wide key overlaps every field key of that block).
		 *
		 * @since 7.2.0
		 *
		 * @param string $a Frame key.
		 * @param string $b Frame key.
		 * @return bool Whether the frames overlap.
		 */
		public static function frame_keys_overlap( string $a, string $b ): bool {
			if ( $a === $b ) {
				return true;
			}
			return ( ! str_contains( $a, '::' ) && str_starts_with( $b, $a . '::' ) )
				|| ( ! str_contains( $b, '::' ) && str_starts_with( $a, $b . '::' ) );
		}

		/**
		 * Frame keys an intent READS.
		 *
		 * @since 7.2.0
		 *
		 * @param array $intent Intent.
		 * @return string[] Frame keys.
		 */
		public static function frame_read_targets( array $intent ): array {
			$payload = $intent['payload'];
			switch ( $intent['type'] ) {
				case 'insert_text':
				case 'delete_text':
				case 'replace_text':
				case 'split_block':
					return array( self::field_frame_key( $payload['syncId'], $payload['field'] ) );
				case 'merge_blocks':
					return array(
						self::field_frame_key( $payload['survivorId'], $payload['field'] ),
						$payload['absorbedId'],
					);
				default:
					return array();
			}
		}

		/**
		 * Frame keys an intent WRITES.
		 *
		 * @since 7.2.0
		 *
		 * @param array $intent Intent.
		 * @return string[] Frame keys.
		 */
		public static function frame_write_targets( array $intent ): array {
			$payload = $intent['payload'];
			switch ( $intent['type'] ) {
				case 'insert_text':
				case 'delete_text':
				case 'replace_text':
				case 'replace_attr_content':
					return array( self::field_frame_key( $payload['syncId'], $payload['field'] ) );
				case 'split_block':
					return array(
						self::field_frame_key( $payload['syncId'], $payload['field'] ),
						self::field_frame_key( $payload['newSyncId'], $payload['field'] ),
					);
				case 'merge_blocks':
					return array(
						self::field_frame_key( $payload['survivorId'], $payload['field'] ),
						$payload['absorbedId'],
					);
				default:
					return array();
			}
		}

		/**
		 * Block ids an intent brings into existence.
		 *
		 * @since 7.2.0
		 *
		 * @param array $intent Intent.
		 * @return string[] Created block ids.
		 */
		private static function created_ids( array $intent ): array {
			if ( 'insert_block' === $intent['type'] ) {
				$ids     = array();
				$collect = static function ( $block ) use ( &$collect, &$ids ) {
					$ids[] = $block['syncId'];
					foreach ( $block['children'] ?? array() as $child ) {
						$collect( $child );
					}
				};
				$collect( $intent['payload']['block'] );
				return $ids;
			}
			if ( 'split_block' === $intent['type'] ) {
				return array( $intent['payload']['newSyncId'] );
			}
			return array();
		}

		/**
		 * Validates an intent payload against the vocabulary schema — the
		 * PHP mirror of createIntent()'s PAYLOAD_SCHEMAS plus its range
		 * checks. Payloads reach typed planner/document code, so the route
		 * must reject malformed ones with a 400 instead of fataling
		 * mid-plan. SyncIds additionally must not contain `::`, which would
		 * silently break the frame-key algebra (frame keys are
		 * `syncId::field`).
		 *
		 * @since 7.2.0
		 *
		 * @param string $type    Intent type.
		 * @param array  $payload Intent payload.
		 * @return bool Whether the payload is valid for the type.
		 */
		public static function is_valid_payload( string $type, array $payload ): bool {
			$is_sync_id         = static function ( $value ): bool {
				return is_string( $value ) && '' !== $value && false === strpos( $value, '::' );
			};
			$is_sync_id_or_null = static function ( $value ) use ( $is_sync_id ): bool {
				return null === $value || $is_sync_id( $value );
			};
			$is_nonempty_string = static function ( $value ): bool {
				return is_string( $value ) && '' !== $value;
			};
			$is_nn_int          = static function ( $value ): bool {
				return is_int( $value ) && $value >= 0;
			};
			$is_text            = 'is_string';
			$is_any             = static function (): bool {
				return true;
			};
			/*
			 * Block names materialize into comment delimiters UNESCAPED
			 * (serialize_block escapes attrs, not the name), so a name
			 * outside the block-name grammar could break out of the comment
			 * and inject markup. Reject for everyone.
			 */
			$is_block_type = static function ( $value ): bool {
				return is_string( $value )
					&& (bool) preg_match( '/^[a-z][a-z0-9-]*(\/[a-z][a-z0-9-]*)?$/', $value );
			};
			$is_block      = null;
			$is_block      = static function ( $value ) use ( &$is_block, $is_sync_id, $is_block_type ): bool {
				if ( ! is_array( $value ) || ! $is_sync_id( $value['syncId'] ?? null ) || ! $is_block_type( $value['blockType'] ?? null ) ) {
					return false;
				}
				foreach ( $value['children'] ?? array() as $child ) {
					if ( ! $is_block( $child ) ) {
						return false;
					}
				}
				return true;
			};

			$schemas = array(
				'set_attr'             => array(
					'syncId'          => $is_sync_id,
					'key'             => $is_nonempty_string,
					'value'           => $is_any,
					'observedVersion' => $is_nn_int,
				),
				'remove_attr'          => array(
					'syncId'          => $is_sync_id,
					'key'             => $is_nonempty_string,
					'observedVersion' => $is_nn_int,
				),
				'set_property'         => array(
					'name'            => $is_nonempty_string,
					'value'           => $is_any,
					'observedVersion' => $is_nn_int,
				),
				'insert_block'         => array(
					'block'          => $is_block,
					'parentId'       => $is_sync_id_or_null,
					'afterSiblingId' => $is_sync_id_or_null,
				),
				'remove_block'         => array(
					'syncId' => $is_sync_id,
				),
				'move_block'           => array(
					'syncId'         => $is_sync_id,
					'newParentId'    => $is_sync_id_or_null,
					'afterSiblingId' => $is_sync_id_or_null,
				),
				'split_block'          => array(
					'syncId'    => $is_sync_id,
					'field'     => $is_nonempty_string,
					'offset'    => $is_nn_int,
					'newSyncId' => $is_sync_id,
				),
				'merge_blocks'         => array(
					'survivorId' => $is_sync_id,
					'absorbedId' => $is_sync_id,
					'field'      => $is_nonempty_string,
					'joinOffset' => $is_nn_int,
				),
				'transform_block'      => array(
					'syncId'       => $is_sync_id,
					'newBlockType' => $is_block_type,
				),
				'insert_text'          => array(
					'syncId' => $is_sync_id,
					'field'  => $is_nonempty_string,
					'offset' => $is_nn_int,
					'text'   => $is_nonempty_string,
				),
				'delete_text'          => array(
					'syncId'      => $is_sync_id,
					'field'       => $is_nonempty_string,
					'start'       => $is_nn_int,
					'end'         => $is_nn_int,
					'removedText' => $is_text,
				),
				'format_text'          => array(
					'syncId' => $is_sync_id,
					'field'  => $is_nonempty_string,
					'start'  => $is_nn_int,
					'end'    => $is_nn_int,
					'format' => $is_nonempty_string,
					'on'     => 'is_bool',
				),
				'replace_text'         => array(
					'syncId'      => $is_sync_id,
					'field'       => $is_nonempty_string,
					'start'       => $is_nn_int,
					'end'         => $is_nn_int,
					'removedText' => $is_text,
					'text'        => $is_nonempty_string,
				),
				'replace_attr_content' => array(
					'syncId'          => $is_sync_id,
					'field'           => $is_nonempty_string,
					'newText'         => $is_text,
					'observedVersion' => $is_nn_int,
				),
			);

			if ( ! isset( $schemas[ $type ] ) ) {
				return false;
			}
			$schema = $schemas[ $type ];
			foreach ( $schema as $field => $predicate ) {
				if ( ! array_key_exists( $field, $payload ) || ! $predicate( $payload[ $field ] ) ) {
					return false;
				}
			}
			foreach ( array_keys( $payload ) as $field ) {
				if ( ! isset( $schema[ $field ] ) ) {
					return false; // Extraneous field.
				}
			}
			// Range sanity, mirroring createIntent().
			$ranged = array( 'delete_text', 'format_text', 'replace_text' );
			if ( in_array( $type, $ranged, true ) && $payload['end'] < $payload['start'] ) {
				return false;
			}
			if ( in_array( $type, array( 'delete_text', 'format_text' ), true ) && $payload['end'] === $payload['start'] ) {
				return false;
			}
			return true;
		}

		/**
		 * Block ids that must survive for the intent to remain applicable.
		 *
		 * @since 7.2.0
		 *
		 * @param array $intent Intent.
		 * @return string[] Required block ids.
		 */
		private static function required_targets( array $intent ): array {
			$payload = $intent['payload'];
			switch ( $intent['type'] ) {
				case 'set_property':
					// Entity properties target the document, not a block.
					return array();
				case 'insert_block':
					return null === $payload['parentId'] ? array() : array( $payload['parentId'] );
				case 'move_block':
					return null === $payload['newParentId']
						? array( $payload['syncId'] )
						: array( $payload['syncId'], $payload['newParentId'] );
				case 'merge_blocks':
					return array( $payload['survivorId'], $payload['absorbedId'] );
				default:
					return array( $payload['syncId'] );
			}
		}

		/**
		 * Escalation rules 5 and 6 against the batch frame state.
		 *
		 * @since 7.2.0
		 *
		 * @param array    $frame            Frame state: array( 'ownWrites' => key =>
		 *                                   array( state, atSeq? ), 'broken' => id => atSeq ).
		 * @param array    $intent           Intent (ORIGINAL payload).
		 * @param callable $first_remote_seq fn( string $frame_key ): ?int.
		 * @return array|null array( 'reason', 'atSeq' ), or null.
		 */
		private static function frame_escalation( array $frame, array $intent, callable $first_remote_seq ): ?array {
			foreach ( self::required_targets( $intent ) as $id ) {
				if ( isset( $frame['broken'][ $id ] ) && $intent['baseSeq'] <= $frame['broken'][ $id ] ) {
					return array(
						'reason' => 'dependent-on-escalated',
						'atSeq'  => $frame['broken'][ $id ],
					);
				}
			}
			foreach ( self::frame_read_targets( $intent ) as $key ) {
				$phantom_at  = null;
				$has_applied = false;
				foreach ( $frame['ownWrites'] as $own_key => $own ) {
					if ( ! self::frame_keys_overlap( (string) $own_key, $key ) ) {
						continue;
					}
					if ( 'phantom' === $own['state'] && $intent['baseSeq'] <= $own['atSeq'] ) {
						$phantom_at = max( $phantom_at ?? -1, $own['atSeq'] );
					} elseif ( 'applied' === $own['state'] ) {
						$has_applied = true;
					}
				}
				if ( null !== $phantom_at ) {
					return array(
						'reason' => 'dependent-on-escalated',
						'atSeq'  => $phantom_at,
					);
				}
				if ( $has_applied ) {
					$remote_at = $first_remote_seq( $key );
					if ( null !== $remote_at ) {
						return array(
							'reason' => 'frame-conflict',
							'atSeq'  => $remote_at,
						);
					}
				}
			}

			return null;
		}

		/**
		 * Records an intent's terminal outcome into the batch frame state.
		 *
		 * @since 7.2.0
		 *
		 * @param array    $frame   Frame state (by reference).
		 * @param array    $intent  Intent (ORIGINAL payload).
		 * @param bool     $applied Whether the intent survived rebase cleanly.
		 * @param int|null $at_seq  Settling log index when not applied.
		 */
		private static function record_frame_outcome( array &$frame, array $intent, bool $applied, ?int $at_seq ): void {
			foreach ( self::frame_write_targets( $intent ) as $key ) {
				$current = $frame['ownWrites'][ $key ] ?? null;
				if ( ! $applied ) {
					$seq                        = max( $at_seq ?? 0, $current['atSeq'] ?? -1 );
					$frame['ownWrites'][ $key ] = array(
						'state' => 'phantom',
						'atSeq' => $seq,
					);
				} elseif ( ( $current['state'] ?? null ) !== 'phantom' ) {
					$frame['ownWrites'][ $key ] = array( 'state' => 'applied' );
				}
			}
			if ( ! $applied ) {
				foreach ( self::created_ids( $intent ) as $id ) {
					$frame['broken'][ $id ] = max( $at_seq ?? 0, $frame['broken'][ $id ] ?? -1 );
				}
			}
		}

		/**
		 * Intra-unit frame conflict (see the JS twin for rationale).
		 *
		 * @since 7.2.0
		 *
		 * @param array    $members          The unit's intents.
		 * @param int      $index            Member being checked.
		 * @param callable $first_remote_seq fn( string $frame_key ): ?int.
		 * @return int|null Conflicting remote write's log index, or null.
		 */
		private static function intra_unit_conflict_seq( array $members, int $index, callable $first_remote_seq ): ?int {
			$prior_writes = array();
			for ( $k = 0; $k < $index; $k++ ) {
				foreach ( self::frame_write_targets( $members[ $k ] ) as $key ) {
					$prior_writes[] = $key;
				}
			}
			$best = null;
			foreach ( self::frame_read_targets( $members[ $index ] ) as $key ) {
				$overlaps = false;
				foreach ( $prior_writes as $prior ) {
					if ( self::frame_keys_overlap( $prior, $key ) ) {
						$overlaps = true;
						break;
					}
				}
				if ( ! $overlaps ) {
					continue;
				}
				$seq = $first_remote_seq( $key );
				if ( null !== $seq && ( null === $best || $seq < $best ) ) {
					$best = $seq;
				}
			}

			return $best;
		}

		/**
		 * Returns an intent copy with payload overrides (envelope preserved).
		 *
		 * @since 7.2.0
		 *
		 * @param array $intent  Intent.
		 * @param array $changes Payload overrides.
		 * @return array Transformed intent.
		 */
		private static function with_payload( array $intent, array $changes ): array {
			$intent['payload'] = array_merge( $intent['payload'], $changes );
			return $intent;
		}

		/**
		 * Whether the intent carries text coordinates in the given block field.
		 *
		 * @since 7.2.0
		 *
		 * @param array  $intent  Intent.
		 * @param string $sync_id Block id.
		 * @param string $field   Field name.
		 * @return bool Whether the intent targets that exact text frame.
		 */
		private static function targets_text_of( array $intent, string $sync_id, string $field ): bool {
			return ( in_array( $intent['type'], self::TEXT_INTENT_TYPES, true ) || 'split_block' === $intent['type'] )
				&& $intent['payload']['syncId'] === $sync_id
				&& $intent['payload']['field'] === $field;
		}

		/**
		 * Whether the intent addresses any text content of the given block.
		 *
		 * @since 7.2.0
		 *
		 * @param array  $intent  Intent.
		 * @param string $sync_id Block id.
		 * @return bool Whether the intent targets any field of that block.
		 */
		private static function targets_any_text_of( array $intent, string $sync_id ): bool {
			return ( in_array( $intent['type'], self::TEXT_INTENT_TYPES, true )
					|| 'split_block' === $intent['type']
					|| 'replace_attr_content' === $intent['type'] )
				&& ( $intent['payload']['syncId'] ?? null ) === $sync_id;
		}

		/**
		 * A point position carried by the intent, or null.
		 *
		 * @since 7.2.0
		 *
		 * @param array $intent Intent.
		 * @return int|null Point position.
		 */
		private static function point_of( array $intent ) {
			if ( 'insert_text' === $intent['type'] || 'split_block' === $intent['type'] ) {
				return $intent['payload']['offset'];
			}
			return null;
		}

		/**
		 * Whether the intent carries a text range.
		 *
		 * @since 7.2.0
		 *
		 * @param array $intent Intent.
		 * @return bool Whether ranged.
		 */
		private static function has_range( array $intent ): bool {
			return in_array( $intent['type'], array( 'delete_text', 'format_text', 'replace_text' ), true );
		}

		/**
		 * Transforms `$intent` over one accepted prior from another actor.
		 * Mirrors transformOne() in the JS twin exactly, including check
		 * order.
		 *
		 * @since 7.2.0
		 *
		 * @param array $intent Intent being rebased.
		 * @param array $prior  Accepted prior intent (other actor).
		 * @param array $doc    Document state immediately BEFORE $prior applied.
		 * @return array array( 'outcome' => 'clean'|'escalate'|'void', 'intent' => array, 'reason' => ?string ).
		 */
		private static function transform_one( array $intent, array $prior, array $doc ): array {
			$payload       = $intent['payload'];
			$prior_payload = $prior['payload'];
			$clean         = static function ( $result_intent ) {
				return array(
					'outcome' => 'clean',
					'intent'  => $result_intent,
				);
			};
			$escalate      = static function ( $result_intent, $reason ) {
				return array(
					'outcome' => 'escalate',
					'intent'  => $result_intent,
					'reason'  => $reason,
				);
			};
			$void_out      = static function ( $result_intent, $reason ) {
				return array(
					'outcome' => 'void',
					'intent'  => $result_intent,
					'reason'  => $reason,
				);
			};

			switch ( $prior['type'] ) {
				case 'remove_block':
					$removed = WP_Intent_Log_Document::get_block( $doc, $prior_payload['syncId'] );
					if ( null === $removed ) {
						return $clean( $intent );
					}
					foreach ( self::required_targets( $intent ) as $id ) {
						if ( WP_Intent_Log_Document::subtree_contains( $removed, $id ) ) {
							if ( 'remove_block' === $intent['type'] && $id === $payload['syncId'] ) {
								return $void_out( $intent, 'already-removed' );
							}
							return $escalate( $intent, 'target-deleted' );
						}
					}
					return $clean( $intent );

				case 'split_block':
					if ( ! self::targets_text_of( $intent, $prior_payload['syncId'], $prior_payload['field'] ) ) {
						return $clean( $intent );
					}
					$split_at = $prior_payload['offset'];
					$point    = self::point_of( $intent );
					if ( null !== $point ) {
						if ( $point < $split_at ) {
							return $clean( $intent );
						}
						return $clean(
							self::with_payload(
								$intent,
								array(
									'syncId' => $prior_payload['newSyncId'],
									'offset' => $point - $split_at,
								)
							)
						);
					}
					if ( self::has_range( $intent ) ) {
						if ( $payload['end'] <= $split_at ) {
							return $clean( $intent );
						}
						if ( $payload['start'] >= $split_at ) {
							return $clean(
								self::with_payload(
									$intent,
									array(
										'syncId' => $prior_payload['newSyncId'],
										'start'  => $payload['start'] - $split_at,
										'end'    => $payload['end'] - $split_at,
									)
								)
							);
						}
						if ( 'format_text' === $intent['type'] ) {
							return $clean( self::with_payload( $intent, array( 'end' => $split_at ) ) );
						}
						return $escalate( $intent, 'range-crosses-split' );
					}
					return $clean( $intent );

				case 'merge_blocks':
					if ( ! self::targets_any_text_of( $intent, $prior_payload['absorbedId'] ) ) {
						/*
						 * The merge consumes the absorbed block (and its
						 * subtree): identity-addressed intents on it escalate
						 * rather than silently voiding at apply time,
						 * mirroring the remove_block prior (rule 1). The one
						 * idempotent case: a concurrent merge of the SAME
						 * pair already achieved this intent's effect — void.
						 */
						if (
							'merge_blocks' === $intent['type'] &&
							$payload['absorbedId'] === $prior_payload['absorbedId'] &&
							$payload['survivorId'] === $prior_payload['survivorId']
						) {
							return $void_out( $intent, 'already-merged' );
						}
						$absorbed_block = WP_Intent_Log_Document::get_block( $doc, $prior_payload['absorbedId'] );
						if ( null !== $absorbed_block ) {
							foreach ( self::required_targets( $intent ) as $id ) {
								if ( WP_Intent_Log_Document::subtree_contains( $absorbed_block, $id ) ) {
									return $escalate( $intent, 'target-deleted' );
								}
							}
						}
						return $clean( $intent );
					}
					if (
						'replace_attr_content' === $intent['type'] ||
						$payload['field'] !== $prior_payload['field']
					) {
						return $escalate( $intent, 'merge-dropped-field' );
					}
					$survivor = WP_Intent_Log_Document::get_block( $doc, $prior_payload['survivorId'] );
					$absorbed = WP_Intent_Log_Document::get_block( $doc, $prior_payload['absorbedId'] );
					if ( null === $survivor || null === $absorbed ) {
						return $clean( $intent );
					}
					$join_offset = WP_Intent_Log_Document::text_length( $survivor['fields'][ $prior_payload['field'] ]['text'] ?? '' );
					$point       = self::point_of( $intent );
					if ( null !== $point ) {
						return $clean(
							self::with_payload(
								$intent,
								array(
									'syncId' => $prior_payload['survivorId'],
									'offset' => $point + $join_offset,
								)
							)
						);
					}
					if ( self::has_range( $intent ) ) {
						return $clean(
							self::with_payload(
								$intent,
								array(
									'syncId' => $prior_payload['survivorId'],
									'start'  => $payload['start'] + $join_offset,
									'end'    => $payload['end'] + $join_offset,
								)
							)
						);
					}
					return $clean( $intent );

				case 'insert_text':
					if ( ! self::targets_text_of( $intent, $prior_payload['syncId'], $prior_payload['field'] ) ) {
						return $clean( $intent );
					}
					$at     = $prior_payload['offset'];
					$length = WP_Intent_Log_Document::text_length( $prior_payload['text'] );
					$point  = self::point_of( $intent );
					if ( null !== $point ) {
						if ( $at <= $point ) {
							return $clean( self::with_payload( $intent, array( 'offset' => $point + $length ) ) );
						}
						return $clean( $intent );
					}
					if ( $at <= $payload['start'] ) {
						return $clean(
							self::with_payload(
								$intent,
								array(
									'start' => $payload['start'] + $length,
									'end'   => $payload['end'] + $length,
								)
							)
						);
					}
					if ( $at >= $payload['end'] ) {
						return $clean( $intent );
					}
					if ( 'format_text' === $intent['type'] ) {
						return $clean( self::with_payload( $intent, array( 'end' => $payload['end'] + $length ) ) );
					}
					return $escalate( $intent, 'concurrent-insert-in-range' );

				case 'delete_text':
				case 'replace_text':
					if ( ! self::targets_text_of( $intent, $prior_payload['syncId'], $prior_payload['field'] ) ) {
						return $clean( $intent );
					}
					$ds           = $prior_payload['start'];
					$de           = $prior_payload['end'];
					$removed_len  = $de - $ds;
					$inserted     = 'replace_text' === $prior['type'] ? WP_Intent_Log_Document::text_length( $prior_payload['text'] ) : 0;
					$is_replace   = 'replace_text' === $prior['type'];
					$map_position = static function ( int $position ) use ( $ds, $de, $removed_len, $inserted ): ?int {
						if ( $position <= $ds ) {
							return $position;
						}
						if ( $position >= $de ) {
							return $position - $removed_len + $inserted;
						}
						return null;
					};
					$point        = self::point_of( $intent );
					if ( null !== $point ) {
						$mapped = $map_position( $point );
						if ( null === $mapped ) {
							return $escalate( $intent, 'position-in-deleted-range' );
						}
						return $clean( self::with_payload( $intent, array( 'offset' => $mapped ) ) );
					}
					if ( $payload['end'] <= $ds || $payload['start'] >= $de ) {
						$shift = static function ( int $position ) use ( $de, $removed_len, $inserted ): int {
							return $position >= $de ? $position - $removed_len + $inserted : $position;
						};
						return $clean(
							self::with_payload(
								$intent,
								array(
									'start' => $shift( $payload['start'] ),
									'end'   => $shift( $payload['end'] ),
								)
							)
						);
					}
					if ( $is_replace || 'replace_text' === $intent['type'] ) {
						return $escalate( $intent, 'concurrent-replace-overlap' );
					}
					$mapped_start = $map_position( $payload['start'] ) ?? $ds;
					$mapped_end   = $map_position( $payload['end'] ) ?? $ds;
					if ( $mapped_end <= $mapped_start ) {
						return $void_out( $intent, 'already-deleted' );
					}
					return $clean(
						self::with_payload(
							$intent,
							array(
								'start' => $mapped_start,
								'end'   => $mapped_end,
							)
						)
					);

				case 'replace_attr_content':
					if ( self::targets_text_of( $intent, $prior_payload['syncId'], $prior_payload['field'] ) ) {
						return $escalate( $intent, 'content-replaced' );
					}
					if (
						'replace_attr_content' === $intent['type'] &&
						$payload['syncId'] === $prior_payload['syncId'] &&
						$payload['field'] === $prior_payload['field']
					) {
						return $escalate( $intent, 'content-replaced' );
					}
					return $clean( $intent );

				case 'set_attr':
				case 'remove_attr':
					$intent_is_map_write = 'set_attr' === $intent['type'] || 'remove_attr' === $intent['type'];
					if (
						$intent_is_map_write &&
						$payload['syncId'] === $prior_payload['syncId'] &&
						$payload['key'] === $prior_payload['key']
					) {
						return $escalate( $intent, 'attr-conflict' );
					}
					return $clean( $intent );

				case 'set_property':
					if (
						'set_property' === $intent['type'] &&
						$payload['name'] === $prior_payload['name']
					) {
						// Escalation rule 3, entity analog: the per-property
						// register saw a write this intent did not observe.
						return $escalate( $intent, 'property-conflict' );
					}
					return $clean( $intent );
			}

			return $clean( $intent );
		}

		/**
		 * Rebases one intent over the accepted slice, mirroring
		 * rebaseIntent() in the JS twin.
		 *
		 * @since 7.2.0
		 *
		 * @param array $intent      Intent to rebase.
		 * @param array $priors      Accepted intents after $start_seq, in log order.
		 * @param array $doc_at_base Document at $start_seq.
		 * @param int   $start_seq   Log index of $priors[0].
		 * @return array array( 'outcome', 'intent', 'reason'?, 'atSeq'? ).
		 */
		private static function rebase_intent( array $intent, array $priors, array $doc_at_base, int $start_seq ): array {
			$current = $intent;
			$doc     = $doc_at_base;
			foreach ( array_values( $priors ) as $i => $prior ) {
				if ( $prior['actorId'] !== $intent['actorId'] ) {
					$result = self::transform_one( $current, $prior, $doc );
					if ( 'clean' !== $result['outcome'] ) {
						$result['atSeq'] = $start_seq + $i;
						return $result;
					}
					$current = $result['intent'];
				}
				$applied = WP_Intent_Log_Document::apply_intent( $doc, $prior );
				$doc     = $applied['doc'];
			}

			return array(
				'outcome' => 'clean',
				'intent'  => $current,
			);
		}

		/**
		 * Plans one client's batch against a log — the shared deterministic
		 * core. Mirrors planBatch() in the JS twin exactly.
		 *
		 * @since 7.2.0
		 *
		 * @param array    $units  Batch grouped into units (group_units).
		 * @param array    $log    Accepted log (batch's intents NOT included).
		 * @param callable $doc_at fn( int $seq ): array document at that log position.
		 * @return array array( 'rows' => row[], 'headDoc' => array ). Each row:
		 *               array( 'intent', 'disposition', 'accepted' => ?array, 'proposal' => ?array ).
		 */
		public static function plan_batch( array $units, array $log, callable $doc_at, int $first_seq = 0 ): array {
			$frame    = array(
				'ownWrites' => array(),
				'broken'    => array(),
			);
			$rows     = array();
			$head_doc = $doc_at( $first_seq + count( $log ) );

			foreach ( $units as $unit ) {
				$unit    = array_values( $unit );
				$rebased = array();
				foreach ( $unit as $j => $intent ) {
					// Callers guarantee baseSeq >= $first_seq (older intents
					// are stale-voided before planning).
					$slice            = array_slice( $log, $intent['baseSeq'] - $first_seq );
					$actor_id         = $intent['actorId'];
					$base_seq         = $intent['baseSeq'];
					$first_remote_seq = static function ( string $key ) use ( $slice, $actor_id, $base_seq ): ?int {
						foreach ( $slice as $index => $entry ) {
							if ( $entry['actorId'] === $actor_id ) {
								continue;
							}
							foreach ( self::frame_write_targets( $entry ) as $written ) {
								if ( self::frame_keys_overlap( $written, $key ) ) {
									return $base_seq + $index;
								}
							}
						}
						return null;
					};

					$frame_problem = self::frame_escalation( $frame, $intent, $first_remote_seq );
					$conflict_seq  = null === $frame_problem
						? self::intra_unit_conflict_seq( $unit, $j, $first_remote_seq )
						: null;

					if ( null !== $frame_problem ) {
						$result = array(
							'outcome' => 'escalate',
							'intent'  => $intent,
							'reason'  => $frame_problem['reason'],
							'atSeq'   => $frame_problem['atSeq'],
						);
					} elseif ( null !== $conflict_seq ) {
						$result = array(
							'outcome' => 'escalate',
							'intent'  => $intent,
							'reason'  => 'frame-conflict',
							'atSeq'   => $conflict_seq,
						);
					} else {
						$result = self::rebase_intent( $intent, $slice, $doc_at( $intent['baseSeq'] ), $intent['baseSeq'] );
					}
					$rebased[] = $result;
				}

				// Rule 4: the unit settles under its lowest-trigger escalation.
				$escalation = null;
				foreach ( $rebased as $result ) {
					if ( 'escalate' !== $result['outcome'] ) {
						continue;
					}
					if ( null === $escalation || $result['atSeq'] < $escalation['atSeq'] ) {
						$escalation = $result;
					}
				}

				foreach ( $unit as $j => $intent ) {
					$result      = $rebased[ $j ];
					$accepted    = null;
					$proposal    = null;
					$disposition = null;
					if ( null !== $escalation ) {
						$disposition = array(
							'status' => 'escalated',
							'reason' => $escalation['reason'],
						);
						$proposal    = array(
							'intent'  => $result['intent'],
							'actorId' => $intent['actorId'],
							'reason'  => $escalation['reason'],
						);
					} elseif ( 'void' === $result['outcome'] ) {
						$disposition = array(
							'status' => 'voided',
							'reason' => $result['reason'],
						);
					} else {
						$applied  = WP_Intent_Log_Document::apply_intent( $head_doc, $result['intent'] );
						$head_doc = $applied['doc'];
						$accepted = $result['intent'];
						if ( 'applied' === $applied['disposition']['status'] ) {
							$disposition = array( 'status' => 'applied' );
						} else {
							$disposition = array(
								'status' => 'voided',
								'reason' => $applied['disposition']['reason'],
							);
						}
					}

					$frame_applied = 'applied' === $disposition['status']
						|| ( 'voided' === $disposition['status'] && 'clean' === $result['outcome'] );
					self::record_frame_outcome(
						$frame,
						$intent,
						$frame_applied,
						null !== $escalation ? $escalation['atSeq'] : ( $result['atSeq'] ?? null )
					);

					$rows[] = array(
						'intent'      => $intent,
						'disposition' => $disposition,
						'accepted'    => $accepted,
						'proposal'    => $proposal,
					);
				}
			}

			return array(
				'rows'    => $rows,
				'headDoc' => $head_doc,
			);
		}

		/**
		 * Creates an in-memory server replay state.
		 *
		 * @since 7.2.0
		 *
		 * @param array $initial_doc Genesis document.
		 * @return array Server state.
		 */
		public static function create_server( array $initial_doc ): array {
			return array(
				'log'          => array(),
				'proposals'    => array(),
				'dispositions' => array(),
				'docCache'     => array( 0 => $initial_doc ),
			);
		}

		/**
		 * Document state at a log position, cached.
		 *
		 * @since 7.2.0
		 *
		 * @param array $server Server state (by reference).
		 * @param int   $seq    Log position (0 = genesis).
		 * @return array Document.
		 */
		public static function server_doc_at( array &$server, int $seq ): array {
			if ( isset( $server['docCache'][ $seq ] ) ) {
				return $server['docCache'][ $seq ];
			}
			$nearest = 0;
			foreach ( array_keys( $server['docCache'] ) as $key ) {
				if ( $key <= $seq && $key > $nearest ) {
					$nearest = $key;
				}
			}
			$doc = WP_Intent_Log_Document::replay(
				$server['docCache'][ $nearest ],
				array_slice( $server['log'], $nearest, $seq - $nearest )
			);

			$server['docCache'][ $seq ] = $doc;
			return $doc;
		}

		/**
		 * Ingests a batch of intents, mirroring serverIngestBatch() in the JS
		 * twin: idempotent per intentId, atomic txn units, dispositions
		 * recorded, proposals filed, accepted intents appended to the log.
		 *
		 * @since 7.2.0
		 *
		 * @param array $server  Server state (by reference).
		 * @param array $intents Intents in authoring order.
		 * @return array Dispositions, one per input intent.
		 */
		public static function server_ingest_batch( array &$server, array $intents ): array {
			// Idempotency covers duplicates WITHIN one batch too (the settled
			// map is only populated after planning) — mirrors the JS twin.
			$seen_in_batch = array();
			$units         = array();
			foreach ( self::group_units( $intents ) as $unit ) {
				$fresh = array_values(
					array_filter(
						$unit,
						static function ( $intent ) use ( $server, &$seen_in_batch ) {
							$intent_id = $intent['intentId'];
							if ( isset( $server['dispositions'][ $intent_id ] ) || isset( $seen_in_batch[ $intent_id ] ) ) {
								return false;
							}
							$seen_in_batch[ $intent_id ] = true;
							return true;
						}
					)
				);
				if ( count( $fresh ) > 0 ) {
					$units[] = $fresh;
				}
			}

			$doc_at = function ( int $seq ) use ( &$server ): array {
				return self::server_doc_at( $server, $seq );
			};
			$plan   = self::plan_batch( $units, $server['log'], $doc_at );

			foreach ( $plan['rows'] as $row ) {
				$server['dispositions'][ $row['intent']['intentId'] ] = $row['disposition'];
				if ( null !== $row['proposal'] ) {
					$server['proposals'][] = $row['proposal'];
				}
				if ( null !== $row['accepted'] ) {
					$server['log'][] = $row['accepted'];
				}
			}
			$server['docCache'][ count( $server['log'] ) ] = $plan['headDoc'];

			$results = array();
			foreach ( $intents as $intent ) {
				$results[] = $server['dispositions'][ $intent['intentId'] ] ?? null;
			}

			return $results;
		}
	}
}
