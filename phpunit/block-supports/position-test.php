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
				'expected_wrapper'  => '/^<div class="wp-container-\d+ is-position-sticky">Content<\/div>$/',
				'expected_styles'   => '/^.wp-container-\d+' . preg_quote( '{top:calc(0px + var(--wp-admin--admin-bar--position-offset, 0px));position:sticky;z-index:10;}' ) . '$/',
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
				'expected_wrapper'  => '/^<div class="wp-container-\d+ is-position-sticky">Content<\/div>$/',
				'expected_styles'   => '/^' . preg_quote( '@media (width <= 480px){.wp-container-' ) . '\d+' . preg_quote( '{top:calc(0px + var(--wp-admin--admin-bar--position-offset, 0px));position:sticky;z-index:10;}}' ) . '$/',
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
				'expected_wrapper'  => '/^<div class="wp-container-\d+ is-position-sticky">Content<\/div>$/',
				'expected_styles'   => '/^' . preg_quote( '.wp-container-' ) . '\d+' . preg_quote( '{top:calc(0px + var(--wp-admin--admin-bar--position-offset, 0px));position:sticky;z-index:10;}' ) . preg_quote( '@media (480px < width <= 782px){.wp-container-' ) . '\d+' . preg_quote( '{top:calc(2rem + var(--wp-admin--admin-bar--position-offset, 0px));position:sticky;z-index:10;}}' ) . '$/',
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
				'expected_wrapper'  => '/^<div class="wp-container-\d+ is-position-sticky">Content<\/div>$/',
				'expected_styles'   => '/^' . preg_quote( '.wp-container-' ) . '\d+' . preg_quote( '{top:calc(0px + var(--wp-admin--admin-bar--position-offset, 0px));position:sticky;z-index:10;}' ) . preg_quote( '@media (width <= 480px){.wp-container-' ) . '\d+' . preg_quote( '{position:static;}}' ) . '$/',
			),
		);
	}
}
