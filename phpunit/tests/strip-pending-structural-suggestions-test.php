<?php
/**
 * Tests that pending structural suggestion state is hidden from rendered
 * output via the render_block filter, type-aware, while raw post content is
 * untouched.
 *
 * A block tagged `metadata.suggestion.type = pending-insert` is proposed new
 * content and must not render until the suggestion is accepted. Blocks tagged
 * `pending-remove` or `pending-move` are real content and render unchanged
 * (removal only happens when accepted). A pending move additionally renders at
 * its ORIGINAL position: the block sits at its proposed position in
 * `post_content`, and the `the_content` pass restores the pre-move sibling
 * order so an un-accepted move never changes what readers see.
 *
 * @group suggestions
 */
class Tests_Strip_Pending_Structural_Suggestions extends WP_UnitTestCase {

	private function render( $content ) {
		return do_blocks( $content );
	}

	/**
	 * Renders through the full `the_content` chain, which is where the
	 * pending-move reorder runs (ahead of `do_blocks()`).
	 *
	 * @param string $content Post content.
	 * @return string Rendered content.
	 */
	private function render_the_content( $content ) {
		return apply_filters( 'the_content', $content );
	}

	/**
	 * Builds a paragraph block, optionally carrying a suggestion marker.
	 *
	 * @param string     $text       Paragraph text.
	 * @param array|null $suggestion Suggestion marker, or null for a plain block.
	 * @return string Serialized block.
	 */
	private function paragraph( $text, $suggestion = null ) {
		$attrs = null === $suggestion
			? ''
			: ' ' . wp_json_encode( array( 'metadata' => array( 'suggestion' => $suggestion ) ) );
		return '<!-- wp:paragraph' . $attrs . ' --><p>' . $text . '</p><!-- /wp:paragraph -->';
	}

	/**
	 * Returns the rendered paragraph texts in document order.
	 *
	 * @param string $rendered Rendered content.
	 * @return string[] Paragraph texts.
	 */
	private function rendered_order( $rendered ) {
		preg_match_all( '~<p[^>]*>(.*?)</p>~s', $rendered, $matches );
		return array_map( 'trim', $matches[1] );
	}

	public function test_pending_insert_block_is_dropped() {
		$content  = '<!-- wp:paragraph {"metadata":{"suggestion":{"type":"pending-insert","authorId":2},"noteId":[7]}} --><p>Proposed new paragraph</p><!-- /wp:paragraph -->';
		$rendered = $this->render( $content );

		$this->assertStringNotContainsString( 'Proposed new paragraph', $rendered );
	}

	public function test_pending_insert_drops_the_whole_subtree() {
		$content  = '<!-- wp:group {"metadata":{"suggestion":{"type":"pending-insert","authorId":2}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>Nested content</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
		$rendered = $this->render( $content );

		$this->assertStringNotContainsString( 'Nested content', $rendered );
	}

	public function test_pending_remove_block_still_renders() {
		$content  = '<!-- wp:paragraph {"metadata":{"suggestion":{"type":"pending-remove","authorId":2},"noteId":[7]}} --><p>Still real content</p><!-- /wp:paragraph -->';
		$rendered = $this->render( $content );

		$this->assertStringContainsString( 'Still real content', $rendered );
		// The marker metadata itself never reaches front-end markup.
		$this->assertStringNotContainsString( 'pending-remove', $rendered );
	}

	public function test_pending_move_block_still_renders() {
		$content  = '<!-- wp:paragraph {"metadata":{"suggestion":{"type":"pending-move","authorId":2,"fromIndex":0}}} --><p>Moved content</p><!-- /wp:paragraph -->';
		$rendered = $this->render( $content );

		$this->assertStringContainsString( 'Moved content', $rendered );
		$this->assertStringNotContainsString( 'pending-move', $rendered );
	}

	public function test_pending_move_renders_in_its_original_position() {
		// "Third" was moved to the front; readers must still see it third.
		$content = $this->paragraph(
			'Third',
			array(
				'type'               => 'pending-move',
				'authorId'           => 2,
				'fromIndex'          => 2,
				'fromParentClientId' => null,
			)
		) . "\n\n" . $this->paragraph( 'First' ) . "\n\n" . $this->paragraph( 'Second' );

		$this->assertSame(
			array( 'First', 'Second', 'Third' ),
			$this->rendered_order( $this->render_the_content( $content ) )
		);
	}

