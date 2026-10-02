<?php

/**
 * Test the position block support.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Position_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	/**
	 * Theme root directory.
	 *
	 * @var string
	 */
	private $theme_root;

	/**
	 * Original theme directory.
	 *
	 * @var string
	 */
	private $orig_theme_dir;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
		$this->theme_root      = realpath( __DIR__ . '/../data/themedir1' );
		$this->orig_theme_dir  = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );
		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
		unregister_block_type( $this->test_block_name );
		$this->test_block_name = null;
		parent::tear_down();
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
	}

	/**
	 * Tests that position block support works as expected.
	 *
	 * @covers ::gutenberg_render_position_support
	 *
	 * @dataProvider data_position_block_support
	 *
	 * @param string $theme_name        The theme to switch to.
	 * @param string $block_name        The test block name to register.
	 * @param mixed  $position_settings The position block support settings.
	 * @param mixed  $style_attribute   The style attribute of the block.
	 * @param string $expected_wrapper  Expected markup for the block wrapper.
	 * @param string $expected_styles   Expected styles enqueued by the style engine.
	 */
	public function test_position_block_support( $theme_name, $block_name, $position_settings, $style_attribute, $expected_wrapper, $expected_styles ) {
		switch_theme( $theme_name );
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
				'supports'    => array(
					'position' => $position_settings,
				),
			)
		);

		$block = array(
			'blockName' => 'test/position-rules-are-output',
			'attrs'     => array(
				'style' => $style_attribute,
			),
		);

		$actual = gutenberg_render_position_support( '<div>Content</div>', $block );

		$this->assertMatchesRegularExpression(
			$expected_wrapper,
			$actual,
			'Position block wrapper markup should be correct'
		);

		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );

		$this->assertMatchesRegularExpression(
			$expected_styles,
			$actual_stylesheet,
			'Position style rules output should be correct'
		);
	}

	/**
	 * Registers a test block type with position support.
	 *
	 * @param string $block_name The test block name to register.
	 */
	private function register_position_block( $block_name ) {
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
				'supports'    => array(
					'position' => true,
				),
			)
		);
	}

	/**
	 * Tests that blocks resolving to the same position styles share a single CSS rule.
	 *
	 * The container class is derived from the position styles, so repeating a block
	 * with the same position does not add a rule per instance to the style engine store.
	 *
	 * @covers ::gutenberg_render_position_support
	 */
	public function test_identical_position_styles_share_one_rule() {
		switch_theme( 'block-theme-child-with-fluid-typography' );
		$this->register_position_block( 'test/position-rules-are-deduplicated' );

		$block = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'style' => array(
					'position' => array(
						'type' => 'sticky',
						'top'  => '0px',
					),
				),
			),
		);

		$first  = gutenberg_render_position_support( '<div>One</div>', $block );
		$second = gutenberg_render_position_support( '<div>Two</div>', $block );

		$this->assertSame(
			1,
			preg_match( '/class="(wp-container-[0-9a-f]{8}) is-position-sticky"/', $first, $first_match ),
			'First block should receive a hashed position container class.'
		);
		$this->assertSame(
			1,
			preg_match( '/class="(wp-container-[0-9a-f]{8}) is-position-sticky"/', $second, $second_match ),
			'Second block should receive a hashed position container class.'
		);
		$this->assertSame(
			$first_match[1],
			$second_match[1],
			'Blocks with identical position styles should share a container class.'
		);

		$stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );

		$this->assertSame(
			1,
			substr_count( $stylesheet, '.' . $first_match[1] . '{' ),
			'Identical position styles should produce a single CSS rule.'
		);
	}

	/**
	 * Tests that blocks with different position styles do not share a CSS rule.
	 *
	 * @covers ::gutenberg_render_position_support
	 */
	public function test_differing_position_styles_do_not_share_a_rule() {
		switch_theme( 'block-theme-child-with-fluid-typography' );
		$this->register_position_block( 'test/position-rules-differ' );

		$make_block = static function ( $top ) {
			return array(
				'blockName' => 'test/position-rules-differ',
				'attrs'     => array(
					'style' => array(
						'position' => array(
							'type' => 'sticky',
							'top'  => $top,
						),
					),
				),
			);
		};

		$first  = gutenberg_render_position_support( '<div>One</div>', $make_block( '0px' ) );
		$second = gutenberg_render_position_support( '<div>Two</div>', $make_block( '10px' ) );

		preg_match( '/class="(wp-container-[0-9a-f]{8}) /', $first, $first_match );
		preg_match( '/class="(wp-container-[0-9a-f]{8}) /', $second, $second_match );

		$this->assertNotSame(
			$first_match[1],
			$second_match[1],
			'Blocks with different position styles should not share a container class.'
		);
	}

	/**
	 * Tests that blocks differing only in a viewport state position do not share a CSS rule.
	 *
	 * @covers ::gutenberg_render_position_support
	 */
	public function test_differing_viewport_position_styles_do_not_share_a_rule() {
		switch_theme( 'block-theme-child-with-fluid-typography' );
		$this->register_position_block( 'test/position-viewport-rules-differ' );

		$make_block = static function ( $tablet_top ) {
			return array(
				'blockName' => 'test/position-viewport-rules-differ',
				'attrs'     => array(
					'style' => array(
						'position' => array(
							'type' => 'sticky',
							'top'  => '0px',
						),
						'@tablet'  => array(
							'position' => array(
								'top' => $tablet_top,
							),
						),
					),
				),
			);
		};

		$first  = gutenberg_render_position_support( '<div>One</div>', $make_block( '1rem' ) );
		$second = gutenberg_render_position_support( '<div>Two</div>', $make_block( '2rem' ) );

		preg_match( '/class="(wp-container-[0-9a-f]{8}) /', $first, $first_match );
		preg_match( '/class="(wp-container-[0-9a-f]{8}) /', $second, $second_match );

		$this->assertNotSame(
			$first_match[1],
			$second_match[1],
			'Blocks with different viewport position styles should not share a container class.'
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_position_block_support() {
		return array(
			'sticky position style is applied' => array(
				'theme_name'        => 'block-theme-child-with-fluid-typography',
				'block_name'        => 'test/position-rules-are-output',
				'position_settings' => true,
				'style_attribute'   => array(
					'position' => array(
						'type' => 'sticky',
						'top'  => '0px',
					),
				),
				'expected_wrapper'  => '/^<div class="wp-container-[0-9a-f]{8} is-position-sticky">Content<\/div>$/',
				'expected_styles'   => '/^.wp-container-[0-9a-f]{8}' . preg_quote( '{top:calc(0px + var(--wp-admin--admin-bar--position-offset, 0px));position:sticky;z-index:10;}' ) . '$/',
			),
			'sticky position style is not applied if theme does not support it' => array(
				'theme_name'        => 'default',
				'block_name'        => 'test/position-rules-without-theme-support',
				'position_settings' => true,
				'style_attribute'   => array(
					'position' => array(
						'type' => 'sticky',
						'top'  => '0px',
					),
				),
				'expected_wrapper'  => '/^<div>Content<\/div>$/',
				'expected_styles'   => '/^$/',
			),
			'sticky position style is not applied if block does not support it' => array(
				'theme_name'        => 'block-theme-child-with-fluid-typography',
				'block_name'        => 'test/position-rules-without-block-support',
				'position_settings' => false,
				'style_attribute'   => array(
					'position' => array(
						'type' => 'sticky',
						'top'  => '0px',
					),
				),
				'expected_wrapper'  => '/^<div>Content<\/div>$/',
				'expected_styles'   => '/^$/',
			),
			'sticky position style is not applied if type is not valid' => array(
				'theme_name'        => 'block-theme-child-with-fluid-typography',
				'block_name'        => 'test/position-rules-with-valid-type',
				'position_settings' => true,
				'style_attribute'   => array(
					'position' => array(
						'type' => 'illegal-type',
						'top'  => '0px',
					),
				),
				'expected_wrapper'  => '/^<div>Content<\/div>$/',
				'expected_styles'   => '/^$/',
			),
			'viewport position style is applied within a media query' => array(
				'theme_name'        => 'block-theme-child-with-fluid-typography',
				'block_name'        => 'test/position-rules-are-output',
				'position_settings' => true,
				'style_attribute'   => array(
					'@mobile' => array(
						'position' => array(
							'type' => 'sticky',
							'top'  => '0px',
						),
					),
				),
				'expected_wrapper'  => '/^<div class="wp-container-[0-9a-f]{8} is-position-sticky">Content<\/div>$/',
				'expected_styles'   => '/^' . preg_quote( '@media (width <= 480px){.wp-container-' ) . '[0-9a-f]{8}' . preg_quote( '{top:calc(0px + var(--wp-admin--admin-bar--position-offset, 0px));position:sticky;z-index:10;}}' ) . '$/',
			),
			'viewport position style inherits the default state position type' => array(
				'theme_name'        => 'block-theme-child-with-fluid-typography',
				'block_name'        => 'test/position-rules-are-output',
				'position_settings' => true,
				'style_attribute'   => array(
					'position' => array(
						'type' => 'sticky',
						'top'  => '0px',
					),
					'@tablet'  => array(
						'position' => array(
							'top' => '2rem',
						),
					),
				),
				'expected_wrapper'  => '/^<div class="wp-container-[0-9a-f]{8} is-position-sticky">Content<\/div>$/',
				'expected_styles'   => '/^' . preg_quote( '.wp-container-' ) . '[0-9a-f]{8}' . preg_quote( '{top:calc(0px + var(--wp-admin--admin-bar--position-offset, 0px));position:sticky;z-index:10;}' ) . preg_quote( '@media (480px < width <= 782px){.wp-container-' ) . '[0-9a-f]{8}' . preg_quote( '{top:calc(2rem + var(--wp-admin--admin-bar--position-offset, 0px));position:sticky;z-index:10;}}' ) . '$/',
			),
			'viewport position style is not applied if theme does not support it' => array(
				'theme_name'        => 'default',
				'block_name'        => 'test/position-rules-are-output',
				'position_settings' => true,
				'style_attribute'   => array(
					'@mobile' => array(
						'position' => array(
							'type' => 'sticky',
							'top'  => '0px',
						),
					),
				),
				'expected_wrapper'  => '/^<div>Content<\/div>$/',
				'expected_styles'   => '/^$/',
			),
			'viewport position style resets an inherited default state position' => array(
				'theme_name'        => 'block-theme-child-with-fluid-typography',
				'block_name'        => 'test/position-rules-are-output',
				'position_settings' => true,
				'style_attribute'   => array(
					'position' => array(
						'type' => 'sticky',
						'top'  => '0px',
					),
					'@mobile'  => array(
						'position' => array(
							'type' => '',
						),
					),
				),
				'expected_wrapper'  => '/^<div class="wp-container-[0-9a-f]{8} is-position-sticky">Content<\/div>$/',
				'expected_styles'   => '/^' . preg_quote( '.wp-container-' ) . '[0-9a-f]{8}' . preg_quote( '{top:calc(0px + var(--wp-admin--admin-bar--position-offset, 0px));position:sticky;z-index:10;}' ) . preg_quote( '@media (width <= 480px){.wp-container-' ) . '[0-9a-f]{8}' . preg_quote( '{position:static;}}' ) . '$/',
			),
		);
	}
}
