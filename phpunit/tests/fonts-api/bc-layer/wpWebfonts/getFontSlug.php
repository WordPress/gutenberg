<?php
/**
 * Integration tests for WP_Webfonts::get_font_slug().
 *
 * @package    Gutenberg
 * @subpackage Fonts API
 */

require_once dirname( __DIR__ ) . '/base.php';

/**
 * @group  fontsapi
 * @group  fontsapi-bclayer
 * @covers WP_Webfonts::get_font_slug
 */
class Tests_Fonts_WpWebfonts_GetFontSlug extends Fonts_BcLayer_TestCase {

	/**
	 * @dataProvider data_should_get_font_slug
	 *
	 * @expectedDeprecated WP_Webfonts::get_font_slug
	 *
	 * @param array|string $to_convert Value to test.
	 * @param string       $expected   Expected result.
	 */
	public function test_should_get_font_slug( $to_convert, $expected ) {
		$this->assertSame( $expected, WP_Webfonts::get_font_slug( $to_convert ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_get_font_slug() {
		return array(
			'font family: single word'                    => array(
				'to_convert' => 'Merriweather',
				'expected'   => 'merriweather',
			),
			'variation: single word font-family'          => array(
				'to_convert' => array(
					'font-family' => 'Merriweather',
					'font-style'  => 'normal',
					'font-weight' => '400',
				),
				'expected'   => 'merriweather',
			),
			'font family: multiword'                      => array(
				'to_convert' => 'Source Sans Pro',
				'expected'   => 'source-sans-pro',
			),
			'variation: multiword font-family'            => array(
				'to_convert' => array(
					'font-family' => 'Source Serif Pro',
					'font-style'  => 'normal',
					'font-weight' => '200 900',
				),
				'expected'   => 'source-serif-pro',
			),
			'font family: delimited by hyphens'           => array(
				'to_convert' => 'source-serif-pro',
				'expected'   => 'source-serif-pro',
			),
			'variation: font-family delimited by hyphens' => array(
				'to_convert' => array(
					'font-family' => 'source-serif-pro',
					'font-style'  => 'normal',
					'font-weight' => '200 900',
				),
				'expected'   => 'source-serif-pro',
			),
			'font family: delimited by underscore'        => array(
				'to_convert' => 'source_serif_pro',
				'expected'   => 'source_serif_pro',
			),
			'variation: font family delimited by underscore' => array(
				'to_convert' => array(
					'font-style'  => 'normal',
					'font-weight' => '200 900',
					'font-family' => 'Source_Serif_Pro',
				),
				'expected'   => 'source_serif_pro',
			),
			'font family: delimited by hyphens and underscore' => array(
				'to_convert' => 'my-custom_font_family',
				'expected'   => 'my-custom_font_family',
			),
			'variation: font family delimited by hyphens and underscore' => array(
				'to_convert' => array(
					'font-weight' => '700',
					'font-family' => 'my-custom_font_family',
					'font-style'  => 'italic',
				),
				'expected'   => 'my-custom_font_family',
			),
			'font family: delimited mixture'              => array(
				'to_convert' => 'My custom_font-family',
				'expected'   => 'my-custom_font-family',
			),
			'variation: font family delimited mixture'    => array(
				'to_convert' => array(
					'font-style'  => 'italic',
					'font-family' => 'My custom_font-family',
					'font-weight' => '700',
				),
				'expected'   => 'my-custom_font-family',
			),
		);
	}

	/**
	 * @dataProvider data_should_not_get_font_slug
	 *
	 * @expectedDeprecated WP_Webfonts::get_font_slug
	 *
	 * @param array|string $to_convert Value to test.
	 */
	public function test_should_not_get_font_slug( $to_convert ) {
		$this->assertFalse( WP_Webfonts::get_font_slug( $to_convert ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_not_get_font_slug() {
		return array(
			'Empty string' => array( '' ),
			'Empty array'  => array( array() ),
		);
	}
}