	public function test_pending_move_backwards_renders_in_its_original_position() {
		// "First" was moved to the end.
		$content = $this->paragraph( 'Second' ) . "\n\n" . $this->paragraph( 'Third' ) . "\n\n" . $this->paragraph(
			'First',
			array(
				'type'               => 'pending-move',
				'authorId'           => 2,
				'fromIndex'          => 0,
				'fromParentClientId' => null,
			)
		);

		$this->assertSame(
			array( 'First', 'Second', 'Third' ),
			$this->rendered_order( $this->render_the_content( $content ) )
		);
	}

	public function test_two_pending_moves_in_one_list_are_left_in_the_proposed_order() {
		/*
		 * `fromIndex` is measured against the order the list was in when the
		 * move was made, so a second move in the same list carries an index
		 * an earlier pending move already shifted. Replaying both would
		 * invent a third order. The level is left alone instead.
		 */
		$content = $this->paragraph(
			'Fourth',
			array(
				'type'               => 'pending-move',
				'authorId'           => 2,
				'fromIndex'          => 3,
				'fromParentClientId' => null,
			)
		) . "\n\n" . $this->paragraph( 'Second' ) . "\n\n" . $this->paragraph(
			'First',
			array(
				'type'               => 'pending-move',
				'authorId'           => 2,
				'fromIndex'          => 0,
				'fromParentClientId' => null,
			)
		) . "\n\n" . $this->paragraph( 'Third' );

		$this->assertSame(
			array( 'Fourth', 'Second', 'First', 'Third' ),
			$this->rendered_order( $this->render_the_content( $content ) )
		);
	}

	public function test_a_second_move_never_renders_an_order_nobody_authored() {
		/*
		 * The skew this gate exists for. Baseline [A, B, C]:
		 *   1. Suggest moving C to the top -> editor shows [C, A, B] and C's
		 *      marker records fromIndex 2.
		 *   2. Suggest moving A to the end -> editor shows [C, B, A]. The
		 *      marker writer diffs against the PREVIOUS tick, where A sat at
		 *      index 1 of [C, A, B], so A's marker records fromIndex 1 - not
		 *      the 0 it held in the baseline.
		 *
		 * Replaying both indices places A at 1 and C at 2 and lets B fall
		 * into slot 0, rendering [B, A, C]: not the baseline, not the
		 * proposal, an order that existed in no version of the document.
		 * Readers get the proposed order until the marker writer records a
		 * baseline-relative index.
		 */
		$content = $this->paragraph(
			'C',
			array(
				'type'               => 'pending-move',
				'authorId'           => 2,
				'fromIndex'          => 2,
				'fromParentClientId' => null,
			)
		) . "\n\n" . $this->paragraph( 'B' ) . "\n\n" . $this->paragraph(
			'A',
			array(
				'type'               => 'pending-move',
				'authorId'           => 2,
				'fromIndex'          => 1,
				'fromParentClientId' => null,
			)
		);

		$rendered = $this->rendered_order( $this->render_the_content( $content ) );

		$this->assertNotSame( array( 'B', 'A', 'C' ), $rendered, 'Rendered a sibling order that never existed.' );
		$this->assertSame( array( 'C', 'B', 'A' ), $rendered );
	}

	public function test_a_second_move_in_a_different_parent_still_restores() {
		/*
		 * The gate is per sibling list: a pending move inside a Group cannot
		 * shift the indices of the root list, so one move at each level is
		 * still restored.
		 */
		$content = $this->paragraph(
			'Root second',
			array(
				'type'               => 'pending-move',
				'authorId'           => 2,
				'fromIndex'          => 1,
				'fromParentClientId' => null,
			)
		) . "\n\n" . $this->paragraph( 'Root first' ) . "\n\n"
			. '<!-- wp:group --><div class="wp-block-group">'
			. $this->paragraph(
				'Inner second',
				array(
					'type'               => 'pending-move',
					'authorId'           => 2,
					'fromIndex'          => 1,
					'fromParentClientId' => 'abc-123',
				)
			)
			. $this->paragraph( 'Inner first' )
			. '</div><!-- /wp:group -->';

		$this->assertSame(
			array( 'Root first', 'Root second', 'Inner first', 'Inner second' ),
			$this->rendered_order( $this->render_the_content( $content ) )
		);
	}

	public function test_an_unrestorable_marker_still_blocks_a_second_move_in_the_list() {
		/*
		 * A marker the restore declines to act on - here one that crossed the
		 * root boundary - still occupies a slot, so it still shifts the
		 * indices the other marker was measured against. It counts toward the
		 * gate.
		 */
		$content = '<!-- wp:group --><div class="wp-block-group">'
			. $this->paragraph( 'Inner first' )
			. $this->paragraph(
				'Arrived from the root',
				array(
					'type'               => 'pending-move',
					'authorId'           => 2,
					'fromIndex'          => 0,
					'fromParentClientId' => null,
				)
			)
			. $this->paragraph(
				'Inner third',
				array(
					'type'               => 'pending-move',
					'authorId'           => 2,
					'fromIndex'          => 0,
					'fromParentClientId' => 'abc-123',
				)
			)
			. '</div><!-- /wp:group -->';

		$this->assertSame(
			array( 'Inner first', 'Arrived from the root', 'Inner third' ),
			$this->rendered_order( $this->render_the_content( $content ) )
		);
	}

