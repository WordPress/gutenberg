<?php

/**
 * Test the block visibility block supports.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Block_Visibility_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	/**
	 * Original experiments option value.
	 *
	 * @var array|null
	 */
	private $original_experiments;

	public function set_up() {
		parent::set_up();
		$this->test_block_name      = null;
		$this->original_experiments = get_option( 'gutenberg-experiments' );

		// Clear the style engine store to avoid test pollution.
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
	}

	public function tear_down() {
		unregister_block_type( $this->test_block_name );
		$this->test_block_name = null;

		// Remove all filters on pre_option_gutenberg-experiments to avoid pollution.
		remove_all_filters( 'pre_option_gutenberg-experiments' );

		// Restore original experiments option.
		if ( null !== $this->original_experiments ) {
			update_option( 'gutenberg-experiments', $this->original_experiments );
		} else {
			delete_option( 'gutenberg-experiments' );
		}

		parent::tear_down();
	}

	/**
	 * Registers a new block for testing visibility support.
	 *
	 * @param string $block_name Name for the test block.
	 * @param array  $supports   Array defining block support configuration.
	 *
	 * @return WP_Block_Type The block type for the newly registered test block.
	 */
	private function register_visibility_block_with_support( $block_name, $supports = array() ) {
		$this->test_block_name = $block_name;
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'metadata' => array(
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
	 * Enable the viewport visibility experiment.
	 */
	private function enable_viewport_visibility_experiment() {
		add_filter(
			'pre_option_gutenberg-experiments',
			function ( $value ) {
				if ( ! is_array( $value ) ) {
					$value = array();
				}
				$value['gutenberg-hide-blocks-based-on-screen-size'] = true;
				return $value;
			}
		);
	}

	public function test_block_visibility_support_hides_block_when_visibility_false() {
		$this->register_visibility_block_with_support(
			'test/visibility-block',
			array( 'visibility' => true )
		);

		$block_content = '<p>This is a test block.</p>';
		$block         = array(
			'blockName' => 'test/visibility-block',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => false,
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertSame( '', $result, 'Block content should be empty when blockVisibility is false and support is opted in.' );
	}

	public function test_block_visibility_support_shows_block_when_support_not_opted_in() {
		$this->register_visibility_block_with_support(
			'test/visibility-block',
			array( 'visibility' => false )
		);

		$block_content = '<p>This is a test block.</p>';
		$block         = array(
			'blockName' => 'test/visibility-block',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => false,
				),
			),
		);

		$result = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertSame( $block_content, $result, 'Block content should remain unchanged when blockVisibility support is not opted in.' );
	}

	public function test_block_visibility_support_no_visibility_attribute() {
		$this->register_visibility_block_with_support(
			'test/block-visibility-none',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/block-visibility-none',
			'attrs'     => array(),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertSame( $block_content, $result, 'Block content should remain unchanged when no visibility attribute is present.' );
	}

	public function test_block_visibility_support_generated_css_with_mobile_viewport_size() {
		$this->enable_viewport_visibility_experiment();

		$this->register_visibility_block_with_support(
			'test/viewport-mobile',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/viewport-mobile',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'viewport' => array(
							'mobile' => false,
						),
					),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringContainsString( 'wp-block-hidden-mobile', $result, 'Block should have the visibility class for the mobile viewport size.' );

		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports' );

		$this->assertSame(
			'@media (width <= 480px){.wp-block-hidden-mobile{display:none !important;}}',
			$actual_stylesheet,
			'CSS should contain mobile visibility rule'
		);
	}

	public function test_block_visibility_support_generated_css_with_tablet_viewport_size() {
		$this->enable_viewport_visibility_experiment();

		$this->register_visibility_block_with_support(
			'test/viewport-tablet',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/viewport-tablet',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'viewport' => array(
							'tablet' => false,
						),
					),
				),
			),
		);

		$block_content = '<div class="existing-class">Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringContainsString( 'class="existing-class wp-block-hidden-tablet"', $result, 'Block should have the existing class and the visibility class for the tablet viewport size in the class attribute.' );

		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports' );

		$this->assertSame(
			'@media (480px < width <= 782px){.wp-block-hidden-tablet{display:none !important;}}',
			$actual_stylesheet,
			'CSS should contain tablet visibility rule'
		);
	}

	public function test_block_visibility_support_generated_css_with_desktop_viewport_size() {
		$this->enable_viewport_visibility_experiment();

		$this->register_visibility_block_with_support(
			'test/viewport-desktop',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/viewport-desktop',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'viewport' => array(
							'desktop' => false,
						),
					),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringContainsString( 'class="wp-block-hidden-desktop"', $result, 'Block should have the visibility class for the desktop viewport size in the class attribute.' );

		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports' );

		$this->assertSame(
			'@media (width > 782px){.wp-block-hidden-desktop{display:none !important;}}',
			$actual_stylesheet,
			'CSS should contain desktop visibility rule'
		);
	}

	public function test_block_visibility_support_generated_css_with_two_viewport_sizes() {
		$this->enable_viewport_visibility_experiment();

		$this->register_visibility_block_with_support(
			'test/viewport-two',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/viewport-two',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'viewport' => array(
							'mobile'  => false,
							'desktop' => false,
						),
					),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringContainsString(
			'class="wp-block-hidden-desktop wp-block-hidden-mobile"',
			$result,
			'Block should have both visibility classes in the class attribute'
		);

		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports' );

		$this->assertSame(
			'@media (width > 782px){.wp-block-hidden-desktop{display:none !important;}}@media (width <= 480px){.wp-block-hidden-mobile{display:none !important;}}',
			$actual_stylesheet,
			'CSS should contain desktop and mobile visibility rules'
		);
	}

	public function test_block_visibility_support_generated_css_with_all_viewport_sizes_visible() {
		$this->enable_viewport_visibility_experiment();

		$this->register_visibility_block_with_support(
			'test/viewport-all-visible',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/viewport-all-visible',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'viewport' => array(
							'mobile'  => true,
							'tablet'  => true,
							'desktop' => true,
						),
					),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertSame( $block_content, $result, 'Block content should remain unchanged when all viewport sizes are visible.' );
	}

	public function test_block_visibility_support_generated_css_with_all_viewport_sizes_hidden() {
		$this->enable_viewport_visibility_experiment();

		$this->register_visibility_block_with_support(
			'test/viewport-all-hidden',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/viewport-all-hidden',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'viewport' => array(
							'mobile'  => false,
							'tablet'  => false,
							'desktop' => false,
						),
					),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertSame( '<div class="wp-block-hidden-desktop wp-block-hidden-mobile wp-block-hidden-tablet">Test content</div>', $result, 'Block content should have the visibility classes for all viewport sizes in the class attribute.' );
	}

	public function test_block_visibility_support_generated_css_with_empty_object() {
		$this->enable_viewport_visibility_experiment();

		$this->register_visibility_block_with_support(
			'test/viewport-empty',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/viewport-empty',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertSame( $block_content, $result, 'Block content should remain unchanged when blockVisibility is an empty array.' );
	}

	public function test_block_visibility_support_generated_css_with_unknown_viewport_sizes_ignored() {
		$this->enable_viewport_visibility_experiment();

		$this->register_visibility_block_with_support(
			'test/viewport-unknown-sizes',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/viewport-unknown-sizes',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'viewport' => array(
							'mobile'       => false,
							'unknownBreak' => false,
							'largeScreen'  => false,
						),
					),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertStringContainsString(
			'class="wp-block-hidden-mobile"',
			$result,
			'Block should have the visibility class for the mobile viewport size in the class attribute'
		);
	}

	public function test_block_visibility_support_generated_css_with_empty_content() {
		$this->enable_viewport_visibility_experiment();

		$this->register_visibility_block_with_support(
			'test/viewport-empty-content',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/viewport-empty-content',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'viewport' => array(
							'mobile' => false,
						),
					),
				),
			),
		);

		$block_content = '';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertSame( '', $result, 'Block content should be empty when there is no content.' );
	}
}
