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
}