	public function test_pending_move_inside_a_group_is_restored() {
		$content = '<!-- wp:group --><div class="wp-block-group">'
			. $this->paragraph(
				'Inner second',
				array(
					'type'               => 'pending-move',
					'authorId'           => 2,
					'fromIndex'          => 1,
					'fromParentClientId' => 'abc-123',
				)
			)
			. $this->paragraph( 'Inner first' )
			. '</div><!-- /wp:group -->';

		$this->assertSame(
			array( 'Inner first', 'Inner second' ),
			$this->rendered_order( $this->render_the_content( $content ) )
		);
	}

	public function test_pending_move_that_left_the_root_is_not_restored_inside_its_new_parent() {
		/*
		 * Client IDs do not survive to the server, so a block that moved from
		 * the root into a Group cannot be put back. Applying its root
		 * `fromIndex` inside the Group would misplace it, so the marker is
		 * ignored and the block renders where it sits.
		 */
		$content = '<!-- wp:group --><div class="wp-block-group">'
			. $this->paragraph( 'Inner first' )
			. $this->paragraph(
				'Arrived from the root',
				array(
					'type'               => 'pending-move',
					'authorId'           => 2,
					'fromIndex'          => 0,
					'fromParentClientId' => null,
				)
			)
			. '</div><!-- /wp:group -->';

		$this->assertSame(
			array( 'Inner first', 'Arrived from the root' ),
			$this->rendered_order( $this->render_the_content( $content ) )
		);
	}

	public function test_pending_move_with_an_out_of_range_from_index_is_ignored() {
		$content = $this->paragraph(
			'Moved',
			array(
				'type'               => 'pending-move',
				'authorId'           => 2,
				'fromIndex'          => 42,
				'fromParentClientId' => null,
			)
		) . "\n\n" . $this->paragraph( 'Other' );

		$this->assertSame(
			array( 'Moved', 'Other' ),
			$this->rendered_order( $this->render_the_content( $content ) )
		);
	}

	public function test_pending_move_restore_keeps_the_marker_out_of_rendered_markup() {
		$content = $this->paragraph(
			'Second',
			array(
				'type'               => 'pending-move',
				'authorId'           => 2,
				'fromIndex'          => 1,
				'fromParentClientId' => null,
			)
		) . "\n\n" . $this->paragraph( 'First' );

		$rendered = $this->render_the_content( $content );

		$this->assertStringNotContainsString( 'pending-move', $rendered );
		$this->assertStringNotContainsString( 'fromIndex', $rendered );
	}

	public function test_a_move_that_crossed_parents_is_left_where_it_sits() {
		/*
		 * Nested-to-nested. `fromParentClientId` is a non-empty client ID and
		 * the block now sits nested, so the root-boundary fallback sees
		 * nothing wrong; only the writer's `crossedParents` flag reveals that
		 * index 0 counts positions in a list this block has left. Without it
		 * the block would be dropped at the front of a Group it never
		 * belonged to.
		 */
		$content = '<!-- wp:group --><div class="wp-block-group">'
			. $this->paragraph( 'Inner first' )
			. $this->paragraph( 'Inner second' )
			. $this->paragraph(
				'Arrived from another group',
				array(
					'type'               => 'pending-move',
					'authorId'           => 2,
					'fromIndex'          => 0,
					'fromParentClientId' => 'group-a-client-id',
					'crossedParents'     => true,
				)
			)
			. '</div><!-- /wp:group -->';

		$this->assertSame(
			array( 'Inner first', 'Inner second', 'Arrived from another group' ),
			$this->rendered_order( $this->render_the_content( $content ) )
		);
	}

	public function test_a_same_parent_move_is_still_restored_when_the_writer_says_it_did_not_cross() {
		// The flag is only a veto: `crossedParents => false` must not block a
		// perfectly ordinary reorder inside one Group.
		$content = '<!-- wp:group --><div class="wp-block-group">'
			. $this->paragraph(
				'Inner second',
				array(
					'type'               => 'pending-move',
					'authorId'           => 2,
					'fromIndex'          => 1,
					'fromParentClientId' => 'abc-123',
					'crossedParents'     => false,
				)
			)
			. $this->paragraph( 'Inner first' )
			. '</div><!-- /wp:group -->';

		$this->assertSame(
			array( 'Inner first', 'Inner second' ),
			$this->rendered_order( $this->render_the_content( $content ) )
		);
	}

