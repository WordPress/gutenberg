<?php
/**
 * Tests for the inner blocks bindings of the Group and Column blocks.
 *
 * @package gutenberg
 */

class Tests_Block_Bindings_Inner_Blocks extends WP_UnitTestCase {

	const SOURCE = 'test/inner-blocks';

	private $value;

	private $value_callback;

	private $inner_blocks_calls;

	public function set_up() {
		parent::set_up();
		$this->value              = null;
		$this->value_callback     = null;
		$this->inner_blocks_calls = 0;
		register_block_bindings_source(
			self::SOURCE,
			array(
				'label'              => 'Test',
				'get_value_callback' => function ( $source_args, $block_instance, $attribute_name ) {
					if ( 'innerBlocks' !== $attribute_name ) {
						return 'Bound text';
					}
					++$this->inner_blocks_calls;
					if ( $this->value_callback ) {
						return call_user_func( $this->value_callback, $source_args, $block_instance );
					}
					return $this->value;
				},
			)
		);
	}

	public function tear_down() {
		unregister_block_bindings_source( self::SOURCE );
		parent::tear_down();
	}

	private function render_group( $bindings = null, $inner_html = '<!-- wp:paragraph --><p>Default</p><!-- /wp:paragraph -->' ) {
		$bindings = $bindings ?? array( 'innerBlocks' => array( 'source' => self::SOURCE ) );
		$markup   = '<!-- wp:group {"metadata":{"bindings":' . wp_json_encode( $bindings ) . '}} -->';
		$markup  .= '<div class="wp-block-group">' . $inner_html . '</div>';
		$markup  .= '<!-- /wp:group -->';
		$block    = new WP_Block( parse_blocks( $markup )[0] );
		return $block->render();
	}

