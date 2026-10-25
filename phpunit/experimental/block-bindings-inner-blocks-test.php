<?php
/**
 * Tests for inner blocks bindings: a block bindings source supplying the inner
 * blocks of a Group or Column block.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_block_bindings_replace_inner_blocks
 * @covers ::gutenberg_block_bindings_end_inner_blocks_substitution
 */
class Tests_Block_Bindings_Inner_Blocks extends WP_UnitTestCase {

	/**
	 * The values of the test source, keyed by the `key` argument of a binding.
	 *
	 * @var array
	 */
	private $values = array();

	public function set_up() {
		parent::set_up();

		gutenberg_block_bindings_get_inner_blocks_state( true );

		register_block_bindings_source(
			'test/inner-blocks',
			array(
				'label'              => 'Inner blocks',
				'get_value_callback' => function ( $source_args ) {
					return $this->values[ $source_args['key'] ?? '' ] ?? null;
				},
			)
		);
	}

	public function tear_down() {
		foreach ( array_keys( get_all_registered_block_bindings_sources() ) as $source_name ) {
			if ( str_starts_with( $source_name, 'test/' ) ) {
				unregister_block_bindings_source( $source_name );
			}
		}
		foreach ( array_keys( WP_Block_Type_Registry::get_instance()->get_all_registered() ) as $block_name ) {
			if ( str_starts_with( $block_name, 'test/' ) ) {
				unregister_block_type( $block_name );
			}
		}
		unregister_post_meta( 'post', 'tests_inner_blocks' );
		gutenberg_block_bindings_get_inner_blocks_state( true );
		// Rendering layouts stores their styles.
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
		// A block whose rendering throws stays the block to render.
		WP_Block_Supports::$block_to_render = null;

		parent::tear_down();
	}

	/**
	 * Returns the markup of a paragraph block.
	 *
	 * @param string $text The text of the paragraph.
	 * @return string The block markup.
	 */
	private static function paragraph( $text ) {
		return '<!-- wp:paragraph --><p>' . $text . '</p><!-- /wp:paragraph -->';
	}

	/**
	 * Returns the markup of a block whose inner blocks are bound to a source.
	 *
	 * @param string $block_name The block name.
	 * @param array  $binding    The binding of the inner blocks.
	 * @param string $inner_html The markup between the block delimiters.
	 * @return string The block markup.
	 */
	private static function bound_block( $block_name, $binding, $inner_html ) {
		return get_comment_delimited_block_content(
			$block_name,
			array( 'metadata' => array( 'bindings' => array( 'innerBlocks' => $binding ) ) ),
			$inner_html
		);
	}

	/**
	 * Returns the markup of a Group block whose inner blocks are bound to the
	 * test source.
	 *
	 * @param string $key            The key of the value in the test source.
	 * @param string $own_inner_html Optional. The markup of the own inner blocks of the group.
	 * @return string The block markup.
	 */
	private static function bound_group( $key, $own_inner_html = '' ) {
		return self::bound_block(
			'core/group',
			array(
				'source' => 'test/inner-blocks',
				'args'   => array( 'key' => $key ),
			),
			'<div class="wp-block-group">' . $own_inner_html . '</div>'
		);
	}

	/**
	 * Returns the markup of a Group block that is not bound.
	 *
	 * @param string $inner_html The markup inside the group.
	 * @return string The block markup.
	 */
	private static function group( $inner_html = '' ) {
		return '<!-- wp:group --><div class="wp-block-group">' . $inner_html . '</div><!-- /wp:group -->';
	}

	public function test_group_and_column_blocks_support_inner_blocks_bindings() {
		$this->assertContains( 'innerBlocks', get_block_bindings_supported_attributes( 'core/group' ) );
		$this->assertContains( 'innerBlocks', get_block_bindings_supported_attributes( 'core/column' ) );
	}

