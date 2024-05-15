<?php

/**
 * Test the elements block support.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Elements_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
	}

	public function tear_down() {
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
		unregister_block_type( $this->test_block_name );
		$this->test_block_name = null;
		parent::tear_down();
	}

	/**
	 * Registers a test block type with the provided color block supports.
	 *
	 * @param array $color_settings The color block support settings used for elements.
	 */
	public function register_block_with_color_settings( $color_settings ) {
		$this->test_block_name = 'test/element-block-supports';

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
					'color' => $color_settings,
				),
			)
		);
	}

	/**
	 * Tests that elements block support applies the correct classname.
	 *
	 * @covers ::gutenberg_render_elements_support
	 *
	 * @dataProvider data_elements_block_support_class
	 *
	 * @param array  $color_settings  The color block support settings used for elements support.
	 * @param array  $elements_styles The elements styles within the block attributes.
	 * @param string $block_markup    Original block markup.
	 * @param string $expected_markup Resulting markup after application of elements block support.
	 */
	public function test_elements_block_support_class( $color_settings, $elements_styles, $block_markup, $expected_markup ) {
		$this->register_block_with_color_settings( $color_settings );

		$block = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'style' => array(
					'elements' => $elements_styles,
				),
			),
		);

		/*
		 * To ensure a consistent elements class name it is generated within a
		 * `render_block_data` filter and stored in the `className` attribute.
		 * As a result the block data needs to be passed through the same
		 * function for this test.
		 */
		$filtered_block = gutenberg_render_elements_support_styles( $block );
		$actual         = gutenberg_render_elements_class_name( $block_markup, $filtered_block );

		$this->assertMatchesRegularExpression(
			$expected_markup,
			$actual,
			'Elements block wrapper markup should be correct'
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_elements_block_support_class() {
		$color_styles = array(
			'text'       => 'var:preset|color|vivid-red',
			'background' => '#fff',
		);

		return array(
			'button element styles with serialization skipped' => array(
				'color_settings'  => array(
					'button'                          => true,
					'__experimentalSkipSerialization' => true,
				),
				'elements_styles' => array(
					'button' => array( 'color' => $color_styles ),
				),
				'block_markup'    => '<p>Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>',
				'expected_markup' => '/^<p>Hello <a href="http:\/\/www.wordpress.org\/">WordPress<\/a>!<\/p>$/',
			),
			'link element styles with serialization skipped' => array(
				'color_settings'  => array(
					'link'                            => true,
					'__experimentalSkipSerialization' => true,
				),
				'elements_styles' => array(
					'link' => array( 'color' => $color_styles ),
				),
				'block_markup'    => '<p>Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>',
				'expected_markup' => '/^<p>Hello <a href="http:\/\/www.wordpress.org\/">WordPress<\/a>!<\/p>$/',
			),
			'heading element styles with serialization skipped' => array(
				'color_settings'  => array(
					'heading'                         => true,
					'__experimentalSkipSerialization' => true,
				),
				'elements_styles' => array(
					'heading' => array( 'color' => $color_styles ),
				),
				'block_markup'    => '<p>Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>',
				'expected_markup' => '/^<p>Hello <a href="http:\/\/www.wordpress.org\/">WordPress<\/a>!<\/p>$/',
			),
			'button element styles apply class to wrapper' => array(
				'color_settings'  => array( 'button' => true ),
				'elements_styles' => array(
					'button' => array( 'color' => $color_styles ),
				),
				'block_markup'    => '<p>Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>',
				'expected_markup' => '/^<p class="wp-elements-[a-f0-9]{32}">Hello <a href="http:\/\/www.wordpress.org\/">WordPress<\/a>!<\/p>$/',
			),
			'link element styles apply class to wrapper'   => array(
				'color_settings'  => array( 'link' => true ),
				'elements_styles' => array(
					'link' => array( 'color' => $color_styles ),
				),
				'block_markup'    => '<p>Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>',
				'expected_markup' => '/^<p class="wp-elements-[a-f0-9]{32}">Hello <a href="http:\/\/www.wordpress.org\/">WordPress<\/a>!<\/p>$/',
			),
			'heading element styles apply class to wrapper' => array(
				'color_settings'  => array( 'heading' => true ),
				'elements_styles' => array(
					'heading' => array( 'color' => $color_styles ),
				),
				'block_markup'    => '<p>Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>',
				'expected_markup' => '/^<p class="wp-elements-[a-f0-9]{32}">Hello <a href="http:\/\/www.wordpress.org\/">WordPress<\/a>!<\/p>$/',
			),
			'element styles apply class to wrapper when it has other classes' => array(
				'color_settings'  => array( 'link' => true ),
				'elements_styles' => array(
					'link' => array( 'color' => $color_styles ),
				),
				'block_markup'    => '<p class="has-dark-gray-background-color has-background">Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>',
				'expected_markup' => '/^<p class="has-dark-gray-background-color has-background wp-elements-[a-f0-9]{32}">Hello <a href="http:\/\/www.wordpress.org\/">WordPress<\/a>!<\/p>$/',
			),
			'element styles apply class to wrapper when it has other attributes' => array(
				'color_settings'  => array( 'link' => true ),
				'elements_styles' => array(
					'link' => array( 'color' => $color_styles ),
				),
				'block_markup'    => '<p id="anchor">Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>',
				'expected_markup' => '/^<p class="wp-elements-[a-f0-9]{32}" id="anchor">Hello <a href="http:\/\/www.wordpress.org\/">WordPress<\/a>!<\/p>$/',
			),
		);
	}

	/**
	 * Tests that elements block support generates appropriate styles.
	 *
	 * @covers ::gutenberg_render_elements_support_styles
	 *
	 * @dataProvider data_elements_block_support_styles
	 *
	 * @param mixed  $color_settings  The color block support settings used for elements support.
	 * @param mixed  $elements_styles The elements styles within the block attributes.
	 * @param string $expected_styles Expected styles enqueued by the style engine.
	 */
	public function test_elements_block_support_styles( $color_settings, $elements_styles, $expected_styles ) {
		$this->register_block_with_color_settings( $color_settings );

		$block = array(
			'blockName' => $this->test_block_name,
			'attrs'     => array(
				'style' => array(
					'elements' => $elements_styles,
				),
			),
		);

		gutenberg_render_elements_support_styles( $block );
		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports' );

		$this->assertMatchesRegularExpression(
			$expected_styles,
			$actual_stylesheet,
			'Elements style rules output should be correct'
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_elements_block_support_styles() {
		$color_styles    = array(
			'text'       => 'var:preset|color|vivid-red',
			'background' => '#fff',
		);
		$color_css_rules = preg_quote( '{color:var(--wp--preset--color--vivid-red);background-color:#fff;}' );

		return array(
			'button element styles are not applied if serialization is skipped' => array(
				'color_settings'  => array(
					'button'                          => true,
					'__experimentalSkipSerialization' => true,
				),
				'elements_styles' => array(
					'button' => array( 'color' => $color_styles ),
				),
				'expected_styles' => '/^$/',
			),
			'link element styles are not applied if serialization is skipped' => array(
				'color_settings'  => array(
					'link'                            => true,
					'__experimentalSkipSerialization' => true,
				),
				'elements_styles' => array(
					'link' => array(
						'color'  => $color_styles,
						':hover' => array(
							'color' => $color_styles,
						),
					),
				),
				'expected_styles' => '/^$/',
			),
			'heading element styles are not applied if serialization is skipped' => array(
				'color_settings'  => array(
					'heading'                         => true,
					'__experimentalSkipSerialization' => true,
				),
				'elements_styles' => array(
					'heading' => array( 'color' => $color_styles ),
					'h1'      => array( 'color' => $color_styles ),
					'h2'      => array( 'color' => $color_styles ),
					'h3'      => array( 'color' => $color_styles ),
					'h4'      => array( 'color' => $color_styles ),
					'h5'      => array( 'color' => $color_styles ),
					'h6'      => array( 'color' => $color_styles ),
				),
				'expected_styles' => '/^$/',
			),
			'button element styles are applied'          => array(
				'color_settings'  => array( 'button' => true ),
				'elements_styles' => array(
					'button' => array( 'color' => $color_styles ),
				),
				'expected_styles' => '/^.wp-elements-[a-f0-9]{32} .wp-element-button, .wp-elements-[a-f0-9]{32} .wp-block-button__link' . $color_css_rules . '$/',
			),
			'link element styles are applied'            => array(
				'color_settings'  => array( 'link' => true ),
				'elements_styles' => array(
					'link' => array(
						'color'  => $color_styles,
						':hover' => array(
							'color' => $color_styles,
						),
					),
				),
				'expected_styles' => '/^.wp-elements-[a-f0-9]{32} a:where\(:not\(.wp-element-button\)\)' . $color_css_rules .
					'.wp-elements-[a-f0-9]{32} a:where\(:not\(.wp-element-button\)\):hover' . $color_css_rules . '$/',
			),
			'generic heading element styles are applied' => array(
				'color_settings'  => array( 'heading' => true ),
				'elements_styles' => array(
					'heading' => array( 'color' => $color_styles ),
				),
				'expected_styles' => '/^.wp-elements-[a-f0-9]{32} h1, .wp-elements-[a-f0-9]{32} h2, .wp-elements-[a-f0-9]{32} h3, .wp-elements-[a-f0-9]{32} h4, .wp-elements-[a-f0-9]{32} h5, .wp-elements-[a-f0-9]{32} h6' . $color_css_rules . '$/',
			),
			'individual heading element styles are applied' => array(
				'color_settings'  => array( 'heading' => true ),
				'elements_styles' => array(
					'h1' => array( 'color' => $color_styles ),
					'h2' => array( 'color' => $color_styles ),
					'h3' => array( 'color' => $color_styles ),
					'h4' => array( 'color' => $color_styles ),
					'h5' => array( 'color' => $color_styles ),
					'h6' => array( 'color' => $color_styles ),
				),
				'expected_styles' => '/^.wp-elements-[a-f0-9]{32} h1' . $color_css_rules .
					'.wp-elements-[a-f0-9]{32} h2' . $color_css_rules .
					'.wp-elements-[a-f0-9]{32} h3' . $color_css_rules .
					'.wp-elements-[a-f0-9]{32} h4' . $color_css_rules .
					'.wp-elements-[a-f0-9]{32} h5' . $color_css_rules .
					'.wp-elements-[a-f0-9]{32} h6' . $color_css_rules . '$/',
			),
		);
	}
}
