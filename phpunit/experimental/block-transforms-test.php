<?php
/**
 * Tests for the block transforms declared in `block.json` and the conversions
 * that read them on the server.
 *
 * @package gutenberg
 */

/**
 * Covers the raw block transforms declared in `block.json` and the conversion
 * pipeline that reads them.
 *
 * @covers Gutenberg_HTML_To_Blocks
 * @covers Gutenberg_Block_Transforms
 * @covers Gutenberg_Block_Attributes_Parser
 * @covers Gutenberg_HTML_Element
 */
class Gutenberg_Block_Transforms_Test extends WP_UnitTestCase {
	/**
	 * Names of the block types registered for a single test.
	 *
	 * @var string[]
	 */
	private $registered = array();

	public function tear_down() {
		foreach ( $this->registered as $block_name ) {
			unregister_block_type( $block_name );
		}

		$this->registered = array();

		parent::tear_down();
	}

	/**
	 * Registers a block type for the duration of a single test.
	 *
	 * @param string $block_name Block name.
	 * @param array  $settings   Block type settings.
	 * @return void
	 */
	private function register( $block_name, $settings ) {
		register_block_type( $block_name, $settings );
		$this->registered[] = $block_name;
	}

	/**
	 * Registers a small block library covering the declarative transform options.
	 *
	 * @return void
	 */
	private function register_test_blocks() {
		$this->register(
			'test/paragraph',
			array(
				'attributes' => array(
					'content' => array(
						'type'     => 'rich-text',
						'source'   => 'rich-text',
						'selector' => 'p',
					),
				),
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'p',
							'priority' => 2,
						),
					),
				),
			)
		);

		$this->register(
			'test/heading',
			array(
				'attributes' => array(
					'content' => array(
						'type'     => 'rich-text',
						'source'   => 'rich-text',
						'selector' => 'h1,h2,h3',
					),
					'level'   => array(
						'type'    => 'number',
						'default' => 2,
					),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'raw',
							'selector'   => 'h1',
							'priority'   => 1,
							'attributes' => array( 'level' => 1 ),
						),
						array(
							'type'       => 'raw',
							'selector'   => 'h3',
							'priority'   => 1,
							'attributes' => array( 'level' => 3 ),
						),
					),
				),
			)
		);

		$this->register(
			'test/quote',
			array(
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'             => 'raw',
							'selector'         => 'blockquote',
							'priority'         => 1,
							'sourceAttributes' => false,
							'innerBlocks'      => true,
						),
					),
				),
			)
		);
	}

	public function test_converts_top_level_elements_using_declared_selectors() {
		$this->register_test_blocks();

		$blocks = gutenberg_html_to_blocks( '<h1>Title</h1><p>Body</p>' );

		$this->assertCount( 2, $blocks );
		$this->assertSame( 'test/heading', $blocks[0]['blockName'] );
		$this->assertSame( 'test/paragraph', $blocks[1]['blockName'] );
	}

	public function test_sets_static_attributes_declared_on_a_transform() {
		$this->register_test_blocks();

		$blocks = gutenberg_html_to_blocks( '<h3>Title</h3>' );

		$this->assertSame( array( 'level' => 3 ), $blocks[0]['attrs'] );
	}

	public function test_omits_attributes_matching_the_block_default() {
		$this->register_test_blocks();

		$blocks = gutenberg_html_to_blocks( '<h1>Title</h1>' );

		$this->assertSame( array( 'level' => 1 ), $blocks[0]['attrs'] );

		$blocks = gutenberg_html_to_blocks( '<h3>Title</h3>' );

		$this->assertArrayNotHasKey( 'content', $blocks[0]['attrs'], 'Sourced attributes are read back from the markup.' );
	}

	public function test_maps_a_sourced_value_onto_a_declared_attribute() {
		$this->register(
			'test/mapped-heading',
			array(
				'attributes' => array(
					'level' => array(
						'type'    => 'number',
						'default' => 2,
					),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'raw',
							'selector'   => 'h1,h3',
							'priority'   => 1,
							'attributes' => array(
								'level' => array(
									'type'     => 'number',
									'source'   => 'tag',
									'selector' => 'h1,h3',
									'map'      => array(
										'h1' => 1,
										'h3' => 3,
									),
								),
							),
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<h1>One</h1><h3>Three</h3>' );

		$this->assertSame( array( 'level' => 1 ), $blocks[0]['attrs'] );
		$this->assertSame( array( 'level' => 3 ), $blocks[1]['attrs'] );
	}

	public function test_falls_back_to_the_html_block_for_unclaimed_markup() {
		$this->register_test_blocks();

		$blocks = gutenberg_html_to_blocks( '<dl><dt>Term</dt></dl>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/html', $blocks[0]['blockName'] );
		$this->assertSame( '<dl><dt>Term</dt></dl>', $blocks[0]['innerHTML'] );
	}

	public function test_respects_transform_priority() {
		$this->register_test_blocks();

		$this->register(
			'test/lead',
			array(
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'p.lead',
							'priority' => 0,
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<p class="lead">One</p><p>Two</p>' );

		$this->assertSame( 'test/lead', $blocks[0]['blockName'] );
		$this->assertSame( 'test/paragraph', $blocks[1]['blockName'] );
	}

	public function test_converts_inner_content_into_inner_blocks() {
		$this->register_test_blocks();

		$blocks = gutenberg_html_to_blocks( '<blockquote><p>One</p><p>Two</p></blockquote>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'test/quote', $blocks[0]['blockName'] );
		$this->assertCount( 2, $blocks[0]['innerBlocks'] );
		$this->assertSame( 'test/paragraph', $blocks[0]['innerBlocks'][0]['blockName'] );
		$this->assertSame(
			array( '<blockquote>', null, null, '</blockquote>' ),
			$blocks[0]['innerContent']
		);
	}

	public function test_converts_only_matching_children_into_inner_blocks() {
		$this->register(
			'test/list',
			array(
				'transforms' => array(
					'from' => array(
						array(
							'type'             => 'raw',
							'selector'         => 'ul',
							'priority'         => 1,
							'sourceAttributes' => false,
							'innerBlocks'      => 'li',
						),
					),
				),
			)
		);

		$this->register(
			'test/list-item',
			array(
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'             => 'raw',
							'selector'         => 'li',
							'priority'         => 1,
							'sourceAttributes' => false,
							'innerBlocks'      => 'ul',
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<ul><li>One<ul><li>Nested</li></ul></li></ul>' );

		$item = $blocks[0]['innerBlocks'][0];

		$this->assertSame( 'test/list-item', $item['blockName'] );
		$this->assertCount( 1, $item['innerBlocks'], 'The nested list becomes an inner block.' );
		$this->assertSame(
			array( '<li>One', null, '</li>' ),
			$item['innerContent'],
			'Content that is not an inner block stays with the block.'
		);
	}

	public function test_wraps_loose_text_in_paragraphs() {
		$this->register_test_blocks();

		$blocks = gutenberg_html_to_blocks( "Loose text with a <a href=\"/x\">link</a>.\n<h1>Title</h1>" );

		$this->assertCount( 2, $blocks );
		$this->assertSame( 'test/paragraph', $blocks[0]['blockName'] );
		$this->assertSame( 'test/heading', $blocks[1]['blockName'] );
		$this->assertStringContainsString( '<a href="/x">link</a>', $blocks[0]['innerHTML'] );
	}

	public function test_leaves_existing_block_markup_alone() {
		$html = '<!-- wp:paragraph --><p>Already a block</p><!-- /wp:paragraph -->';

		$blocks = gutenberg_html_to_blocks( $html );

		$this->assertSame( 'core/paragraph', $blocks[0]['blockName'] );
		$this->assertSame( $html, serialize_blocks( $blocks ) );
	}

	public function test_adds_the_generated_class_name_to_saved_markup() {
		$this->register_test_blocks();

		$blocks = gutenberg_html_to_blocks( '<h1>Title</h1><p>Body</p>' );

		$this->assertSame( '<h1 class="wp-block-test-heading">Title</h1>', $blocks[0]['innerHTML'] );
		$this->assertSame(
			'<p>Body</p>',
			$blocks[1]['innerHTML'],
			'Blocks that opt out of className keep their markup as-is.'
		);
	}

	public function test_reads_anchor_and_class_name_from_block_supports() {
		$this->register(
			'test/anchored',
			array(
				'supports'   => array( 'anchor' => true ),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'section',
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<section id="intro" class="fancy">Text</section>' );

		$this->assertSame( 'intro', $blocks[0]['attrs']['anchor'] );
		$this->assertSame( 'fancy', $blocks[0]['attrs']['className'] );
	}

	public function test_matches_a_transform_registered_from_php() {
		$this->register(
			'test/callback',
			array(
				'transforms' => array(
					'from' => array(
						array(
							'type'      => 'raw',
							'isMatch'   => static function ( $element ) {
								return 'section' === $element->tag_name;
							},
							'transform' => static function ( $element ) {
								return array(
									'blockName'    => 'test/callback',
									'attrs'        => array( 'text' => $element->get_text_content() ),
									'innerBlocks'  => array(),
									'innerHTML'    => '',
									'innerContent' => array(),
								);
							},
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<section>Text</section>' );

		$this->assertSame( 'test/callback', $blocks[0]['blockName'] );
		$this->assertSame( 'Text', $blocks[0]['attrs']['text'] );
	}

	/**
	 * @dataProvider data_attribute_sources
	 *
	 * @param array  $attributes Block attribute definitions.
	 * @param string $html       Markup to read from.
	 * @param array  $expected   Expected attribute values.
	 */
	public function test_derives_attributes_from_markup( $attributes, $html, $expected ) {
		$this->register( 'test/sourced', array( 'attributes' => $attributes ) );

		$this->assertSame( $expected, gutenberg_get_block_attributes_from_html( 'test/sourced', $html ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public static function data_attribute_sources() {
		return array(
			'html source'            => array(
				array(
					'content' => array(
						'type'     => 'string',
						'source'   => 'html',
						'selector' => 'p',
					),
				),
				'<p>One <em>two</em></p>',
				array( 'content' => 'One <em>two</em>' ),
			),
			'text source'            => array(
				array(
					'content' => array(
						'type'     => 'string',
						'source'   => 'text',
						'selector' => 'p',
					),
				),
				'<p>One <em>two</em></p>',
				array( 'content' => 'One two' ),
			),
			'attribute source'       => array(
				array(
					'url' => array(
						'type'      => 'string',
						'source'    => 'attribute',
						'selector'  => 'img',
						'attribute' => 'src',
					),
				),
				'<figure><img src="/a.png" /></figure>',
				array( 'url' => '/a.png' ),
			),
			'child combinator'       => array(
				array(
					'href' => array(
						'type'      => 'string',
						'source'    => 'attribute',
						'selector'  => 'figure > a',
						'attribute' => 'href',
					),
				),
				'<figure><a href="/l"><img src="/a.png" /></a></figure>',
				array( 'href' => '/l' ),
			),
			'boolean attribute'      => array(
				array(
					'reversed' => array(
						'type'      => 'boolean',
						'source'    => 'attribute',
						'selector'  => 'ol',
						'attribute' => 'reversed',
					),
				),
				'<ol reversed><li>One</li></ol>',
				array( 'reversed' => true ),
			),
			'missing boolean'        => array(
				array(
					'reversed' => array(
						'type'      => 'boolean',
						'source'    => 'attribute',
						'selector'  => 'ol',
						'attribute' => 'reversed',
					),
				),
				'<ol><li>One</li></ol>',
				array( 'reversed' => false ),
			),
			'tag source'             => array(
				array(
					'tag' => array(
						'type'     => 'string',
						'source'   => 'tag',
						'selector' => 'td,th',
					),
				),
				'<table><tr><th>One</th></tr></table>',
				array( 'tag' => 'th' ),
			),
			'default when unmatched' => array(
				array(
					'content' => array(
						'type'     => 'string',
						'source'   => 'html',
						'selector' => 'p',
						'default'  => 'none',
					),
				),
				'<h1>Title</h1>',
				array( 'content' => 'none' ),
			),
			'query source'           => array(
				array(
					'rows' => array(
						'type'     => 'array',
						'source'   => 'query',
						'selector' => 'tr',
						'query'    => array(
							'content' => array(
								'type'     => 'string',
								'source'   => 'text',
								'selector' => 'td',
							),
						),
					),
				),
				'<table><tr><td>One</td></tr><tr><td>Two</td></tr></table>',
				array( 'rows' => array( array( 'content' => 'One' ), array( 'content' => 'Two' ) ) ),
			),
		);
	}

	/**
	 * @dataProvider data_selectors
	 *
	 * @param string $selector Selector to match.
	 * @param string $html     Markup whose first element is matched.
	 * @param bool   $expected Whether the element is expected to match.
	 */
	public function test_matches_supported_selectors( $selector, $html, $expected ) {
		$root    = Gutenberg_HTML_Element::from_html( $html );
		$element = $root->child_elements()[0];

		$this->assertSame( $expected, $element->matches( $selector ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public static function data_selectors() {
		return array(
			'type'                 => array( 'p', '<p>One</p>', true ),
			'type mismatch'        => array( 'p', '<div>One</div>', false ),
			'selector list'        => array( 'h1,h2,h3', '<h2>One</h2>', true ),
			'universal'            => array( '*', '<p>One</p>', true ),
			'class'                => array( 'p.lead', '<p class="intro lead">One</p>', true ),
			'class mismatch'       => array( 'p.lead', '<p class="intro">One</p>', false ),
			'id'                   => array( '#intro', '<p id="intro">One</p>', true ),
			'attribute presence'   => array( 'a[href]', '<a href="/x">One</a>', true ),
			'attribute value'      => array( 'wp-block[data-block="core/more"]', '<wp-block data-block="core/more"></wp-block>', true ),
			'has descendant'       => array( 'figure:has(img)', '<figure><a><img src="/a.png" /></a></figure>', true ),
			'has direct child'     => array( 'pre:has(> code)', '<pre><code>One</code></pre>', true ),
			'has direct child not' => array( 'pre:has(> code)', '<pre><span><code>One</code></span></pre>', false ),
			'not'                  => array( 'pre:not(:has(> code))', '<pre>One</pre>', true ),
			'not mismatch'         => array( 'pre:not(:has(> code))', '<pre><code>One</code></pre>', false ),
		);
	}

	public function test_core_blocks_declare_raw_transforms() {
		$paragraph = WP_Block_Type_Registry::get_instance()->get_registered( 'core/paragraph' );

		if ( ! isset( $paragraph->transforms ) ) {
			$this->markTestSkipped( 'Core block transforms require the plugin to be built.' );
		}

		$markup = gutenberg_html_to_block_markup( '<h2>Recipe</h2><ul><li>Flour</li></ul>' );

		$this->assertSame(
			'<!-- wp:heading --><h2 class="wp-block-heading">Recipe</h2><!-- /wp:heading -->' .
			'<!-- wp:list --><ul class="wp-block-list"><!-- wp:list-item --><li>Flour</li><!-- /wp:list-item --></ul><!-- /wp:list -->',
			$markup
		);
	}

	/**
	 * Registers a dynamic block, which the server can serialize without any
	 * saved markup.
	 *
	 * @param string $block_name Block name.
	 * @param array  $settings   Block type settings.
	 * @return void
	 */
	private function register_dynamic( $block_name, $settings ) {
		$this->register(
			$block_name,
			array_merge(
				array(
					'render_callback' => static function () {
						return '';
					},
				),
				$settings
			)
		);
	}

	public function test_converts_between_blocks_that_declare_a_transform() {
		$this->register_dynamic( 'test/calendar', array() );
		$this->register_dynamic(
			'test/archives',
			array(
				'transforms' => array(
					'from' => array(
						array(
							'type'   => 'block',
							'blocks' => array( 'test/calendar' ),
						),
					),
				),
			)
		);

		$blocks = gutenberg_switch_block_type(
			array(
				'blockName'    => 'test/calendar',
				'attrs'        => array(),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			),
			'test/archives'
		);

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'test/archives', $blocks[0]['blockName'] );
		$this->assertSame( '<!-- wp:test/archives /-->', serialize_blocks( $blocks ) );
	}

	/**
	 * @dataProvider data_attribute_policies
	 *
	 * @param mixed $policy   Declared attribute policy.
	 * @param array $expected Expected attributes on the resulting block.
	 */
	public function test_applies_the_declared_attribute_policy( $policy, $expected ) {
		$this->register_dynamic(
			'test/source',
			array( 'attributes' => array( 'heading' => array( 'type' => 'string' ) ) )
		);

		$transform = array(
			'type'   => 'block',
			'blocks' => array( 'test/source' ),
		);

		if ( null !== $policy ) {
			$transform['attributes'] = $policy;
		}

		$this->register_dynamic(
			'test/target',
			array(
				'attributes' => array( 'title' => array( 'type' => 'string' ) ),
				'transforms' => array( 'from' => array( $transform ) ),
			)
		);

		$blocks = gutenberg_switch_block_type(
			array(
				'blockName'    => 'test/source',
				'attrs'        => array( 'heading' => 'Hello' ),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			),
			'test/target'
		);

		$this->assertSame( $expected, $blocks[0]['attrs'] );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public static function data_attribute_policies() {
		return array(
			'no policy carries nothing'  => array( null, array() ),
			'all carries everything'     => array( 'all', array( 'heading' => 'Hello' ) ),
			'a map renames'              => array( array( 'title' => 'heading' ), array( 'title' => 'Hello' ) ),
			'an unknown name is skipped' => array( array( 'title' => 'missing' ), array() ),
		);
	}

	public function test_refuses_a_target_that_saves_its_own_markup() {
		$this->register_dynamic( 'test/source', array() );
		$this->register(
			'test/static-target',
			array(
				'attributes' => array( 'content' => array( 'type' => 'string' ) ),
				'transforms' => array(
					'from' => array(
						array(
							'type'   => 'block',
							'blocks' => array( 'test/source' ),
						),
					),
				),
			)
		);

		$blocks = gutenberg_switch_block_type(
			array(
				'blockName'    => 'test/source',
				'attrs'        => array(),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			),
			'test/static-target'
		);

		$this->assertNull(
			$blocks,
			'A block whose markup only its save() can produce cannot be converted to on the server.'
		);
	}

	public function test_refuses_a_multi_block_selection_unless_declared() {
		$this->register_dynamic( 'test/source', array() );
		$this->register_dynamic(
			'test/target',
			array(
				'transforms' => array(
					'from' => array(
						array(
							'type'   => 'block',
							'blocks' => array( 'test/source' ),
						),
					),
				),
			)
		);

		$block = array(
			'blockName'    => 'test/source',
			'attrs'        => array(),
			'innerBlocks'  => array(),
			'innerHTML'    => '',
			'innerContent' => array(),
		);

		$this->assertNull( gutenberg_switch_block_type( array( $block, $block ), 'test/target' ) );
		$this->assertNotNull( gutenberg_switch_block_type( array( $block ), 'test/target' ) );
	}

	public function test_returns_null_when_no_transform_applies() {
		$this->register_dynamic( 'test/source', array() );
		$this->register_dynamic( 'test/target', array() );

		$block = array(
			'blockName'    => 'test/source',
			'attrs'        => array(),
			'innerBlocks'  => array(),
			'innerHTML'    => '',
			'innerContent' => array(),
		);

		$this->assertNull( gutenberg_switch_block_type( $block, 'test/target' ) );
		$this->assertNull( gutenberg_switch_block_type( $block, 'test/not-registered' ) );
	}

	public function test_leaves_markup_alone_when_a_transform_declines_the_server() {
		$this->register(
			'test/picture',
			array(
				'attributes' => array(
					'url' => array(
						'type'      => 'string',
						'source'    => 'attribute',
						'selector'  => 'img',
						'attribute' => 'src',
					),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'             => 'raw',
							'selector'         => 'figure:has(img)',
							'serverConversion' => false,
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<figure><img src="/a.png" alt="A"/></figure>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/html', $blocks[0]['blockName'] );
		$this->assertStringContainsString( '<img src="/a.png"', $blocks[0]['innerHTML'] );
	}

	public function test_leaves_media_in_place_when_nothing_converts_it() {
		$this->register_test_blocks();

		// No registered block claims a figure, so wrapping the image in one
		// would invent markup the source never had.
		$blocks = gutenberg_html_to_blocks( '<p><img src="/a.png" alt="A"/></p>' );

		$this->assertCount( 1, $blocks );
		$this->assertStringNotContainsString( '<figure', $blocks[0]['innerHTML'] );
	}

	public function test_takes_media_out_of_a_paragraph_for_a_block_that_claims_it() {
		$this->register_test_blocks();
		$this->register(
			'test/picture',
			array(
				'attributes' => array(
					'url' => array(
						'type'      => 'string',
						'source'    => 'attribute',
						'selector'  => 'img',
						'attribute' => 'src',
					),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'figure:has(img)',
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<p><img src="/a.png" alt="A"/></p>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'test/picture', $blocks[0]['blockName'] );
		$this->assertStringContainsString( '<img src="/a.png"', $blocks[0]['innerHTML'] );
	}

	public function test_keeps_media_that_reads_as_part_of_a_sentence() {
		$this->register_test_blocks();
		$this->register(
			'test/picture',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'figure:has(img)',
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<p>See <img src="/a.png" alt="A"/> here.</p>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'test/paragraph', $blocks[0]['blockName'] );

		// An aligned image leaves even when the paragraph carries text.
		$aligned = gutenberg_html_to_blocks( '<p>See <img class="alignright" src="/a.png" alt="A"/> here.</p>' );

		$this->assertSame( 'test/picture', $aligned[0]['blockName'] );
	}

	public function test_omits_an_absent_boolean_attribute() {
		$this->register(
			'test/list',
			array(
				'attributes' => array(
					'reversed' => array( 'type' => 'boolean' ),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'raw',
							'selector'   => 'ol',
							'attributes' => array(
								'reversed' => array(
									'type'      => 'boolean',
									'source'    => 'attribute',
									'selector'  => 'ol',
									'attribute' => 'reversed',
								),
							),
						),
					),
				),
			)
		);

		$plain = gutenberg_html_to_blocks( '<ol><li>One</li></ol>' );

		// The editor derives no value at all from markup without the attribute.
		$this->assertArrayNotHasKey( 'reversed', $plain[0]['attrs'] );

		$reversed = gutenberg_html_to_blocks( '<ol reversed><li>One</li></ol>' );

		$this->assertTrue( $reversed[0]['attrs']['reversed'] );
	}
}
