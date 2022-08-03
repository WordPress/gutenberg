<?php
/**
 * Register variation tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

/**
 * @group  webfonts
 * @covers ::wp_register_webfont_variation
 * @covers WP_Webfonts::add_variation
 */
class Tests_Webfonts_WpRegisterVariation extends WP_UnitTestCase {
	/**
	 * WP_Webfonts instance reference
	 *
	 * @var WP_Webfonts
	 */
	private $old_wp_webfonts;

	public function set_up() {
		parent::set_up();

		global $wp_webfonts;
		$this->old_wp_webfonts = $wp_webfonts;

		$wp_webfonts = null;
	}

	public function tear_down() {
		global $wp_webfonts;

		$wp_webfonts = $this->old_wp_webfonts;
		parent::tear_down();
	}

	/**
	 * @dataProvider data_variation_registers
	 *
	 * @param string|bool $expected           Expected results.
	 * @param string      $font_family_handle The font family's handle for this variation.
	 * @param array       $variation          An array of variation properties to add.
	 * @param string      $variation_handle   Optional. The variation's handle.
	 */
	public function test_variation_registers( $expected, $font_family_handle, array $variation, $variation_handle = '' ) {
		$this->assertSame( $expected, wp_register_webfont_variation( $font_family_handle, $variation, $variation_handle ) );
	}

	/**
	 * Data Provider
	 *
	 * @return array
	 */
	public function data_variation_registers() {
		return array(
			'fewer variation properties; without variation handle' => array(
				'expected'           => 'lato-200-normal',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'font-style'  => 'normal',
					'font-weight' => '200',
					'src'         => 'https://example.com/assets/fonts/lato/lato.ttf.woff2',
				),
			),
			'fewer variation properties; with variation handle'    => array(
				'expected'           => 'lato-my-custom-handle',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'font-style'  => 'normal',
					'font-weight' => '200',
					'src'         => 'https://example.com/assets/fonts/lato/lato.ttf.woff2',
				),
				'variation_handle'   => 'lato-my-custom-handle',
			),
			'more variation properties; without variation handle'  => array(
				'expected'           => 'source-serif-pro-200-900-normal',
				'font_family_handle' => 'source-serif-pro',
				'variation'          => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
			),
			'more variation properties; with variation handle'     => array(
				'expected'           => 'my-custom-handle',
				'font_family_handle' => 'source-serif-pro',
				'variation'          => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'variation_handle'   => 'my-custom-handle',
			),
		);
	}
}
