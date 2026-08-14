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

	public function test_two_pending_moves_are_both_restored() {
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
			array( 'First', 'Second', 'Third', 'Fourth' ),
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
