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

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
	}

	public function tear_down() {
		if ( $this->test_block_name ) {
			unregister_block_type( $this->test_block_name );
		}
		$this->test_block_name = null;
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

	// Tests for gutenberg_decode_custom_css_attribute_for_display().

	/**
	 * Tests that plain CSS (no prefix) is returned unchanged.
	 *
	 * @covers ::gutenberg_decode_custom_css_attribute_for_display
	 */
	public function test_decode_css_attribute_returns_plain_css_unchanged() {
		$css = 'color: red; font-size: 16px;';
		$this->assertSame( $css, gutenberg_decode_custom_css_attribute_for_display( $css ) );
	}

	/**
	 * Tests that a base64-encoded value is decoded correctly.
	 *
	 * @covers ::gutenberg_decode_custom_css_attribute_for_display
	 */
	public function test_decode_css_attribute_decodes_encoded_value() {
		$css     = 'color: red;';
		$encoded = 'data:text/css;base64,' . base64_encode( $css );
		$this->assertSame( $css, gutenberg_decode_custom_css_attribute_for_display( $encoded ) );
	}

	/**
	 * Tests that nested CSS selectors survive the encode/decode round-trip.
	 * This is the primary bug being fixed: wp_kses corrupts `&` and `>` in CSS.
	 *
	 * @covers ::gutenberg_decode_custom_css_attribute_for_display
	 */
	public function test_decode_css_attribute_decodes_nested_css() {
		$css     = 'background: green; & p { color: yellow; padding: 20px; }';
		$encoded = 'data:text/css;base64,' . base64_encode( $css );
		$this->assertSame( $css, gutenberg_decode_custom_css_attribute_for_display( $encoded ) );
	}

	/**
	 * Tests that CSS with characters wp_kses would corrupt (`&`, `>`) round-trips correctly.
	 *
	 * @covers ::gutenberg_decode_custom_css_attribute_for_display
	 */
	public function test_decode_css_attribute_decodes_kses_sensitive_characters() {
		$css     = '& > p { color: red; }';
		$encoded = 'data:text/css;base64,' . base64_encode( $css );
		$this->assertSame( $css, gutenberg_decode_custom_css_attribute_for_display( $encoded ) );
	}

	/**
	 * Tests that non-ASCII characters (e.g. Unicode in content values) survive decoding.
	 *
	 * @covers ::gutenberg_decode_custom_css_attribute_for_display
	 */
	public function test_decode_css_attribute_decodes_unicode_characters() {
		$css     = 'content: "→";';
		$encoded = 'data:text/css;base64,' . base64_encode( $css );
		$this->assertSame( $css, gutenberg_decode_custom_css_attribute_for_display( $encoded ) );
	}

	/**
	 * Tests that an invalid base64 payload returns an empty string.
	 *
	 * @covers ::gutenberg_decode_custom_css_attribute_for_display
	 */
	public function test_decode_css_attribute_returns_empty_for_invalid_base64() {
		$invalid = 'data:text/css;base64,!!!not-valid-base64!!!';
		$this->assertSame( '', gutenberg_decode_custom_css_attribute_for_display( $invalid ) );
	}

	// Integration tests: encode/decode through the full render path.

	/**
	 * Tests that base64-encoded CSS is decoded and applied correctly during render.
	 * Verifies the primary bug fix: a block saved by a user without unfiltered_html
	 * should render with the correct CSS, including nested selectors.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 * @covers ::gutenberg_decode_custom_css_attribute_for_display
	 */
	public function test_render_decodes_and_applies_base64_encoded_css() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-encoded',
			array( 'customCSS' => true )
		);

		$css     = 'background: green; & p { color: yellow; }';
		$encoded = 'data:text/css;base64,' . base64_encode( $css );

		$parsed_block = array(
			'blockName' => 'test/custom-css-encoded',
			'attrs'     => array(
				'style' => array(
					'css' => $encoded,
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayHasKey( 'className', $result['attrs'], 'Block should have className added for encoded CSS.' );
	}

	/**
	 * Tests that a base64-encoded HTML injection payload is rejected after decoding.
	 * Encoding must not be used to bypass the HTML markup check.
	 *
	 * @covers ::gutenberg_render_custom_css_support_styles
	 * @covers ::gutenberg_decode_custom_css_attribute_for_display
	 */
	public function test_render_rejects_base64_encoded_html_injection() {
		$this->register_custom_css_block_with_support(
			'test/custom-css-encoded-html',
			array( 'customCSS' => true )
		);

		// Encode an HTML injection payload — should be caught after decoding.
		$encoded = 'data:text/css;base64,' . base64_encode( 'color: red;</style><script>alert(1)</script>' );

		$parsed_block = array(
			'blockName' => 'test/custom-css-encoded-html',
			'attrs'     => array(
				'style' => array(
					'css' => $encoded,
				),
			),
		);

		$result = gutenberg_render_custom_css_support_styles( $parsed_block );

		$this->assertArrayNotHasKey( 'className', $result['attrs'], 'Block should not render when decoded CSS contains HTML markup.' );
	}

	// Tests for gutenberg_encode_custom_css_for_kses().

	/**
	 * Tests that content without blocks is returned unchanged.
	 *
	 * @covers ::gutenberg_encode_custom_css_for_kses
	 */
	public function test_encode_for_kses_ignores_non_block_content() {
		$content = '<p>Hello world</p>';
		$this->assertSame( $content, gutenberg_encode_custom_css_for_kses( $content ) );
	}

	/**
	 * Tests that CSS without KSES-sensitive characters is still encoded.
	 * All CSS is encoded uniformly regardless of content, for consistent storage.
	 *
	 * @covers ::gutenberg_encode_custom_css_for_kses
	 */
	public function test_encode_for_kses_encodes_safe_css() {
		$css     = 'color: red; font-size: 16px;';
		$encoded = 'data:text/css;base64,' . base64_encode( $css );
		$content = '<!-- wp:paragraph {"style":{"css":' . json_encode( $css, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '}} --><p>Test</p><!-- /wp:paragraph -->';
		$result  = gutenberg_encode_custom_css_for_kses( $content );
		$this->assertStringContainsString(
			json_encode( $encoded, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			$result,
			'All CSS should be encoded, including values with no KSES-sensitive characters.'
		);
	}

	/**
	 * Tests that CSS with `&` is encoded before KSES can corrupt it.
	 *
	 * @covers ::gutenberg_encode_custom_css_for_kses
	 */
	public function test_encode_for_kses_encodes_css_with_ampersand() {
		$css     = '& > p { color: red; }';
		$content = '<!-- wp:paragraph {"style":{"css":' . json_encode( $css, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '}} --><p>Test</p><!-- /wp:paragraph -->';
		$result  = gutenberg_encode_custom_css_for_kses( $content );
		$this->assertStringNotContainsString( $css, $result, 'Original CSS should be replaced.' );
		$this->assertStringContainsString( 'data:text/css;base64,', $result, 'Result should contain base64-encoded CSS.' );
	}

	/**
	 * Tests the primary bug scenario: nested CSS selectors survive encoding for KSES.
	 *
	 * @covers ::gutenberg_encode_custom_css_for_kses
	 */
	public function test_encode_for_kses_encodes_nested_css_selectors() {
		$css     = 'background: green; & p { color: yellow; padding: 20px; }';
		$encoded = 'data:text/css;base64,' . base64_encode( $css );
		$content = '<!-- wp:paragraph {"style":{"css":' . json_encode( $css, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '}} --><p>Test</p><!-- /wp:paragraph -->';
		$result  = gutenberg_encode_custom_css_for_kses( $content );
		$this->assertStringContainsString(
			json_encode( $encoded, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			$result,
			'CSS should be base64-encoded in the block comment.'
		);
	}

	/**
	 * Tests that already-encoded CSS is not double-encoded.
	 *
	 * @covers ::gutenberg_encode_custom_css_for_kses
	 */
	public function test_encode_for_kses_does_not_double_encode() {
		$css     = '& > p { color: red; }';
		$encoded = 'data:text/css;base64,' . base64_encode( $css );
		$content = '<!-- wp:paragraph {"style":{"css":' . json_encode( $encoded, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '}} --><p>Test</p><!-- /wp:paragraph -->';
		$result  = gutenberg_encode_custom_css_for_kses( $content );
		$this->assertSame( $content, $result, 'Already-encoded CSS should not be modified.' );
	}

	/**
	 * Tests that CSS in inner blocks is also encoded.
	 *
	 * @covers ::gutenberg_encode_custom_css_for_kses
	 * @covers ::gutenberg_collect_custom_css_values_for_encoding
	 */
	public function test_encode_for_kses_encodes_inner_block_css() {
		$inner_css = '& > span { color: blue; }';
		$encoded   = 'data:text/css;base64,' . base64_encode( $inner_css );
		// Simulate a group block with an inner paragraph that has custom CSS.
		$content = '<!-- wp:group --><div class="wp-block-group"><!-- wp:paragraph {"style":{"css":' . json_encode( $inner_css, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '}} --><p>Test</p><!-- /wp:paragraph --></div><!-- /wp:group -->';
		$result  = gutenberg_encode_custom_css_for_kses( $content );
		$this->assertStringContainsString(
			json_encode( $encoded, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			$result,
			'CSS in inner blocks should be base64-encoded.'
		);
	}

	/**
	 * Tests that encoded CSS round-trips correctly: encode_for_kses + decode_for_display
	 * restores the original CSS.
	 *
	 * @covers ::gutenberg_encode_custom_css_for_kses
	 * @covers ::gutenberg_decode_custom_css_attribute_for_display
	 */
	public function test_encode_for_kses_round_trips_with_decode() {
		$css     = 'background: green; & p { color: yellow; }';
		$content = '<!-- wp:paragraph {"style":{"css":' . json_encode( $css, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '}} --><p>Test</p><!-- /wp:paragraph -->';
		$encoded_content = gutenberg_encode_custom_css_for_kses( $content );

		// Extract the encoded CSS value from the result.
		$blocks      = parse_blocks( $encoded_content );
		$stored_css  = $blocks[0]['attrs']['style']['css'];
		$decoded_css = gutenberg_decode_custom_css_attribute_for_display( $stored_css );

		$this->assertSame( $css, $decoded_css, 'CSS should survive the encode → store → decode round-trip.' );
	}
}