	public function test_other_blocks_do_not_support_inner_blocks_bindings_even_when_a_filter_adds_them() {
		add_filter(
			'block_bindings_supported_attributes',
			static function ( $supported_attributes, $block_type ) {
				if ( 'core/quote' === $block_type ) {
					$supported_attributes[] = 'innerBlocks';
				}
				return $supported_attributes;
			},
			10,
			2
		);
		$this->values['area'] = self::paragraph( 'Bound' );

		$quote = '<blockquote class="wp-block-quote">' . self::paragraph( 'Own' ) . '</blockquote>';
		$bound = self::bound_block(
			'core/quote',
			array(
				'source' => 'test/inner-blocks',
				'args'   => array( 'key' => 'area' ),
			),
			$quote
		);

		$this->assertNotContains( 'innerBlocks', get_block_bindings_supported_attributes( 'core/quote' ) );
		$this->assertEqualHTML( do_blocks( '<!-- wp:quote -->' . $quote . '<!-- /wp:quote -->' ), do_blocks( $bound ) );
	}

	public function test_other_blocks_render_their_own_inner_blocks_when_a_filter_for_their_type_adds_support() {
		// The filter for a single block type runs after the one for all of them.
		add_filter(
			'block_bindings_supported_attributes_core/quote',
			static function ( $supported_attributes ) {
				$supported_attributes[] = 'innerBlocks';
				return $supported_attributes;
			}
		);
		$this->values['area'] = self::paragraph( 'Bound' );

		$quote = '<blockquote class="wp-block-quote">' . self::paragraph( 'Own' ) . '</blockquote>';
		$bound = self::bound_block(
			'core/quote',
			array(
				'source' => 'test/inner-blocks',
				'args'   => array( 'key' => 'area' ),
			),
			$quote
		);

		$this->assertEqualHTML( do_blocks( '<!-- wp:quote -->' . $quote . '<!-- /wp:quote -->' ), do_blocks( $bound ) );
	}

	/**
	 * @covers ::gutenberg_block_bindings_restrict_inner_blocks_editor_settings
	 */
	public function test_editor_settings_list_inner_blocks_only_for_group_and_column_blocks() {
		add_filter(
			'block_bindings_supported_attributes_core/quote',
			static function ( $supported_attributes ) {
				$supported_attributes[] = 'innerBlocks';
				return $supported_attributes;
			}
		);

		$supported_attributes = get_block_editor_settings( array(), new WP_Block_Editor_Context() )['__experimentalBlockBindingsSupportedAttributes'];

		$this->assertSame( array( 'innerBlocks' ), $supported_attributes['core/group'] );
		$this->assertSame( array( 'innerBlocks' ), $supported_attributes['core/column'] );
		$this->assertArrayNotHasKey( 'core/quote', $supported_attributes );
		$this->assertSame( array( 'content' ), $supported_attributes['core/paragraph'] );
	}

	public function data_priorities_of_a_filter_that_returns_null() {
		return array(
			'before the filter that adds inner blocks' => array( 5 ),
			'after it'                                 => array( 20 ),
		);
	}

	/**
	 * @covers ::gutenberg_block_bindings_add_inner_blocks_support
	 * @covers ::gutenberg_block_bindings_restrict_inner_blocks_support
	 *
	 * @dataProvider data_priorities_of_a_filter_that_returns_null
	 *
	 * @param int $priority The priority of the filter.
	 */
	public function test_blocks_render_when_a_filter_returns_null_for_the_supported_attributes( $priority ) {
		$this->values['area'] = self::paragraph( 'Bound' );
		$paragraph            = do_blocks( self::paragraph( 'Text' ) );
		$bound                = self::bound_group( 'area', self::paragraph( 'Own' ) );

		// A filter for a single block type that returns nothing for the others.
		$filter_one_block_type = static function ( $supported_attributes, $block_type ) {
			return 'test/made-up' === $block_type ? $supported_attributes : null;
		};
		add_filter( 'block_bindings_supported_attributes', $filter_one_block_type, $priority, 2 );

		$this->assertSame( $paragraph, do_blocks( self::paragraph( 'Text' ) ) );
		$this->assertEqualHTML(
			do_blocks( self::group( self::paragraph( 'Own' ) ) ),
			do_blocks( $bound ),
			'<body>',
			'The group should render its own inner blocks, as no attribute supports bindings.'
		);

		remove_filter( 'block_bindings_supported_attributes', $filter_one_block_type, $priority );

		$this->assertEqualHTML( do_blocks( self::group( self::paragraph( 'Bound' ) ) ), do_blocks( $bound ) );
	}