	private function bound_group_markup( $args = array(), $own_paragraph = 'Nested own' ) {
		$binding = array( 'source' => self::SOURCE );
		if ( $args ) {
			$binding['args'] = $args;
		}
		return '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":' . wp_json_encode( $binding ) . '}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>' . $own_paragraph . '</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
	}

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
		$this->assertStringContainsString( '>One</p><p', $output );
		$this->assertStringContainsString( '>Two</p></div>', $output );
		$this->assertStringNotContainsString( 'Default', $output );
	}

	public function test_value_may_start_with_whitespace() {
		$this->value = "\n\t<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->";
		$this->assertStringContainsString( '>One</p>', $this->render_group() );
	}

	/**
	 * @dataProvider data_whitespace_after_the_delimiter_opener
	 */
	public function test_value_may_have_any_whitespace_after_the_delimiter_opener( $whitespace ) {
		$this->value = "<!--{$whitespace}wp:paragraph --><p>One</p><!-- /wp:paragraph -->";
		$output      = $this->render_group();
		$this->assertStringContainsString( '>One</p>', $output );
		$this->assertStringNotContainsString( 'Default', $output );
	}

	public function data_whitespace_after_the_delimiter_opener() {
		return array(
			'space'   => array( ' ' ),
			'tab'     => array( "\t" ),
			'newline' => array( "\n" ),
		);
	}

	public function test_whitespace_value_keeps_own_inner_blocks() {
		$this->value = " \n\t";
		$this->assertStringContainsString( '>Default</p>', $this->render_group() );
	}

	public function test_value_starting_with_a_closer_keeps_own_inner_blocks() {
		$this->value = '<!-- /wp:paragraph --><!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$this->assertStringContainsString( '>Default</p>', $this->render_group() );
	}

	public function test_empty_value_removes_inner_blocks() {
		$this->value = '';
		$output      = $this->render_group();
		$this->assertStringNotContainsString( '<p', $output );
		$this->assertStringContainsString( 'wp-block-group', $output );
	}

	public function test_empty_value_removes_inner_blocks_without_wrapper_markup() {
		$this->value = '';
		$output      = render_block( parse_blocks( '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"' . self::SOURCE . '"}}}} --><!-- wp:paragraph --><p>Default</p><!-- /wp:paragraph --><!-- /wp:group -->' )[0] );
		$this->assertSame( '', $output );
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
		$this->assertSame( $this->render_group( array() ), $output );
	}

	public function test_value_is_sanitized() {
		$this->value = '<!-- wp:html --><script>alert(1)</script><p>Safe</p><!-- /wp:html -->';
		$output      = $this->render_group();
		$this->assertStringNotContainsString( '<script>', $output );
		$this->assertStringContainsString( '<p>Safe</p>', $output );
	}

	public function test_block_attributes_in_the_value_are_sanitized() {
		$this->value = '<!-- wp:paragraph {"className":"<img src=x onerror=alert(1)>"} --><p>Safe</p><!-- /wp:paragraph -->';
		$output      = $this->render_group();
		$this->assertStringNotContainsString( 'onerror', $output );
		$this->assertStringContainsString( '>Safe</p>', $output );
	}

	public function test_value_of_a_trusted_source_is_not_sanitized() {
		$this->value = '<!-- wp:html --><svg><circle r="1"></circle></svg><!-- /wp:html -->';
		$trusted     = array();
		$trust       = static function ( $sanitize, $source_name, $source_args, $block_instance ) use ( &$trusted ) {
			$trusted[] = array( $source_name, $source_args, $block_instance->name );
			return false;
		};
		add_filter( 'block_bindings_sanitize_inner_blocks', $trust, 10, 4 );
		$output = $this->render_group(
			array(
				'innerBlocks' => array(
					'source' => self::SOURCE,
					'args'   => array( 'key' => 'chart' ),
				),
			)
		);
		remove_filter( 'block_bindings_sanitize_inner_blocks', $trust );

		$this->assertStringContainsString( '<svg><circle r="1"></circle></svg>', $output );
		$this->assertSame( array( array( self::SOURCE, array( 'key' => 'chart' ), 'core/group' ) ), $trusted );
	}

	public function test_custom_css_in_the_value_of_a_trusted_source_is_removed() {
		$this->value = '<!-- wp:paragraph {"style":{"css":"color:red"}} --><p>Styled</p><!-- /wp:paragraph -->';
		add_filter( 'block_bindings_sanitize_inner_blocks', '__return_false' );
		$output = $this->render_group();
		remove_filter( 'block_bindings_sanitize_inner_blocks', '__return_false' );

		$this->assertStringNotContainsString( 'wp-custom-css-', $output );
		$this->assertStringContainsString( '>Styled</p>', $output );
	}

	public function test_bindings_to_the_same_source_inside_the_value_are_ignored() {
		$this->value = $this->bound_group_markup();
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
					return $this->bound_group_markup( array(), 'From other' );
				},
			)
		);
		$this->value = '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/other-inner-blocks"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>From test</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
		$output      = $this->render_group();
		unregister_block_bindings_source( 'test/other-inner-blocks' );
		$this->assertStringContainsString( '>From other</p>', $output );
		$this->assertStringNotContainsString( 'From test', $output );
		$this->assertStringNotContainsString( 'Default', $output );
	}

	public function test_bindings_to_another_source_inside_the_value_resolve() {
		register_block_bindings_source(
			'test/other-inner-blocks',
			array(
				'label'              => 'Test',
				'get_value_callback' => static function () {
					return '<!-- wp:paragraph --><p>From other</p><!-- /wp:paragraph -->';
				},
			)
		);
		$this->value = '<!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/other-inner-blocks"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>Nested own</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
		$output      = $this->render_group();
		unregister_block_bindings_source( 'test/other-inner-blocks' );
		$this->assertStringContainsString( '>From other</p>', $output );
		$this->assertStringNotContainsString( 'Nested own', $output );
	}

	public function test_bindings_with_other_arguments_inside_the_value_resolve() {
		$this->value_callback = function ( $source_args ) {
			$level = $source_args['level'] ?? 1;
			if ( $level < 3 ) {
				return $this->bound_group_markup( array( 'level' => $level + 1 ), "Level {$level} own" );
			}
			return '<!-- wp:paragraph --><p>Level 3</p><!-- /wp:paragraph -->';
		};
		$output               = $this->render_group();
		$this->assertStringContainsString( '>Level 3</p>', $output );
		$this->assertStringNotContainsString( 'own', $output );
		$this->assertSame( 3, $this->inner_blocks_calls );
	}

	public function test_bindings_asking_for_the_same_value_with_other_arguments_stop_at_the_limit() {
		$this->value_callback = function () {
			$value = '<!-- wp:paragraph --><p>Supplied</p><!-- /wp:paragraph -->';
			foreach ( range( 1, 6 ) as $variant ) {
				$value .= $this->bound_group_markup( array( 'variant' => $variant ) );
			}
			return $value;
		};
		$limit                = static function () {
			return 10;
		};
		add_filter( 'block_bindings_nested_inner_blocks_limit', $limit );
		$output = $this->render_group();
		remove_filter( 'block_bindings_nested_inner_blocks_limit', $limit );

		$this->assertSame( 11, substr_count( $output, '>Supplied</p>' ) );
		$this->assertStringContainsString( '>Nested own</p>', $output );
	}

	public function test_bindings_with_other_attributes_inside_the_value_resolve() {
		$this->value = '<!-- wp:group {"tagName":"section","metadata":{"bindings":{"innerBlocks":{"source":"' . self::SOURCE . '"}}}} --><section class="wp-block-group"><!-- wp:paragraph --><p>Nested own</p><!-- /wp:paragraph --></section><!-- /wp:group -->';
		$output      = $this->render_group();
		$this->assertSame( 2, substr_count( $output, '<section class="wp-block-group">' ) );
		$this->assertSame( 1, substr_count( $output, 'Nested own' ) );
	}

	public function test_bindings_with_other_context_inside_the_value_resolve() {
		register_block_type(
			'test/provides-post',
			array(
				'attributes'       => array( 'id' => array( 'type' => 'integer' ) ),
				'provides_context' => array( 'postId' => 'id' ),
			)
		);
		register_block_bindings_source(
			'test/post-inner-blocks',
			array(
				'label'              => 'Test',
				'uses_context'       => array( 'postId' ),
				'get_value_callback' => static function ( $source_args, $block_instance ) {
					if ( 1 === $block_instance->context['postId'] ) {
						return '<!-- wp:test/provides-post {"id":2} --><!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/post-inner-blocks"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>Nested own</p><!-- /wp:paragraph --></div><!-- /wp:group --><!-- /wp:test/provides-post -->';
					}
					return '<!-- wp:paragraph --><p>Post ' . $block_instance->context['postId'] . '</p><!-- /wp:paragraph -->';
				},
			)
		);
		$output = do_blocks( '<!-- wp:test/provides-post {"id":1} --><!-- wp:group {"metadata":{"bindings":{"innerBlocks":{"source":"test/post-inner-blocks"}}}} --><div class="wp-block-group"><!-- wp:paragraph --><p>Default</p><!-- /wp:paragraph --></div><!-- /wp:group --><!-- /wp:test/provides-post -->' );
		unregister_block_bindings_source( 'test/post-inner-blocks' );
		unregister_block_type( 'test/provides-post' );

		$this->assertStringContainsString( '>Post 2</p>', $output );
		$this->assertStringNotContainsString( 'Nested own', $output );
		$this->assertStringNotContainsString( 'Default', $output );
	}

	public function test_bindings_inside_content_loaded_by_the_value_are_ignored() {
		register_block_type(
			'test/loads-content',
			array(
				'render_callback' => function () {
					return do_blocks( $this->bound_group_markup( array(), 'Loaded own' ) );
				},
			)
		);
		$this->value = '<!-- wp:test/loads-content /-->';
		$output      = $this->render_group();
		unregister_block_type( 'test/loads-content' );

		$this->assertSame( 1, substr_count( $output, 'Loaded own' ) );
		$this->assertStringNotContainsString( 'Default', $output );
	}

	public function test_sibling_bindings_each_resolve() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$group       = $this->bound_group_markup( array(), 'Default' );
		$output      = do_blocks( $group . $group );

		$this->assertSame( 2, $this->inner_blocks_calls );
		$this->assertSame( 2, substr_count( $output, '>One</p>' ) );
		$this->assertStringNotContainsString( 'Default', $output );
	}

	public function test_bindings_resolve_again_after_supplied_inner_blocks_render() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$this->render_group();
		$this->assertStringContainsString( '>One</p>', $this->render_group() );
	}

	public function test_blocks_that_stop_rendering_inside_a_host_are_forgotten_with_it() {
		register_block_type(
			'test/throws',
			array(
				'render_callback' => static function () {
					throw new Exception( 'Stopped' );
				},
			)
		);
		register_block_type(
			'test/catches',
			array(
				'render_callback' => function () {
					try {
						return do_blocks( $this->bound_group_markup( array( 'part' => 'inner' ) ) );
					} catch ( Exception $exception ) {
						return $exception->getMessage();
					}
				},
			)
		);
		$this->value_callback = static function ( $source_args ) {
			return 'inner' === ( $source_args['part'] ?? '' ) ? '<!-- wp:test/throws /-->' : '<!-- wp:test/catches /-->';
		};
		$output               = $this->render_group();
		$this->assertStringContainsString( 'Stopped', $output );

		$this->value_callback = null;
		$this->value          = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$output               = $this->render_group(
			array(
				'innerBlocks' => array(
					'source' => self::SOURCE,
					'args'   => array( 'part' => 'inner' ),
				),
			)
		);
		unregister_block_type( 'test/throws' );
		unregister_block_type( 'test/catches' );

		$this->assertStringContainsString( '>One</p>', $output );
	}

	public function test_attribute_bindings_inside_the_value_are_kept() {
		$this->value = '<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"test/inner-blocks"}}}} --><p>One</p><!-- /wp:paragraph -->';
		$this->assertStringContainsString( '>Bound text</p>', $this->render_group() );
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
		$this->assertStringContainsString( '>One</p><span>Tail</span>', $output );
	}

	public function test_value_goes_inside_the_inner_container_of_a_legacy_group() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$output      = $this->render_group( null, '<div class="wp-block-group__inner-container"><!-- wp:paragraph --><p>Default</p><!-- /wp:paragraph --></div>' );
		$this->assertSame( 1, substr_count( $output, 'wp-block-group__inner-container' ) );
		$this->assertStringEndsWith( '>One</p></div></div>', $output );
	}

	public function test_value_goes_inside_an_empty_group() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$output      = $this->render_group( null, '' );
		$this->assertStringStartsWith( '<div class="wp-block-group', $output );
		$this->assertStringContainsString( '>One</p></div>', $output );
		$this->assertSame( 1, substr_count( $output, '<p' ) );
	}

	public function test_value_goes_before_the_closer_of_a_wrapper_with_unclosed_elements() {
		$this->value = '<!-- wp:paragraph --><p>One</p><!-- /wp:paragraph -->';
		$output      = $this->render_group( null, '<p>Tail' );
		$this->assertStringContainsString( '<p>Tail</p><p', $output );
		$this->assertStringContainsString( '>One</p></div>', $output );
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
