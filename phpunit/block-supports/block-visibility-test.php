<?php

/**
 * Test the block visibility block supports.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Visibility_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
	}

	public function tear_down() {
		unregister_block_type( $this->test_block_name );
		$this->test_block_name = null;
		parent::tear_down();
	}

	/**
	 * Test that hide everywhere returns empty string.
	 */
	public function test_hide_everywhere_returns_empty_string() {
		$this->test_block_name = 'test/hide-everywhere';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => false,
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertSame( '', $result );
	}

	/**
	 * Test that block with visibility explicitly disabled is not affected.
	 */
	public function test_block_with_visibility_disabled_unaffected() {
		$this->test_block_name = 'test/visibility-disabled';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => false,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => true,
						'tablet'  => true,
						'desktop' => true,
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		// Should not add breakpoint classes if visibility support explicitly disabled
		$this->assertSame( $block_content, $result );
	}

	/**
	 * Test that boolean true adds mobile visibility class.
	 */
	public function test_boolean_true_adds_mobile_class() {
		$this->test_block_name = 'test/mobile-visibility';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => true,
						'tablet'  => false,
						'desktop' => false,
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringContainsString( 'wp-block-hidden-mobile', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-tablet', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-desktop', $result );
	}

	/**
	 * Test that integer 1 does NOT add visibility class (strict boolean check).
	 */
	public function test_integer_one_does_not_add_class() {
		$this->test_block_name = 'test/integer-one';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => 1,
						'tablet'  => 1,
						'desktop' => 1,
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringNotContainsString( 'wp-block-hidden-mobile', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-tablet', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-desktop', $result );
	}

	/**
	 * Test that string "1" does NOT add visibility class (strict boolean check).
	 */
	public function test_string_one_does_not_add_class() {
		$this->test_block_name = 'test/string-one';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => '1',
						'tablet'  => '1',
						'desktop' => '1',
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringNotContainsString( 'wp-block-hidden-mobile', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-tablet', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-desktop', $result );
	}

	/**
	 * Test that string "0" does NOT add visibility class.
	 * This specifically tests against the ! empty() bug.
	 */
	public function test_string_zero_does_not_add_class() {
		$this->test_block_name = 'test/string-zero';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => '0',
						'tablet'  => '0',
						'desktop' => '0',
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringNotContainsString( 'wp-block-hidden-mobile', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-tablet', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-desktop', $result );
	}

	/**
	 * Test that string "yes" does NOT add visibility class (strict boolean check).
	 */
	public function test_string_yes_does_not_add_class() {
		$this->test_block_name = 'test/string-yes';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => 'yes',
						'tablet'  => 'yes',
						'desktop' => 'yes',
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringNotContainsString( 'wp-block-hidden-mobile', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-tablet', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-desktop', $result );
	}

	/**
	 * Test that boolean false, null, and 0 do NOT add visibility classes.
	 */
	public function test_falsy_values_do_not_add_classes() {
		$this->test_block_name = 'test/falsy-values';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => false,
						'tablet'  => null,
						'desktop' => 0,
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringNotContainsString( 'wp-block-hidden-mobile', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-tablet', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-desktop', $result );
	}

	/**
	 * Test that multiple breakpoints work correctly.
	 */
	public function test_multiple_breakpoints_add_multiple_classes() {
		$this->test_block_name = 'test/multiple-breakpoints';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => true,
						'tablet'  => true,
						'desktop' => false,
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringContainsString( 'wp-block-hidden-mobile', $result );
		$this->assertStringContainsString( 'wp-block-hidden-tablet', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-desktop', $result );
	}

	/**
	 * Test that missing breakpoint data doesn't cause errors.
	 */
	public function test_missing_breakpoint_data_returns_original_content() {
		$this->test_block_name = 'test/missing-breakpoints';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertSame( $block_content, $result );
	}

	/**
	 * Test that invalid breakpoint data doesn't cause errors.
	 */
	public function test_invalid_breakpoint_data_returns_original_content() {
		$this->test_block_name = 'test/invalid-breakpoints';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => 'invalid',
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertSame( $block_content, $result );
	}

	/**
	 * Test that empty breakpoint data doesn't add classes.
	 */
	public function test_empty_breakpoint_data_returns_original_content() {
		$this->test_block_name = 'test/empty-breakpoints';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertSame( $block_content, $result );
	}

	/**
	 * Test that tablet-only visibility works correctly.
	 */
	public function test_tablet_only_visibility() {
		$this->test_block_name = 'test/tablet-only';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => false,
						'tablet'  => true,
						'desktop' => false,
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringNotContainsString( 'wp-block-hidden-mobile', $result );
		$this->assertStringContainsString( 'wp-block-hidden-tablet', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-desktop', $result );
	}

	/**
	 * Test that desktop-only visibility works correctly.
	 */
	public function test_desktop_only_visibility() {
		$this->test_block_name = 'test/desktop-only';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => false,
						'tablet'  => false,
						'desktop' => true,
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringNotContainsString( 'wp-block-hidden-mobile', $result );
		$this->assertStringNotContainsString( 'wp-block-hidden-tablet', $result );
		$this->assertStringContainsString( 'wp-block-hidden-desktop', $result );
	}

	/**
	 * Test that all breakpoints hidden adds all three classes.
	 */
	public function test_all_breakpoints_hidden() {
		$this->test_block_name = 'test/all-hidden';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => true,
						'tablet'  => true,
						'desktop' => true,
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringContainsString( 'wp-block-hidden-mobile', $result );
		$this->assertStringContainsString( 'wp-block-hidden-tablet', $result );
		$this->assertStringContainsString( 'wp-block-hidden-desktop', $result );
	}

	/**
	 * Test that hide everywhere takes precedence over breakpoint visibility.
	 */
	public function test_hide_everywhere_takes_precedence() {
		$this->test_block_name = 'test/hide-everywhere-precedence';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test">Test content</div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility'            => false,
					'blockVisibilityBreakpoints' => array(
						'mobile'  => true,
						'tablet'  => true,
						'desktop' => true,
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		// Should return empty string, not add classes
		$this->assertSame( '', $result );
	}

	/**
	 * Test that visibility classes are added to the first HTML tag.
	 */
	public function test_classes_added_to_first_tag() {
		$this->test_block_name = 'test/classes-first-tag';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'visibility' => true,
				),
			)
		);

		$block_content = '<div class="wp-block-test"><p>Inner content</p></div>';
		$block         = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'metadata' => array(
					'blockVisibilityBreakpoints' => array(
						'mobile'  => true,
						'tablet'  => false,
						'desktop' => false,
					),
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		// Check that the class is added to the first div, not the inner p tag
		$this->assertStringContainsString( 'class="wp-block-test wp-block-hidden-mobile"', $result );
		$this->assertStringContainsString( '<p>Inner content</p>', $result );
	}
}
