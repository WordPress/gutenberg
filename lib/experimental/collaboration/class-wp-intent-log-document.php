<?php
/**
 * WP_Intent_Log_Document class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Intent_Log_Document' ) ) {

	/**
	 * The intent-log engine's document model and deterministic reducer — the
	 * PHP twin of `prototypes/sync/src/document.js` and `reducer.js`.
	 *
	 * A document is `array( 'root' => block[] )`; a block is an associative
	 * array with syncId, blockType, attrs, attrVersions, fields (name =>
	 * array( text, formats )), syncParent, and children. All methods are
	 * static and pure at the interface: apply_intent() returns a new
	 * document and never mutates its input.
	 *
	 * Twin discipline: this class must match the JS implementation exactly —
	 * the frozen transcripts in `prototypes/sync/test-vectors/planner.json`
	 * are the contract, and any behavior change must land in both languages
	 * with regenerated vectors. Text offsets are UTF-16 CODE UNITS in both
	 * languages (see text_length/text_slice): JS strings are UTF-16
	 * natively, and the vectors include multibyte and astral content
	 * pinning the convention cross-language.
	 *
	 * @since 7.2.0
	 * @access private
	 */
	class WP_Intent_Log_Document {
		/**
		 * Field name used when a block spec does not name one.
		 *
		 * @since 7.2.0
		 * @var string
		 */
		const DEFAULT_FIELD = 'content';

		/**
		 * Normalizes a field spec.
		 *
		 * @since 7.2.0
		 *
		 * @param array $spec Field spec.
		 * @return array Field: array( 'text' => string, 'formats' => array ).
		 */
		private static function make_field( array $spec = array() ): array {
			return array(
				'text'    => $spec['text'] ?? '',
				'formats' => array_values( $spec['formats'] ?? array() ),
			);
		}

		/**
		 * Creates a block node from a spec.
		 *
		 * @since 7.2.0
		 *
		 * @param array $spec Block spec.
		 * @return array Block node.
		 */
		public static function make_block( array $spec ): array {
			$fields = array();
			foreach ( $spec['fields'] ?? array() as $name => $field ) {
				$fields[ $name ] = self::make_field( is_array( $field ) ? $field : array() );
			}
			if ( ! isset( $fields[ self::DEFAULT_FIELD ] ) ) {
				$fields[ self::DEFAULT_FIELD ] = self::make_field(
					array(
						'text'    => $spec['text'] ?? '',
						'formats' => $spec['formats'] ?? array(),
					)
				);
			}
			$children = array();
			foreach ( $spec['children'] ?? array() as $child ) {
				$children[] = self::make_block( $child );
			}

			return array(
				'syncId'       => $spec['syncId'],
				'blockType'    => $spec['blockType'],
				'attrs'        => $spec['attrs'] ?? array(),
				'attrVersions' => $spec['attrVersions'] ?? array(),
				'fields'       => $fields,
				'syncParent'   => $spec['syncParent'] ?? null,
				'children'     => $children,
			);
		}

		/**
		 * Length of field text in UTF-16 CODE UNITS — the engine's pinned
		 * text coordinate space. JavaScript strings are UTF-16 natively;
		 * every offset in every text intent counts code units, so the PHP
		 * twin must too (PHP's byte-based strlen/substr desynchronize on the
		 * first multibyte character). Astral characters count as 2, matching
		 * JS surrogate pairs.
		 *
		 * @since 7.2.0
		 *
		 * @param string $text UTF-8 text.
		 * @return int Length in UTF-16 code units.
		 */
		public static function text_length( string $text ): int {
			if ( '' === $text ) {
				return 0;
			}
			return (int) ( strlen( mb_convert_encoding( $text, 'UTF-16LE', 'UTF-8' ) ) / 2 );
		}

		/**
		 * Slice of field text by UTF-16 code-unit offsets (see text_length).
		 *
		 * @since 7.2.0
		 *
		 * @param string   $text  UTF-8 text.
		 * @param int      $start Start offset (code units).
		 * @param int|null $end   End offset (code units), or null for the end.
		 * @return string UTF-8 slice.
		 */
		public static function text_slice( string $text, int $start, ?int $end = null ): string {
			if ( '' === $text ) {
				return '';
			}
			$utf16  = mb_convert_encoding( $text, 'UTF-16LE', 'UTF-8' );
			$length = (int) ( strlen( $utf16 ) / 2 );
			$end    = null === $end ? $length : $end;
			$sliced = substr( $utf16, $start * 2, max( 0, ( $end - $start ) * 2 ) );
			if ( false === $sliced || '' === $sliced ) {
				return '';
			}
			return mb_convert_encoding( $sliced, 'UTF-8', 'UTF-16LE' );
		}

		/**
		 * Creates a document from root block specs and optional entity
		 * properties (title, excerpt, …).
		 *
		 * @since 7.2.0
		 *
		 * @param array $blocks Root block specs.
		 * @param array $props  Entity properties ( name => value ).
		 * @return array Document.
		 */
		public static function create_document( array $blocks = array(), array $props = array() ): array {
			$doc = array( 'root' => array_map( array( __CLASS__, 'make_block' ), $blocks ) );
			if ( count( $props ) > 0 ) {
				$doc['props']        = $props;
				$doc['propVersions'] = array();
			}
			return $doc;
		}

		/**
		 * Finds the index path of a block: a list of child indices from the
		 * root, e.g. [2, 0] = root[2]['children'][0].
		 *
		 * @since 7.2.0
		 *
		 * @param array  $blocks  Sibling list to search.
		 * @param string $sync_id Target block id.
		 * @return array|null Index path, or null.
		 */
		public static function find_path( array $blocks, string $sync_id ): ?array {
			foreach ( $blocks as $index => $block ) {
				if ( $block['syncId'] === $sync_id ) {
					return array( $index );
				}
				$child_path = self::find_path( $block['children'], $sync_id );
				if ( null !== $child_path ) {
					return array_merge( array( $index ), $child_path );
				}
			}

			return null;
		}

		/**
		 * Returns a reference to the block at an index path.
		 *
		 * @since 7.2.0
		 *
		 * @param array $doc  Document (by reference).
		 * @param array $path Index path from find_path().
		 * @return array Reference to the block.
		 */
		private static function &block_at( array &$doc, array $path ): array {
			$node =& $doc['root'];
			$last = count( $path ) - 1;
			foreach ( $path as $depth => $index ) {
				if ( $depth === $last ) {
					return $node[ $index ];
				}
				$node =& $node[ $index ]['children'];
			}
			// Unreachable for non-empty paths.
			return $node[ $path[0] ];
		}

		/**
		 * Returns a reference to the sibling list containing an index path's
		 * target.
		 *
		 * @since 7.2.0
		 *
		 * @param array $doc  Document (by reference).
		 * @param array $path Index path.
		 * @return array Reference to the sibling list.
		 */
		private static function &siblings_of( array &$doc, array $path ): array {
			$node =& $doc['root'];
			$last = count( $path ) - 1;
			foreach ( $path as $depth => $index ) {
				if ( $depth === $last ) {
					break;
				}
				$node =& $node[ $index ]['children'];
			}
			return $node;
		}

		/**
		 * Returns the block for a syncId (a copy), or null.
		 *
		 * @since 7.2.0
		 *
		 * @param array  $doc     Document.
		 * @param string $sync_id Target block id.
		 * @return array|null Block, or null.
		 */
		public static function get_block( array $doc, string $sync_id ): ?array {
			$path = self::find_path( $doc['root'], $sync_id );
			if ( null === $path ) {
				return null;
			}
			return self::block_at( $doc, $path );
		}

		/**
		 * Whether the subtree rooted at $block contains $sync_id (including
		 * the root itself).
		 *
		 * @since 7.2.0
		 *
		 * @param array  $block   Subtree root.
		 * @param string $sync_id Candidate descendant id.
		 * @return bool Whether contained.
		 */
		public static function subtree_contains( array $block, string $sync_id ): bool {
			if ( $block['syncId'] === $sync_id ) {
				return true;
			}
			foreach ( $block['children'] as $child ) {
				if ( self::subtree_contains( $child, $sync_id ) ) {
					return true;
				}
			}

			return false;
		}

		/**
		 * Returns a reference to a block's named field, creating an empty one
		 * on first access (the reducer is forgiving; see the JS twin).
		 *
		 * @since 7.2.0
		 *
		 * @param array  $block Block (by reference).
		 * @param string $name  Field name.
		 * @return array Reference to array( 'text', 'formats' ).
		 */
		private static function &ensure_field( array &$block, string $name ): array {
			if ( ! isset( $block['fields'][ $name ] ) ) {
				$block['fields'][ $name ] = self::make_field();
			}
			return $block['fields'][ $name ];
		}

		/**
		 * Canonical form of a document: fixed key order, sorted attrs/fields
		 * keys, sorted format spans — structurally identical to the JS
		 * canonicalJson() output after JSON decoding.
		 *
		 * @since 7.2.0
		 *
		 * @param array $doc Document.
		 * @return array Canonical structure.
		 */
		public static function canonicalize( array $doc ): array {
			$canonical = array( 'root' => array_map( array( __CLASS__, 'canonical_block' ), $doc['root'] ) );
			// Entity property maps are emitted ONLY when non-empty, so
			// documents predating the entity family canonicalize identically
			// to their original form (the frozen vectors depend on this).
			if ( ! empty( $doc['props'] ) ) {
				$props = $doc['props'];
				ksort( $props, SORT_STRING );
				$canonical['props'] = $props;
			}
			if ( ! empty( $doc['propVersions'] ) ) {
				$prop_versions = $doc['propVersions'];
				ksort( $prop_versions, SORT_STRING );
				$canonical['propVersions'] = $prop_versions;
			}
			return $canonical;
		}

		/**
		 * Canonical form of one block.
		 *
		 * @since 7.2.0
		 *
		 * @param array $block Block.
		 * @return array Canonical block.
		 */
		private static function canonical_block( array $block ): array {
			$attrs = $block['attrs'];
			ksort( $attrs, SORT_STRING );
			$attr_versions = $block['attrVersions'];
			ksort( $attr_versions, SORT_STRING );
			$fields = array();
			$names  = array_keys( $block['fields'] );
			sort( $names, SORT_STRING );
			foreach ( $names as $name ) {
				$formats = array_values( $block['fields'][ $name ]['formats'] );
				usort(
					$formats,
					static function ( $a, $b ) {
						return ( $a['start'] <=> $b['start'] )
							?: ( $a['end'] <=> $b['end'] )
							?: strcmp( $a['format'], $b['format'] );
					}
				);
				$fields[ $name ] = array(
					'text'    => $block['fields'][ $name ]['text'],
					'formats' => $formats,
				);
			}

			return array(
				'syncId'       => $block['syncId'],
				'blockType'    => $block['blockType'],
				'attrs'        => $attrs,
				'attrVersions' => $attr_versions,
				'fields'       => $fields,
				'syncParent'   => $block['syncParent'],
				'children'     => array_map( array( __CLASS__, 'canonical_block' ), $block['children'] ),
			);
		}

		/**
		 * Inserts a block into a sibling list after the given anchor.
		 *
		 * @since 7.2.0
		 *
		 * @param array       $siblings         Sibling list (by reference).
		 * @param array       $block            Block to insert.
		 * @param string|null $after_sibling_id Anchor id, or null for start.
		 */
		private static function insert_into_siblings( array &$siblings, array $block, ?string $after_sibling_id ): void {
			if ( null === $after_sibling_id ) {
				array_unshift( $siblings, $block );
				return;
			}
			foreach ( $siblings as $index => $sibling ) {
				if ( $sibling['syncId'] === $after_sibling_id ) {
					array_splice( $siblings, $index + 1, 0, array( $block ) );
					return;
				}
			}
			$siblings[] = $block;
		}

		/**
		 * Shifts format spans for a text insertion.
		 *
		 * @since 7.2.0
		 *
		 * @param array $formats Spans (by reference).
		 * @param int   $offset  Insert offset.
		 * @param int   $length  Inserted length.
		 */
		private static function shift_formats_for_insert( array &$formats, int $offset, int $length ): void {
			foreach ( $formats as &$span ) {
				if ( $offset <= $span['start'] ) {
					$span['start'] += $length;
					$span['end']   += $length;
				} elseif ( $offset < $span['end'] ) {
					$span['end'] += $length;
				}
			}
			unset( $span );
		}

		/**
		 * Shifts format spans for a text deletion, dropping emptied spans.
		 *
		 * @since 7.2.0
		 *
		 * @param array $formats Spans.
		 * @param int   $start   Deletion start.
		 * @param int   $end     Deletion end.
		 * @return array Adjusted spans.
		 */
		private static function shift_formats_for_delete( array $formats, int $start, int $end ): array {
			$removed = $end - $start;
			$adjust  = static function ( int $position ) use ( $start, $end, $removed ): int {
				if ( $position <= $start ) {
					return $position;
				}
				if ( $position >= $end ) {
					return $position - $removed;
				}
				return $start;
			};
			$result  = array();
			foreach ( $formats as $span ) {
				$span['start'] = $adjust( $span['start'] );
				$span['end']   = $adjust( $span['end'] );
				if ( $span['end'] > $span['start'] ) {
					$result[] = $span;
				}
			}

			return $result;
		}

		/**
		 * Applies a text deletion to a field.
		 *
		 * @since 7.2.0
		 *
		 * @param array $field Field (by reference).
		 * @param int   $start Start offset.
		 * @param int   $end   End offset.
		 */
		private static function apply_text_delete( array &$field, int $start, int $end ): void {
			$field['text']    = self::text_slice( $field['text'], 0, $start ) . self::text_slice( $field['text'], $end );
			$field['formats'] = self::shift_formats_for_delete( $field['formats'], $start, $end );
		}

		/**
		 * Applies a text insertion to a field.
		 *
		 * @since 7.2.0
		 *
		 * @param array  $field  Field (by reference).
		 * @param int    $offset Insert offset.
		 * @param string $text   Text to insert.
		 */
		private static function apply_text_insert( array &$field, int $offset, string $text ): void {
			$field['text'] = self::text_slice( $field['text'], 0, $offset ) . $text . self::text_slice( $field['text'], $offset );
			self::shift_formats_for_insert( $field['formats'], $offset, self::text_length( $text ) );
		}

		/**
		 * Applies one intent to a document. Never throws: missing targets
		 * void and out-of-range offsets clamp, so replaying a log cannot
		 * crash a replica. Mirrors applyIntent() in the JS twin exactly.
		 *
		 * @since 7.2.0
		 *
		 * @param array $doc    Document (not mutated).
		 * @param array $intent Intent.
		 * @return array array( 'doc' => array, 'disposition' => array{status: string, reason?: string} ).
		 */
		public static function apply_intent( array $doc, array $intent ): array {
			$next    = $doc; // PHP arrays copy on assignment.
			$payload = $intent['payload'];
			$applied = static function ( $result_doc ) {
				return array(
					'doc'         => $result_doc,
					'disposition' => array( 'status' => 'applied' ),
				);
			};
			$voided  = static function ( $result_doc, $reason ) {
				return array(
					'doc'         => $result_doc,
					'disposition' => array(
						'status' => 'voided',
						'reason' => $reason,
					),
				);
			};

			switch ( $intent['type'] ) {
				case 'set_attr':
					$path = self::find_path( $next['root'], $payload['syncId'] );
					if ( null === $path ) {
						return $voided( $next, 'missing-target' );
					}
					$block                                    =& self::block_at( $next, $path );
					$block['attrs'][ $payload['key'] ]        = $payload['value'];
					$block['attrVersions'][ $payload['key'] ] =
						( $block['attrVersions'][ $payload['key'] ] ?? 0 ) + 1;
					return $applied( $next );

				case 'remove_attr':
					$path = self::find_path( $next['root'], $payload['syncId'] );
					if ( null === $path ) {
						return $voided( $next, 'missing-target' );
					}
					$block =& self::block_at( $next, $path );
					unset( $block['attrs'][ $payload['key'] ] );
					$block['attrVersions'][ $payload['key'] ] =
						( $block['attrVersions'][ $payload['key'] ] ?? 0 ) + 1;
					return $applied( $next );

				case 'set_property':
					if ( ! isset( $next['props'] ) ) {
						$next['props'] = array();
					}
					if ( ! isset( $next['propVersions'] ) ) {
						$next['propVersions'] = array();
					}
					$next['props'][ $payload['name'] ]        = $payload['value'];
					$next['propVersions'][ $payload['name'] ] =
						( $next['propVersions'][ $payload['name'] ] ?? 0 ) + 1;
					return $applied( $next );

				case 'insert_block':
					// EVERY id the payload subtree brings in must be new,
					// and unique within the payload itself: a nested
					// duplicate would silently retarget all later intents
					// addressing that id.
					$incoming_ids = array();
					$collect_ids  = static function ( $block_payload ) use ( &$collect_ids, &$incoming_ids ) {
						$incoming_ids[] = $block_payload['syncId'];
						foreach ( $block_payload['children'] ?? array() as $child ) {
							$collect_ids( $child );
						}
					};
					$collect_ids( $payload['block'] );
					$seen_ids = array();
					foreach ( $incoming_ids as $incoming_id ) {
						if ( null !== self::get_block( $next, $incoming_id ) || isset( $seen_ids[ $incoming_id ] ) ) {
							return $voided( $next, 'duplicate-id' );
						}
						$seen_ids[ $incoming_id ] = true;
					}
					$new_block = self::make_block( $payload['block'] );
					if ( null === $payload['parentId'] ) {
						self::insert_into_siblings( $next['root'], $new_block, $payload['afterSiblingId'] );
						return $applied( $next );
					}
					$parent_path = self::find_path( $next['root'], $payload['parentId'] );
					if ( null === $parent_path ) {
						return $voided( $next, 'missing-parent' );
					}
					$parent =& self::block_at( $next, $parent_path );
					self::insert_into_siblings( $parent['children'], $new_block, $payload['afterSiblingId'] );
					return $applied( $next );

				case 'remove_block':
					$path = self::find_path( $next['root'], $payload['syncId'] );
					if ( null === $path ) {
						return $voided( $next, 'already-removed' );
					}
					$siblings =& self::siblings_of( $next, $path );
					array_splice( $siblings, end( $path ), 1 );
					return $applied( $next );

				case 'move_block':
					$path = self::find_path( $next['root'], $payload['syncId'] );
					if ( null === $path ) {
						return $voided( $next, 'missing-target' );
					}
					$moving = self::block_at( $next, $path );
					if ( null !== $payload['newParentId'] ) {
						if ( self::subtree_contains( $moving, $payload['newParentId'] ) ) {
							return $voided( $next, 'cycle' );
						}
						if ( null === self::find_path( $next['root'], $payload['newParentId'] ) ) {
							return $voided( $next, 'missing-parent' );
						}
					}
					$siblings =& self::siblings_of( $next, $path );
					array_splice( $siblings, end( $path ), 1 );
					unset( $siblings );
					if ( null === $payload['newParentId'] ) {
						self::insert_into_siblings( $next['root'], $moving, $payload['afterSiblingId'] );
					} else {
						// Re-find: removal may have shifted the parent's path.
						$parent_path = self::find_path( $next['root'], $payload['newParentId'] );
						$parent      =& self::block_at( $next, $parent_path );
						self::insert_into_siblings( $parent['children'], $moving, $payload['afterSiblingId'] );
					}
					return $applied( $next );

				case 'split_block':
					$path = self::find_path( $next['root'], $payload['syncId'] );
					if ( null === $path ) {
						return $voided( $next, 'missing-target' );
					}
					if ( null !== self::get_block( $next, $payload['newSyncId'] ) ) {
						return $voided( $next, 'duplicate-id' );
					}
					$block  =& self::block_at( $next, $path );
					$field  =& self::ensure_field( $block, $payload['field'] );
					$offset = min( $payload['offset'], self::text_length( $field['text'] ) );
					$tail   = self::make_block(
						array(
							'syncId'     => $payload['newSyncId'],
							'blockType'  => $block['blockType'],
							'attrs'      => $block['attrs'],
							'fields'     => array(
								$payload['field'] => array( 'text' => self::text_slice( $field['text'], $offset ) ),
							),
							'syncParent' => $block['syncId'],
						)
					);
					foreach ( $field['formats'] as $span ) {
						if ( $span['end'] > $offset ) {
							$tail['fields'][ $payload['field'] ]['formats'][] = array(
								'start'  => max( 0, $span['start'] - $offset ),
								'end'    => $span['end'] - $offset,
								'format' => $span['format'],
							);
						}
					}
					$field['text'] = self::text_slice( $field['text'], 0, $offset );
					$head_formats  = array();
					foreach ( $field['formats'] as $span ) {
						$span['end'] = min( $span['end'], $offset );
						if ( $span['end'] > $span['start'] ) {
							$head_formats[] = $span;
						}
					}
					$field['formats'] = $head_formats;
					unset( $field, $block );
					$siblings =& self::siblings_of( $next, $path );
					array_splice( $siblings, end( $path ) + 1, 0, array( $tail ) );
					return $applied( $next );

				case 'merge_blocks':
					$survivor_path = self::find_path( $next['root'], $payload['survivorId'] );
					$absorbed_path = self::find_path( $next['root'], $payload['absorbedId'] );
					if ( null === $survivor_path || null === $absorbed_path ) {
						return $voided( $next, 'missing-target' );
					}
					if ( $payload['survivorId'] === $payload['absorbedId'] ) {
						return $voided( $next, 'self-merge' );
					}
					$absorbed = self::block_at( $next, $absorbed_path );
					if ( self::subtree_contains( $absorbed, $payload['survivorId'] ) ) {
						return $voided( $next, 'cycle' );
					}
					$absorbed_field = $absorbed['fields'][ $payload['field'] ] ?? self::make_field();
					$survivor       =& self::block_at( $next, $survivor_path );
					$field          =& self::ensure_field( $survivor, $payload['field'] );
					$join_offset    = self::text_length( $field['text'] );
					$field['text'] .= $absorbed_field['text'];
					foreach ( $absorbed_field['formats'] as $span ) {
						$field['formats'][] = array(
							'start'  => $span['start'] + $join_offset,
							'end'    => $span['end'] + $join_offset,
							'format' => $span['format'],
						);
					}
					foreach ( $absorbed['children'] as $child ) {
						$survivor['children'][] = $child;
					}
					unset( $field, $survivor );
					// Re-find: appending children may have changed paths.
					$absorbed_path = self::find_path( $next['root'], $payload['absorbedId'] );
					$siblings      =& self::siblings_of( $next, $absorbed_path );
					array_splice( $siblings, end( $absorbed_path ), 1 );
					return $applied( $next );

				case 'transform_block':
					$path = self::find_path( $next['root'], $payload['syncId'] );
					if ( null === $path ) {
						return $voided( $next, 'missing-target' );
					}
					$block              =& self::block_at( $next, $path );
					$block['blockType'] = $payload['newBlockType'];
					return $applied( $next );

				case 'insert_text':
					$path = self::find_path( $next['root'], $payload['syncId'] );
					if ( null === $path ) {
						return $voided( $next, 'missing-target' );
					}
					$block  =& self::block_at( $next, $path );
					$field  =& self::ensure_field( $block, $payload['field'] );
					$offset = min( $payload['offset'], self::text_length( $field['text'] ) );
					self::apply_text_insert( $field, $offset, $payload['text'] );
					return $applied( $next );

				case 'delete_text':
					$path = self::find_path( $next['root'], $payload['syncId'] );
					if ( null === $path ) {
						return $voided( $next, 'missing-target' );
					}
					$block =& self::block_at( $next, $path );
					$field =& self::ensure_field( $block, $payload['field'] );
					$start = min( $payload['start'], self::text_length( $field['text'] ) );
					$end   = min( $payload['end'], self::text_length( $field['text'] ) );
					if ( $end <= $start ) {
						return $voided( $next, 'empty-after-clamp' );
					}
					self::apply_text_delete( $field, $start, $end );
					return $applied( $next );

				case 'format_text':
					$path = self::find_path( $next['root'], $payload['syncId'] );
					if ( null === $path ) {
						return $voided( $next, 'missing-target' );
					}
					$block =& self::block_at( $next, $path );
					$field =& self::ensure_field( $block, $payload['field'] );
					$start = min( $payload['start'], self::text_length( $field['text'] ) );
					$end   = min( $payload['end'], self::text_length( $field['text'] ) );
					if ( $end <= $start ) {
						return $voided( $next, 'empty-after-clamp' );
					}
					if ( $payload['on'] ) {
						$field['formats'][] = array(
							'start'  => $start,
							'end'    => $end,
							'format' => $payload['format'],
						);
						return $applied( $next );
					}
					$next_formats = array();
					foreach ( $field['formats'] as $span ) {
						if (
							$span['format'] !== $payload['format'] ||
							$span['end'] <= $start ||
							$span['start'] >= $end
						) {
							$next_formats[] = $span;
							continue;
						}
						if ( $span['start'] < $start ) {
							$next_formats[] = array_merge( $span, array( 'end' => $start ) );
						}
						if ( $span['end'] > $end ) {
							$next_formats[] = array_merge( $span, array( 'start' => $end ) );
						}
					}
					$field['formats'] = $next_formats;
					return $applied( $next );

				case 'replace_text':
					$path = self::find_path( $next['root'], $payload['syncId'] );
					if ( null === $path ) {
						return $voided( $next, 'missing-target' );
					}
					$block =& self::block_at( $next, $path );
					$field =& self::ensure_field( $block, $payload['field'] );
					$start = min( $payload['start'], self::text_length( $field['text'] ) );
					$end   = min( $payload['end'], self::text_length( $field['text'] ) );
					if ( $end > $start ) {
						self::apply_text_delete( $field, $start, $end );
					}
					self::apply_text_insert( $field, $start, $payload['text'] );
					return $applied( $next );

				case 'replace_attr_content':
					$path = self::find_path( $next['root'], $payload['syncId'] );
					if ( null === $path ) {
						return $voided( $next, 'missing-target' );
					}
					$block            =& self::block_at( $next, $path );
					$field            =& self::ensure_field( $block, $payload['field'] );
					$field['text']    = $payload['newText'];
					$field['formats'] = array();
					return $applied( $next );
			}

			return $voided( $next, 'unknown-type' );
		}

		/**
		 * Replays a log of intents from an initial document.
		 *
		 * @since 7.2.0
		 *
		 * @param array $initial_doc Genesis document.
		 * @param array $log         Ordered accepted intents.
		 * @return array Final document.
		 */
		public static function replay( array $initial_doc, array $log ): array {
			$doc = $initial_doc;
			foreach ( $log as $intent ) {
				$result = self::apply_intent( $doc, $intent );
				$doc    = $result['doc'];
			}

			return $doc;
		}
	}
}
