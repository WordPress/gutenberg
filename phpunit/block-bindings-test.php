<?php
/**
 * Tests for Block Bindings integration with block rendering.
 *
 * @package gutenberg
 */
class Tests_Block_Bindings extends WP_UnitTestCase {

	const SOURCE_NAME  = 'test/source';
	const SOURCE_LABEL = array(
		'label' => 'Test source',
	);

	/**
	 * Sets up shared fixtures.
	 */
	public static function wpSetUpBeforeClass() {
		register_block_type(
			'test/block',
			array(
				'attributes'      => array(
					'myAttribute' => array(
						'type' => 'string',
					),
				),
				'render_callback' => function ( $attributes ) {
					if ( isset( $attributes['myAttribute'] ) ) {
						return '<p>' . esc_html( $attributes['myAttribute'] ) . '</p>';
					}
				},
			)
		);
	}

	/**
	 * Sets up the test fixture.
	 */
	public function set_up() {
		parent::set_up();

		add_filter(
			'block_bindings_supported_attributes_test/block',
			function ( $supported_attributes ) {
				$supported_attributes[] = 'myAttribute';
				return $supported_attributes;
			}
		);

		add_filter(
			'block_bindings_supported_attributes_core/image',
			function ( $supported_attributes ) {
				$supported_attributes[] = 'caption';
				return $supported_attributes;
			}
		);
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		foreach ( get_all_registered_block_bindings_sources() as $source_name => $source_properties ) {
			if ( str_starts_with( $source_name, 'test/' ) ) {
				unregister_block_bindings_source( $source_name );
			}
		}

		parent::tear_down();
	}

	/**
	 * Tear down after class.
	 */
	public static function wpTearDownAfterClass() {
		unregister_block_type( 'test/block' );
	}

	public function data_update_block_with_value_from_source() {
		return array(
			'paragraph block' => array(
				'content',
				<<<HTML
<!-- wp:paragraph -->
<p>This should not appear</p>
<!-- /wp:paragraph -->
HTML
				,
				'<p class="wp-block-paragraph">test source value</p>',
			),
			'button block'    => array(
				'text',
				<<<HTML
<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">This should not appear</a></div>
<!-- /wp:button -->
HTML
				,
				'<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">test source value</a></div>',
			),
			'test block'      => array(
				'myAttribute',
				<<<HTML
<!-- wp:test/block -->
<p>This should not appear</p>
<!-- /wp:test/block -->
HTML
				,
				'<p>test source value</p>',
			),
		);
	}

	/**
	 * Test if the block content is updated with the value returned by the source.
	 *
	 * @covers ::register_block_bindings_source
	 *
	 * @dataProvider data_update_block_with_value_from_source
	 */
	public function test_update_block_with_value_from_source( $bound_attribute, $block_content, $expected_result ) {
		$get_value_callback = function () {
			return 'test source value';
		};

		register_block_bindings_source(
			self::SOURCE_NAME,
			array(
				'label'              => self::SOURCE_LABEL,
				'get_value_callback' => $get_value_callback,
			)
		);

		$parsed_blocks = parse_blocks( $block_content );

		$parsed_blocks[0]['attrs']['metadata'] = array(
			'bindings' => array(
				$bound_attribute => array(
					'source' => self::SOURCE_NAME,
				),
			),
		);

		$block  = new WP_Block( $parsed_blocks[0] );
		$result = $block->render();

		$this->assertSame(
			'test source value',
			$block->attributes[ $bound_attribute ],
			"The '{$bound_attribute}' attribute should be updated with the value returned by the source."
		);
		$this->assertSame(
			$expected_result,
			trim( $result ),
			'The block content should be updated with the value returned by the source.'
		);
	}