	public function data_values_that_supply_no_inner_blocks() {
		return array(
			'no value'                      => array( null ),
			'a value that is not a string'  => array( array( self::paragraph( 'Bound' ) ) ),
			'a string without block markup' => array( '<p>Bound</p>' ),
			'whitespace'                    => array( "\n" ),
		);
	}

	/**
	 * @dataProvider data_values_that_supply_no_inner_blocks
	 *
	 * @param mixed $value The value of the source.
	 */
	public function test_group_renders_its_own_inner_blocks_when_the_value_supplies_none( $value ) {
		$this->values['area'] = $value;

		$this->assertEqualHTML(
			do_blocks( self::group( self::paragraph( 'Own' ) ) ),
			do_blocks( self::bound_group( 'area', self::paragraph( 'Own' ) ) )
		);
	}

	public function test_group_renders_the_inner_blocks_of_the_value_in_place_of_its_own() {
		$this->values['area'] = self::paragraph( 'One' ) . "\n\n" . self::paragraph( 'Two' );

		$bound_group    = null;
		$capture_render = static function ( $block_content, $parsed_block, $instance ) use ( &$bound_group ) {
			if ( 'core/group' === $parsed_block['blockName'] ) {
				$bound_group = $instance;
			}
			return $block_content;
		};
		add_filter( 'render_block', $capture_render, 10, 3 );

		$this->assertEqualHTML(
			do_blocks( self::group( self::paragraph( 'One' ) . self::paragraph( 'Two' ) ) ),
			do_blocks( self::bound_group( 'area', self::paragraph( 'Own one' ) . "\n" . self::paragraph( 'Own two' ) ) ),
			'<body>',
			'The group should keep its own wrapper around the inner blocks of the value.'
		);
		$this->assertArrayNotHasKey( 'innerBlocks', $bound_group->attributes, 'The value should not become an attribute.' );
	}

	public function test_nested_column_renders_the_inner_blocks_of_the_value() {
		$this->values['area'] = self::paragraph( 'Bound' );

		$bound_column = self::bound_block(
			'core/column',
			array(
				'source' => 'test/inner-blocks',
				'args'   => array( 'key' => 'area' ),
			),
			'<div class="wp-block-column">' . self::paragraph( 'Own' ) . '</div>'
		);
		$column       = '<!-- wp:column --><div class="wp-block-column">' . self::paragraph( 'Bound' ) . '</div><!-- /wp:column -->';

		$this->assertEqualHTML(
			do_blocks( '<!-- wp:columns --><div class="wp-block-columns">' . $column . '</div><!-- /wp:columns -->' ),
			do_blocks( '<!-- wp:columns --><div class="wp-block-columns">' . $bound_column . '</div><!-- /wp:columns -->' )
		);
	}

	public function test_empty_group_renders_the_inner_blocks_of_the_value_inside_its_element() {
		$this->values['area'] = self::paragraph( 'Bound' );

		$this->assertEqualHTML(
			do_blocks( self::group( self::paragraph( 'Bound' ) ) ),
			do_blocks( self::bound_group( 'area' ) )
		);
	}

	public function test_group_without_markup_renders_the_inner_blocks_of_the_value() {
		$this->values['area'] = self::paragraph( 'Bound' );

		$bound = self::bound_block(
			'core/group',
			array(
				'source' => 'test/inner-blocks',
				'args'   => array( 'key' => 'area' ),
			),
			''
		);

		$this->assertStringContainsString( 'Bound', do_blocks( $bound ) );
	}

	public function test_empty_string_leaves_the_group_without_inner_blocks() {
		$this->values['area'] = '';

		$bound_group    = null;
		$capture_render = static function ( $block_content, $parsed_block, $instance ) use ( &$bound_group ) {
			if ( 'core/group' === $parsed_block['blockName'] ) {
				$bound_group = $instance;
			}
			return $block_content;
		};
		add_filter( 'render_block', $capture_render, 10, 3 );

		$this->assertEqualHTML(
			do_blocks( self::group() ),
			do_blocks( self::bound_group( 'area', self::paragraph( 'Own' ) ) )
		);
		$this->assertSame( array(), $bound_group->inner_blocks, 'A block that renders its inner blocks itself should find none.' );
		$this->assertSame( '<div class="wp-block-group"></div>', $bound_group->inner_html );
	}

