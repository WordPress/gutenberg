<?php

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * Test WP_Font_Face::generate_and_print().
 *
 * @package WordPress
 * @subpackage Fonts API
 *
 * @since X.X.X
 * @group fonts
 * @covers WP_Font_Face::generate_and_print
 */
class Tests_Fonts_WPFontFace_GenerateAndPrint extends WP_UnitTestCase {
	/**
	 * @var WP_Font_Face
	 */
	private $font_face;

	public function set_up() {
		parent::set_up();

		$this->font_face = new WP_Font_Face();
	}

	/**
	 * @dataProvider data_test_generate_and_print
	 *
	 * @param array  $fonts Prepared fonts (to store in WP_Fonts_Provider_Local::$fonts property).
	 * @param string $expected Expected CSS.
	 */
	public function test_generate_and_print( array $fonts, $expected ) {
		$expected_output = sprintf( $expected['style-element'], $expected['font-face-css'] );
		$this->expectOutputString( $expected_output );
		$this->font_face->generate_and_print( $fonts );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_test_generate_and_print() {
		return array(
			'truetype format' => array(
				'fonts'    => array(
					'open-sans-bold-italic-local' => array(
						'provider'    => 'local',
						'font-family' => 'Open Sans',
						'font-style'  => 'italic',
						'font-weight' => 'bold',
						'src'         => 'http://example.org/assets/fonts/OpenSans-Italic-VariableFont_wdth,wght.ttf',
					),
				),
				'expected' => array(
					'style-element' => "<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
					'font-face-css' => <<<CSS
@font-face{font-family:"Open Sans";font-style:italic;font-weight:bold;src:url('http://example.org/assets/fonts/OpenSans-Italic-VariableFont_wdth,wght.ttf') format('truetype');}
CSS
				,
				),
			),
			'woff2 format'    => array(
				'fonts'    => array(
					'source-serif-pro-200-900-normal-local' => array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-stretch' => 'normal',
						'src'          => 'http://example.org/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					),
					'source-serif-pro-400-900-italic-local' => array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'italic',
						'font-weight'  => '200 900',
						'font-stretch' => 'normal',
						'src'          => 'http://example.org/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
					),
				),
				'expected' => array(
					'style-element' => "<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
					'font-face-css' => <<<CSS
@font-face{font-family:"Source Serif Pro";font-style:normal;font-weight:200 900;font-stretch:normal;src:url('http://example.org/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2') format('woff2');}@font-face{font-family:"Source Serif Pro";font-style:italic;font-weight:200 900;font-stretch:normal;src:url('http://example.org/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2') format('woff2');}
CSS

				,
				),
			),
		);
	}
}
