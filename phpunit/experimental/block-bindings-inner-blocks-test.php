<?php
/**
 * Tests for the inner blocks bindings of the Group and Column blocks.
 *
 * @package gutenberg
 */

class Tests_Block_Bindings_Inner_Blocks extends WP_UnitTestCase {

	const SOURCE = 'test/inner-blocks';

	/**
	 * The value the test source returns for `innerBlocks`.
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
				'get_value_callback' => function ( $source_args, $block_instance, $attribute_name ) {
					return 'innerBlocks' === $attribute_name ? $this->value : 'Bound text';
				},
			)
		);
	}

	public function tear_down() {
		unregister_block_bindings_source( self::SOURCE );
		parent::tear_down();
	}

	/**
	 * Renders a Group block with the given bindings and, by default, a
	 * `Default` paragraph as its own inner blocks.
	 *
	 * @param array|null $bindings   The bindings of the Group block.
	 * @param string     $inner_html The markup inside the Group's wrapper.
	 * @return string The rendered block.
	 */
	private function render_group( $bindings = null, $inner_html = '<!-- wp:paragraph --><p>Default</p><!-- /wp:paragraph -->' ) {
		$bindings = $bindings ?? array( 'innerBlocks' => array( 'source' => self::SOURCE ) );
		$markup   = '<!-- wp:group {"metadata":{"bindings":' . wp_json_encode( $bindings ) . '}} -->';
		$markup  .= '<div class="wp-block-group">' . $inner_html . '</div>';
		$markup  .= '<!-- /wp:group -->';
		$block    = new WP_Block( parse_blocks( $markup )[0] );
		return $block->render();
	}

	/**
	 * Returns the attributes the supplied blocks render with.
	 *
	 * @return array[] The attributes of each rendered block, in render order.
	 */
	private function render_group_and_get_supplied_attributes() {
		$attributes = array();
		$capture    = static function ( $parsed_block, $source_block, $parent_block ) use ( &$attributes ) {
			if ( $parent_block ) {
				$attributes[] = $parsed_block['attrs'];
			}
			return $parsed_block;
		};
		add_filter( 'render_block_data', $capture, 10, 3 );
		$this->render_group();
		remove_filter( 'render_block_data', $capture );
		return $attributes;
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
		$this->assertStringNotContainsString( '<p', $output );
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

	public function test_value_does_not_become_an_attribute() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$block       = new WP_Block( parse_blocks( '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/inner-blocks"}}}} --><div class="wp-block-group"></div><!-- /wp:group -->' )[0] );
		$block->render();
		$this->assertArrayNotHasKey( 'innerBlocks', $block->attributes );
	}