	public function data_different_get_value_callbacks() {
		return array(
			'pass arguments to source'        => array(
				function ( $source_args, $block_instance, $attribute_name ) {
					$value = $source_args['key'];
					return "The attribute name is '$attribute_name' and its binding has argument 'key' with value '$value'.";
				},
				"<p class=\"wp-block-paragraph\">The attribute name is 'content' and its binding has argument 'key' with value 'test'.</p>",
			),
			'unsafe HTML should be sanitized' => array(
				function () {
					return '<script>alert("Unsafe HTML")</script>';
				},
				'<p class="wp-block-paragraph">alert("Unsafe HTML")</p>',
			),
			'symbols and numbers should be rendered correctly' => array(
				function () {
					return '$12.50';
				},
				'<p class="wp-block-paragraph">$12.50</p>',
			),
		);
	}

	/**
	 * Test passing arguments to the source.
	 *
	 * @covers ::register_block_bindings_source
	 *
	 * @dataProvider data_different_get_value_callbacks
	 */
	public function test_different_get_value_callbacks( $get_value_callback, $expected ) {
		register_block_bindings_source(
			self::SOURCE_NAME,
			array(
				'label'              => self::SOURCE_LABEL,
				'get_value_callback' => $get_value_callback,
			)
		);

		$block_content = <<<HTML
<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"test/source", "args": {"key": "test"}}}}} -->
<p>This should not appear</p>
<!-- /wp:paragraph -->
HTML;
		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$this->assertSame(
			$expected,
			trim( $result ),
			'The block content should be updated with the value returned by the source.'
		);
	}

	/**
	 * Tests passing `uses_context` as argument to the source.
	 *
	 * @covers ::register_block_bindings_source
	 */
	public function test_passing_uses_context_to_source() {
		$get_value_callback = function ( $source_args, $block_instance ) {
			$this->assertArrayNotHasKey(
				'forbiddenSourceContext',
				$block_instance->context,
				"Only context that was made available through the source's uses_context property should be accessible."
			);
			$value = $block_instance->context['sourceContext'];
			return "Value: $value";
		};

		register_block_bindings_source(
			self::SOURCE_NAME,
			array(
				'label'              => self::SOURCE_LABEL,
				'get_value_callback' => $get_value_callback,
				'uses_context'       => array( 'sourceContext' ),
			)
		);

		$block_content = <<<HTML
<!-- wp:test/block {"metadata":{"bindings":{"myAttribute":{"source":"test/source", "args": {"key": "test"}}}}} -->
<p>This should not appear</p>
<!-- /wp:test/block -->
HTML;
		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block(
			$parsed_blocks[0],
			array(
				'sourceContext'          => 'source context value',
				'forbiddenSourceContext' => 'forbidden donut',
			)
		);
		$result        = $block->render();

		$this->assertSame(
			'Value: source context value',
			$block->attributes['myAttribute'],
			"The 'myAttribute' should be updated with the value of the source context."
		);
		$this->assertSame(
			'<p>Value: source context value</p>',
			trim( $result ),
			'The block content should be updated with the value of the source context.'
		);
	}

	/**
	 * Tests if the block content is updated with the value returned by the source
	 * for the Image block in the placeholder state.
	 *
	 * Furthermore tests if the caption attribute, for which support is added via the
	 * `block_bindings_supported_attributes_core/image` filter, is correctly processed.
	 *
	 * @covers ::register_block_bindings_source
	 */
	public function test_update_block_with_value_from_source_image_placeholder() {
		$get_value_callback = function ( $source_args, $block_instance, $attribute_name ) {
			if ( 'url' === $attribute_name ) {
				return 'https://example.com/image.jpg';
			}
			if ( 'caption' === $attribute_name ) {
				return 'Example Image';
			}
		};

		register_block_bindings_source(
			self::SOURCE_NAME,
			array(
				'label'              => self::SOURCE_LABEL,
				'get_value_callback' => $get_value_callback,
			)
		);

		$block_content = <<<HTML
<!-- wp:image {"metadata":{"bindings":{"url":{"source":"test/source"},"caption":{"source":"test/source"}}}} -->
<figure class="wp-block-image"><img alt=""/><figcaption class="wp-element-caption"></figcaption></figure>
<!-- /wp:image -->
HTML;
		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$this->assertSame(
			'https://example.com/image.jpg',
			$block->attributes['url'],
			"The 'url' attribute should be updated with the value returned by the source."
		);
		$this->assertSame(
			'Example Image',
			$block->attributes['caption'],
			"The 'caption' attribute should be updated with the value returned by the source."
		);
		$this->assertSame(
			'<figure class="wp-block-image"><img src="https://example.com/image.jpg" alt=""/><figcaption class="wp-element-caption">Example Image</figcaption></figure>',
			trim( $result ),
			'The block content should be updated with the value returned by the source.'
		);
	}

	/**
	 * Tests if the `__default` attribute is replaced with real attributes for
	 * pattern overrides.
	 *
	 * @covers WP_Block::process_block_bindings
	 */
	public function test_default_binding_for_pattern_overrides() {
		$block_content = <<<HTML
<!-- wp:test/block {"metadata":{"bindings":{"__default":{"source":"core/pattern-overrides"}},"name":"Test"}} -->
<p>This should not appear</p>
<!-- /wp:test/block -->
HTML;

		$expected_content = 'This is the content value';
		$parsed_blocks    = parse_blocks( $block_content );
		$block            = new WP_Block( $parsed_blocks[0], array( 'pattern/overrides' => array( 'Test' => array( 'myAttribute' => $expected_content ) ) ) );

		$result = $block->render();

		$this->assertSame(
			"<p>$expected_content</p>",
			trim( $result ),
			'The `__default` attribute should be replaced with the real attribute prior to the callback.'
		);

		$expected_bindings_metadata = array(
			'myAttribute' => array( 'source' => 'core/pattern-overrides' ),
		);
		$this->assertSame(
			$expected_bindings_metadata,
			$block->attributes['metadata']['bindings'],
			'The __default binding should be updated with the individual binding attributes in the block metadata.'
		);
	}

	/**
	 * Tests that filter `block_bindings_source_value` is applied.
	 */
	public function test_filter_block_bindings_source_value() {
		register_block_bindings_source(
			self::SOURCE_NAME,
			array(
				'label'              => self::SOURCE_LABEL,
				'get_value_callback' => function () {
					return '';
				},
			)
		);

		$filter_value = function ( $value, $source_name, $source_args, $block_instance, $attribute_name ) {
			if ( self::SOURCE_NAME !== $source_name ) {
				return $value;
			}
			return "Filtered value: {$source_args['test_key']}. Block instance: {$block_instance->name}. Attribute name: {$attribute_name}.";
		};

		add_filter( 'block_bindings_source_value', $filter_value, 10, 5 );

		$block_content = <<<HTML
<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"test/source", "args":{"test_key":"test_arg"}}}}} -->
<p>Default content</p>
<!-- /wp:paragraph -->
HTML;
		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		remove_filter( 'block_bindings_source_value', $filter_value );

		$this->assertSame(
			'<p class="wp-block-paragraph">Filtered value: test_arg. Block instance: core/paragraph. Attribute name: content.</p>',
			trim( $result ),
			'The block content should show the filtered value.'
		);
	}

	/**
	 * Renders a list item with a source value bound to its content attribute.
	 *
	 * @param mixed  $source_value  The source value.
	 * @param string $block_content The block content.
	 * @return string Rendered block content.
	 */
	private function render_list_item_with_source_value( $source_value, $block_content ) {
		register_block_bindings_source(
			self::SOURCE_NAME,
			array(
				'label'              => self::SOURCE_LABEL,
				'get_value_callback' => function () use ( $source_value ) {
					return $source_value;
				},
			)
		);

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		return trim( $block->render() );
	}

	/**
	 * Tests if list item content is updated with a plain text value returned by the source.
	 *
	 * @covers WP_Block::render
	 */
	public function test_update_list_item_with_plain_text_value_from_source() {
		$block_content = <<<HTML
<!-- wp:list-item {"metadata":{"bindings":{"content":{"source":"test/source"}}}} -->
<li>This should not appear</li>
<!-- /wp:list-item -->
HTML;
		$result        = $this->render_list_item_with_source_value( 'test source value', $block_content );

		$this->assertSame(
			'<li>test source value</li>',
			$result,
			'The list item content should be replaced by the source text.'
		);
	}
	/**
	 * Tests if raw nested list markup is replaced when it is not a list inner block.
	 *
	 * @covers WP_Block::render
	 */
	public function test_update_list_item_with_raw_nested_list_markup_without_inner_block_replaces_markup() {
		$block_content = <<<HTML
<!-- wp:list-item {"metadata":{"bindings":{"content":{"source":"test/source"}}}} -->
<li>Default content<ul><li>Raw nested list should be replaced</li></ul></li>
<!-- /wp:list-item -->
HTML;
		$result        = $this->render_list_item_with_source_value( 'Bound text', $block_content );

		$this->assertSame(
			'<li>Bound text</li>',
			$result,
			'Raw nested list markup should be replaced with the rest of the list item content.'
		);
	}

	/**
	 * Tests if source image markup renders after post KSES sanitization.
	 *
	 * @covers WP_Block::render
	 */
	public function test_update_list_item_source_image_renders_after_kses() {
		$block_content = <<<HTML
<!-- wp:list-item {"metadata":{"bindings":{"content":{"source":"test/source"}}}} -->
<li>This should not appear</li>
<!-- /wp:list-item -->
HTML;
		$result        = $this->render_list_item_with_source_value(
			'Bound <img class="wp-image-42" src="https://example.com/inline-image.jpg" alt="Inline image" />',
			$block_content
		);

		$this->assertMatchesRegularExpression(
			'#<li>Bound <img[^>]*class="wp-image-42"[^>]*src="https://example\.com/inline-image\.jpg"[^>]*alt="Inline image"[^>]*/?></li>#',
			$result,
			'The source image should render in the list item content after sanitization.'
		);
	}

	/**
	 * Tests if unsafe source markup is sanitized from list item content.
	 *
	 * @covers WP_Block::render
	 */
	public function test_update_list_item_unsafe_source_markup_is_sanitized() {
		$block_content = <<<HTML
<!-- wp:list-item {"metadata":{"bindings":{"content":{"source":"test/source"}}}} -->
<li>This should not appear</li>
<!-- /wp:list-item -->
HTML;
		$result        = $this->render_list_item_with_source_value(
			'Bound <img src="https://example.com/inline-image.jpg" alt="Inline image" onerror="alert(1)" /> <script>alert("Unsafe HTML")</script>',
			$block_content
		);

		$this->assertStringNotContainsString(
			'<script',
			$result,
			'Script tags should be stripped from list item source content.'
		);
		$this->assertStringNotContainsString(
			'onerror',
			$result,
			'Event handler attributes should be stripped from list item source content.'
		);
		$this->assertMatchesRegularExpression(
			'#<img[^>]*src="https://example\.com/inline-image\.jpg"[^>]*alt="Inline image"[^>]*/?>#',
			$result,
			'Safe image markup should remain after sanitization.'
		);
	}

	/**
	 * Tests if original inline images are replaced by bound list item text.
	 *
	 * @covers WP_Block::render
	 */
	public function test_update_list_item_original_inline_image_is_replaced_by_source_text() {
		$block_content = <<<HTML
<!-- wp:list-item {"metadata":{"bindings":{"content":{"source":"test/source"}}}} -->
<li>Original <img src="https://example.com/original-image.jpg" alt="Original inline image" /> content</li>
<!-- /wp:list-item -->
HTML;
		$result        = $this->render_list_item_with_source_value( 'Bound text', $block_content );

		$this->assertSame(
			'<li>Bound text</li>',
			$result,
			'The original inline image should be replaced with the rest of the list item content.'
		);
		$this->assertStringNotContainsString(
			'original-image.jpg',
			$result,
			'The original inline image source should not remain after binding replacement.'
		);
		$this->assertStringNotContainsString(
			'Original inline image',
			$result,
			'The original inline image alt text should not remain after binding replacement.'
		);
	}
}
