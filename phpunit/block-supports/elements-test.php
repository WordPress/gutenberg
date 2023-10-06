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
	 * Tests that elements block support works as expected.
	 *
	 * @covers ::gutenberg_render_elements_support_styles
	 *
	 * @dataProvider data_elements_block_support_styles
	 *
	 * @param string $block_name      The test block name to register.
	 * @param mixed  $color_settings  The color block support settings used for elements support.
	 * @param mixed  $elements_styles The elements styles within the block attributes.
	 * @param string $expected_styles Expected styles enqueued by the style engine.
	 */
	public function test_elements_block_support_styles( $block_name, $color_settings, $elements_styles, $expected_styles ) {
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
					'color' => $color_settings,
				),
			)
		);

		$block = array(
			'blockName' => 'test/element-block-supports',
			'attrs'     => array(
				'style' => array(
					'elements' => $elements_styles,
				),
			),
		);

		gutenberg_render_elements_support_styles( null, $block );
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
				'block_name'      => 'test/element-block-supports',
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
				'block_name'      => 'test/element-block-supports',
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
				'block_name'      => 'test/element-block-supports',
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
				'block_name'      => 'test/element-block-supports',
				'color_settings'  => array( 'button' => true ),
				'elements_styles' => array(
					'button' => array( 'color' => $color_styles ),
				),
				'expected_styles' => '/^.wp-elements-[a-f0-9]{32} .wp-element-button, .wp-elements-[a-f0-9]{32} .wp-block-button__link' . $color_css_rules . '$/',
			),
			'link element styles are applied'            => array(
				'block_name'      => 'test/element-block-supports',
				'color_settings'  => array( 'link' => true ),
				'elements_styles' => array(
					'link' => array(
						'color'  => $color_styles,
						':hover' => array(
							'color' => $color_styles,
						),
					),
				),
				'expected_styles' => '/^.wp-elements-[a-f0-9]{32} a' . $color_css_rules .
					'.wp-elements-[a-f0-9]{32} a:hover' . $color_css_rules . '$/',
			),
			'generic heading element styles are applied' => array(
				'block_name'      => 'test/element-block-supports',
				'color_settings'  => array( 'heading' => true ),
				'elements_styles' => array(
					'heading' => array( 'color' => $color_styles ),
				),
				'expected_styles' => '/^.wp-elements-[a-f0-9]{32} h1, .wp-elements-[a-f0-9]{32} h2, .wp-elements-[a-f0-9]{32} h3, .wp-elements-[a-f0-9]{32} h4, .wp-elements-[a-f0-9]{32} h5, .wp-elements-[a-f0-9]{32} h6' . $color_css_rules . '$/',
			),
			'individual heading element styles are applied' => array(
				'block_name'      => 'test/element-block-supports',
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