	public function test_default_pattern_overrides_binding_does_not_bind_inner_blocks() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$output      = $this->render_group( array( '__default' => array( 'source' => 'core/pattern-overrides' ) ) );
		$this->assertStringContainsString( '>Default</p>', $output );
	}

	public function test_value_is_sanitized() {
		$this->value = '<!-- wp:html --><script>alert(1)</script><p>Safe</p><!-- /wp:html -->';
		$output      = $this->render_group();
		$this->assertStringNotContainsString( '<script>', $output );
		$this->assertStringContainsString( '<p>Safe</p>', $output );
	}

	public function test_block_attributes_in_the_value_are_sanitized() {
		$this->value = '<!-- wp:paragraph {"className":"\u003cimg src=x onerror=alert(1)\u003e"} --><p>Safe</p><!-- /wp:paragraph -->';
		$output      = $this->render_group();
		$this->assertStringNotContainsString( 'onerror', $output );
		$this->assertStringContainsString( '>Safe</p>', $output );
	}

	public function test_bindings_to_the_same_source_inside_the_value_are_ignored() {
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
				'get_value_callback' => static function () {
					return '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/inner-blocks"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>From other</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
				},
			)
		);
		$this->value = '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/other-inner-blocks"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>From test</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
		$output      = $this->render_group();
		unregister_block_bindings_source( 'test/other-inner-blocks' );
		$this->assertStringContainsString( '>From test</p>', $output );
		$this->assertStringNotContainsString( 'From other', $output );
	}

	public function test_attribute_bindings_inside_the_value_are_kept() {
		$this->value = '<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"test/inner-blocks"}}}} --><p>One</p><!-- /wp:paragraph -->';
		$this->assertStringContainsString( '>Bound text</p>', $this->render_group() );
	}

	public function test_removed_bindings_leave_no_empty_metadata() {
		$this->value = '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/inner-blocks"}}}} --><div class="wp-block-group"></div><!-- /wp:group -->';
		$attributes  = $this->render_group_and_get_supplied_attributes();
		$this->assertArrayNotHasKey( 'metadata', $attributes[0] );
	}

	public function test_custom_css_in_the_value_is_removed() {
		$this->value = '<!-- wp:paragraph {"style":{"css":"color:red","color":{"text":"#00f"},":hover":{"css":"color:green"}}} --><p>Styled</p><!-- /wp:paragraph -->';
		$attributes  = $this->render_group_and_get_supplied_attributes();
		$this->assertSame( array( 'color' => array( 'text' => '#00f' ) ), $attributes[0]['style'] );
		$this->assertStringNotContainsString( 'wp-custom-css-', $this->render_group() );
	}

	public function test_nested_custom_css_in_the_value_is_removed() {
		$this->value = '<!-- wp:group --><div class="wp-block-group"><!-- wp:paragraph {"style":{"@mobile":{":hover":{"css":"color:red"}}}} --><p>Styled</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
		$output      = $this->render_group();
		$this->assertStringNotContainsString( 'wp-custom-css-', $output );
		$this->assertStringContainsString( '>Styled</p>', $output );
	}

	public function test_value_goes_where_the_own_inner_blocks_were() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$output      = $this->render_group( null, '<!-- wp:paragraph --><p>Default</p><!-- /wp:paragraph --><span>Tail</span>' );
		$this->assertMatchesRegularExpression( '#>One</p><span>Tail</span>#', $output );
	}

	public function test_value_goes_inside_the_inner_container_of_a_legacy_group() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$output      = $this->render_group( null, '<div class="wp-block-group__inner-container"><!-- wp:paragraph --><p>Default</p><!-- /wp:paragraph --></div>' );
		$this->assertMatchesRegularExpression( '#<div class="wp-block-group__inner-container[^"]*">\s*<p[^>]*>One</p>\s*</div></div>$#', $output );
	}

	public function test_value_goes_inside_an_empty_group() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$this->assertMatchesRegularExpression( '#^<div class="wp-block-group[^"]*">(<div class="wp-block-group__inner-container[^"]*">)?\s*<p[^>]*>One</p>\s*(</div>)?</div>$#', $this->render_group( null, '' ) );
	}

	public function test_value_goes_before_the_closer_of_a_wrapper_with_unclosed_elements() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$this->assertMatchesRegularExpression( '#<p>Tail</p><p[^>]*>One</p>\s*</div>#', $this->render_group( null, '<p>Tail' ) );
	}

	public function test_value_is_skipped_without_markup_to_place_it_in() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$output      = render_block(
			array(
				'blockName'   => 'core/group',
				'attrs'       => array( 'metadata' => array( 'bindings' => array( 'innerBlocks' => array( 'source' => self::SOURCE ) ) ) ),
				'innerBlocks' => array(),
			)
		);
		$this->assertSame( '', $output );
	}

	public function test_column_supports_inner_blocks_bindings() {
		$this->assertContains( 'innerBlocks', get_block_bindings_supported_attributes( 'core/column' ) );
		$this->assertContains( 'innerBlocks', get_block_bindings_supported_attributes( 'core/group' ) );
	}

	public function test_editor_does_not_offer_inner_blocks_bindings() {
		$settings = get_block_editor_settings( array(), new WP_Block_Editor_Context() );
		$this->assertArrayNotHasKey( 'core/group', $settings['__experimentalBlockBindingsSupportedAttributes'] );
		$this->assertArrayNotHasKey( 'core/column', $settings['__experimentalBlockBindingsSupportedAttributes'] );
		$this->assertSame( array( 'content' ), $settings['__experimentalBlockBindingsSupportedAttributes']['core/paragraph'] );
	}

	public function test_embeds_in_the_value_are_rendered() {
		wp_embed_register_handler(
			'test-inner-blocks',
			'#https://example\.org/video/(\w+)#',
			static function ( $matches ) {
				return '<iframe class="test-embed" src="https://example.org/embed/' . $matches[1] . '"></iframe>';
			}
		);
		$this->value = '<!-- wp:paragraph --><p>[embed]https://example.org/video/one[/embed]</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>https://example.org/video/two</p><!-- /wp:paragraph -->';
		$output      = $this->render_group();
		wp_embed_unregister_handler( 'test-inner-blocks' );

		$this->assertStringContainsString( '<iframe class="test-embed" src="https://example.org/embed/one"></iframe>', $output );
		$this->assertStringContainsString( '<iframe class="test-embed" src="https://example.org/embed/two"></iframe>', $output );
	}
}
