<?php

/**
 * Test the background block support.
 *
 * @package gutenberg
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

	private function get_apostrophe_entity() {
		// WP 6.9+ has get_block_bindings_supported_attributes() and uses &apos;
		// WP 6.8 and earlier use &#039;
		return function_exists( 'get_block_bindings_supported_attributes' ) ? '&apos;' : '&#039;';
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
		// Get the appropriate apostrophe encoding based on WordPress version.
		// function_exists() works in data providers, unlike get_bloginfo().
		$apos = $this->get_apostrophe_entity();

		return array(
			'background image style is applied'      => array(
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
				'expected_wrapper'    => '<div class="has-background" style="background-image:url(' . $apos . 'https://example.com/image.jpg' . $apos . ');background-size:cover;">Content</div>',
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
				'expected_wrapper'    => '<div class="has-background" style="background-image:url(' . $apos . 'https://example.com/image.jpg' . $apos . ');background-size:cover;">Content</div>',
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
				'expected_wrapper'    => '<div class="has-background" style="background-image:url(' . $apos . 'https://example.com/image.jpg' . $apos . ');background-position:50% 50%;background-repeat:no-repeat;background-size:contain;background-attachment:fixed;">Content</div>',
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
				'expected_wrapper'    => '<div class="wp-block-test has-background" style="color: red;background-image:url(' . $apos . 'https://example.com/image.jpg' . $apos . ');background-size:cover;">Content</div>',
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
				'expected_wrapper'    => '<div class="wp-block-test has-background" style="color: red;font-size: 15px;background-image:url(' . $apos . 'https://example.com/image.jpg' . $apos . ');background-size:cover;">Content</div>',
				'wrapper'             => '<div class="wp-block-test" style="color: red;font-size: 15px;">Content</div>',
			),
			'background gradient style is applied'   => array(
				'theme_name'          => 'block-theme-child-with-fluid-typography',
				'block_name'          => 'test/background-gradient-rules-are-output',
				'background_settings' => array(
					'gradient' => true,
				),
				'background_style'    => array(
					'gradient' => 'linear-gradient(135deg,rgb(255,0,0) 0%,rgb(0,0,255) 100%)',
				),
				'expected_wrapper'    => '<div class="has-background" style="background-image:linear-gradient(135deg,rgb(255,0,0) 0%,rgb(0,0,255) 100%);">Content</div>',
				'wrapper'             => '<div>Content</div>',
			),
			'background gradient style is not applied if the block does not support it' => array(
				'theme_name'          => 'block-theme-child-with-fluid-typography',
				'block_name'          => 'test/background-gradient-rules-are-not-output',
				'background_settings' => array(
					'gradient' => false,
				),
				'background_style'    => array(
					'gradient' => 'linear-gradient(135deg,rgb(255,0,0) 0%,rgb(0,0,255) 100%)',
				),
				'expected_wrapper'    => '<div>Content</div>',
				'wrapper'             => '<div>Content</div>',
			),
			'background gradient style with preset slug is applied' => array(
				'theme_name'          => 'block-theme-child-with-fluid-typography',
				'block_name'          => 'test/background-gradient-preset-slug',
				'background_settings' => array(
					'gradient' => true,
				),
				'background_style'    => array(
					'gradient' => 'var:preset|gradient|vivid-cyan-blue',
				),
				'expected_wrapper'    => '<div class="has-background" style="background-image:var(--wp--preset--gradient--vivid-cyan-blue);">Content</div>',
				'wrapper'             => '<div>Content</div>',
			),
			'background gradient and image combined' => array(
				'theme_name'          => 'block-theme-child-with-fluid-typography',
				'block_name'          => 'test/background-gradient-and-image-combined',
				'background_settings' => array(
					'backgroundImage' => true,
					'gradient'        => true,
				),
				'background_style'    => array(
					'backgroundImage' => array(
						'url' => 'https://example.com/image.jpg',
					),
					'gradient'        => 'linear-gradient(135deg,rgb(255,0,0) 0%,rgb(0,0,255) 100%)',
				),
				'expected_wrapper'    => '<div class="has-background" style="background-image:linear-gradient(135deg,rgb(255,0,0) 0%,rgb(0,0,255) 100%), url(' . $apos . 'https://example.com/image.jpg' . $apos . ');background-size:cover;">Content</div>',
				'wrapper'             => '<div>Content</div>',
			),
			'background gradient with hsl colors and image combined' => array(
				'theme_name'          => 'block-theme-child-with-fluid-typography',
				'block_name'          => 'test/background-gradient-hsl-and-image',
				'background_settings' => array(
					'backgroundImage' => true,
					'gradient'        => true,
				),
				'background_style'    => array(
					'backgroundImage' => array(
						'url' => 'https://example.com/image.jpg',
					),
					'gradient'        => 'linear-gradient(135deg,hsl(0,100%,50%) 0%,hsl(240,100%,50%) 100%)',
				),
				'expected_wrapper'    => '<div class="has-background" style="background-image:linear-gradient(135deg,hsl(0,100%,50%) 0%,hsl(240,100%,50%) 100%), url(' . $apos . 'https://example.com/image.jpg' . $apos . ');background-size:cover;">Content</div>',
				'wrapper'             => '<div>Content</div>',
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

	/**
	 * Tests that combined background gradient and image CSS values pass KSES.
	 *
	 * WordPress's safecss_filter_attr() handles gradient and url() values
	 * separately but strips the declaration when both appear in a single
	 * comma-separated background-image. The gutenberg_allow_background_image_combined
	 * filter should ensure these combined values survive sanitization.
	 *
	 * @covers ::gutenberg_allow_background_image_combined
	 *
	 * @dataProvider data_background_combined_values_pass_kses
	 *
	 * @param string $css The CSS declaration to test.
	 */
	public function test_background_combined_values_pass_kses( $css ) {
		$result = safecss_filter_attr( $css );
		$this->assertNotEmpty( $result, "Expected CSS to be allowed: $css" );
		$this->assertStringContainsString( 'background-image', $result );
	}

	/**
	 * Data provider for combined background-image KSES tests.
	 *
	 * @return array[]
	 */
	public function data_background_combined_values_pass_kses() {
		return array(
			'gradient first with rgb colors'     => array(
				'background-image: linear-gradient(135deg, rgb(255,0,0) 0%, rgb(0,0,255) 100%), url(https://example.com/image.jpg)',
			),
			'url first with rgb colors'          => array(
				'background-image: url(https://example.com/image.jpg), linear-gradient(135deg, rgb(255,0,0) 0%, rgb(0,0,255) 100%)',
			),
			'gradient first with rgba colors'    => array(
				'background-image: linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(255,255,255,0.2) 100%), url(https://example.com/image.jpg)',
			),
			'gradient first with hsl colors'     => array(
				'background-image: linear-gradient(135deg, hsl(0, 100%, 50%) 0%, hsl(240, 100%, 50%) 100%), url(https://example.com/image.jpg)',
			),
			'gradient first with hsla colors'    => array(
				'background-image: linear-gradient(135deg, hsla(0, 100%, 50%, 0.8) 0%, hsla(240, 100%, 50%, 0.5) 100%), url(https://example.com/image.jpg)',
			),
			'gradient first with oklch colors'   => array(
				'background-image: linear-gradient(135deg, oklch(0.7 0.15 30) 0%, oklch(0.5 0.2 260) 100%), url(https://example.com/image.jpg)',
			),
			'gradient first with lab colors'     => array(
				'background-image: linear-gradient(135deg, lab(50% 40 59.5) 0%, lab(70% -45 0) 100%), url(https://example.com/image.jpg)',
			),
			'radial gradient with url'           => array(
				'background-image: radial-gradient(circle, rgb(255,0,0) 0%, rgb(0,0,255) 100%), url(https://example.com/image.jpg)',
			),
			'conic gradient with url'            => array(
				'background-image: conic-gradient(rgb(255,0,0), rgb(0,0,255)), url(https://example.com/image.jpg)',
			),
			'repeating-linear gradient with url' => array(
				'background-image: repeating-linear-gradient(45deg, rgb(255,0,0) 0px, rgb(0,0,255) 40px), url(https://example.com/image.jpg)',
			),
			'var preset gradient first with url' => array(
				'background-image: var(--wp--preset--gradient--vivid-cyan-blue), url(https://example.com/image.jpg)',
			),
			'url first with var preset gradient' => array(
				'background-image: url(https://example.com/image.jpg), var(--wp--preset--gradient--vivid-cyan-blue)',
			),
			'gradient with hex colors'           => array(
				'background-image: linear-gradient(135deg, #ff0000 0%, #0000ff 100%), url(https://example.com/image.jpg)',
			),
		);
	}
}