	/**
	 * The placement helper is exercised directly: the caller declines any list
	 * holding more than one pending move, so multi-move placement cannot be
	 * reached through `the_content`. These pin the rules the helper will be
	 * held to when that gate is lifted.
	 */
	public function test_reorder_helper_puts_a_moved_block_back_and_closes_the_gap() {
		$siblings = array( 'C', 'A', 'B' );
		// C is at offset 0 and came from index 2.
		$this->assertSame(
			array( 'A', 'B', 'C' ),
			gutenberg_reorder_pending_move_siblings( $siblings, array( 0 => 2 ) )
		);
	}

	public function test_reorder_helper_resolves_two_moves_lowest_from_index_first() {
		$siblings = array( 'D', 'B', 'A', 'C' );
		// D came from index 3, A came from index 0.
		$this->assertSame(
			array( 'A', 'B', 'C', 'D' ),
			gutenberg_reorder_pending_move_siblings(
				$siblings,
				array(
					0 => 3,
					2 => 0,
				)
			)
		);
	}

	public function test_reorder_helper_leaves_a_duplicate_claim_in_place_rather_than_at_the_end() {
		/*
		 * Two moves claiming index 2: the first wins the slot and the second
		 * is unrestorable. An unrestorable block must keep its position among
		 * the un-moved blocks - appending it would relocate a block the
		 * function just decided it could not place.
		 */
		$siblings  = array( 'A', 'M1', 'M2', 'B' );
		$reordered = gutenberg_reorder_pending_move_siblings(
			$siblings,
			array(
				1 => 2,
				2 => 2,
			)
		);

		$this->assertSame( array( 'A', 'M2', 'M1', 'B' ), $reordered );
		// M2 keeps its offset relative to the blocks that did not move.
		$this->assertLessThan(
			array_search( 'B', $reordered, true ),
			array_search( 'M2', $reordered, true )
		);
	}

	public function test_only_post_types_that_render_through_the_content_can_author_a_move() {
		/*
		 * The restore hooks `the_content`. Render paths that parse post
		 * content themselves never apply it - `render_block_core_block()`
		 * calls `parse_blocks()` on a synced pattern's `post_content`
		 * directly - so a pending move stored in one of those would publish
		 * in its proposed order.
		 *
		 * That is currently unreachable: Suggest mode is gated on the
		 * `editor.notes` post-type support, which only `post` and `page`
		 * declare, and both render through `the_content`. This is the canary
		 * for that assumption. If it fails because a new post type gained
		 * `editor.notes`, check how that type renders before deleting it.
		 */
		foreach ( array( 'post', 'page' ) as $post_type ) {
			$this->assertTrue(
				post_type_supports( $post_type, 'editor' ),
				"{$post_type} should support the editor."
			);
		}

		foreach ( array( 'wp_block', 'wp_template', 'wp_template_part' ) as $post_type ) {
			$supports = get_all_post_type_supports( $post_type );
			$editor   = isset( $supports['editor'] ) ? $supports['editor'] : null;
			$notes    = is_array( $editor ) && isset( $editor[0]['notes'] )
				? $editor[0]['notes']
				: false;
			$this->assertFalse(
				(bool) $notes,
				"{$post_type} gained editor.notes support, so Suggest mode can now author a pending move in content that never runs through `the_content`. gutenberg_restore_pending_move_order() needs to cover that render path."
			);
		}
	}

	public function test_content_without_a_pending_move_is_returned_unchanged() {
		$content  = $this->paragraph( 'First' ) . "\n\n" . $this->paragraph( 'Second' );
		$filtered = gutenberg_restore_pending_move_order( $content );

		$this->assertSame( $content, $filtered );
	}

	public function test_block_without_suggestion_marker_is_untouched() {
		$content  = '<!-- wp:paragraph {"metadata":{"noteId":[7]}} --><p>Plain paragraph</p><!-- /wp:paragraph -->';
		$rendered = $this->render( $content );

		$this->assertStringContainsString( 'Plain paragraph', $rendered );
	}

	public function test_malformed_suggestion_marker_is_ignored() {
		// A scalar `suggestion` value (not an object with a type) must not
		// fatal or hide content.
		$content  = '<!-- wp:paragraph {"metadata":{"suggestion":"bogus"}} --><p>Kept</p><!-- /wp:paragraph -->';
		$rendered = $this->render( $content );

		$this->assertStringContainsString( 'Kept', $rendered );
	}
}
