<?php
/**
 * Tests for the inner blocks bindings of Group and Column blocks in synced
 * patterns.
 *
 * @package gutenberg
 */

class Tests_Block_Bindings_Inner_Blocks extends WP_UnitTestCase {

	/**
	 * Renders a Group block, named `Area`, with the given bindings and the
	 * given pattern overrides as context.
	 *
	 * @param array      $bindings  The bindings of the Group block.
	 * @param array|null $overrides The overrides of the `Area` block, or null for no pattern.
	 * @return string The rendered block.
	 */
	private function render_group( $bindings, $overrides ) {
		$markup  = '<!-- wp:group {"metadata":{"name":"Area","bindings":' . wp_json_encode( $bindings ) . '}} -->';
		$markup .= '<div class="wp-block-group"><!-- wp:paragraph --><p>Default</p><!-- /wp:paragraph --></div>';
		$markup .= '<!-- /wp:group -->';
		$context = null === $overrides ? array() : array( 'pattern/overrides' => array( 'Area' => $overrides ) );
		$block   = new WP_Block( parse_blocks( $markup )[0], $context );
		return $block->render();
	}

	private function inner_blocks_binding() {
		return array( 'innerBlocks' => array( 'source' => 'core/pattern-overrides' ) );
	}

	public function test_override_replaces_inner_blocks() {
		$output = $this->render_group(
			$this->inner_blocks_binding(),
			array( 'innerBlocks' => '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Two</p><!-- /wp:paragraph -->' )
		);
		$this->assertMatchesRegularExpression( '#>One</p><p[^>]*>Two</p></div></div>$#', $output );
		$this->assertStringNotContainsString( 'Default', $output );
	}

	public function test_empty_override_removes_inner_blocks() {
		$output = $this->render_group( $this->inner_blocks_binding(), array( 'innerBlocks' => '' ) );
		$this->assertStringNotContainsString( '<p>', $output );
		$this->assertStringContainsString( 'wp-block-group', $output );
	}

	public function test_without_override_keeps_own_inner_blocks() {
		$this->assertStringContainsString( '>Default</p>', $this->render_group( $this->inner_blocks_binding(), array() ) );
		$this->assertStringContainsString( '>Default</p>', $this->render_group( $this->inner_blocks_binding(), null ) );
	}

	public function test_default_binding_does_not_bind_inner_blocks() {
		$output = $this->render_group(
			array( '__default' => array( 'source' => 'core/pattern-overrides' ) ),
			array( 'innerBlocks' => '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->' )
		);
		$this->assertStringContainsString( '>Default</p>', $output );
	}

	public function test_override_is_sanitized() {
		$output = $this->render_group(
			$this->inner_blocks_binding(),
			array( 'innerBlocks' => '<!-- wp:html --><script>alert(1)</script><p>Safe</p><!-- /wp:html -->' )
		);
		$this->assertStringNotContainsString( '<script>', $output );
		$this->assertStringContainsString( '<p>Safe</p>', $output );
	}

	public function test_area_inside_its_own_override_is_not_expanded() {
		// The override contains the bound Group itself, which would expand forever.
		$nested = '<!-- wp:group {"metadata":{"name":"Area","bindings":{"innerBlocks":{"source":"core/pattern-overrides"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>Nested</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
		$output = $this->render_group( $this->inner_blocks_binding(), array( 'innerBlocks' => $nested ) );
		$this->assertStringContainsString( '>Nested</p>', $output );
		$this->assertSame( 2, substr_count( $output, '<div class="wp-block-group">' ) );
	}

	public function test_any_source_supplies_inner_blocks() {
		register_block_bindings_source(
			'test/inner-blocks',
			array(
				'label'              => 'Test',
				'get_value_callback' => function () {
					// The supplied Group is bound to the same source, which is ignored.
					return '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/inner-blocks"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>Nested own</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
				},
			)
		);
		$block  = new WP_Block(
			parse_blocks( '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/inner-blocks"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>Own</p><!-- /wp:paragraph --></div><!-- /wp:group -->' )[0]
		);
		$output = $block->render();
		unregister_block_bindings_source( 'test/inner-blocks' );

		$this->assertStringContainsString( '>Nested own</p>', $output );
		$this->assertStringNotContainsString( '>Own</p>', $output );
	}

	public function test_plain_text_value_keeps_own_inner_blocks() {
		register_block_bindings_source(
			'test/plain-text',
			array(
				'label'              => 'Test',
				'get_value_callback' => function () {
					return 'Plain text';
				},
			)
		);
		$block  = new WP_Block(
			parse_blocks( '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/plain-text"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>Own</p><!-- /wp:paragraph --></div><!-- /wp:group -->' )[0]
		);
		$output = $block->render();
		unregister_block_bindings_source( 'test/plain-text' );

		$this->assertStringContainsString( '>Own</p>', $output );
		$this->assertStringNotContainsString( 'Plain text', $output );
	}

	public function test_removed_bindings_leave_no_empty_metadata() {
		$blocks = gutenberg_block_bindings_remove_source(
			parse_blocks( '<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"test/source"}}}} --><p>One</p><!-- /wp:paragraph -->' ),
			'test/source'
		);
		$this->assertArrayNotHasKey( 'metadata', $blocks[0]['attrs'] );
	}
}
