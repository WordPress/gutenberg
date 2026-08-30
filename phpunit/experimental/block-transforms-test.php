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
 * @covers Gutenberg_Embed_Transforms
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
				// The editor's `toBooleanAttributeMatcher()` derives `false`
				// from markup without the attribute.
				array( 'reversed' => false ),
			),
			'boolean without target' => array(
				array(
					'reversed' => array(
						'type'      => 'boolean',
						'source'    => 'attribute',
						'selector'  => 'ol',
						'attribute' => 'reversed',
					),
				),
				'<ul><li>One</li></ul>',
				// Unmatched selector reads as `false` too, not as no value.
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
			'numeric string'         => array(
				array(
					'width' => array(
						'type'      => 'number',
						'source'    => 'attribute',
						'selector'  => 'img',
						'attribute' => 'width',
					),
				),
				'<figure><img src="/a.png" width="600" /></figure>',
				// A block's own attributes are read uncoerced on both
				// runtimes, so the string fails the number type and drops
				// out. Only a transform's declared attributes coerce.
				array(),
			),
			'nested query'           => array(
				array(
					'rows' => array(
						'type'     => 'array',
						'source'   => 'query',
						'selector' => 'div',
						'query'    => array(
							'inner' => array(
								'type'     => 'array',
								'source'   => 'query',
								'selector' => 'div',
								'query'    => array(
									'txt' => array(
										'type'   => 'string',
										'source' => 'text',
									),
								),
							),
						),
					),
				),
				'<section><div>outer<div>inner</div></div></section>',
				// A nested query runs through `querySelectorAll()` on each
				// matched item, which never matches the item itself.
				array(
					'rows' => array(
						array( 'inner' => array( array( 'txt' => 'inner' ) ) ),
						array( 'inner' => array() ),
					),
				),
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
			'attribute prefix'     => array( 'a[href^="https"]', '<a href="https://example.com">One</a>', true ),
			'attribute suffix'     => array( 'a[href$=".pdf"]', '<a href="/files/a.pdf">One</a>', true ),
			'attribute substring'  => array( 'a[href*="example"]', '<a href="https://example.com">One</a>', true ),
			'attribute dash'       => array( 'p[lang|="en"]', '<p lang="en-GB">One</p>', true ),
			'attribute dash exact' => array( 'p[lang|=en]', '<p lang="en">One</p>', true ),
			// A valueless attribute has the empty string for its DOM value.
			'valueless equality'   => array( 'p[data-x=""]', '<p data-x>One</p>', true ),
			// `^=`, `$=` and `*=` with an empty string match nothing, per CSS.
			'empty prefix'         => array( 'a[href^=""]', '<a href="https://example.com">One</a>', false ),
			'has descendant'       => array( 'figure:has(img)', '<figure><a><img src="/a.png" /></a></figure>', true ),
			'has direct child'     => array( 'pre:has(> code)', '<pre><code>One</code></pre>', true ),
			'has direct child not' => array( 'pre:has(> code)', '<pre><span><code>One</code></span></pre>', false ),
			'not'                  => array( 'pre:not(:has(> code))', '<pre>One</pre>', true ),
			'not mismatch'         => array( 'pre:not(:has(> code))', '<pre><code>One</code></pre>', false ),
			'only child'           => array( 'pre:has(> code:only-child)', '<pre><code>One</code></pre>', true ),
			'only child text'      => array( 'pre:has(> code:only-child)', '<pre>Text <code>One</code></pre>', true ),
			'only child mismatch'  => array( 'pre:has(> code:only-child)', '<pre><code>One</code><code>Two</code></pre>', false ),
		);
	}

	/**
	 * An unsupported selector must match nothing rather than match more than it
	 * names: the editor throws on it and `getRawTransforms()` treats the throw
	 * as "no match", so failing open would convert markup the editor leaves alone.
	 *
	 * @dataProvider data_unsupported_selectors
	 *
	 * @param string $selector Selector using CSS the server does not support.
	 * @param string $html     Markup whose first element the selector is matched against.
	 */
	public function test_unsupported_selectors_match_nothing( $selector, $html ) {
		$this->setExpectedIncorrectUsage( 'Gutenberg_HTML_Element::parse_selector_list' );

		$root    = Gutenberg_HTML_Element::from_html( $html );
		$element = $root->child_elements()[0];

		$this->assertFalse( $element->matches( $selector ) );
	}

	/**
	 * Data provider.
	 *
	 * Every selector here must be unique across the suite: the parse result is
	 * cached, so a repeat would not raise the notice a second time.
	 *
	 * @return array[]
	 */
	public static function data_unsupported_selectors() {
		return array(
			'structural pseudo-class' => array( 'p:first-child', '<p>One</p>' ),
			'functional pseudo-class' => array( 'p:nth-child(2)', '<p>One</p>' ),
			'pseudo-element'          => array( 'p::before', '<p>One</p>' ),
			'matches-any'             => array( ':is(p)', '<p>One</p>' ),
			'specificity-zero'        => array( ':where(p)', '<p>One</p>' ),
			'unsupported in a list'   => array( 'p, :is(h1)', '<p>One</p>' ),
			'adjacent sibling'        => array( 'p + p', '<p>One</p>' ),
			'general sibling'         => array( 'p ~ p', '<p>One</p>' ),
			'case-insensitivity flag' => array( 'a[href="x" i]', '<a href="x">One</a>' ),
			'unknown operator'        => array( 'a[href!="x"]', '<a href="y">One</a>' ),
			'unclosed bracket'        => array( 'p[data-x', '<p data-x="1">One</p>' ),
			'unclosed parenthesis'    => array( 'p:has(', '<p><span>One</span></p>' ),
			// `:not()` takes a complex selector in CSS; the editor's engine
			// takes only compound ones, so a combinator inside must refuse
			// loudly rather than match as if it were not there.
			'relative argument'       => array( 'div:not(> p)', '<div>One</div>' ),
		);
	}

	public function test_matches_a_child_combinator_against_the_child() {
		$root = Gutenberg_HTML_Element::from_html( '<ul><li>One</li></ul>' );
		$list = $root->child_elements()[0];
		$item = $list->child_elements()[0];

		$this->assertTrue( $item->matches( 'ol > li, ul > li' ) );
		$this->assertFalse( $list->matches( 'ol > li, ul > li' ) );

		// The same item with no list around it, which is what a stray one in
		// converted markup looks like.
		$stray = Gutenberg_HTML_Element::from_html( '<li>One</li>' )->child_elements()[0];

		$this->assertFalse( $stray->matches( 'ol > li, ul > li' ) );
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

	public function test_refuses_a_multi_block_selection() {
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

		// A declared transform maps one block's attributes onto another's and
		// has no way to say how several blocks' attributes combine.
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
						'selector'  => 'video',
						'attribute' => 'src',
					),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'             => 'raw',
							'selector'         => 'figure:has(video)',
							'serverConversion' => false,
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<figure><video src="/a.mp4"></video></figure>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/html', $blocks[0]['blockName'] );
		$this->assertStringContainsString( '<video src="/a.mp4">', $blocks[0]['innerHTML'] );
	}

	/**
	 * `rawHandler()` normalises with `{ raw: true }`, so a single `<br>` stays
	 * inside its paragraph, content following a paragraph joins it, and empty
	 * paragraphs are deliberate content rather than noise.
	 *
	 * @dataProvider data_normalisation
	 *
	 * @param string   $html     Markup to convert.
	 * @param string[] $expected Inner HTML of each block the conversion produces.
	 */
	public function test_normalises_loose_content_like_the_editor( $html, $expected ) {
		$this->register_test_blocks();

		$blocks = gutenberg_html_to_blocks( $html );

		$this->assertSame( $expected, wp_list_pluck( $blocks, 'innerHTML' ) );
	}

	/**
	 * Data provider.
	 *
	 * Every expectation here was taken from `normaliseBlocks( html, { raw: true } )`.
	 *
	 * @return array[]
	 */
	public static function data_normalisation() {
		return array(
			'single line break kept'   => array( 'One<br>Two', array( '<p>One<br>Two</p>' ) ),
			'double line break splits' => array( 'One<br><br>Two', array( '<p>One</p>', '<p>Two</p>' ) ),
			'triple line break'        => array( 'One<br><br><br>Two', array( '<p>One</p>', '<p>Two</p>' ) ),
			'leading line break'       => array( '<br>One', array( '<p>One</p>' ) ),
			'trailing line break'      => array( 'One<br>', array( '<p>One<br></p>' ) ),
			'text joins a paragraph'   => array( '<p>One</p>Two', array( '<p>OneTwo</p>' ) ),
			'phrasing joins it too'    => array( '<p>One</p><em>Two</em>', array( '<p>One<em>Two</em></p>' ) ),
			'a block ends it'          => array( '<p>One</p><h1>Two</h1>Three', array( '<p>One</p>', '<h1 class="wp-block-test-heading">Two</h1>', '<p>Three</p>' ) ),
			'empty paragraph kept'     => array( '<p></p><p>Two</p>', array( '<p></p>', '<p>Two</p>' ) ),
			'empty paragraph between'  => array( '<p>One</p><p></p><p>Two</p>', array( '<p>One</p>', '<p></p>', '<p>Two</p>' ) ),
		);
	}

	/**
	 * @dataProvider data_special_comments
	 *
	 * @param string $html     Markup to convert.
	 * @param array  $expected Block name and inner HTML of each block the conversion produces.
	 */
	public function test_converts_special_comments_like_the_editor( $html, $expected ) {
		$blocks = gutenberg_html_to_blocks( $html );
		$actual = array();

		foreach ( $blocks as $block ) {
			$actual[] = array( $block['blockName'], $block['innerHTML'] );
		}

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Data provider.
	 *
	 * Every expectation here was taken from `rawHandler()`.
	 *
	 * @return array[]
	 */
	public static function data_special_comments() {
		return array(
			'between paragraphs'          => array(
				'<p>Before</p><!--more--><p>After</p>',
				array(
					array( 'core/paragraph', '<p>Before</p>' ),
					array( 'core/more', '<!--more-->' ),
					array( 'core/paragraph', '<p>After</p>' ),
				),
			),
			'inside a paragraph'          => array(
				'<p>Before<!--more-->After</p>',
				array(
					array( 'core/paragraph', '<p>Before</p>' ),
					array( 'core/more', '<!--more-->' ),
					array( 'core/paragraph', '<p>After</p>' ),
				),
			),
			'alone in a paragraph'        => array(
				'<p><!--more--></p>',
				array( array( 'core/more', '<!--more-->' ) ),
			),
			'between text'                => array(
				'Text<!--more-->More',
				array(
					array( 'core/paragraph', '<p>Text</p>' ),
					array( 'core/more', '<!--more-->' ),
					array( 'core/paragraph', '<p>More</p>' ),
				),
			),
			'no teaser'                   => array(
				"<p>Before</p><!--more-->\n<!--noteaser-->\n<p>After</p>",
				array(
					array( 'core/paragraph', '<p>Before</p>' ),
					array( 'core/more', "<!--more-->\n<!--noteaser-->" ),
					array( 'core/paragraph', '<p>After</p>' ),
				),
			),
			'custom text'                 => array(
				'<p>Before</p><!--more Read on--><p>After</p>',
				array(
					array( 'core/paragraph', '<p>Before</p>' ),
					array( 'core/more', '<!--more Read on-->' ),
					array( 'core/paragraph', '<p>After</p>' ),
				),
			),
			'page break in a paragraph'   => array(
				'<p>Before<!--nextpage-->After</p>',
				array(
					array( 'core/paragraph', '<p>Before</p>' ),
					array( 'core/nextpage', '<!--nextpage-->' ),
					array( 'core/paragraph', '<p>After</p>' ),
				),
			),
			'inside a division'           => array(
				// Only top-level elements become blocks, so the marker splits
				// its container instead of being swallowed into it.
				'<div><p>Intro</p><!--more--><p>Rest</p></div>',
				array(
					array( 'core/html', '<div><p>Intro</p></div>' ),
					array( 'core/more', '<!--more-->' ),
					array( 'core/html', '<div><p>Rest</p></div>' ),
				),
			),
			'nested containers'           => array(
				'<section><div><h2>a</h2><!--more--><h2>b</h2></div></section>',
				array(
					array( 'core/html', '<section><div><h2>a</h2></div></section>' ),
					array( 'core/more', '<!--more-->' ),
					array( 'core/html', '<section><div><h2>b</h2></div></section>' ),
				),
			),
			'alone in a division'         => array(
				'<div><!--more--></div>',
				array( array( 'core/more', '<!--more-->' ) ),
			),
			'media before the marker'     => array(
				// The editor promotes the image out before the marker splits
				// the division, whose emptied halves are then dropped.
				'<div><img src="x.png"><!--more--></div>',
				array(
					array( 'core/image', '<figure class="wp-block-image"><img src="x.png"></figure>' ),
					array( 'core/more', '<!--more-->' ),
				),
			),
			'media after the marker'      => array(
				// Split first, then promoted out of the half the split made,
				// which stays behind empty, exactly as the editor leaves it.
				'<div><!--more--><img src="x.png"></div>',
				array(
					array( 'core/more', '<!--more-->' ),
					array( 'core/image', '<figure class="wp-block-image"><img src="x.png"></figure>' ),
					array( 'core/html', '<div></div>' ),
				),
			),
			'paragraph halves built bare' => array(
				// As the editor builds them, with `createElement( 'p' )`:
				// keeping the source markup would duplicate its `id`.
				'<p id="intro">Teaser<!--more-->Rest.</p>',
				array(
					array( 'core/paragraph', '<p>Teaser</p>' ),
					array( 'core/more', '<!--more-->' ),
					array( 'core/paragraph', '<p>Rest.</p>' ),
				),
			),
		);
	}

	public function test_reads_the_teaser_flag_off_a_more_comment() {
		$blocks = gutenberg_html_to_blocks( '<p>Before<!--more--><!--noteaser-->After</p>' );

		$this->assertSame( 'core/more', $blocks[1]['blockName'] );
		$this->assertSame( array( 'noTeaser' => true ), $blocks[1]['attrs'] );
	}

	public function test_normalises_a_more_comment_to_what_the_block_saves() {
		// The source spells the marker loosely; the block saves it one way, and
		// markup that does not match `save()` is an invalid block.
		$blocks = gutenberg_html_to_blocks( '<p>Before</p><!--more   Read on  --><p>After</p>' );

		$this->assertSame( '<!--more Read on-->', $blocks[1]['innerHTML'] );
		$this->assertSame( array( 'customText' => 'Read on' ), $blocks[1]['attrs'] );
	}

	/**
	 * `normalise()` decides what joins a paragraph from the same list
	 * `isPhrasingContent()` reads, so an element the editor leaves standing on
	 * its own must not be swept into one here.
	 *
	 * @dataProvider data_non_phrasing_elements
	 *
	 * @param string $html Markup whose first element is not phrasing content.
	 */
	public function test_leaves_non_phrasing_elements_out_of_paragraphs( $html ) {
		$blocks = gutenberg_html_to_blocks( $html );

		$this->assertStringNotContainsString( '<p>', $blocks[0]['innerHTML'] );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public static function data_non_phrasing_elements() {
		return array(
			'cite'     => array( '<cite>A citation</cite>' ),
			'iframe'   => array( '<iframe src="/x"></iframe>' ),
			'label'    => array( '<label>A label</label>' ),
			'select'   => array( '<select><option>One</option></select>' ),
			'input'    => array( '<input value="x">' ),
			'progress' => array( '<progress value="1"></progress>' ),
			'picture'  => array( '<picture><img src="/a.png"></picture>' ),
		);
	}

	public function test_keeps_ruby_annotations_inside_a_paragraph() {
		// `rt` and `rp` are phrasing content the server used to leave out.
		$blocks = gutenberg_html_to_blocks( '<rt>note</rt>' );

		$this->assertStringContainsString( '<p>', $blocks[0]['innerHTML'] );
	}

	/**
	 * @dataProvider data_text_alignment
	 *
	 * @param string      $html     Markup to convert.
	 * @param string|null $expected Alignment the block is expected to carry, or null for none.
	 */
	public function test_reads_inline_text_alignment( $html, $expected ) {
		$blocks = gutenberg_html_to_blocks( $html );
		$actual = isset( $blocks[0]['attrs']['style']['typography']['textAlign'] )
			? $blocks[0]['attrs']['style']['typography']['textAlign']
			: null;

		$this->assertSame( $expected, $actual );

		// The alignment is saved as a class, so the markup has to carry it or
		// the block does not match what `save()` produces.
		if ( null === $expected ) {
			$this->assertStringNotContainsString( 'has-text-align', $blocks[0]['innerHTML'] );
		} else {
			$this->assertStringContainsString( "has-text-align-$expected", $blocks[0]['innerHTML'] );
		}
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public static function data_text_alignment() {
		return array(
			'centred paragraph'   => array( '<p style="text-align:center">One</p>', 'center' ),
			'right paragraph'     => array( '<p style="text-align:right">One</p>', 'right' ),
			'left paragraph'      => array( '<p style="text-align:left">One</p>', 'left' ),
			'among other styles'  => array( '<p style="color:red;text-align:center;margin:0">One</p>', 'center' ),
			'spaced out'          => array( '<p style="text-align : center">One</p>', 'center' ),
			'uppercase property'  => array( '<p style="TEXT-ALIGN:center">One</p>', 'center' ),
			'centred heading'     => array( '<h2 style="text-align:center">One</h2>', 'center' ),
			'a value blocks omit' => array( '<p style="text-align:justify">One</p>', null ),
			'no alignment'        => array( '<p style="color:red">One</p>', null ),
			'no style at all'     => array( '<p>One</p>', null ),
		);
	}

	public function test_writes_a_declared_attribute_path_into_a_nested_attribute() {
		$this->register(
			'test/aligned',
			array(
				'attributes' => array(
					'style' => array( 'type' => 'object' ),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'raw',
							'selector'   => 'aside',
							'attributes' => array(
								'style.typography.textAlign' => array(
									'type'     => 'string',
									'source'   => 'style',
									'property' => 'text-align',
								),
								'style.color.text' => array(
									'type'     => 'string',
									'source'   => 'style',
									'property' => 'color',
								),
							),
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<aside style="text-align:center;color:#f00">One</aside>' );

		$this->assertSame(
			array(
				'style' => array(
					'typography' => array( 'textAlign' => 'center' ),
					'color'      => array( 'text' => '#f00' ),
				),
			),
			$blocks[0]['attrs']
		);
	}

	/**
	 * A `requires` schema names the wrapper attributes a block can write back as
	 * well as its content, so markup carrying one the block would drop is left
	 * alone rather than converted into a block that has lost it.
	 *
	 * @dataProvider data_list_wrapper_attributes
	 *
	 * @param string $html     Markup to convert.
	 * @param string $expected Name of the block the conversion is expected to produce.
	 */
	public function test_declines_a_list_carrying_what_it_cannot_save( $html, $expected ) {
		$blocks = gutenberg_html_to_blocks( $html );

		$this->assertSame( $expected, $blocks[0]['blockName'] );

		// Declining is only worth it if nothing is lost by it.
		if ( 'core/html' === $expected ) {
			$this->assertSame( $html, $blocks[0]['innerHTML'] );
		}
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public static function data_list_wrapper_attributes() {
		return array(
			'plain list'      => array( '<ul><li>One</li></ul>', 'core/list' ),
			'start'           => array( '<ol start="3"><li>One</li></ol>', 'core/list' ),
			'reversed'        => array( '<ol reversed><li>One</li></ol>', 'core/list' ),
			'numbering style' => array( '<ol type="A"><li>One</li></ol>', 'core/html' ),
			'inline style'    => array( '<ul style="margin:0"><li>One</li></ul>', 'core/html' ),
		);
	}

	public function test_keeps_the_attributes_block_supports_write_back() {
		// `class` and `id` are written by the `customClassName` and `anchor`
		// supports, so a `requires` schema does not have to name them.
		$blocks = gutenberg_html_to_blocks( '<ol id="x" class="y"><li>One</li></ol>' );

		$this->assertSame( 'core/list', $blocks[0]['blockName'] );
		$this->assertSame( 'x', $blocks[0]['attrs']['anchor'] );
		$this->assertSame( 'y', $blocks[0]['attrs']['className'] );
	}

	public function test_keeps_an_inner_block_where_it_stood() {
		// A nested list sits between the text before it and the text after it.
		// Appending every inner block after the rest of the content would run
		// the two together and move the list to the end.
		$blocks = gutenberg_html_to_blocks( '<ul><li>One<ul><li>Nested</li></ul>After</li></ul>' );

		$item = $blocks[0]['innerBlocks'][0];

		$this->assertSame( 'core/list-item', $item['blockName'] );
		$this->assertCount( 1, $item['innerBlocks'] );
		$this->assertSame( 'core/list', $item['innerBlocks'][0]['blockName'] );

		$this->assertSame(
			array( '<li>One', null, 'After</li>' ),
			$item['innerContent']
		);
	}

	public function test_writes_nothing_between_adjacent_inner_blocks() {
		$this->register_test_blocks();
		$this->register(
			'test/group',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'        => 'raw',
							'selector'    => 'section',
							'innerBlocks' => 'p',
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<section><p>One</p><p>Two</p></section>' );

		// `parse_blocks()` writes no empty string between two inner blocks that
		// stood next to each other.
		$this->assertSame(
			array( '<section class="wp-block-test-group">', null, null, '</section>' ),
			$blocks[0]['innerContent']
		);
	}

	public function test_refuses_a_transform_callback_written_as_text() {
		// `block.json` is JSON, and JSON can spell a callback name as a
		// string; PHP would resolve it to whatever global function bears
		// that name.
		$this->setExpectedIncorrectUsage( 'Gutenberg_Block_Transforms::is_runnable_callback' );

		$this->register(
			'test/named-callback',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'    => 'raw',
							'isMatch' => 'phpversion',
						),
					),
				),
			)
		);

		// The transform matches nothing rather than calling `phpversion()`.
		$blocks = gutenberg_html_to_blocks( '<aside>One</aside>' );

		$this->assertSame( 'core/html', $blocks[0]['blockName'] );
	}

	public function test_refuses_a_transform_callback_written_as_a_static_method() {
		// JSON spells `["Some_Class", "some_method"]` as easily as a string,
		// and decoding it out of a `block.json` file must not hand the
		// conversion an arbitrary static method to call.
		$this->setExpectedIncorrectUsage( 'Gutenberg_Block_Transforms::is_runnable_callback' );

		self::$static_callback_calls = 0;

		$this->register(
			'test/static-callback',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'      => 'raw',
							'selector'  => 'aside',
							'transform' => array( __CLASS__, 'record_static_callback' ),
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<aside>One</aside>' );

		// The transform still matches — its generic conversion runs — but the
		// named static method is never called.
		$this->assertSame( 'test/static-callback', $blocks[0]['blockName'] );
		$this->assertSame( 0, self::$static_callback_calls );
	}

	/**
	 * How often the refused static callback ran, which must stay zero.
	 *
	 * @var int
	 */
	public static $static_callback_calls = 0;

	/**
	 * Stands in for a static method a `block.json` file could name.
	 *
	 * @return null
	 */
	public static function record_static_callback() {
		++self::$static_callback_calls;

		return null;
	}

	public function test_refuses_an_attribute_source_naming_no_attribute() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Block_Attributes_Parser::apply_source' );

		$this->register(
			'test/nameless-attribute',
			array(
				'attributes' => array(
					'value' => array(
						'type'   => 'string',
						'source' => 'attribute',
					),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'aside',
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<aside data-x="1">One</aside>' );

		$this->assertSame( 'test/nameless-attribute', $blocks[0]['blockName'] );
		$this->assertArrayNotHasKey( 'value', $blocks[0]['attrs'] );
	}

	/**
	 * @dataProvider data_unusable_shortcode_tags
	 *
	 * @param string $tag Shortcode tag a block declares.
	 */
	public function test_refuses_a_shortcode_tag_that_would_break_the_pattern( $tag ) {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Shortcode_Transforms::is_usable_tag' );

		$this->register(
			'test/shortcode-' . md5( $tag ),
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type' => 'shortcode',
							'tag'  => $tag,
						),
					),
				),
			)
		);

		/*
		 * The block's own transform never runs; the shortcode falls to the
		 * Shortcode block, which is lossless, rather than being matched
		 * against a pattern that does not mean what the block wrote.
		 */
		$blocks = gutenberg_html_to_blocks( '<p>[thing]</p>' );

		$this->assertSame( 'core/shortcode', $blocks[0]['blockName'] );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public static function data_unusable_shortcode_tags() {
		return array(
			'pattern delimiter' => array( 'thing#' ),
			'capturing group'   => array( '(thing)' ),
			'invalid pattern'   => array( '*thing' ),
		);
	}

	/**
	 * @dataProvider data_lone_brackets
	 *
	 * @param string $html     Markup holding a shortcode.
	 * @param string $expected Text the match is expected to cover.
	 * @param int    $index    Offset the match is expected to start at.
	 */
	public function test_reads_a_shortcode_past_a_lone_bracket( $html, $expected, $index ) {
		$next = new ReflectionMethod( 'Gutenberg_Shortcode_Transforms', 'next' );

		/*
		 * ReflectionMethod::setAccessible is:
		 * - needed until 8.1.0, as `next` is private
		 * - redundant as of 8.1.0, which made all methods accessible
		 * - deprecated as of 8.5.0
		 */
		if ( PHP_VERSION_ID < 80100 ) {
			$next->setAccessible( true );
		}

		$match = $next->invoke( null, 'gallery', $html );

		$this->assertSame( $expected, $match['text'] );
		$this->assertSame( $index, $match['index'] );
	}

	/**
	 * Data provider.
	 *
	 * Every expectation here was taken from `next()` in `@wordpress/shortcode`.
	 *
	 * @return array[]
	 */
	public static function data_lone_brackets() {
		return array(
			'plain'            => array( '[gallery]', '[gallery]', 0 ),
			'in a sentence'    => array( 'a [gallery] b', '[gallery]', 2 ),
			'leading bracket'  => array( '[[gallery]', '[gallery]', 1 ),
			'trailing bracket' => array( '[gallery]]', '[gallery]', 0 ),
			'both, mid text'   => array( 'x[[gallery] y', '[gallery]', 2 ),
		);
	}

	public function test_orders_shortcode_transforms_across_blocks_by_registration() {
		/*
		 * Two blocks declaring the same shortcode at the same priority resolve
		 * in the order they were registered. `usort` is only stable from PHP
		 * 8.0, so the ordering has to come from a counter spanning the whole
		 * registry rather than each block's own list.
		 */
		foreach ( array( 'test/first-shortcode', 'test/second-shortcode' ) as $block_name ) {
			$this->register(
				$block_name,
				array(
					'attributes' => array(
						'text' => array(
							'type'     => 'string',
							'source'   => 'raw',
							'selector' => '',
						),
					),
					'transforms' => array(
						'from' => array(
							array(
								'type'       => 'shortcode',
								'tag'        => 'testthing',
								'attributes' => array(
									'text' => array( 'source' => 'shortcodeText' ),
								),
							),
						),
					),
				)
			);
		}

		$blocks = gutenberg_html_to_blocks( "<p>Before</p>\n[testthing]\n<p>After</p>" );
		$names  = wp_list_pluck( $blocks, 'blockName' );

		$this->assertContains( 'test/first-shortcode', $names );
		$this->assertNotContains( 'test/second-shortcode', $names );
	}

	public function test_leaves_media_in_place_when_nothing_converts_it() {
		$this->register_test_blocks();

		// No registered block claims a figure holding a video, so wrapping it
		// in one would invent markup the source never had.
		$blocks = gutenberg_html_to_blocks( '<p><video src="/a.mp4"></video></p>' );

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
						'selector'  => 'video',
						'attribute' => 'src',
					),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'figure:has(video)',
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<p><video src="/a.mp4"></video></p>' );

		$this->assertSame( 'test/picture', $blocks[0]['blockName'] );
		$this->assertStringContainsString( '<video src="/a.mp4">', $blocks[0]['innerHTML'] );

		/*
		 * The paragraph the media came out of is left behind empty, which is
		 * what `figureContentReducer()` followed by `normaliseBlocks()` in raw
		 * mode does: `<p><img></p>` becomes an Image block and an empty
		 * Paragraph in the editor too.
		 */
		$this->assertCount( 2, $blocks );
		$this->assertSame( 'test/paragraph', $blocks[1]['blockName'] );
		$this->assertSame( '<p></p>', $blocks[1]['innerHTML'] );
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
							'selector' => 'figure:has(video)',
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<p>See <video src="/a.mp4"></video> here.</p>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'test/paragraph', $blocks[0]['blockName'] );

		// Aligned media leaves even when the paragraph carries text.
		$aligned = gutenberg_html_to_blocks( '<p>See <video class="alignright" src="/a.mp4"></video> here.</p>' );

		$this->assertSame( 'test/picture', $aligned[0]['blockName'] );
	}

	public function test_reads_an_absent_boolean_attribute_as_false() {
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
							// Ahead of the List block, which also claims `ol`.
							'priority'   => 5,
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

		// The editor's `toBooleanAttributeMatcher()` derives `false` from
		// markup without the attribute, so the server has to as well.
		$this->assertFalse( $plain[0]['attrs']['reversed'] );

		$reversed = gutenberg_html_to_blocks( '<ol reversed><li>One</li></ol>' );

		$this->assertTrue( $reversed[0]['attrs']['reversed'] );
	}

	public function test_takes_the_generated_class_from_block_supports() {
		$this->register(
			'test/plain',
			array(
				'attributes' => array(),
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'aside',
						),
					),
				),
			)
		);

		// `wp_apply_generated_classname_support()` is what decides this, the
		// same call the editor's wrapper goes through.
		$blocks = gutenberg_html_to_blocks( '<aside>Note</aside>' );

		$this->assertSame( '<aside>Note</aside>', $blocks[0]['innerHTML'] );
	}

	public function test_reduces_a_repeated_class_to_one() {
		$this->register_test_blocks();

		// `save` emits each class once, so markup repeating one would not match
		// it and the editor would flag the block.
		$blocks = gutenberg_html_to_blocks( '<p class="intro intro">Text</p>' );

		$this->assertSame( '<p class="intro">Text</p>', $blocks[0]['innerHTML'] );
	}

	public function test_reports_which_blocks_a_conversion_can_produce() {
		$this->register(
			'test/aside',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'aside',
						),
					),
				),
			)
		);
		$this->register(
			'test/picture',
			array(
				'attributes' => array(),
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

		$support = gutenberg_get_block_conversion_support();

		$this->assertContains( 'test/aside', $support['converts'] );
		$this->assertNotContains( 'test/aside', $support['declines'] );

		$this->assertContains( 'test/picture', $support['declines'] );
		$this->assertNotContains( 'test/picture', $support['converts'] );
	}

	public function test_drops_a_wrapper_attribute_the_block_cannot_hold() {
		$this->register(
			'test/note',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'aside',
						),
					),
				),
			)
		);

		// `save` would not put these back, so keeping them makes the block
		// invalid, and a deprecation sourcing content without a selector then
		// absorbs the whole element as the block's content.
		$blocks = gutenberg_html_to_blocks( '<aside style="color:red" dir="rtl" data-legacy="1">Text</aside>' );

		$this->assertSame( '<aside class="wp-block-test-note">Text</aside>', $blocks[0]['innerHTML'] );
	}

	public function test_keeps_a_wrapper_attribute_the_block_sources() {
		$this->register(
			'test/counter',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'raw',
							'selector'   => 'aside',
							'attributes' => array(
								'count' => array(
									'type'      => 'number',
									'source'    => 'attribute',
									'attribute' => 'data-count',
								),
							),
						),
					),
				),
			)
		);

		// `save` writes a sourced attribute back out, so this one stays while
		// the rest of the wrapper is cleared.
		$blocks = gutenberg_html_to_blocks( '<aside data-count="3" title="tip">Items</aside>' );

		$this->assertSame( '<aside class="wp-block-test-counter" data-count="3">Items</aside>', $blocks[0]['innerHTML'] );
	}

	public function test_drops_an_attribute_the_content_schema_does_not_allow() {
		$this->register_schema_block();

		$blocks = gutenberg_html_to_blocks( '<aside><b class="x">Marked</b></aside>' );

		$this->assertSame( '<aside class="wp-block-test-schema"><b>Marked</b></aside>', $blocks[0]['innerHTML'] );
	}

	public function test_keeps_an_attribute_the_content_schema_allows() {
		$this->register_schema_block();

		$blocks = gutenberg_html_to_blocks( '<aside><b data-lang="js" id="z">Marked</b></aside>' );

		$this->assertSame( '<aside class="wp-block-test-schema"><b data-lang="js">Marked</b></aside>', $blocks[0]['innerHTML'] );
	}

	public function test_unwraps_an_element_the_content_schema_does_not_name() {
		$this->register_schema_block();

		// `deepFilterHTML` keeps the content of an element it does not allow
		// and drops the element, rather than dropping both.
		$blocks = gutenberg_html_to_blocks( '<aside><i>Emphasis</i></aside>' );

		$this->assertSame( '<aside class="wp-block-test-schema">Emphasis</aside>', $blocks[0]['innerHTML'] );
	}

	public function test_removes_content_a_schema_declares_no_children_for() {
		$this->register(
			'test/rule',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'section',
							'schema'   => array( 'section' => array() ),
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<section>Dropped<b>too</b></section>' );

		$this->assertSame( '<section class="wp-block-test-rule"></section>', $blocks[0]['innerHTML'] );
	}

	public function test_reads_the_default_attributes_of_a_schema_that_varies_by_context() {
		$this->register(
			'test/varies',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'article',
							'schema'   => array(
								'article' => array(
									'children' => array(
										'p' => array(
											'attributes' => array(
												'default' => array( 'lang' ),
												'paste'   => array(),
											),
											'children'   => array( '#text' => array() ),
										),
									),
								),
							),
						),
					),
				),
			)
		);

		// Conversion is not a paste, so `default` is the list that applies.
		$blocks = gutenberg_html_to_blocks( '<article><p lang="en" dir="rtl">Quoted</p></article>' );

		$this->assertSame( '<article class="wp-block-test-varies"><p lang="en">Quoted</p></article>', $blocks[0]['innerHTML'] );
	}

	public function test_leaves_content_alone_when_the_schema_allows_anything() {
		$this->register(
			'test/anything',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'nav',
							'schema'   => array( 'nav' => array( 'children' => '*' ) ),
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<nav><b class="x">Kept</b></nav>' );

		$this->assertSame( '<nav class="wp-block-test-anything"><b class="x">Kept</b></nav>', $blocks[0]['innerHTML'] );
	}

	/**
	 * Registers a block whose transform declares a content schema.
	 *
	 * @return void
	 */
	private function register_schema_block() {
		$this->register(
			'test/schema',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'aside',
							'schema'   => array(
								'aside' => array(
									'children' => array(
										'#text' => array(),
										'b'     => array(
											'attributes' => array( 'data-lang' ),
											'children'   => array( '#text' => array() ),
										),
									),
								),
							),
						),
					),
				),
			)
		);
	}

	public function test_converts_media_a_block_can_save_back() {
		$blocks = gutenberg_html_to_blocks( '<figure><img src="/a.png" alt="A"><figcaption>Cap</figcaption></figure>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/image', $blocks[0]['blockName'] );
		$this->assertStringContainsString( '<figcaption>Cap</figcaption>', $blocks[0]['innerHTML'] );
	}

	public function test_leaves_media_carrying_markup_the_block_cannot_save() {
		// `save` writes the image class from the attachment ID, so source
		// classes it does not read cannot survive a round trip.
		$blocks = gutenberg_html_to_blocks( '<figure><img class="alignnone size-medium wp-image-9" src="/a.png" alt="A"></figure>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/html', $blocks[0]['blockName'] );
		$this->assertStringContainsString( 'wp-image-9', $blocks[0]['innerHTML'] );
	}

	public function test_converts_only_the_markup_a_conditional_transform_declares() {
		$this->register(
			'test/note',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'             => 'raw',
							'selector'         => 'aside',
							'serverConversion' => array(
								'requires' => array(
									'aside' => array(
										'children' => array(
											'b' => array(
												'children' => array( '#text' => array() ),
											),
										),
									),
								),
							),
						),
					),
				),
			)
		);

		$converted = gutenberg_html_to_blocks( '<aside><b>Kept</b></aside>' );
		$this->assertSame( 'test/note', $converted[0]['blockName'] );

		// An attribute the schema does not allow means the markup would not
		// survive being saved back, so it is left as it was.
		$declined = gutenberg_html_to_blocks( '<aside><b class="x">Kept</b></aside>' );
		$this->assertSame( 'core/html', $declined[0]['blockName'] );
		$this->assertStringContainsString( 'class="x"', $declined[0]['innerHTML'] );
	}

	public function test_reports_a_block_that_converts_only_some_markup() {
		$this->register(
			'test/sometimes',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'             => 'raw',
							'selector'         => 'aside',
							'serverConversion' => array(
								'requires' => array( 'aside' => array( 'children' => array( 'b' => array( 'children' => array( '#text' => array() ) ) ) ) ),
							),
						),
					),
				),
			)
		);

		$support = gutenberg_get_block_conversion_support();

		$this->assertContains( 'test/sometimes', $support['conditional'] );
		$this->assertNotContains( 'test/sometimes', $support['converts'] );
		$this->assertNotContains( 'test/sometimes', $support['declines'] );
	}

	public function test_turns_a_shortcode_standing_on_its_own_into_a_block() {
		$blocks = gutenberg_html_to_blocks( '<p>[contact-form-7 id="5" title="Contact"]</p>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/shortcode', $blocks[0]['blockName'] );
		$this->assertSame( '[contact-form-7 id="5" title="Contact"]', $blocks[0]['innerHTML'] );
	}

	public function test_keeps_a_shortcode_that_reads_as_part_of_a_sentence() {
		$blocks = gutenberg_html_to_blocks( '<p>See [myshortcode] here.</p>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/paragraph', $blocks[0]['blockName'] );
	}

	public function test_converts_the_markup_around_a_shortcode() {
		$blocks = gutenberg_html_to_blocks( '<p>Before.</p><p>[gallery ids="1,2"]</p><h2>After</h2>' );

		$this->assertSame(
			array( 'core/paragraph', 'core/shortcode', 'core/heading' ),
			array_column( $blocks, 'blockName' )
		);
	}

	public function test_leaves_an_escaped_shortcode_alone() {
		// `[[tag]]` is how a shortcode is written when it should be read
		// rather than run.
		$blocks = gutenberg_html_to_blocks( '<p>[[contact-form-7]]</p>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/paragraph', $blocks[0]['blockName'] );
	}

	public function test_reads_a_named_shortcode_attribute() {
		$this->register_shortcode_block(
			array(
				'src' => array(
					'type'      => 'string',
					'source'    => 'shortcodeAttribute',
					'attribute' => 'src',
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<p>[testmedia src="/a.mp3"]</p>' );

		$this->assertSame( 'test/media', $blocks[0]['blockName'] );
		$this->assertSame( '/a.mp3', $blocks[0]['attrs']['src'] );
	}

	public function test_reads_the_first_shortcode_attribute_a_transform_names() {
		$this->register_shortcode_block(
			array(
				'src' => array(
					'type'      => 'string',
					'source'    => 'shortcodeAttribute',
					'attribute' => array( 'src', 'mp3', 'ogg' ),
				),
			)
		);

		// A shortcode carries the value under whichever name it was written
		// with, so the transform names them in the order they win.
		$blocks = gutenberg_html_to_blocks( '<p>[testmedia ogg="/a.ogg"]</p>' );

		$this->assertSame( '/a.ogg', $blocks[0]['attrs']['src'] );
	}

	public function test_leaves_a_shortcode_to_the_shortcode_block_when_a_block_rebuilds_its_markup() {
		$this->register(
			'test/player',
			array(
				'attributes' => array( 'src' => array( 'type' => 'string' ) ),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'shortcode',
							'tag'        => 'testplayer',
							'attributes' => array(
								'src' => array(
									'type'      => 'string',
									'source'    => 'shortcodeAttribute',
									'attribute' => 'src',
								),
							),
						),
					),
				),
			)
		);

		// The block saves markup built from its attributes, which the server
		// cannot write, so the shortcode stays whole.
		$blocks = gutenberg_html_to_blocks( '<p>[testplayer src="/a.mp3"]</p>' );

		$this->assertSame( 'core/shortcode', $blocks[0]['blockName'] );
		$this->assertSame( '[testplayer src="/a.mp3"]', $blocks[0]['innerHTML'] );
	}

	public function test_keeps_markup_the_html_parser_will_not_read() {
		// The HTML API gives up on foster parenting, among other shapes
		// classic content is full of, and the markup has to survive that.
		$blocks = gutenberg_html_to_blocks( '<p>Intro</p><table>text<tr><td>c</td></tr></table>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/html', $blocks[0]['blockName'] );
		$this->assertStringContainsString( '<p>Intro</p>', $blocks[0]['innerHTML'] );
		$this->assertStringContainsString( 'text', $blocks[0]['innerHTML'] );
	}

	public function test_converts_markup_holding_a_comment_that_is_not_a_block() {
		// `parse_blocks()` reads this as one nameless block rather than as
		// block markup, which means it still has to go through conversion.
		$blocks = gutenberg_html_to_blocks( '<p>See <!-- wp: unterminated</p>' );

		$this->assertSame( 'core/paragraph', $blocks[0]['blockName'] );
	}

	public function test_tells_a_code_block_from_a_preformatted_one_by_what_the_pre_holds() {
		$cases = array(
			'<pre><code>echo 1;</code></pre>'            => 'core/code',
			'<pre>plain</pre>'                           => 'core/preformatted',

			// The <code> is not the whole of the <pre>, so nothing may be
			// dropped to make it one.
			'<pre>Intro <code>echo 1;</code> tail</pre>' => 'core/preformatted',
			'<pre><code>a</code><code>b</code></pre>'    => 'core/preformatted',
		);

		foreach ( $cases as $html => $expected ) {
			$this->assertSame( $expected, gutenberg_html_to_blocks( $html )[0]['blockName'], $html );
		}
	}

	public function test_leaves_a_list_item_standing_outside_a_list_alone() {
		// The List Item block declares `core/list` as its parent, so one at
		// the top level would be a block with nowhere to live.
		$blocks = gutenberg_html_to_blocks( '<li>Stray</li>' );

		$this->assertSame( 'core/html', $blocks[0]['blockName'] );
		$this->assertSame( '<li>Stray</li>', $blocks[0]['innerHTML'] );
	}

	public function test_reads_a_value_whose_declared_type_names_null_first() {
		$this->register(
			'test/nullable',
			array(
				'attributes' => array(
					'label' => array(
						'type'      => array( 'null', 'string' ),
						'source'    => 'attribute',
						'attribute' => 'data-label',
						'selector'  => 'aside',
					),
				),
			)
		);

		$this->assertSame(
			array( 'label' => 'Note' ),
			gutenberg_get_block_attributes_from_html( 'test/nullable', '<aside data-label="Note"></aside>' )
		);
	}

	public function test_ignores_a_wildcard_naming_the_target_of_a_transform() {
		$this->register_dynamic( 'test/source', array() );
		$this->register_dynamic(
			'test/other',
			array(
				'transforms' => array(
					'to' => array(
						array(
							'type'   => 'block',
							// Every block, which names no block to build.
							'blocks' => array( '*' ),
						),
					),
				),
			)
		);

		$block = array(
			'blockName'    => 'test/other',
			'attrs'        => array(),
			'innerBlocks'  => array(),
			'innerHTML'    => '',
			'innerContent' => array(),
		);

		$this->assertNull( gutenberg_switch_block_type( array( $block ), 'test/source' ) );
	}

	public function test_leaves_a_list_holding_more_than_its_items_alone() {
		// The List block saves its items and nothing else, so markup carrying
		// anything beside them cannot be reproduced. A nested list written as
		// a sibling rather than inside an item is the common shape.
		$this->assertSame( 'core/html', gutenberg_html_to_blocks( '<ul><li>a</li><ul><li>b</li></ul></ul>' )[0]['blockName'] );
		$this->assertSame( 'core/html', gutenberg_html_to_blocks( '<ul><li>a</li>stray<li>b</li></ul>' )[0]['blockName'] );

		// A list that holds only items still converts.
		$this->assertSame( 'core/list', gutenberg_html_to_blocks( '<ul><li>a</li><li>b</li></ul>' )[0]['blockName'] );
	}

	public function test_encodes_an_embed_url_the_way_the_block_saves_it() {
		// The URL is written into the markup as text, so an address carrying
		// an `&` has to be encoded or the block will not validate.
		$blocks = gutenberg_html_to_blocks( '<p>https://www.youtube.com/watch?v=abc&amp;list=xyz</p>' );

		$this->assertSame( 'https://www.youtube.com/watch?v=abc&list=xyz', $blocks[0]['attrs']['url'] );
		$this->assertStringContainsString( "\n" . 'https://www.youtube.com/watch?v=abc&amp;list=xyz' . "\n", $blocks[0]['innerHTML'] );
	}

	public function test_turns_a_url_standing_on_its_own_into_an_embed() {
		$blocks = gutenberg_html_to_blocks( '<p>https://vimeo.com/76979871</p>' );

		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/embed', $blocks[0]['blockName'] );
		$this->assertSame(
			array(
				'url'              => 'https://vimeo.com/76979871',
				'type'             => 'video',
				'providerNameSlug' => 'vimeo',
				'responsive'       => true,
			),
			$blocks[0]['attrs']
		);
	}

	public function test_writes_the_markup_the_embed_block_saves() {
		$blocks = gutenberg_html_to_blocks( '<p>https://vimeo.com/76979871</p>' );

		// The class names come from the attributes, so markup and attributes
		// have to be written together or the editor cannot validate the block.
		$this->assertSame(
			'<figure class="wp-block-embed is-type-video is-provider-vimeo wp-block-embed-vimeo">' .
			'<div class="wp-block-embed__wrapper">' . "\n" . 'https://vimeo.com/76979871' . "\n" . '</div>' .
			'</figure>',
			$blocks[0]['innerHTML']
		);
	}

	public function test_keeps_a_url_that_reads_as_part_of_a_sentence() {
		$blocks = gutenberg_html_to_blocks( '<p>Watch https://vimeo.com/76979871 tonight.</p>' );

		$this->assertSame( 'core/paragraph', $blocks[0]['blockName'] );
	}

	public function test_keeps_a_paragraph_naming_two_addresses() {
		$blocks = gutenberg_html_to_blocks( '<p>https://vimeo.com/1 https://vimeo.com/2</p>' );

		$this->assertSame( 'core/paragraph', $blocks[0]['blockName'] );
	}

	public function test_keeps_a_url_pointing_at_a_file() {
		// A file is something to link to rather than something a provider
		// can embed, unless the extension is one permalinks are built from.
		$this->assertSame( 'core/paragraph', gutenberg_html_to_blocks( '<p>https://example.com/a.pdf</p>' )[0]['blockName'] );
		$this->assertSame( 'core/embed', gutenberg_html_to_blocks( '<p>https://example.com/a.html</p>' )[0]['blockName'] );
	}

	public function test_keeps_a_url_that_is_not_secure() {
		$this->assertSame( 'core/paragraph', gutenberg_html_to_blocks( '<p>http://vimeo.com/76979871</p>' )[0]['blockName'] );
	}

	public function test_reads_a_url_someone_linked() {
		$blocks = gutenberg_html_to_blocks( '<p><a href="https://vimeo.com/76979871">https://vimeo.com/76979871</a></p>' );

		$this->assertSame( 'core/embed', $blocks[0]['blockName'] );
		$this->assertSame( 'https://vimeo.com/76979871', $blocks[0]['attrs']['url'] );
	}

	public function test_rewrites_an_x_address_to_twitter() {
		// The oEmbed registry has no X provider yet, which the editor works
		// around the same way.
		$blocks = gutenberg_html_to_blocks( '<p>https://x.com/wordpress/status/123</p>' );

		$this->assertSame( 'https://twitter.com/wordpress/status/123', $blocks[0]['attrs']['url'] );
		$this->assertSame( 'twitter', $blocks[0]['attrs']['providerNameSlug'] );
	}

	public function test_embeds_a_url_no_provider_claims() {
		// Anything the site's oEmbed registry recognises can be embedded, so
		// an unmatched address still becomes an embed, without the class
		// names a known provider would add.
		$blocks = gutenberg_html_to_blocks( '<p>https://example.com/talk/</p>' );

		$this->assertSame( 'core/embed', $blocks[0]['blockName'] );
		$this->assertSame( array( 'url' => 'https://example.com/talk/' ), $blocks[0]['attrs'] );
		$this->assertSame(
			'<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">' . "\n" . 'https://example.com/talk/' . "\n" . '</div></figure>',
			$blocks[0]['innerHTML']
		);
	}

	public function test_records_no_type_for_a_provider_serving_more_than_one_kind_of_media() {
		// Flickr answers `photo` for a photo and `video` for a video, so the
		// type belongs to the address rather than the provider. The editor
		// fills it in when the post is next opened.
		$blocks = gutenberg_html_to_blocks( '<p>https://flic.kr/p/abc</p>' );

		$this->assertSame( 'flickr', $blocks[0]['attrs']['providerNameSlug'] );
		$this->assertArrayNotHasKey( 'type', $blocks[0]['attrs'] );
	}

	public function test_keeps_the_class_the_paragraph_carried_on_the_embed() {
		$blocks = gutenberg_html_to_blocks( '<p class="lead">https://vimeo.com/76979871</p>' );

		$this->assertSame( 'lead', $blocks[0]['attrs']['className'] );
		$this->assertStringContainsString( 'wp-block-embed-vimeo lead"', $blocks[0]['innerHTML'] );
	}

	public function test_reports_that_a_conversion_can_produce_an_embed() {
		$this->assertContains( 'core/embed', gutenberg_get_block_conversion_support()['converts'] );
	}

	public function test_compiles_every_declared_provider_pattern() {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( 'core/embed' );
		$compile    = $this->accessible_method( 'Gutenberg_Embed_Transforms', 'compile_pattern' );
		$patterns   = 0;

		foreach ( (array) $block_type->variations as $variation ) {
			if ( empty( $variation['patterns'] ) ) {
				continue;
			}

			foreach ( $variation['patterns'] as $pattern ) {
				$this->assertNotNull(
					$compile->invoke( null, $pattern ),
					$variation['name'] . ': ' . $pattern
				);

				++$patterns;
			}
		}

		// An empty declaration would pass every assertion above.
		$this->assertGreaterThan( 0, $patterns );
	}

	public function test_converts_a_provider_registered_through_the_variations_filter() {
		$add_provider = static function ( $variations, $block_type ) {
			if ( 'core/embed' !== $block_type->name ) {
				return $variations;
			}

			$variations[] = array(
				'name'       => 'example-videos',
				'title'      => 'Example Videos Embed',
				'patterns'   => array( '^https://videos\\.example\\.com/.+' ),
				'attributes' => array(
					'providerNameSlug' => 'example-videos',
					'responsive'       => true,
				),
				'oembedType' => 'video',
			);

			return $variations;
		};

		add_filter( 'get_block_type_variations', $add_provider, 10, 2 );

		try {
			$blocks = gutenberg_html_to_blocks( '<p>https://videos.example.com/watch/1</p>' );
		} finally {
			remove_filter( 'get_block_type_variations', $add_provider );
		}

		// A provider registered from PHP is matched exactly as a declared
		// one: the point of reading the block's own variations.
		$this->assertSame( 'core/embed', $blocks[0]['blockName'] );
		$this->assertSame( 'example-videos', $blocks[0]['attrs']['providerNameSlug'] );
		$this->assertSame( 'video', $blocks[0]['attrs']['type'] );
		$this->assertStringContainsString( 'is-provider-example-videos', $blocks[0]['innerHTML'] );
		$this->assertStringContainsString( 'is-type-video', $blocks[0]['innerHTML'] );
	}

	public function test_refuses_a_provider_pattern_that_does_not_compile() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Embed_Transforms::compile_pattern' );

		$broken = static function ( $variations, $block_type ) {
			if ( 'core/embed' !== $block_type->name ) {
				return $variations;
			}

			$variations[] = array(
				'name'       => 'broken-provider',
				'title'      => 'Broken Provider Embed',
				'patterns'   => array( '^https://broken(\\.example' ),
				'attributes' => array( 'providerNameSlug' => 'broken-provider' ),
			);

			return $variations;
		};

		add_filter( 'get_block_type_variations', $broken, 10, 2 );

		try {
			$blocks = gutenberg_html_to_blocks( '<p>https://broken.example/x</p>' );
		} finally {
			remove_filter( 'get_block_type_variations', $broken );
		}

		// The pattern matches nothing rather than taking the conversion
		// down; the URL still becomes an embed the way any unclaimed one does.
		$this->assertSame( 'core/embed', $blocks[0]['blockName'] );
		$this->assertArrayNotHasKey( 'providerNameSlug', $blocks[0]['attrs'] );
	}

	/**
	 * `createShortcodeAttributes()` in the editor reads `shortcodeText` as
	 * `removep( autop( text ) )`; the server reads it as
	 * `remove_paragraphs( wpautop( text ) )`. Both runtimes assert this
	 * fixture, so a change to either port that drifts from the other fails
	 * one of the two suites. The editor's half lives in
	 * `test/integration/blocks-transforms-metadata.jsdom.test.js`.
	 *
	 * @dataProvider data_removep_parity
	 *
	 * @param string $input    Shortcode text as matched in classic content.
	 * @param string $expected Text the attribute stores.
	 */
	public function test_strips_shortcode_paragraphs_the_same_as_the_editor( $input, $expected ) {
		$remove_paragraphs = $this->accessible_method( 'Gutenberg_Shortcode_Transforms', 'remove_paragraphs' );

		$this->assertSame( $expected, $remove_paragraphs->invoke( null, wpautop( $input ) ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public static function data_removep_parity() {
		$cases = json_decode(
			file_get_contents( gutenberg_dir_path() . 'test/integration/fixtures/block-transforms/removep-parity.json' ),
			true
		);

		$data = array();

		foreach ( $cases as $at => $case ) {
			$label                       = str_replace( array( "\n", '"' ), array( '\n', "'" ), substr( $case['input'], 0, 40 ) );
			$data[ $at . ': ' . $label ] = array( $case['input'], $case['expected'] );
		}

		return $data;
	}

	/**
	 * The full phrasing content schema — attributes and nesting, not only tag
	 * names — held against the fixture the editor's
	 * `test/integration/phrasing-content-schema.test.js` asserts too.
	 */
	public function test_phrasing_schema_matches_the_shared_fixture() {
		$fixture = json_decode(
			file_get_contents( gutenberg_dir_path() . 'test/integration/fixtures/block-transforms/phrasing-content-schema.json' ),
			true
		);

		$schema  = $this->accessible_method( 'Gutenberg_HTML_To_Blocks', 'get_phrasing_content_schema' )->invoke( null );
		$resolve = $this->accessible_method( 'Gutenberg_HTML_To_Blocks', 'resolve_children_schema' );

		$text_level = $fixture['textLevel'];
		$childless  = $fixture['childless'];

		$expected_tags = array_merge( array_keys( $text_level ), array_keys( $fixture['embedded'] ) );
		$actual_tags   = array_keys( $schema );
		sort( $expected_tags );
		sort( $actual_tags );

		$this->assertSame( $expected_tags, $actual_tags );

		foreach ( array( $text_level, $fixture['embedded'] ) as $group ) {
			foreach ( $group as $tag => $definition ) {
				$declared = isset( $definition['attributes'] ) ? $definition['attributes'] : null;
				$actual   = isset( $schema[ $tag ]['attributes'] ) ? $schema[ $tag ]['attributes'] : null;

				$this->assertSame( array( $tag => $declared ), array( $tag => $actual ) );
			}
		}

		foreach ( array_keys( $text_level ) as $tag ) {
			if ( in_array( $tag, $childless, true ) ) {
				$this->assertArrayNotHasKey( 'children', $schema[ $tag ] );
				continue;
			}

			$children = $resolve->invoke( null, $tag, $schema[ $tag ]['children'] );

			$expected_children = array_merge( array_diff( array_keys( $text_level ), array( $tag ) ), array( 'img' ) );
			$actual_children   = array_keys( $children );
			sort( $expected_children );
			sort( $actual_children );

			$this->assertSame( array( $tag => $expected_children ), array( $tag => $actual_children ) );
		}

		// The nesting recurses one level at a time, each element excluding
		// only itself: `strong > em > strong` is allowed, `strong > strong`
		// is not.
		$strong_children = $resolve->invoke( null, 'strong', $schema['strong']['children'] );
		$em_children     = $resolve->invoke( null, 'em', $strong_children['em']['children'] );

		$this->assertArrayHasKey( 'strong', $em_children );
		$this->assertArrayNotHasKey( 'strong', $strong_children );

		$this->assertSame( '*', $schema['math']['children'] );
	}

	public function test_keeps_shortcode_content_that_is_not_utf8() {
		$this->register_shortcode_block( array() );

		/*
		 * Latin-1 bytes, as legacy content still carries: a `u`-modifier
		 * pattern returns null on them, which must not cascade into losing
		 * the content.
		 */
		$blocks = gutenberg_html_to_blocks( "<p>[testmedia]Caf\xE9 au lait[/testmedia]</p>" );

		// `text` reads from the block's own markup, so it is implied there
		// rather than written into the delimiter.
		$this->assertSame( 'test/media', $blocks[0]['blockName'] );
		$this->assertSame( "[testmedia]Caf\xE9 au lait[/testmedia]", $blocks[0]['innerHTML'] );
	}

	public function test_honours_a_shortcode_is_match_callback() {
		$this->register(
			'test/clip',
			array(
				'attributes' => array(
					'text' => array(
						'type'   => 'string',
						'source' => 'raw',
					),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'shortcode',
							'tag'        => 'clip',
							'isMatch'    => static function ( $attributes ) {
								return isset( $attributes['named']['src'] );
							},
							'attributes' => array(
								'text' => array(
									'type'   => 'string',
									'source' => 'shortcodeText',
								),
							),
						),
					),
				),
			)
		);

		$matched = gutenberg_html_to_blocks( '<p>[clip src="a.mp3"]</p>' );

		$this->assertSame( 'test/clip', $matched[0]['blockName'] );

		// Declined, the shortcode falls through to the next transform that
		// wants it — the Shortcode block's, exactly as the editor's
		// `segmentHTMLToShortcodeBlock` falls back.
		$declined = gutenberg_html_to_blocks( '<p>[clip]</p>' );

		$this->assertSame( 'core/shortcode', $declined[0]['blockName'] );
		$this->assertSame( '[clip]', $declined[0]['innerHTML'] );
	}

	public function test_refuses_a_shortcode_is_match_written_as_text() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Block_Transforms::is_runnable_callback' );

		$this->register(
			'test/named-match',
			array(
				'attributes' => array(
					'text' => array(
						'type'   => 'string',
						'source' => 'raw',
					),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'shortcode',
							'tag'        => 'namedmatch',
							// A name can be written into `block.json`, and
							// data must not choose what runs.
							'isMatch'    => 'is_string',
							'attributes' => array(
								'text' => array(
									'type'   => 'string',
									'source' => 'shortcodeText',
								),
							),
						),
					),
				),
			)
		);

		/*
		 * The refused callable is ignored, not honoured: the transform still
		 * matches, exactly as the editor's `typeof isMatch === 'function'`
		 * guard reads a non-function. Only the gate is lost, never to a
		 * callable named by data.
		 */
		$blocks = gutenberg_html_to_blocks( '<p>[namedmatch]</p>' );

		$this->assertSame( 'test/named-match', $blocks[0]['blockName'] );
	}

	public function test_falls_back_to_the_default_for_an_invalid_shortcode_attribute() {
		$this->register_shortcode_block(
			array(
				'src' => array(
					'type'      => 'number',
					'source'    => 'shortcodeAttribute',
					'attribute' => 'id',
					'default'   => 99,
				),
			)
		);

		// The editor validates a shortcode-sourced value against its declared
		// type the same as any other sourced value.
		$blocks = gutenberg_html_to_blocks( '<p>[testmedia id="abc"]</p>' );

		$this->assertSame( 'test/media', $blocks[0]['blockName'] );
		$this->assertSame( 99, $blocks[0]['attrs']['src'] );
	}

	public function test_coerces_a_declared_numeric_attribute_strictly() {
		$this->register(
			'test/sized',
			array(
				'attributes' => array(
					'size' => array( 'type' => 'number' ),
				),
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'raw',
							'selector'   => 'aside',
							'priority'   => 1,
							'attributes' => array(
								'size' => array(
									'type'      => 'number',
									'source'    => 'attribute',
									'selector'  => 'aside',
									'attribute' => 'data-size',
								),
							),
						),
					),
				),
			)
		);

		$converted = gutenberg_html_to_blocks( '<aside data-size="600">x</aside>' );
		$this->assertSame( 600, $converted[0]['attrs']['size'] );

		// One grammar on both runtimes: exponents are numbers, and an
		// integral result is stored as an integer, as `JSON.stringify` would
		// write it.
		$exponent = gutenberg_html_to_blocks( '<aside data-size="4.5e1">x</aside>' );
		$this->assertSame( 45, $exponent[0]['attrs']['size'] );

		// `is_numeric()` in PHP 8 and `Number()` both take the padded string;
		// the shared grammar refuses it on both runtimes.
		$padded = gutenberg_html_to_blocks( '<aside data-size=" 600">x</aside>' );
		$this->assertArrayNotHasKey( 'size', $padded[0]['attrs'] );

		// A magnitude past the float range coerces to infinity, which JSON
		// cannot write, so it falls out as type-invalid on both runtimes.
		$overflow = gutenberg_html_to_blocks( '<aside data-size="1e309">x</aside>' );
		$this->assertArrayNotHasKey( 'size', $overflow[0]['attrs'] );
	}

	public function test_keeps_single_spaces_between_kept_attributes() {
		$this->register(
			'test/spacing',
			array(
				'attributes' => array(
					'first' => array(
						'type'      => 'string',
						'source'    => 'attribute',
						'selector'  => 'aside',
						'attribute' => 'data-a',
					),
					'third' => array(
						'type'      => 'string',
						'source'    => 'attribute',
						'selector'  => 'aside',
						'attribute' => 'data-c',
					),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'aside',
						),
					),
				),
			)
		);

		// Dropping `data-b` must not leave a double space behind, nor a
		// straggler before the bracket when the last attribute goes.
		$blocks = gutenberg_html_to_blocks( '<aside data-a="1" data-b="2" data-c="3">x</aside>' );

		$this->assertSame( '<aside class="wp-block-test-spacing" data-a="1" data-c="3">x</aside>', $blocks[0]['innerHTML'] );
	}

	public function test_warns_for_a_selector_that_is_not_a_string() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_HTML_Element::parse_selector_list' );

		$this->register(
			'test/mistyped',
			array(
				'attributes' => array(),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							// An array where a string belongs — a mistake a
							// `block.json` can hold, so it cannot fatal.
							'selector' => array( 'p' ),
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<p>One</p>' );

		$this->assertSame( 'core/paragraph', $blocks[0]['blockName'] );
	}

	public function test_lets_a_declared_transform_outrank_the_embed() {
		$this->register(
			'test/linkgrab',
			array(
				'attributes' => array(
					'content' => array(
						'type'     => 'string',
						'source'   => 'html',
						'selector' => 'p',
					),
				),
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'p',
							'priority' => 5,
						),
					),
				),
			)
		);

		// The editor consults the embed matcher at priority 10; a transform
		// declaring a lower number outranks it there, so it has to here.
		$blocks = gutenberg_html_to_blocks( '<p>https://youtu.be/abc123</p>' );

		$this->assertSame( 'test/linkgrab', $blocks[0]['blockName'] );
	}

	public function test_prefers_the_embed_over_a_default_priority_transform() {
		$this->register(
			'test/tenner',
			array(
				'attributes' => array(
					'content' => array(
						'type'     => 'string',
						'source'   => 'html',
						'selector' => 'p',
					),
				),
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'p',
							'priority' => 10,
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<p>https://youtu.be/abc123</p>' );

		$this->assertSame( 'core/embed', $blocks[0]['blockName'] );
	}

	public function test_reads_supports_attributes_from_markup_over_declared_values() {
		$this->register(
			'test/anchored',
			array(
				'attributes' => array(),
				'supports'   => array(
					'anchor'    => true,
					'className' => false,
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'raw',
							'selector'   => 'aside',
							'priority'   => 1,
							'attributes' => array( 'anchor' => 'declared' ),
						),
					),
				),
			)
		);

		// `nodeToBlock()` writes the node-derived supports over the sourced
		// attributes, so what the markup says wins over what the transform
		// declares.
		$from_markup = gutenberg_html_to_blocks( '<aside id="from-markup">x</aside>' );
		$this->assertSame( 'from-markup', $from_markup[0]['attrs']['anchor'] );

		$declared_only = gutenberg_html_to_blocks( '<aside>x</aside>' );
		$this->assertSame( 'declared', $declared_only[0]['attrs']['anchor'] );
	}

	public function test_keeps_only_the_classes_a_schema_declares() {
		$this->register(
			'test/captioned',
			array(
				'attributes' => array(),
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'aside',
							'priority' => 1,
							'schema'   => array(
								'aside' => array(
									'children' => array(
										'#text' => array(),
										'b'     => array(
											'classes'  => array( 'keep-me' ),
											'children' => array( '#text' => array() ),
										),
									),
								),
							),
						),
					),
				),
			)
		);

		// `cleanNodeList()` keeps the classes a schema names and strips the
		// rest, separately from the attribute list.
		$blocks = gutenberg_html_to_blocks( '<aside><b class="keep-me drop-me">Marked</b> tail</aside>' );

		$this->assertSame( 'test/captioned', $blocks[0]['blockName'] );
		$this->assertSame( '<aside><b class="keep-me">Marked</b> tail</aside>', $blocks[0]['innerHTML'] );
	}

	public function test_filters_classes_even_when_every_attribute_is_kept() {
		$this->register(
			'test/starred',
			array(
				'attributes' => array(),
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'aside',
							'priority' => 1,
							'schema'   => array(
								'aside' => array(
									'children' => array(
										'#text' => array(),
										'b'     => array(
											'attributes' => '*',
											'classes'    => array( 'keep-me' ),
											'children'   => array( '#text' => array() ),
										),
									),
								),
							),
						),
					),
				),
			)
		);

		// `cleanNodeList()` skips only the attribute stripping for `*`; the
		// declared classes still decide which class names survive.
		$blocks = gutenberg_html_to_blocks( '<aside><b class="keep-me drop-me" data-x="1">M</b> t</aside>' );

		$this->assertSame( '<aside><b class="keep-me" data-x="1">M</b> t</aside>', $blocks[0]['innerHTML'] );
	}

	public function test_reads_no_class_meaning_into_the_attribute_list() {
		$this->register(
			'test/class-attr',
			array(
				'attributes' => array(),
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'aside',
							'priority' => 1,
							'schema'   => array(
								'aside' => array(
									'children' => array(
										'#text' => array(),
										'b'     => array(
											'attributes' => array( 'class' ),
											'children'   => array( '#text' => array() ),
										),
									),
								),
							),
						),
					),
				),
			)
		);

		// Only `classes` governs class names in `cleanNodeList()`; listing
		// `class` under `attributes` does not keep any.
		$blocks = gutenberg_html_to_blocks( '<aside><b class="one two">M</b></aside>' );

		$this->assertSame( '<aside><b>M</b></aside>', $blocks[0]['innerHTML'] );
	}

	public function test_conformance_reads_no_class_into_a_wildcarded_element() {
		/*
		 * The Code block requires a lone `<code>` whose attributes, spelled
		 * `*`, do not matter: its own schema strips them anyway. A language
		 * class must not count against what `save` reproduces, or every
		 * highlighted snippet in classic content lands in Preformatted.
		 */
		$blocks = gutenberg_html_to_blocks( '<pre><code class="language-js">const a = 1;</code></pre>' );

		$this->assertSame( 'core/code', $blocks[0]['blockName'] );
		$this->assertSame( '<pre class="wp-block-code"><code>const a = 1;</code></pre>', $blocks[0]['innerHTML'] );
	}

	public function test_conformance_accepts_a_class_the_block_saves_back() {
		/*
		 * The Image block's `requires` lists `class` among the attributes of
		 * the link, because `save` writes `linkClass` back onto it — so a
		 * classed link is content the conversion can reproduce, not a reason
		 * to leave the figure alone.
		 */
		$blocks = gutenberg_html_to_blocks(
			'<figure><a class="custom-link" href="https://example.com/page"><img src="https://example.com/a.png" alt="A"></a></figure>'
		);

		$this->assertSame( 'core/image', $blocks[0]['blockName'] );
		$this->assertStringContainsString( '<a class="custom-link"', $blocks[0]['innerHTML'] );
	}

	public function test_reads_a_contextual_attribute_wildcard() {
		$this->register(
			'test/ctx-star',
			array(
				'attributes' => array(),
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'aside',
							'priority' => 1,
							'schema'   => array(
								'aside' => array(
									'children' => array(
										'#text' => array(),
										'b'     => array(
											'attributes' => array(
												'default' => '*',
												'paste'   => array(),
											),
											'children'   => array( '#text' => array() ),
										),
									),
								),
							),
						),
					),
				),
			)
		);

		// The conversion context resolves to `default`, which may itself be
		// the keep-everything wildcard.
		$blocks = gutenberg_html_to_blocks( '<aside><b data-x="1" title="t">M</b></aside>' );

		$this->assertSame( '<aside><b data-x="1" title="t">M</b></aside>', $blocks[0]['innerHTML'] );
	}

	public function test_keeps_every_class_a_schema_wildcards() {
		$this->register(
			'test/classy',
			array(
				'attributes' => array(),
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'     => 'raw',
							'selector' => 'aside',
							'priority' => 1,
							'schema'   => array(
								'aside' => array(
									'children' => array(
										'#text' => array(),
										'b'     => array(
											'classes'  => array( '*' ),
											'children' => array( '#text' => array() ),
										),
									),
								),
							),
						),
					),
				),
			)
		);

		$blocks = gutenberg_html_to_blocks( '<aside><b class="one two">Marked</b></aside>' );

		$this->assertSame( '<aside><b class="one two">Marked</b></aside>', $blocks[0]['innerHTML'] );
	}

	public function test_reads_the_last_non_empty_style_declaration() {
		$this->register(
			'test/tinted',
			array(
				'attributes' => array(
					'shade' => array( 'type' => 'string' ),
				),
				'supports'   => array( 'className' => false ),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'raw',
							'selector'   => 'aside',
							'priority'   => 1,
							'attributes' => array(
								'shade' => array(
									'type'     => 'string',
									'source'   => 'style',
									'property' => 'color',
								),
							),
						),
					),
				),
			)
		);

		// CSSOM never records a declaration without a value, so a trailing
		// empty one must not clobber the value that stands.
		$blocks = gutenberg_html_to_blocks( '<aside style="color:red;color:">x</aside>' );

		$this->assertSame( 'red', $blocks[0]['attrs']['shade'] );
	}

	/**
	 * Returns a reflection of a private method, made invocable on every
	 * supported PHP version.
	 *
	 * `ReflectionMethod::setAccessible()` is needed until 8.1.0, redundant as
	 * of 8.1.0, and deprecated as of 8.5.0.
	 *
	 * @param string $class_name  Class the method belongs to.
	 * @param string $method_name Method name.
	 * @return ReflectionMethod The reflected method.
	 */
	private function accessible_method( $class_name, $method_name ) {
		$method = new ReflectionMethod( $class_name, $method_name );

		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method;
	}

	/**
	 * Registers a block that saves a shortcode's own text.
	 *
	 * @param array $attributes Transform attribute definitions.
	 * @return void
	 */
	private function register_shortcode_block( $attributes ) {
		$this->register(
			'test/media',
			array(
				'attributes' => array(
					'src'  => array( 'type' => 'string' ),
					'text' => array(
						'type'   => 'string',
						'source' => 'raw',
					),
				),
				'transforms' => array(
					'from' => array(
						array(
							'type'       => 'shortcode',
							'tag'        => 'testmedia',
							'attributes' => array_merge(
								array(
									'text' => array(
										'type'   => 'string',
										'source' => 'shortcodeText',
									),
								),
								$attributes
							),
						),
					),
				),
			)
		);
	}
}
