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
	private function register_block_with_visibility_support( $block_name, $supports = array() ) {
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
	 * Enable the responsive visibility experiment.
	 */
	private function enable_responsive_visibility_experiment() {
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

	/**
	 * Disable the responsive visibility experiment.
	 */
	private function disable_responsive_visibility_experiment() {
		add_filter(
			'pre_option_gutenberg-experiments',
			function ( $value ) {
				if ( ! is_array( $value ) ) {
					$value = array();
				}
				unset( $value['gutenberg-hide-blocks-based-on-screen-size'] );
				return $value;
			}
		);
	}

	public function test_block_visibility_false_hides_block() {
		self::register_block_with_visibility_support(
			'test/block-visibility-false',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/block-visibility-false',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => false,
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertEquals( '', $result );
	}

	public function test_block_visibility_true_shows_block() {
		self::register_block_with_visibility_support(
			'test/block-visibility-true',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/block-visibility-true',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => true,
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertEquals( $block_content, $result );
	}

	public function test_block_visibility_no_visibility_attribute() {
		self::register_block_with_visibility_support(
			'test/block-visibility-none',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/block-visibility-none',
			'attrs'     => array(),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		$this->assertEquals( $block_content, $result );
	}

	public function test_block_without_visibility_support() {
		self::register_block_with_visibility_support(
			'test/no-visibility-support',
			array( 'visibility' => false )
		);

		$block = array(
			'blockName' => 'test/no-visibility-support',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => false,
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		// Block should not be hidden because it doesn't have visibility support.
		$this->assertEquals( $block_content, $result );
	}

	public function test_experiment_can_be_enabled() {
		$this->enable_responsive_visibility_experiment();
		$this->assertTrue( gutenberg_is_experiment_enabled( 'gutenberg-hide-blocks-based-on-screen-size' ) );
	}

	public function test_css_with_display_none_is_generated() {
		$this->enable_responsive_visibility_experiment();

		self::register_block_with_visibility_support(
			'test/css-generation',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/css-generation',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'mobile' => false,
					),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		gutenberg_render_block_visibility_support( $block_content, $block );

		// Get the generated stylesheet from the style engine context.
		$stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports' );

		// Verify the stylesheet contains display:none.
		$this->assertStringContainsString( 'display', $stylesheet, 'Stylesheet should contain display property' );
		$this->assertStringContainsString( 'none', $stylesheet, 'Stylesheet should contain none value' );
		$this->assertStringContainsString( '.wp-block-hidden-mobile', $stylesheet, 'Stylesheet should contain the visibility class' );
		$this->assertStringContainsString( '@media', $stylesheet, 'Stylesheet should contain media query' );
	}


	public function test_responsive_visibility_without_experiment() {
		$this->disable_responsive_visibility_experiment();

		self::register_block_with_visibility_support(
			'test/responsive-no-experiment',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/responsive-no-experiment',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'mobile' => false,
					),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		// Without experiment enabled, responsive visibility should not work.
		$this->assertEquals( $block_content, $result );
	}

	public function test_responsive_visibility_with_experiment_mobile() {
		$this->enable_responsive_visibility_experiment();

		self::register_block_with_visibility_support(
			'test/responsive-mobile',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/responsive-mobile',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'mobile' => false,
					),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		// Block should have the visibility class added.
		$this->assertStringContainsString( 'wp-block-hidden-mobile', $result );
	}

	public function test_responsive_visibility_with_experiment_multiple_breakpoints() {
		$this->enable_responsive_visibility_experiment();

		self::register_block_with_visibility_support(
			'test/responsive-multiple',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/responsive-multiple',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'mobile'  => false,
						'desktop' => false,
					),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		// Block should have the visibility class for both breakpoints (sorted alphabetically).
		$this->assertStringContainsString( 'wp-block-hidden-desktop-mobile', $result );
	}

	public function test_responsive_visibility_tablet_only() {
		$this->enable_responsive_visibility_experiment();

		self::register_block_with_visibility_support(
			'test/responsive-tablet',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/responsive-tablet',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'tablet' => false,
					),
				),
			),
		);

		$block_content = '<div class="existing-class">Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		// Block should have both the existing class and the new visibility class.
		$this->assertStringContainsString( 'existing-class', $result );
		$this->assertStringContainsString( 'wp-block-hidden-tablet', $result );
	}

	public function test_responsive_visibility_all_visible() {
		$this->enable_responsive_visibility_experiment();

		self::register_block_with_visibility_support(
			'test/responsive-all-visible',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/responsive-all-visible',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(
						'mobile'  => true,
						'tablet'  => true,
						'desktop' => true,
					),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		// No classes should be added if all breakpoints are visible.
		$this->assertEquals( $block_content, $result );
	}

	public function test_responsive_visibility_empty_object() {
		$this->enable_responsive_visibility_experiment();

		self::register_block_with_visibility_support(
			'test/responsive-empty',
			array( 'visibility' => true )
		);

		$block = array(
			'blockName' => 'test/responsive-empty',
			'attrs'     => array(
				'metadata' => array(
					'blockVisibility' => array(),
				),
			),
		);

		$block_content = '<div>Test content</div>';
		$result        = gutenberg_render_block_visibility_support( $block_content, $block );

		// Empty visibility object should not modify content.
		$this->assertEquals( $block_content, $result );
	}
}
