<?php
/**
 * Integration tests for WP_Webfonts::register_webfont().
 *
 * @package    Gutenberg
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../fonts-bc-layer-testcase.php';

/**
 * @group  fontsapi
 * @group  fontsapi-bclayer
 * @covers WP_Webfonts::register_webfont
 */
class Tests_Fonts_WpWebfonts_RegisterWebfont extends Fonts_BcLayer_TestCase {

	/**
	 * @expectedDeprecated wp_webfonts
	 * @expectedDeprecated WP_Webfonts::register_webfont
	 */
	public function test_should_bail_out() {
		$webfont = array();
		$this->assertFalse( wp_webfonts()->register_webfont( $webfont ) );
	}

	/**
	 * @dataProvider data_should_register_webfont
	 *
	 * @expectedDeprecated wp_webfonts
	 * @expectedDeprecated WP_Webfonts::register_webfont
	 *
	 * @param array        $input    Font to register.
	 * @param string|false $expected Expected result.
	 */
	public function test_should_register_webfont( array $input, $expected ) {
		$this->assertSame( $expected['register_webfont'], wp_webfonts()->register_webfont( ...$input ), 'Font-family handle should be returned' );
		$this->assertSame( $expected['get_registered'], $this->get_registered_handles(), 'Font should be registered' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_register_webfont() {
		return array(
			'No font family or variation handles'   => array(
				'input'    => array(
					array(
						'font-family' => 'Merriweather',
						'font-style'  => 'italic',
						'font-weight' => '400',
						'src'         => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					),
				),
				'expected' => array(
					'register_webfont' => 'merriweather',
					'get_registered'   => array( 'merriweather', 'merriweather-400-italic' ),
				),
			),
			'Has font family handle but no variation handles' => array(
				'input'    => array(
					array(
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					),
					'source-serif-pro',
				),
				'expected' => array(
					'register_webfont' => 'source-serif-pro',
					'get_registered'   => array( 'source-serif-pro', 'source-serif-pro-200-900-normal' ),
				),
			),
			'No font family handle but has variation handle' => array(
				'input'    => array(
					array(
						'font-family' => 'Merriweather',
						'font-style'  => 'italic',
						'font-weight' => '400',
						'src'         => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					),
					'',
					'merriweather-italic-400',
				),
				'expected' => array(
					'register_webfont' => 'merriweather',
					'get_registered'   => array( 'merriweather', 'merriweather-italic-400' ),
				),
			),
			'Has font family and variation handles' => array(
				'input'    => array(
					array(
						'font-family' => 'Source Serif Pro',
						'font-style'  => 'italic',
						'font-weight' => '200 900',
						'src'         => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
					),
					'source-serif-pro',
					'source-serif-pro-variable-italic',
				),
				'expected' => array(
					'register_webfont' => 'source-serif-pro',
					'get_registered'   => array( 'source-serif-pro', 'source-serif-pro-variable-italic' ),
				),
			),
		);
	}
}
