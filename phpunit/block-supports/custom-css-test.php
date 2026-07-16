<?php
/**
 * Test the custom CSS block support.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Custom_CSS_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	/**
	 * @var WP_Styles|null
	 */
	private $old_wp_styles;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;

		// Use a clean styles queue so tests don't leak registered handles
		// or inline styles into each other. The default-styles callbacks are
		// removed because they expect a fully set up instance.
		$this->old_wp_styles = $GLOBALS['wp_styles'] ?? null;
		remove_action( 'wp_default_styles', 'wp_default_styles' );
		remove_action( 'wp_default_styles', 'gutenberg_register_packages_styles', 15 );
		remove_action( 'wp_print_styles', 'print_emoji_styles' );
		$GLOBALS['wp_styles'] = new WP_Styles();
	}

	public function tear_down() {
		if ( $this->test_block_name ) {
			unregister_block_type( $this->test_block_name );
		}
		$this->test_block_name = null;

		$GLOBALS['wp_styles'] = $this->old_wp_styles;
		add_action( 'wp_default_styles', 'wp_default_styles' );
		add_action( 'wp_default_styles', 'gutenberg_register_packages_styles', 15 );
		add_action( 'wp_print_styles', 'print_emoji_styles' );

		parent::tear_down();
	}

	/**
	 * Registers a new block for testing custom CSS support.
	 *
	 * @param string $block_name Name for the test block.
	 * @param array  $supports   Array defining block support configuration.
	 *
	 * @return WP_Block_Type The block type for the newly registered test block.
	 */
	private function register_custom_css_block_with_support( $block_name, $supports = array() ) {
		$this->test_block_name = $block_name;
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => $supports,
			)
		);
		$registry = WP_Block_Type_Registry::get_instance();

		return $registry->get_registered( $this->test_block_name );
	}

	/**
	 * Tests that custom CSS support adds class name when block has custom CSS.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_support_adds_class_name_when_css_present() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-block',
			array( 'customCSS' => true )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-block',
			'attrs'     => array(
				'style' => array(
					'css' => 'color: red;',
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayHasKey( 'className', $result['attrs'], 'Block should have className added.' );
		$this->assertMatchesRegularExpression( '/wp-custom-css-/', $result['attrs']['className'], 'className should contain wp-custom-css- prefix.' );
	}

	/**
	 * Tests that custom CSS support preserves existing className.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_support_preserves_existing_class_name() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-block-existing',
			array( 'customCSS' => true )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-block-existing',
			'attrs'     => array(
				'className' => 'my-existing-class',
				'style'     => array(
					'css' => 'color: blue;',
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertStringContainsString( 'my-existing-class', $result['attrs']['className'], 'Existing className should be preserved.' );
		$this->assertMatchesRegularExpression( '/wp-custom-css-/', $result['attrs']['className'], 'className should also contain wp-custom-css- prefix.' );
	}

	/**
	 * Tests that custom CSS support returns unchanged block when support is disabled.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_support_returns_unchanged_when_support_disabled() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-disabled',
			array( 'customCSS' => false )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-disabled',
			'attrs'     => array(
				'style' => array(
					'css' => 'color: green;',
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayNotHasKey( 'className', $result['attrs'], 'Block should not have className added when support is disabled.' );
	}

	/**
	 * Tests that custom CSS support returns unchanged block when no CSS attribute present.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_support_returns_unchanged_when_no_css() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-no-css',
			array( 'customCSS' => true )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-no-css',
			'attrs'     => array(
				'style' => array(
					'color' => 'red',
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayNotHasKey( 'className', $result['attrs'], 'Block should not have className added when no CSS attribute.' );
	}

	/**
	 * Tests that custom CSS support returns unchanged block when CSS is empty.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_support_returns_unchanged_when_css_empty() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-empty',
			array( 'customCSS' => true )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-empty',
			'attrs'     => array(
				'style' => array(
					'css' => '',
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayNotHasKey( 'className', $result['attrs'], 'Block should not have className added when CSS is empty.' );
	}

	/**
	 * Tests that custom CSS support returns unchanged block when CSS is whitespace only.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_support_returns_unchanged_when_css_whitespace_only() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-whitespace',
			array( 'customCSS' => true )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-whitespace',
			'attrs'     => array(
				'style' => array(
					'css' => '   ',
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayNotHasKey( 'className', $result['attrs'], 'Block should not have className added when CSS is whitespace only.' );
	}

	/**
	 * Tests that custom CSS support returns unchanged block when style attribute is missing.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_support_returns_unchanged_when_no_style_attribute() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-no-style',
			array( 'customCSS' => true )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-no-style',
			'attrs'     => array(),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayNotHasKey( 'className', $result['attrs'], 'Block should not have className added when no style attribute.' );
	}

	/**
	 * Tests that render_block filter adds custom CSS class to block content.
	 *
	 * @covers ::gutenberg_render_custom_css_class_name
	 */
	public function test_render_custom_css_class_name_adds_class_to_content() {
		$block_content = '<div class="wp-block-paragraph">Test content</div>';
		$block         = array(
			'blockName' => 'core/paragraph',
			'attrs'     => array(
				'className' => 'wp-custom-css-123abc',
			),
		);

		$result = gutenberg_render_custom_css_class_name( $block_content, $block );

		$this->assertStringContainsString( 'wp-custom-css-123abc', $result, 'Custom CSS class should be added to block content.' );
	}

	/**
	 * Tests that render_block filter preserves existing classes when adding custom CSS class.
	 *
	 * @covers ::gutenberg_render_custom_css_class_name
	 */
	public function test_render_custom_css_class_name_preserves_existing_classes() {
		$block_content = '<div class="existing-class another-class">Test content</div>';
		$block         = array(
			'blockName' => 'core/paragraph',
			'attrs'     => array(
				'className' => 'wp-custom-css-456def',
			),
		);

		$result = gutenberg_render_custom_css_class_name( $block_content, $block );

		$this->assertStringContainsString( 'existing-class', $result, 'Existing classes should be preserved.' );
		$this->assertStringContainsString( 'another-class', $result, 'All existing classes should be preserved.' );
		$this->assertStringContainsString( 'wp-custom-css-456def', $result, 'Custom CSS class should be added.' );
	}

	/**
	 * Tests that render_block filter returns unchanged content when no custom CSS class in attrs.
	 *
	 * @covers ::gutenberg_render_custom_css_class_name
	 */
	public function test_render_custom_css_class_name_returns_unchanged_when_no_custom_css_class() {
		$block_content = '<div class="wp-block-paragraph">Test content</div>';
		$block         = array(
			'blockName' => 'core/paragraph',
			'attrs'     => array(
				'className' => 'some-other-class',
			),
		);

		$result = gutenberg_render_custom_css_class_name( $block_content, $block );

		$this->assertSame( $block_content, $result, 'Block content should remain unchanged when no custom CSS class.' );
	}

	/**
	 * Tests that render_block filter returns unchanged content when className is empty.
	 *
	 * @covers ::gutenberg_render_custom_css_class_name
	 */
	public function test_render_custom_css_class_name_returns_unchanged_when_classname_empty() {
		$block_content = '<div class="wp-block-paragraph">Test content</div>';
		$block         = array(
			'blockName' => 'core/paragraph',
			'attrs'     => array(),
		);

		$result = gutenberg_render_custom_css_class_name( $block_content, $block );

		$this->assertSame( $block_content, $result, 'Block content should remain unchanged when className is empty.' );
	}

	/**
	 * Tests that render_block filter returns empty string when content is empty.
	 *
	 * @covers ::gutenberg_render_custom_css_class_name
	 */
	public function test_render_custom_css_class_name_returns_empty_when_content_empty() {
		$block_content = '';
		$block         = array(
			'blockName' => 'core/paragraph',
			'attrs'     => array(
				'className' => 'wp-custom-css-789ghi',
			),
		);

		$result = gutenberg_render_custom_css_class_name( $block_content, $block );

		$this->assertSame( '', $result, 'Result should be empty when block content is empty.' );
	}

	/**
	 * Tests that custom CSS class is extracted correctly when mixed with other classes.
	 *
	 * @covers ::gutenberg_render_custom_css_class_name
	 */
	public function test_render_custom_css_class_name_extracts_class_from_mixed_classnames() {
		$block_content = '<p>Test content</p>';
		$block         = array(
			'blockName' => 'core/paragraph',
			'attrs'     => array(
				'className' => 'my-class wp-custom-css-mixed123 another-class',
			),
		);

		$result = gutenberg_render_custom_css_class_name( $block_content, $block );

		$this->assertStringContainsString( 'wp-custom-css-mixed123', $result, 'Custom CSS class should be extracted and added.' );
	}

	/**
	 * Tests that custom CSS class surrounded by ASCII whitespace (other than space) is extracted.
	 *
	 * @covers ::gutenberg_render_custom_css_class_name
	 */
	public function test_render_custom_css_class_name_extracts_class_between_whitespace() {
		$block_content = '<div class="wp-block-paragraph">Test content</div>';
		$block         = array(
			'blockName' => 'core/paragraph',
			'attrs'     => array(
				'className' => "\twp-custom-css-123abc\t",
			),
		);

		$result = gutenberg_render_custom_css_class_name( $block_content, $block );

		$this->assertStringContainsString( 'wp-custom-css-123abc', $result, 'Custom CSS class should be extracted from between whitespace.' );
	}

	/**
	 * Tests that a class merely prefixed with wp-custom-css- (e.g. via a hyphen) is not treated as the custom CSS class.
	 *
	 * @covers ::gutenberg_render_custom_css_class_name
	 */
	public function test_render_custom_css_class_name_returns_unchanged_for_prefixed_class() {
		$block_content = '<div class="wp-block-paragraph">Test content</div>';
		$block         = array(
			'blockName' => 'core/paragraph',
			'attrs'     => array(
				'className' => 'my-wp-custom-css-456def',
			),
		);

		$result = gutenberg_render_custom_css_class_name( $block_content, $block );

		$this->assertSame( $block_content, $result, 'Block content should remain unchanged when wp-custom-css- only appears as a substring of another class.' );
	}

	/**
	 * Tests that custom CSS support is enabled by default.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_support_enabled_by_default() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-default',
			array() // No explicit customCSS support defined.
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-default',
			'attrs'     => array(
				'style' => array(
					'css' => 'font-weight: bold;',
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayHasKey( 'className', $result['attrs'], 'Block should have className added by default when customCSS support is not explicitly set.' );
	}

	/**
	 * Tests that custom CSS containing HTML opening tags is rejected.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_rejects_html_opening_tags() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-html-open',
			array( 'customCSS' => true )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-html-open',
			'attrs'     => array(
				'style' => array(
					'css' => '<script>alert(1)</script>',
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayNotHasKey( 'className', $result['attrs'], 'Block should not have className added when CSS contains HTML opening tags.' );
	}

	/**
	 * Tests that custom CSS containing HTML closing tags is rejected.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_rejects_html_closing_tags() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-html-close',
			array( 'customCSS' => true )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-html-close',
			'attrs'     => array(
				'style' => array(
					'css' => 'color: red;</style><script>alert(1)</script>',
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayNotHasKey( 'className', $result['attrs'], 'Block should not have className added when CSS contains HTML closing tags.' );
	}

	/**
	 * Tests that valid CSS without HTML markup is accepted.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_accepts_valid_css() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-valid',
			array( 'customCSS' => true )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-valid',
			'attrs'     => array(
				'style' => array(
					'css' => 'color: red; background: url("image.png"); font-size: 16px;',
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayHasKey( 'className', $result['attrs'], 'Block should have className added for valid CSS.' );
	}

	/**
	 * Tests that custom CSS styles print after block style variation styles,
	 * regardless of enqueue order, so that custom CSS wins the cascade at
	 * equal specificity.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_prints_after_block_style_variation_styles() {
		wp_register_style( 'wp-block-library', false );
		wp_register_style( 'global-styles', false );

		$this->register_custom_css_block_with_support(
			'test/custom-css-print-order',
			array( 'customCSS' => true )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-print-order',
			'attrs'     => array(
				'style' => array(
					'css' => 'border-style: double;',
				),
			),
		);

		gutenberg_render_custom_css_support_styles( $parsed_block );

		// Mimic the block style variation support registering its per-instance
		// styles, as done in gutenberg_render_block_style_variation_support_styles().
		wp_register_style( 'block-style-variation-styles', false, array( 'wp-block-library', 'global-styles' ) );
		wp_add_inline_style( 'block-style-variation-styles', ':root :where(.is-style-test-variation){border-style: dotted;}' );

		// Enqueue custom CSS first to prove the declared dependency decides
		// the print order, not the enqueue order.
		wp_enqueue_style( 'wp-block-custom-css' );
		wp_enqueue_style( 'block-style-variation-styles' );

		$output = get_echo( 'wp_print_styles' );

		$variation_position  = strpos( $output, 'border-style: dotted' );
		$custom_css_position = strpos( $output, 'border-style: double' );

		$this->assertNotFalse( $variation_position, 'Block style variation styles should be printed.' );
		$this->assertNotFalse( $custom_css_position, 'Custom CSS should be printed.' );
		$this->assertLessThan( $custom_css_position, $variation_position, 'Block style variation styles should print before custom CSS so custom CSS wins ties at equal specificity.' );
	}

	/**
	 * Tests that custom CSS still prints when no block style variation styles
	 * were registered on the page. The `block-style-variation-styles` handle
	 * is normally registered lazily while rendering a block with a variation,
	 * and a style with an unregistered dependency is never printed.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 */
	public function test_custom_css_prints_without_block_style_variation_styles() {
		wp_register_style( 'wp-block-library', false );
		wp_register_style( 'global-styles', false );

		$this->register_custom_css_block_with_support(
			'test/custom-css-no-variations',
			array( 'customCSS' => true )
		);

		$parsed_block = array(
			'blockName' => 'test/custom-css-no-variations',
			'attrs'     => array(
				'style' => array(
					'css' => 'color: teal;',
				),
			),
		);

		gutenberg_render_custom_css_support_styles( $parsed_block );
		wp_enqueue_style( 'wp-block-custom-css' );

		$output = get_echo( 'wp_print_styles' );

		$this->assertStringContainsString( 'color: teal', $output, 'Custom CSS should print even when no block style variation styles exist on the page.' );
	}

	/**
	 * Tests that style.css is stripped from a single block.
	 *
	 * @covers ::gutenberg_strip_custom_css_from_blocks
	 */
	public function test_strip_custom_css_removes_css_from_block() {
		$content = '<!-- wp:paragraph {"style":{"css":"color: red;"}} --><p>Hello</p><!-- /wp:paragraph -->';

		$result = wp_unslash( gutenberg_strip_custom_css_from_blocks( $content ) );
		$blocks = parse_blocks( $result );

		$this->assertArrayNotHasKey( 'css', $blocks[0]['attrs']['style'] ?? array(), 'style.css should be stripped from block attributes.' );
	}

	/**
	 * Tests that style.css is stripped from nested inner blocks.
	 *
	 * @covers ::gutenberg_strip_custom_css_from_blocks
	 */
	public function test_strip_custom_css_removes_css_from_inner_blocks() {
		$content = '<!-- wp:group --><div class="wp-block-group"><!-- wp:paragraph {"style":{"css":"color: red;"}} --><p>Hello</p><!-- /wp:paragraph --></div><!-- /wp:group -->';

		$result = wp_unslash( gutenberg_strip_custom_css_from_blocks( $content ) );
		$blocks = parse_blocks( $result );

		$inner_block = $blocks[0]['innerBlocks'][0];
		$this->assertArrayNotHasKey( 'css', $inner_block['attrs']['style'] ?? array(), 'style.css should be stripped from inner block attributes.' );
	}

	/**
	 * Tests that content without blocks is returned unchanged.
	 *
	 * @covers ::gutenberg_strip_custom_css_from_blocks
	 */
	public function test_strip_custom_css_returns_non_block_content_unchanged() {
		$content = '<p>This is plain HTML content with no blocks.</p>';

		$result = gutenberg_strip_custom_css_from_blocks( $content );

		$this->assertSame( $content, $result, 'Non-block content should be returned unchanged.' );
	}

	/**
	 * Tests that content without style.css attributes is returned unchanged.
	 *
	 * @covers ::gutenberg_strip_custom_css_from_blocks
	 */
	public function test_strip_custom_css_returns_unchanged_when_no_css_attributes() {
		$content = '<!-- wp:paragraph {"style":{"color":{"text":"#ff0000"}}} --><p class="has-text-color" style="color:#ff0000">Hello</p><!-- /wp:paragraph -->';

		$result = gutenberg_strip_custom_css_from_blocks( $content );

		$this->assertSame( $content, $result, 'Content without style.css attributes should be returned unchanged.' );
	}

	/**
	 * Tests that other style properties are preserved when css is stripped.
	 *
	 * @covers ::gutenberg_strip_custom_css_from_blocks
	 */
	public function test_strip_custom_css_preserves_other_style_properties() {
		$content = '<!-- wp:paragraph {"style":{"css":"color: red;","color":{"text":"#ff0000"}}} --><p>Hello</p><!-- /wp:paragraph -->';

		$result = wp_unslash( gutenberg_strip_custom_css_from_blocks( $content ) );
		$blocks = parse_blocks( $result );

		$this->assertArrayNotHasKey( 'css', $blocks[0]['attrs']['style'], 'style.css should be stripped.' );
		$this->assertSame( '#ff0000', $blocks[0]['attrs']['style']['color']['text'], 'Other style properties should be preserved.' );
	}

	/**
	 * Tests that empty style object is cleaned up after stripping css.
	 *
	 * @covers ::gutenberg_strip_custom_css_from_blocks
	 */
	public function test_strip_custom_css_cleans_up_empty_style_object() {
		$content = '<!-- wp:paragraph {"style":{"css":"color: red;"}} --><p>Hello</p><!-- /wp:paragraph -->';

		$result = wp_unslash( gutenberg_strip_custom_css_from_blocks( $content ) );
		$blocks = parse_blocks( $result );

		$this->assertArrayNotHasKey( 'style', $blocks[0]['attrs'], 'Empty style object should be cleaned up after stripping css.' );
	}

	/**
	 * Tests that slashed content is handled correctly.
	 *
	 * @covers ::gutenberg_strip_custom_css_from_blocks
	 */
	public function test_strip_custom_css_handles_slashed_content() {
		$content = '<!-- wp:paragraph {"style":{"css":"color: red;"}} --><p>Hello</p><!-- /wp:paragraph -->';
		$slashed = wp_slash( $content );

		$result = gutenberg_strip_custom_css_from_blocks( $slashed );
		$blocks = parse_blocks( wp_unslash( $result ) );

		$this->assertArrayNotHasKey( 'css', $blocks[0]['attrs']['style'] ?? array(), 'style.css should be stripped even from slashed content.' );
	}
}
