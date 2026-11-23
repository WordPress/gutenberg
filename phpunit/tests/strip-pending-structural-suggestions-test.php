<?php
/**
 * Tests that pending structural suggestion state is hidden from rendered
 * output via the render_block filter, type-aware, while raw post content is
 * untouched.
 *
 * A block tagged `metadata.suggestion.type = pending-insert` is proposed new
 * content and must not render until the suggestion is accepted. Blocks tagged
 * `pending-remove` or `pending-move` are real content and render unchanged
 * (removal only happens when accepted; a pending move renders at its proposed
 * position — a documented limitation).
 *
 * @group suggestions
 */
class Tests_Strip_Pending_Structural_Suggestions extends WP_UnitTestCase {

	private function render( $content ) {
		return do_blocks( $content );
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

	public function test_pending_insert_block_and_its_subtree_are_never_rendered(): void {
		$calls = 0;
		register_block_type(
			'tests/suggestion-render-probe',
			array(
				'render_callback' => static function () use ( &$calls ): string {
					++$calls;
					return '<p>Probe</p>';
				},
			)
		);
		$insert = '{"metadata":{"suggestion":{"type":"pending-insert","authorId":2}}}';
		// A pending insertion at the top level, one nested in a block that
		// renders, and a plain block nested in a pending insertion.
		$content = '<!-- wp:tests/suggestion-render-probe ' . $insert . ' /-->'
			. '<!-- wp:group --><div class="wp-block-group"><!-- wp:tests/suggestion-render-probe ' . $insert . ' /--></div><!-- /wp:group -->'
			. '<!-- wp:group ' . $insert . ' --><div class="wp-block-group"><!-- wp:tests/suggestion-render-probe /--></div><!-- /wp:group -->';

		$rendered = do_blocks( $content );
		unregister_block_type( 'tests/suggestion-render-probe' );

		$this->assertSame( 0, $calls, 'A pending insertion runs no render callback.' );
		$this->assertStringNotContainsString( 'Probe', $rendered );
		$this->assertStringContainsString( 'wp-block-group', $rendered, 'The block around a pending insertion still renders.' );
	}

	public function test_pending_insert_block_rendered_directly_is_dropped(): void {
		// A block rendered without `render_block()` skips `pre_render_block`.
		$blocks = parse_blocks( '<!-- wp:paragraph {"metadata":{"suggestion":{"type":"pending-insert"}}} --><p>Proposed</p><!-- /wp:paragraph -->' );

		$this->assertSame( '', ( new WP_Block( $blocks[0] ) )->render() );
	}

	public function test_pending_remove_block_still_renders() {
		$content  = '<!-- wp:paragraph {"metadata":{"suggestion":{"type":"pending-remove","authorId":2},"noteId":[7]}} --><p>Still real content</p><!-- /wp:paragraph -->';
		$rendered = $this->render( $content );

		$this->assertStringContainsString( 'Still real content', $rendered );
		// The marker metadata itself never reaches front-end markup.
		$this->assertStringNotContainsString( 'pending-remove', $rendered );
	}

	public function test_pending_attributes_block_renders_its_live_attributes() {
		$content  = '<!-- wp:heading {"level":2,"metadata":{"suggestion":{"type":"pending-attributes","authorId":2,"after":{"level":3}},"noteId":[7]}} --><h2 class="wp-block-heading">Proposed level change</h2><!-- /wp:heading -->';
		$rendered = $this->render( $content );

		// The proposal never reaches the front end: readers see the baseline.
		$this->assertStringContainsString( '<h2', $rendered );
		$this->assertStringNotContainsString( '<h3', $rendered );
		$this->assertStringNotContainsString( 'pending-attributes', $rendered );
	}

	public function test_pending_move_block_still_renders() {
		$content  = '<!-- wp:paragraph {"metadata":{"suggestion":{"type":"pending-move","authorId":2,"fromIndex":0}}} --><p>Moved content</p><!-- /wp:paragraph -->';
		$rendered = $this->render( $content );

		$this->assertStringContainsString( 'Moved content', $rendered );
		$this->assertStringNotContainsString( 'pending-move', $rendered );
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