	public function data_markup_without_a_place_for_inner_blocks() {
		return array(
			'markup between the inner blocks'    => array( '<div class="wp-block-group">' . self::paragraph( 'Own one' ) . '<hr/>' . self::paragraph( 'Own two' ) . '</div>' ),
			'an element that cannot hold blocks' => array( '<p class="wp-block-group"></p>' ),
			'an element with a child'            => array( '<div class="wp-block-group"><div class="wp-block-group__inner-container"></div></div>' ),
			'an element with text'               => array( '<div class="wp-block-group">Text</div>' ),
			'two elements'                       => array( '<div class="wp-block-group"></div><div></div>' ),
			'a self-closing element'             => array( '<div class="wp-block-group"/></div>' ),
			'whitespace'                         => array( "\n" ),
		);
	}

	/**
	 * @dataProvider data_markup_without_a_place_for_inner_blocks
	 *
	 * @param string $inner_html The markup between the block delimiters.
	 */
	public function test_group_renders_its_own_markup_when_it_has_no_place_for_inner_blocks( $inner_html ) {
		$this->values['area'] = self::paragraph( 'Bound' );

		$bound = self::bound_block(
			'core/group',
			array(
				'source' => 'test/inner-blocks',
				'args'   => array( 'key' => 'area' ),
			),
			$inner_html
		);

		$this->assertSame(
			do_blocks( '<!-- wp:group -->' . $inner_html . '<!-- /wp:group -->' ),
			do_blocks( $bound )
		);
	}

	public function test_source_reads_the_context_an_ancestor_provides_while_rendering() {
		register_block_bindings_source(
			'test/post-inner-blocks',
			array(
				'label'              => 'Post inner blocks',
				'uses_context'       => array( 'postId' ),
				'get_value_callback' => static function ( $source_args, $block_instance ) {
					return self::paragraph( 'Post ' . ( $block_instance->context['postId'] ?? 'none' ) );
				},
			)
		);
		$template = self::group(
			self::bound_block(
				'core/group',
				array( 'source' => 'test/post-inner-blocks' ),
				'<div class="wp-block-group">' . self::paragraph( 'Own' ) . '</div>'
			)
		);

		// Render the template as the Post Template block renders it for a post.
		$provide_post_id = static function ( $context ) {
			$context['postId'] = 123;
			return $context;
		};
		add_filter( 'render_block_context', $provide_post_id, 1 );
		$block  = array(
			'blockName'    => 'core/null',
			'attrs'        => array(),
			'innerBlocks'  => parse_blocks( $template ),
			'innerHTML'    => '',
			'innerContent' => array( null ),
		);
		$output = ( new WP_Block( $block ) )->render( array( 'dynamic' => false ) );
		remove_filter( 'render_block_context', $provide_post_id, 1 );

		$this->assertStringContainsString( 'Post 123', $output );
		$this->assertStringNotContainsString( 'Own', $output );
	}

	public function test_group_renders_its_own_inner_blocks_without_the_context_the_source_uses() {
		register_block_bindings_source(
			'test/post-inner-blocks',
			array(
				'label'              => 'Post inner blocks',
				'uses_context'       => array( 'postId' ),
				'get_value_callback' => static function ( $source_args, $block_instance ) {
					return self::paragraph( 'Post ' . ( $block_instance->context['postId'] ?? 'none' ) );
				},
			)
		);
		$template = self::group(
			self::bound_block(
				'core/group',
				array( 'source' => 'test/post-inner-blocks' ),
				'<div class="wp-block-group">' . self::paragraph( 'Own' ) . '</div>'
			)
		);

		$output = ( new WP_Block( parse_blocks( $template )[0] ) )->render();

		$this->assertStringContainsString( 'Own', $output );
		$this->assertStringNotContainsString( 'Post', $output );
	}

