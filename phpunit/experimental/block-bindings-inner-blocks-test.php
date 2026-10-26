<?php
/**
 * Tests for the inner blocks bindings of Group and Column blocks.
 *
 * @package gutenberg
 */

class Tests_Block_Bindings_Inner_Blocks extends WP_UnitTestCase {

	const SOURCE = 'test/inner-blocks';

	/**
	 * The value the test source returns.
	 *
	 * @var mixed
	 */
	private $value;

	public function set_up() {
		parent::set_up();
		$this->value = null;
		register_block_bindings_source(
			self::SOURCE,
			array(
				'label'              => 'Test',
				'get_value_callback' => function () {
					return $this->value;
				},
			)
		);
	}

	public function tear_down() {
		unregister_block_bindings_source( self::SOURCE );
		parent::tear_down();
	}

	/**
	 * Renders a Group block with the given bindings and a `Default` paragraph
	 * as its own inner blocks.
	 *
	 * @param array $bindings The bindings of the Group block.
	 * @return string The rendered block.
	 */
	private function render_group( $bindings = null ) {
		$bindings = $bindings ?? array( 'innerBlocks' => array( 'source' => self::SOURCE ) );
		$markup   = '<!-- wp:group {"metadata":{"bindings":' . wp_json_encode( $bindings ) . '}} -->';
		$markup  .= '<div class="wp-block-group"><!-- wp:paragraph --><p>Default</p><!-- /wp:paragraph --></div>';
		$markup  .= '<!-- /wp:group -->';
		$block    = new WP_Block( parse_blocks( $markup )[0] );
		return $block->render();
	}

	public function test_value_replaces_inner_blocks() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Two</p><!-- /wp:paragraph -->';
		$output      = $this->render_group();
		$this->assertMatchesRegularExpression( '#>One</p><p[^>]*>Two</p></div></div>$#', $output );
		$this->assertStringNotContainsString( 'Default', $output );
	}

	public function test_value_may_start_with_whitespace() {
		$this->value = "\n\t<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->";
		$this->assertStringContainsString( '>One</p>', $this->render_group() );
	}

	public function test_empty_value_removes_inner_blocks() {
		$this->value = '';
		$output      = $this->render_group();
		$this->assertStringNotContainsString( '<p>', $output );
		$this->assertStringContainsString( 'wp-block-group', $output );
	}

	public function test_without_value_keeps_own_inner_blocks() {
		$this->assertStringContainsString( '>Default</p>', $this->render_group() );
	}

	public function test_plain_text_value_keeps_own_inner_blocks() {
		$this->value = 'Plain text';
		$output      = $this->render_group();
		$this->assertStringContainsString( '>Default</p>', $output );
		$this->assertStringNotContainsString( 'Plain text', $output );
	}

	public function test_default_binding_does_not_bind_inner_blocks() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$output      = $this->render_group( array( '__default' => array( 'source' => self::SOURCE ) ) );
		$this->assertStringContainsString( '>Default</p>', $output );
	}

	public function test_value_is_sanitized() {
		$this->value = '<!-- wp:html --><script>alert(1)</script><p>Safe</p><!-- /wp:html -->';
		$output      = $this->render_group();
		$this->assertStringNotContainsString( '<script>', $output );
		$this->assertStringContainsString( '<p>Safe</p>', $output );
	}

	public function test_bindings_to_the_same_source_inside_the_value_are_ignored() {
		// The supplied Group is bound to the same source, which would expand forever.
		$this->value = '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/inner-blocks"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>Nested own</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
		$output      = $this->render_group();
		$this->assertStringContainsString( '>Nested own</p>', $output );
		$this->assertSame( 2, substr_count( $output, '<div class="wp-block-group">' ) );
	}

	public function test_sources_binding_each_other_render_once() {
		register_block_bindings_source(
			'test/other-inner-blocks',
			array(
				'label'              => 'Test',
				'get_value_callback' => function () {
					return '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/inner-blocks"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>From other</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
				},
			)
		);
		$this->value = '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/other-inner-blocks"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>From test</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
		$output      = $this->render_group();
		unregister_block_bindings_source( 'test/other-inner-blocks' );

		// The supplied Group keeps its own inner blocks instead of asking the other source.
		$this->assertStringContainsString( '>From test</p>', $output );
		$this->assertStringNotContainsString( 'From other', $output );
	}

	public function test_attribute_bindings_inside_the_value_to_other_sources_are_kept() {
		$blocks = gutenberg_block_bindings_remove_source(
			parse_blocks( '<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"test/other"}}}} --><p>One</p><!-- /wp:paragraph -->' ),
			'test/source'
		);
		$this->assertSame( 'test/other', $blocks[0]['attrs']['metadata']['bindings']['content']['source'] );
	}

	public function test_block_attributes_in_the_value_are_sanitized() {
		$this->value = '<!-- wp:paragraph {"className":"\u003cimg src=x onerror=alert(1)\u003e"} --><p>Safe</p><!-- /wp:paragraph -->';
		$output      = $this->render_group();
		$this->assertStringNotContainsString( 'onerror', $output );
		$this->assertStringContainsString( '>Safe</p>', $output );
	}

	public function test_removed_bindings_leave_no_empty_metadata() {
		$blocks = gutenberg_block_bindings_remove_source(
			parse_blocks( '<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"test/source"}}}} --><p>One</p><!-- /wp:paragraph -->' ),
			'test/source'
		);
		$this->assertArrayNotHasKey( 'metadata', $blocks[0]['attrs'] );
	}
}
