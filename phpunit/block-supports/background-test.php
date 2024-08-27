<?php

/**
 * Test the background block support.
 *
 * @package Gutenberg
 */
class WP_Block_Supports_Background_Test extends WP_UnitTestCase {
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
		WP_Style_Engine_CSS_Rules_Store::remove_all_stores();
	}

	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;

		// Clear up the filters to modify the theme root.
		remove_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		remove_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		remove_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );

		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		WP_Style_Engine_CSS_Rules_Store::remove_all_stores();
		unregister_block_type( $this->test_block_name );
		$this->test_block_name = null;
		parent::tear_down();
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
	}

	/**
	 * Tests that background image block support works as expected.
	 *
	 * @covers ::gutenberg_render_background_support
	 *
	 * @dataProvider data_background_block_support
	 *
	 * @param string $theme_name          The theme to switch to.
	 * @param string $block_name          The test block name to register.
	 * @param mixed  $background_settings The background block support settings.
	 * @param mixed  $background_style    The background styles within the block attributes.
	 * @param string $expected_wrapper    Expected markup for the block wrapper.
	 * @param string $wrapper             Existing markup for the block wrapper.
	 */
	public function test_background_block_support( $theme_name, $block_name, $background_settings, $background_style, $expected_wrapper, $wrapper ) {
		switch_theme( $theme_name );
		$this->test_block_name = $block_name;

		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 2,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'background' => $background_settings,
				),
			)
		);

		$block = array(
			'blockName' => $block_name,
			'attrs'     => array(
				'style' => array(
					'background' => $background_style,
				),
			),
		);

		$actual = gutenberg_render_background_support( $wrapper, $block );

		$this->assertEquals(
			$expected_wrapper,
			$actual,
			'Background block wrapper markup should be correct'
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_background_block_support() {
		return array(
			'background image style is applied' => array(
				'theme_name'          => 'block-theme-child-with-fluid-typography',
				'block_name'          => 'test/background-rules-are-output',
				'background_settings' => array(
					'backgroundImage' => true,
				),
				'background_style'    => array(
					'backgroundImage' => array(
						'url' => 'https://example.com/image.jpg',
					),
				),
				'expected_wrapper'    => '<div class="has-background" style="background-image:url(&#039;https://example.com/image.jpg&#039;);background-size:cover;">Content</div>',
				'wrapper'             => '<div>Content</div>',
			),
			'background image style is applied when backgroundImage is a string' => array(
				'theme_name'          => 'block-theme-child-with-fluid-typography',
				'block_name'          => 'test/background-rules-are-output',
				'background_settings' => array(
					'backgroundImage' => true,
				),
				'background_style'    => array(
					'backgroundImage' => "url('https://example.com/image.jpg')",
				),
				'expected_wrapper'    => '<div class="has-background" style="background-image:url(&#039;https://example.com/image.jpg&#039;);background-size:cover;">Content</div>',
				'wrapper'             => '<div>Content</div>',
			),
			'background image style with contain, position, attachment, and repeat is applied' => array(
				'theme_name'          => 'block-theme-child-with-fluid-typography',
				'block_name'          => 'test/background-rules-are-output',
				'background_settings' => array(
					'backgroundImage' => true,
				),
				'background_style'    => array(
					'backgroundImage'      => array(
						'url' => 'https://example.com/image.jpg',
					),
					'backgroundRepeat'     => 'no-repeat',
					'backgroundSize'       => 'contain',
					'backgroundAttachment' => 'fixed',
				),
				'expected_wrapper'    => '<div class="has-background" style="background-image:url(&#039;https://example.com/image.jpg&#039;);background-position:50% 50%;background-repeat:no-repeat;background-size:contain;background-attachment:fixed;">Content</div>',
				'wrapper'             => '<div>Content</div>',
			),
			'background image style is appended if a style attribute already exists' => array(
				'theme_name'          => 'block-theme-child-with-fluid-typography',
				'block_name'          => 'test/background-rules-are-output',
				'background_settings' => array(
					'backgroundImage' => true,
				),
				'background_style'    => array(
					'backgroundImage' => array(
						'url' => 'https://example.com/image.jpg',
					),
				),
				'expected_wrapper'    => '<div class="wp-block-test has-background" style="color: red;background-image:url(&#039;https://example.com/image.jpg&#039;);background-size:cover;">Content</div>',
				'wrapper'             => '<div class="wp-block-test" style="color: red">Content</div>',
			),
			'background image style is appended if a style attribute containing multiple styles already exists' => array(
				'theme_name'          => 'block-theme-child-with-fluid-typography',
				'block_name'          => 'test/background-rules-are-output',
				'background_settings' => array(
					'backgroundImage' => true,
				),
				'background_style'    => array(
					'backgroundImage' => array(
						'url' => 'https://example.com/image.jpg',
					),
				),
				'expected_wrapper'    => '<div class="wp-block-test has-background" style="color: red;font-size: 15px;background-image:url(&#039;https://example.com/image.jpg&#039;);background-size:cover;">Content</div>',
				'wrapper'             => '<div class="wp-block-test" style="color: red;font-size: 15px;">Content</div>',
			),
			'background image style is not applied if the block does not support background image' => array(
				'theme_name'          => 'block-theme-child-with-fluid-typography',
				'block_name'          => 'test/background-rules-are-not-output',
				'background_settings' => array(
					'backgroundImage' => false,
				),
				'background_style'    => array(
					'backgroundImage' => array(
						'url' => 'https://example.com/image.jpg',
					),
				),
				'expected_wrapper'    => '<div>Content</div>',
				'wrapper'             => '<div>Content</div>',
			),
		);
	}
}