	/**
	 * Returns the markup of a Pattern block that renders a synced pattern, with
	 * overrides for its blocks.
	 *
	 * @param string $pattern   The content of the synced pattern.
	 * @param array  $overrides The overrides, keyed by the name of the block they apply to.
	 * @return string The block markup.
	 */
	private static function synced_pattern( $pattern, $overrides ) {
		$pattern_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_content' => $pattern,
			)
		);

		return get_comment_delimited_block_content(
			'core/block',
			array(
				'ref'     => $pattern_id,
				'content' => $overrides,
			),
			''
		);
	}

	public function test_pattern_overrides_supply_the_inner_blocks_of_a_group_in_a_synced_pattern() {
		$pattern = get_comment_delimited_block_content(
			'core/group',
			array(
				'metadata' => array(
					'name'     => 'Area',
					'bindings' => array( 'innerBlocks' => array( 'source' => 'core/pattern-overrides' ) ),
				),
			),
			'<div class="wp-block-group">' . self::paragraph( 'Own' ) . '</div>'
		);

		$content = self::synced_pattern( $pattern, array( 'Area' => array( 'innerBlocks' => self::paragraph( 'Override' ) ) ) );
		$output  = do_blocks( $content );

		$this->assertStringContainsString( 'Override', $output );
		$this->assertStringNotContainsString( 'Own', $output );
		$this->assertSame( $output, do_blocks( $content ), 'Rendering the pattern again should render it the same.' );
	}

	public function test_default_pattern_overrides_binding_does_not_bind_inner_blocks() {
		$pattern = get_comment_delimited_block_content(
			'core/group',
			array(
				'metadata' => array(
					'name'     => 'Area',
					'bindings' => array( '__default' => array( 'source' => 'core/pattern-overrides' ) ),
				),
			),
			'<div class="wp-block-group">' . self::paragraph( 'Own' ) . '</div>'
		);

		$output = do_blocks( self::synced_pattern( $pattern, array( 'Area' => array( 'innerBlocks' => self::paragraph( 'Override' ) ) ) ) );

		$this->assertStringContainsString( 'Own', $output );
		$this->assertStringNotContainsString( 'Override', $output );
	}

	public function test_pattern_overrides_apply_to_blocks_in_the_inner_blocks_they_supply() {
		$pattern   = get_comment_delimited_block_content(
			'core/group',
			array(
				'metadata' => array(
					'name'     => 'area',
					'bindings' => array( 'innerBlocks' => array( 'source' => 'core/pattern-overrides' ) ),
				),
			),
			'<div class="wp-block-group">' . self::paragraph( 'Pattern' ) . '</div>'
		);
		$paragraph = get_comment_delimited_block_content(
			'core/paragraph',
			array(
				'metadata' => array(
					'name'     => 'p',
					'bindings' => array( '__default' => array( 'source' => 'core/pattern-overrides' ) ),
				),
			),
			'<p>Own</p>'
		);

		$output = do_blocks(
			self::synced_pattern(
				$pattern,
				array(
					'area' => array( 'innerBlocks' => $paragraph ),
					'p'    => array( 'content' => 'Override' ),
				)
			)
		);

		$this->assertEqualHTML( do_blocks( self::group( self::paragraph( 'Override' ) ) ), $output );
	}

	public function test_post_meta_does_not_supply_inner_blocks() {
		register_post_meta(
			'post',
			'tests_inner_blocks',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
			)
		);
		$post_id = self::factory()->post->create( array( 'meta_input' => array( 'tests_inner_blocks' => self::paragraph( 'Meta' ) ) ) );
		$bound   = self::bound_block(
			'core/group',
			array(
				'source' => 'core/post-meta',
				'args'   => array( 'key' => 'tests_inner_blocks' ),
			),
			'<div class="wp-block-group">' . self::paragraph( 'Own' ) . '</div>'
		);

		$output = ( new WP_Block(
			parse_blocks( $bound )[0],
			array(
				'postId'   => $post_id,
				'postType' => 'post',
			)
		) )->render();

		$this->assertStringContainsString( 'Own', $output );
		$this->assertStringNotContainsString( 'Meta', $output );
	}

	public function test_value_that_contains_itself_renders_once() {
		$this->values['loop'] = self::paragraph( 'Bound' ) . self::bound_group( 'loop', self::paragraph( 'Inner own' ) );
		$content              = self::bound_group( 'loop', self::paragraph( 'Outer own' ) );

		$output = do_blocks( $content );

		$this->assertEqualHTML(
			do_blocks( self::group( self::paragraph( 'Bound' ) . self::group( self::paragraph( 'Inner own' ) ) ) ),
			$output,
			'<body>',
			'The group repeating the value should render its own inner blocks.'
		);
		$this->assertSame( $output, do_blocks( $content ), 'Rendering the content again should render it the same.' );
	}

	public function test_nested_values_stop_after_eight_levels() {
		register_block_bindings_source(
			'test/levels',
			array(
				'label'              => 'Levels',
				'get_value_callback' => static function ( $source_args ) {
					$next = $source_args['level'] + 1;
					return self::paragraph( "Level {$source_args['level']}." ) . self::bound_block(
						'core/group',
						array(
							'source' => 'test/levels',
							'args'   => array( 'level' => $next ),
						),
						'<div class="wp-block-group">' . self::paragraph( "Own {$next}." ) . '</div>'
					);
				},
			)
		);
		$content = self::bound_block(
			'core/group',
			array(
				'source' => 'test/levels',
				'args'   => array( 'level' => 1 ),
			),
			'<div class="wp-block-group">' . self::paragraph( 'Own 1.' ) . '</div>'
		);

		$output = do_blocks( $content );

		for ( $level = 1; $level <= 8; $level++ ) {
			$this->assertStringContainsString( "Level {$level}.", $output );
			$this->assertStringNotContainsString( "Own {$level}.", $output );
		}
		$this->assertStringNotContainsString( 'Level 9.', $output );
		$this->assertStringContainsString( 'Own 9.', $output );
	}

	public function test_nested_values_stop_once_a_megabyte_of_them_has_rendered() {
		$this->values['first']  = self::paragraph( str_repeat( 'a', 600 * KB_IN_BYTES ) ) . self::bound_group( 'second', self::paragraph( 'Own 2.' ) );
		$this->values['second'] = self::paragraph( str_repeat( 'b', 600 * KB_IN_BYTES ) ) . self::bound_group( 'third', self::paragraph( 'Own 3.' ) );
		$this->values['third']  = self::paragraph( 'Bound 3.' );

		$output = do_blocks( self::bound_group( 'first', self::paragraph( 'Own 1.' ) ) );

		$this->assertStringNotContainsString( 'Own 2.', $output, 'The second group should render its value.' );
		$this->assertStringContainsString( 'Own 3.', $output, 'The third group should render its own inner blocks.' );
		$this->assertStringNotContainsString( 'Bound 3.', $output );
		$this->assertStringContainsString(
			'Bound 3.',
			do_blocks( self::bound_group( 'third' ) ),
			'The third group should render its value when it renders on its own.'
		);
	}

	public function test_group_renders_the_value_after_it_is_resolved_for_a_block_that_never_renders() {
		$this->values['area'] = self::paragraph( 'Bound' );
		$bound                = self::bound_group( 'area', self::paragraph( 'Own' ) );

		// Resolve the binding of a block that is gone right after, without rendering.
		get_block_bindings_source( 'test/inner-blocks' )->get_value( array( 'key' => 'area' ), new WP_Block( parse_blocks( $bound )[0] ), 'innerBlocks' );
		$output = do_blocks( $bound );

		$this->assertEqualHTML( do_blocks( self::group( self::paragraph( 'Bound' ) ) ), $output );
	}

	public function test_values_resolved_for_a_block_that_never_renders_do_not_count_towards_the_megabyte() {
		$this->values['leak']   = self::paragraph( str_repeat( 'a', 600 * KB_IN_BYTES ) );
		$this->values['first']  = self::paragraph( str_repeat( 'b', 600 * KB_IN_BYTES ) ) . self::bound_group( 'second', self::paragraph( 'Own 2.' ) );
		$this->values['second'] = self::paragraph( 'Bound 2.' );

		// Resolve the binding of a block that is gone right after, without rendering.
		get_block_bindings_source( 'test/inner-blocks' )->get_value( array( 'key' => 'leak' ), new WP_Block( parse_blocks( self::bound_group( 'leak' ) )[0] ), 'innerBlocks' );
		$output = do_blocks( self::bound_group( 'first', self::paragraph( 'Own 1.' ) ) );

		$this->assertStringContainsString( 'Bound 2.', $output );
		$this->assertStringNotContainsString( 'Own 2.', $output );
	}

	/**
	 * Registers a block whose rendering throws an exception the first time.
	 */
	private static function register_block_that_throws_once() {
		$throws = true;
		register_block_type(
			'test/throws',
			array(
				'render_callback' => static function () use ( &$throws ) {
					if ( $throws ) {
						$throws = false;
						throw new RuntimeException( 'Rendering failed.' );
					}
					return '<p>Rendered</p>';
				},
			)
		);
	}

	public function test_group_renders_the_value_again_after_rendering_it_threw() {
		self::register_block_that_throws_once();
		$this->values['area'] = self::paragraph( 'Bound' ) . '<!-- wp:test/throws /-->';
		$bound                = self::bound_group( 'area', self::paragraph( 'Own' ) );

		$message = null;
		try {
			do_blocks( $bound );
		} catch ( RuntimeException $exception ) {
			$message = $exception->getMessage();
		}
		$output = do_blocks( $bound );

		$this->assertSame( 'Rendering failed.', $message, 'Rendering the value should throw the first time.' );
		$this->assertEqualHTML( do_blocks( self::group( self::paragraph( 'Bound' ) . '<!-- wp:test/throws /-->' ) ), $output );
	}

	public function test_group_renders_the_value_again_after_an_exception_was_caught_inside_it() {
		self::register_block_that_throws_once();
		register_block_type(
			'test/catches',
			array(
				'skip_inner_blocks' => true,
				'render_callback'   => static function ( $attributes, $content, $block ) {
					$output = '';
					foreach ( $block->inner_blocks as $inner_block ) {
						try {
							$output .= $inner_block->render();
						} catch ( RuntimeException $exception ) {
							$output .= '<p>Failed</p>';
						}
					}
					return $output;
				},
			)
		);
		$this->values['area']  = '<!-- wp:test/catches -->' . self::bound_group( 'inner' ) . '<!-- /wp:test/catches -->';
		$this->values['inner'] = '<!-- wp:test/throws /-->';
		$bound                 = self::bound_group( 'area', self::paragraph( 'Own' ) );

		// Inside another block, the first group is still there when the second renders.
		$output = do_blocks( self::group( $bound . $bound ) );

		$this->assertStringContainsString( 'Failed', $output, 'The first group should render the value, which throws inside it.' );
		$this->assertStringContainsString( 'Rendered', $output, 'The second group should render the value.' );
		$this->assertStringNotContainsString( 'Own', $output );
	}

	public function test_markup_from_the_source_is_sanitized() {
		$this->values['area'] = self::paragraph( 'Image <img src="x" onerror="alert(1)">' ) . '<!-- wp:template-part {"slug":"tests-missing","tagName":"script"} /-->';

		$template_part_attributes = null;
		$capture_template_part    = static function ( $parsed_block ) use ( &$template_part_attributes ) {
			if ( 'core/template-part' === $parsed_block['blockName'] ) {
				$template_part_attributes = $parsed_block['attrs'];
			}
			return $parsed_block;
		};
		add_filter( 'render_block_data', $capture_template_part );

		$processor = new WP_HTML_Tag_Processor( do_blocks( self::bound_group( 'area' ) ) );

		$this->assertTrue( $processor->next_tag( 'IMG' ), 'The image should render.' );
		$this->assertNull( $processor->get_attribute( 'onerror' ), 'The event handler attribute should be removed.' );
		$this->assertSame( '', $template_part_attributes['tagName'], 'The tag name of the Template Part block should be removed.' );
	}
}
