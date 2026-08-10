<?php
/**
 * Gutenberg_Distributed_Editing_Engine class
 *
 * Server-authoritative save engine for the distributed editing prototype.
 *
 * Security invariant: every top-level chunk of accepted post_content is either
 * (a) byte-identical to a chunk of the previously accepted content,
 * (b) filtered through wp_kses_post(), or
 * (c) explicitly approved (hash-pinned) by a user with the unfiltered_html
 *     capability in the same request that carried the bytes.
 * Unapproved protected changes are never trusted: for every saver they are
 * sequestered into a pending-review block whose attributes carry the proposed
 * bytes as inert data and whose inner content is the kses-filtered placeholder.
 * Only an explicit reviewer action (unwrap in the editor, then save with the
 * approval hash) turns a proposal into active content.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'Gutenberg_Distributed_Editing_Engine' ) ) {

	/**
	 * Applies distributed-editing saves with compare-and-swap versioning and
	 * block-level capability enforcement.
	 *
	 * @access private
	 */
	class Gutenberg_Distributed_Editing_Engine {
		/**
		 * Maximum accepted content length.
		 *
		 * @var int
		 */
		const MAX_CONTENT_LENGTH = 16777216;

		/**
		 * Returns the current version token for a post.
		 *
		 * The version is derived from the accepted content bytes, so any accepted
		 * change (from any client, plugin, or direct call) invalidates stale bases.
		 *
		 * @param int $post_id Post ID.
		 * @return string|WP_Error Version token, or WP_Error for an unknown post.
		 */
		public function get_version( $post_id ) {
			$post = get_post( $post_id );
			if ( ! $post ) {
				return new WP_Error( 'de_unknown_post', __( 'Unknown post.', 'gutenberg' ), array( 'status' => 404 ) );
			}
			return 'v1:' . hash( 'sha256', $post->post_content );
		}

		/**
		 * Returns the hash of a chunk's exact bytes.
		 *
		 * @param string $chunk Chunk bytes.
		 * @return string Hash.
		 */
		public function hash_chunk( $chunk ) {
			return hash( 'sha256', $chunk );
		}

		/**
		 * Splits serialized content into top-level chunks without re-serializing.
		 *
		 * Each chunk is an exact byte substring of the input: a complete top-level
		 * block (including nested inner blocks), a void block, or a run of freeform
		 * content between blocks. Concatenating the chunks reproduces the input
		 * byte for byte. Hashes are computed over these exact bytes; content is
		 * never re-serialized before comparison.
		 *
		 * @param string $content Serialized post content.
		 * @return string[] Ordered list of chunks.
		 */
		public function split_top_level_chunks( $content ) {
			if ( '' === $content ) {
				return array();
			}

			$chunks      = array();
			$chunk_start = 0;
			$depth       = 0;
			$length      = strlen( $content );

			preg_match_all(
				'/<!--\s+(?P<closer>\/)?wp:[a-z][a-z0-9_\-\/]*(?:\s+.*?)?-->/s',
				$content,
				$matches,
				PREG_OFFSET_CAPTURE | PREG_SET_ORDER
			);

			foreach ( $matches as $match ) {
				$token_start = $match[0][1];
				$token_end   = $token_start + strlen( $match[0][0] );
				$is_closer   = ! empty( $match['closer'][0] );
				$is_void     = ! $is_closer && '/-->' === substr( $match[0][0], -4 );

				if ( $is_closer ) {
					if ( $depth > 0 ) {
						--$depth;
						if ( 0 === $depth ) {
							$chunks[]    = substr( $content, $chunk_start, $token_end - $chunk_start );
							$chunk_start = $token_end;
						}
					}
					// A stray closer at depth zero is treated as freeform content.
					continue;
				}

				if ( $is_void ) {
					if ( 0 === $depth ) {
						if ( $token_start > $chunk_start ) {
							$chunks[] = substr( $content, $chunk_start, $token_start - $chunk_start );
						}
						$chunks[]    = substr( $content, $token_start, $token_end - $token_start );
						$chunk_start = $token_end;
					}
					continue;
				}

				// Opener.
				if ( 0 === $depth ) {
					if ( $token_start > $chunk_start ) {
						$chunks[] = substr( $content, $chunk_start, $token_start - $chunk_start );
					}
					$chunk_start = $token_start;
				}
				++$depth;
			}

			if ( $chunk_start < $length ) {
				$chunks[] = substr( $content, $chunk_start );
			}

			return $chunks;
		}

		/**
		 * Checks whether a chunk contains content a user without unfiltered_html
		 * could not have authored.
		 *
		 * @param string $chunk Chunk bytes.
		 * @return bool Whether the chunk is protected.
		 */
		public function is_protected_chunk( $chunk ) {
			$trimmed = trim( $chunk );
			if ( '' === $trimmed ) {
				return false;
			}

			// A pending-review wrapper is a void block whose escaped attributes
			// carry the inert proposed payload and the safe placeholder. The
			// proposed payload is never rendered (the front-end callback and
			// the editor render only the placeholder; the payload activates
			// only through an explicit editor unwrap, which re-enters this
			// check as an ordinary chunk). So protection turns solely on the
			// placeholder being kses-clean — this both lets a legitimate
			// wrapper pass through untouched and forces a hand-crafted wrapper
			// with a dangerous placeholder to be re-sequestered.
			if ( 0 === strpos( $trimmed, '<!-- wp:de/pending-review' ) ) {
				$parsed      = parse_blocks( $chunk );
				$placeholder = isset( $parsed[0]['attrs']['placeholder'] ) ? $parsed[0]['attrs']['placeholder'] : '';
				return wp_kses_post( $placeholder ) !== $placeholder;
			}

			return wp_kses_post( $chunk ) !== $chunk;
		}

		/**
		 * Describes the current accepted state of a post.
		 *
		 * @param int $post_id Post ID.
		 * @return array|WP_Error State description or error.
		 */
		public function get_state( $post_id ) {
			$post = get_post( $post_id );
			if ( ! $post ) {
				return new WP_Error( 'de_unknown_post', __( 'Unknown post.', 'gutenberg' ), array( 'status' => 404 ) );
			}

			$chunks      = $this->split_top_level_chunks( $post->post_content );
			$chunk_infos = array();
			foreach ( $chunks as $chunk ) {
				$chunk_infos[] = array(
					'hash'      => $this->hash_chunk( $chunk ),
					'protected' => $this->is_protected_chunk( $chunk ),
					'length'    => strlen( $chunk ),
				);
			}

			return array(
				'version' => 'v1:' . hash( 'sha256', $post->post_content ),
				'content' => $post->post_content,
				'chunks'  => $chunk_infos,
			);
		}

		/**
		 * Evaluates a distributed-editing save without persisting anything.
		 *
		 * Callers that manage persistence themselves (like the wp/v2 save
		 * integration) use this to obtain the decision: the accepted content,
		 * sequestered proposals, or a bounce error.
		 *
		 * @param int      $post_id      Post ID.
		 * @param string   $content      Proposed full post content.
		 * @param string   $base_version Version token the proposal is based on.
		 * @param string[] $approvals    Hashes of protected chunks the saver explicitly approved.
		 * @param int      $user_id      Acting user ID.
		 * @return array|WP_Error Decision (changed, content, sequestered, deleted_protected, version) or error.
		 */
		public function evaluate( $post_id, $content, $base_version, $approvals, $user_id ) {
			$post = get_post( $post_id );
			if ( ! $post ) {
				return new WP_Error( 'de_unknown_post', __( 'Unknown post.', 'gutenberg' ), array( 'status' => 404 ) );
			}

			if ( strlen( $content ) > self::MAX_CONTENT_LENGTH ) {
				return new WP_Error( 'de_content_too_large', __( 'Content exceeds the maximum allowed length.', 'gutenberg' ), array( 'status' => 413 ) );
			}

			$current_version = 'v1:' . hash( 'sha256', $post->post_content );
			if ( $base_version !== $current_version ) {
				return new WP_Error(
					'de_stale_base',
					__( 'The post changed since this edit was based. Rebase and try again.', 'gutenberg' ),
					array(
						'status'  => 409,
						'version' => $current_version,
						'content' => $post->post_content,
					)
				);
			}

			if ( $content === $post->post_content ) {
				return array(
					'changed'           => false,
					'version'           => $current_version,
					'content'           => $post->post_content,
					'sequestered'       => array(),
					'deleted_protected' => 0,
				);
			}

			$can_approve = user_can( $user_id, 'unfiltered_html' );
			$approvals   = array_fill_keys( array_map( 'strval', (array) $approvals ), true );

			$base_chunks     = $this->split_top_level_chunks( $post->post_content );
			$incoming_chunks = $this->split_top_level_chunks( $content );
			$matched         = $this->match_common_chunks( $base_chunks, $incoming_chunks );

			$accepted          = array();
			$sequestered       = array();
			$deleted_protected = 0;

			foreach ( $incoming_chunks as $index => $chunk ) {
				if ( isset( $matched['incoming'][ $index ] ) ) {
					// Byte-identical to accepted content: passes through untouched,
					// even when protected. This is what lets unprivileged users edit
					// around protected blocks without destroying them.
					$accepted[] = $chunk;
					continue;
				}

				if ( ! $this->is_protected_chunk( $chunk ) ) {
					$accepted[] = $chunk;
					continue;
				}

				$hash = $this->hash_chunk( $chunk );

				if ( $can_approve && isset( $approvals[ $hash ] ) ) {
					$accepted[] = $chunk;
					continue;
				}

				// Default-deny for every saver: the unapproved protected proposal
				// is sequestered into a pending-review block. The proposed bytes
				// ride in the block attributes as inert data; the kses-filtered
				// placeholder is the block's inner content, so it is what renders
				// anywhere the payload is not explicitly reviewed.
				$id            = wp_generate_uuid4();
				$placeholder   = wp_kses_post( $chunk );
				$accepted[]    = $this->wrap_pending_review( $chunk, $placeholder, $id, $user_id );
				$sequestered[] = array(
					'id'            => $id,
					'proposer'      => (int) $user_id,
					'proposed_hash' => $hash,
				);
			}

			foreach ( $base_chunks as $index => $chunk ) {
				if ( ! isset( $matched['base'][ $index ] ) && $this->is_protected_chunk( $chunk ) ) {
					// Removing protected content carries no injection risk, so pure
					// deletions are accepted without approval (classic kses would
					// have stripped the content silently); the count is reported so
					// clients can surface the removal.
					++$deleted_protected;
				}
			}

			$accepted_content = implode( '', $accepted );

			return array(
				'changed'           => $accepted_content !== $post->post_content,
				'version'           => 'v1:' . hash( 'sha256', $accepted_content ),
				'content'           => $accepted_content,
				'sequestered'       => $sequestered,
				'deleted_protected' => $deleted_protected,
			);
		}

		/**
		 * Applies a distributed-editing save.
		 *
		 * @param int      $post_id      Post ID.
		 * @param string   $content      Proposed full post content.
		 * @param string   $base_version Version token the proposal is based on.
		 * @param string[] $approvals    Hashes of protected chunks the saver explicitly approved.
		 * @param int      $user_id      Acting user ID.
		 * @return array|WP_Error Save result or error.
		 */
		public function save( $post_id, $content, $base_version, $approvals, $user_id ) {
			$result = $this->evaluate( $post_id, $content, $base_version, $approvals, $user_id );
			if ( is_wp_error( $result ) ) {
				return $result;
			}

			if ( $result['changed'] ) {
				$persisted = $this->persist_content( $post_id, $result['content'] );
				if ( is_wp_error( $persisted ) ) {
					return $persisted;
				}
			}

			return array(
				'version'           => $result['version'],
				'content'           => $result['content'],
				'sequestered'       => $result['sequestered'],
				'deleted_protected' => $result['deleted_protected'],
			);
		}

		/**
		 * Wraps an unapproved protected proposal in a pending-review block.
		 *
		 * The proposed bytes are stored in the block attributes, where the
		 * serializer's comment-safe escaping keeps them inert data; the
		 * kses-filtered placeholder is the inner content, so it is what renders
		 * on the front end, in plugin-less contexts, and in editors that never
		 * unwrap the proposal. Only an explicit reviewer action turns the
		 * payload back into active content — and that content then re-enters
		 * evaluate() as an ordinary protected chunk.
		 *
		 * @param string $proposed    Exact proposed bytes.
		 * @param string $placeholder kses-filtered bytes accepted in their place.
		 * @param string $id          Pending review ID.
		 * @param int    $user_id     Proposing user ID.
		 * @return string Serialized pending-review block.
		 */
		public function wrap_pending_review( $proposed, $placeholder, $id, $user_id ) {
			$attributes = array(
				'pendingId'    => $id,
				'proposer'     => (int) $user_id,
				'proposedHash' => $this->hash_chunk( $proposed ),
				'proposed'     => $proposed,
				'placeholder'  => $placeholder,
			);

			// A void block: both the inert proposed payload and the safe
			// placeholder live in the comment-escaped attributes. The whole
			// chunk is therefore a single HTML comment — inherently
			// kses-stable, with no inner content to render as active markup or
			// to fail block validation. The editor renders the placeholder
			// from the attribute; the front end renders it via the block's
			// server render callback.
			return '<!-- wp:de/pending-review ' . serialize_block_attributes( $attributes ) . ' /-->';
		}

		/**
		 * Renders a pending-review block on the front end.
		 *
		 * Outputs only the kses-filtered placeholder; the proposed payload is
		 * never rendered outside an explicit editor review.
		 *
		 * @param array $attributes Block attributes.
		 * @return string Rendered safe placeholder.
		 */
		public static function render_pending_review( $attributes ) {
			$placeholder = isset( $attributes['placeholder'] ) ? $attributes['placeholder'] : '';
			return do_blocks( $placeholder );
		}

		/**
		 * Aligns base and incoming chunks by exact bytes using a longest common
		 * subsequence, so unchanged chunks pass through and only genuine changes
		 * are evaluated.
		 *
		 * @param string[] $base_chunks     Chunks of the accepted content.
		 * @param string[] $incoming_chunks Chunks of the proposed content.
		 * @return array Two maps of matched indices: 'base' and 'incoming'.
		 */
		private function match_common_chunks( $base_chunks, $incoming_chunks ) {
			$n = count( $base_chunks );
			$m = count( $incoming_chunks );

			$lengths = array_fill( 0, $n + 1, array_fill( 0, $m + 1, 0 ) );
			for ( $i = $n - 1; $i >= 0; $i-- ) {
				for ( $j = $m - 1; $j >= 0; $j-- ) {
					if ( $base_chunks[ $i ] === $incoming_chunks[ $j ] ) {
						$lengths[ $i ][ $j ] = $lengths[ $i + 1 ][ $j + 1 ] + 1;
					} else {
						$lengths[ $i ][ $j ] = max( $lengths[ $i + 1 ][ $j ], $lengths[ $i ][ $j + 1 ] );
					}
				}
			}

			$matched = array(
				'base'     => array(),
				'incoming' => array(),
			);

			$i = 0;
			$j = 0;
			while ( $i < $n && $j < $m ) {
				if ( $base_chunks[ $i ] === $incoming_chunks[ $j ] ) {
					$matched['base'][ $i ]     = $j;
					$matched['incoming'][ $j ] = $i;
					++$i;
					++$j;
				} elseif ( $lengths[ $i + 1 ][ $j ] >= $lengths[ $i ][ $j + 1 ] ) {
					++$i;
				} else {
					++$j;
				}
			}

			return $matched;
		}

		/**
		 * Persists accepted content with kses filters suspended.
		 *
		 * The engine performs its own chunk-level enforcement (see the class
		 * security invariant), so the global kses save filters must not run: they
		 * would destroy protected chunks that an unprivileged user legitimately
		 * left untouched.
		 *
		 * @param int    $post_id Post ID.
		 * @param string $content Accepted content.
		 * @return true|WP_Error True on success.
		 */
		private function persist_content( $post_id, $content ) {
			kses_remove_filters();
			$result = wp_update_post(
				array(
					'ID'           => $post_id,
					'post_content' => wp_slash( $content ),
				),
				true
			);
			kses_init();

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			return true;
		}
	}
}
