<?php

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
			'single truetype format font' => array(
				'fonts'    => array(
					'Inter' =>
						array (
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/inter/Inter-VariableFont_slnt,wght.ttf',
									),
								'font-family' => 'Inter',
								'font-stretch' => 'normal',
								'font-style' => 'normal',
								'font-weight' => '200',
							),
						),
				),
                'expected' => array(
					'style-element' => "<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
					'font-face-css' => <<<CSS
@font-face{font-family:Inter;font-style:normal;font-weight:200;font-display:fallback;src:url('https://example.org/assets/fonts/inter/Inter-VariableFont_slnt,wght.ttf') format('truetype');font-stretch:normal;}
CSS
				,
				),
			),
			'multiple truetype format fonts' => array(
				'fonts'    => array(
					'Inter' =>
						array (
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/inter/Inter-VariableFont_slnt,wght.ttf',
									),
								'font-family' => 'Inter',
								'font-stretch' => 'normal',
								'font-style' => 'normal',
								'font-weight' => '200',
							),
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/inter/Inter-VariableFont_slnt-Italic,wght.ttf',
									),
								'font-family' => 'Inter',
								'font-stretch' => 'normal',
								'font-style' => 'italic',
								'font-weight' => '900',
							),
						),
				),
				'expected' => array(
					'style-element' => "<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
					'font-face-css' => <<<CSS
@font-face{font-family:Inter;font-style:normal;font-weight:200;font-display:fallback;src:url('https://example.org/assets/fonts/inter/Inter-VariableFont_slnt,wght.ttf') format('truetype');font-stretch:normal;}
@font-face{font-family:Inter;font-style:italic;font-weight:900;font-display:fallback;src:url('https://example.org/assets/fonts/inter/Inter-VariableFont_slnt-Italic,wght.ttf') format('truetype');font-stretch:normal;}
CSS
				,
				),
			),
			'single woff2 format font'    => array(
				'fonts'    => array(
					'DM Sans' =>
						array (
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/dm-sans/DMSans-Regular.woff2',
									),
								'font-family' => 'DM Sans',
								'font-stretch' => 'normal',
								'font-style' => 'normal',
								'font-weight' => '400',
							),
						),
				),
				'expected' => array(
					'style-element' => "<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
					'font-face-css' => <<<CSS
@font-face{font-family:"DM Sans";font-style:normal;font-weight:400;font-display:fallback;src:url('https://example.org/assets/fonts/dm-sans/DMSans-Regular.woff2') format('woff2');font-stretch:normal;}
CSS
				,
				),
			),
			'multiple woff2 format fonts'    => array(
				'fonts'    => array(
					'DM Sans' =>
						array (
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/dm-sans/DMSans-Regular.woff2',
									),
								'font-family' => 'DM Sans',
								'font-stretch' => 'normal',
								'font-style' => 'normal',
								'font-weight' => '400',
							),
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/dm-sans/DMSans-Regular-Italic.woff2',
									),
								'font-family' => 'DM Sans',
								'font-stretch' => 'normal',
								'font-style' => 'italic',
								'font-weight' => '400',
							),
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/dm-sans/DMSans-Bold.woff2',
									),
								'font-family' => 'DM Sans',
								'font-stretch' => 'normal',
								'font-style' => 'normal',
								'font-weight' => '700',
							),
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/dm-sans/DMSans-Bold-Italic.woff2',
									),
								'font-family' => 'DM Sans',
								'font-stretch' => 'normal',
								'font-style' => 'italic',
								'font-weight' => '700',
							),
						),
					'IBM Plex Mono' =>
						array (
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Light.woff2',
									),
								'font-family' => 'IBM Plex Mono',
								'font-display' => 'block',
								'font-stretch' => 'normal',
								'font-style' => 'normal',
								'font-weight' => '300',
							),
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2',
									),
								'font-family' => 'IBM Plex Mono',
								'font-display' => 'block',
								'font-stretch' => 'normal',
								'font-style' => 'normal',
								'font-weight' => '400',
							),
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Italic.woff2',
									),
								'font-family' => 'IBM Plex Mono',
								'font-display' => 'block',
								'font-stretch' => 'normal',
								'font-style' => 'italic',
								'font-weight' => '400',
							),
							array (
								'src' =>
									array (
										'https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Bold.woff2',
									),
								'font-family' => 'IBM Plex Mono',
								'font-display' => 'block',
								'font-stretch' => 'normal',
								'font-style' => 'normal',
								'font-weight' => '700',
							),
						),
				),
				'expected' => array(
					'style-element' => "<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
					'font-face-css' => <<<CSS
@font-face{font-family:"DM Sans";font-style:normal;font-weight:400;font-display:fallback;src:url('https://example.org/assets/fonts/dm-sans/DMSans-Regular.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"DM Sans";font-style:italic;font-weight:400;font-display:fallback;src:url('https://example.org/assets/fonts/dm-sans/DMSans-Regular-Italic.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"DM Sans";font-style:normal;font-weight:700;font-display:fallback;src:url('https://example.org/assets/fonts/dm-sans/DMSans-Bold.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"DM Sans";font-style:italic;font-weight:700;font-display:fallback;src:url('https://example.org/assets/fonts/dm-sans/DMSans-Bold-Italic.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:300;font-display:block;src:url('https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Light.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:400;font-display:block;src:url('https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"IBM Plex Mono";font-style:italic;font-weight:400;font-display:block;src:url('https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Italic.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"IBM Plex Mono";font-style:normal;font-weight:700;font-display:block;src:url('https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Bold.woff2') format('woff2');font-stretch:normal;}
CSS
				,
				),
			),
		);
	}
}
