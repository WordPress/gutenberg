<?php
/**
 * Datasets for unit and integration tests.
 *
 * @package    WordPress
 * @subpackage Fonts
 */

/**
 * Trait for reusing datasets within the Fonts tests.
 */
trait WP_Font_Face_Tests_Datasets {
	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_print_given_fonts() {
		return array(
			'single truetype format font'    => array(
				'fonts'    => array(
					'Inter' =>
						array(
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/inter/Inter-VariableFont_slnt,wght.ttf',
									),
								'font-family'  => 'Inter',
								'font-stretch' => 'normal',
								'font-style'   => 'normal',
								'font-weight'  => '200',
							),
						),
				),
				'expected' => <<<CSS
@font-face{font-family:Inter;font-style:normal;font-weight:200;font-display:fallback;src:url('https://example.org/assets/fonts/inter/Inter-VariableFont_slnt,wght.ttf') format('truetype');font-stretch:normal;}
CSS
			,
			),
			'multiple truetype format fonts' => array(
				'fonts'    => array(
					'Inter' =>
						array(
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/inter/Inter-VariableFont_slnt,wght.ttf',
									),
								'font-family'  => 'Inter',
								'font-stretch' => 'normal',
								'font-style'   => 'normal',
								'font-weight'  => '200',
							),
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/inter/Inter-VariableFont_slnt-Italic,wght.ttf',
									),
								'font-family'  => 'Inter',
								'font-stretch' => 'normal',
								'font-style'   => 'italic',
								'font-weight'  => '900',
							),
						),
				),
				'expected' => <<<CSS
@font-face{font-family:Inter;font-style:normal;font-weight:200;font-display:fallback;src:url('https://example.org/assets/fonts/inter/Inter-VariableFont_slnt,wght.ttf') format('truetype');font-stretch:normal;}
@font-face{font-family:Inter;font-style:italic;font-weight:900;font-display:fallback;src:url('https://example.org/assets/fonts/inter/Inter-VariableFont_slnt-Italic,wght.ttf') format('truetype');font-stretch:normal;}
CSS
			,
			),
			'single woff2 format font'       => array(
				'fonts'    => array(
					'DM Sans' =>
						array(
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/dm-sans/DMSans-Regular.woff2',
									),
								'font-family'  => 'DM Sans',
								'font-stretch' => 'normal',
								'font-style'   => 'normal',
								'font-weight'  => '400',
							),
						),
				),
				'expected' => <<<CSS
@font-face{font-family:"DM Sans";font-style:normal;font-weight:400;font-display:fallback;src:url('https://example.org/assets/fonts/dm-sans/DMSans-Regular.woff2') format('woff2');font-stretch:normal;}
CSS
			,
			),
			'multiple woff2 format fonts'    => array(
				'fonts'    => array(
					'DM Sans'       =>
						array(
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/dm-sans/DMSans-Regular.woff2',
									),
								'font-family'  => 'DM Sans',
								'font-stretch' => 'normal',
								'font-style'   => 'normal',
								'font-weight'  => '400',
							),
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/dm-sans/DMSans-Regular-Italic.woff2',
									),
								'font-family'  => 'DM Sans',
								'font-stretch' => 'normal',
								'font-style'   => 'italic',
								'font-weight'  => '400',
							),
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/dm-sans/DMSans-Bold.woff2',
									),
								'font-family'  => 'DM Sans',
								'font-stretch' => 'normal',
								'font-style'   => 'normal',
								'font-weight'  => '700',
							),
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/dm-sans/DMSans-Bold-Italic.woff2',
									),
								'font-family'  => 'DM Sans',
								'font-stretch' => 'normal',
								'font-style'   => 'italic',
								'font-weight'  => '700',
							),
						),
					'IBM Plex Mono' =>
						array(
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Light.woff2',
									),
								'font-family'  => 'IBM Plex Mono',
								'font-display' => 'block',
								'font-stretch' => 'normal',
								'font-style'   => 'normal',
								'font-weight'  => '300',
							),
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2',
									),
								'font-family'  => 'IBM Plex Mono',
								'font-display' => 'block',
								'font-stretch' => 'normal',
								'font-style'   => 'normal',
								'font-weight'  => '400',
							),
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Italic.woff2',
									),
								'font-family'  => 'IBM Plex Mono',
								'font-display' => 'block',
								'font-stretch' => 'normal',
								'font-style'   => 'italic',
								'font-weight'  => '400',
							),
							array(
								'src'          =>
									array(
										'https://example.org/assets/fonts/ibm-plex-mono/IBMPlexMono-Bold.woff2',
									),
								'font-family'  => 'IBM Plex Mono',
								'font-display' => 'block',
								'font-stretch' => 'normal',
								'font-style'   => 'normal',
								'font-weight'  => '700',
							),
						),
				),
				'expected' => <<<CSS
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
		);
	}

	public function get_expected_fonts_for_fonts_block_theme( $key = '' ) {
		static $data = null;

		if ( null === $data ) {
			$uri  = get_stylesheet_directory_uri() . '/assets/fonts/';
			$data = array(
				'fonts'            => array(
					'DM Sans'          => array(
						array(
							'src'          => array( $uri . 'dm-sans/DMSans-Regular.woff2' ),
							'font-family'  => 'DM Sans',
							'font-stretch' => 'normal',
							'font-style'   => 'normal',
							'font-weight'  => '400',
						),
						array(
							'src'          => array( $uri . 'dm-sans/DMSans-Regular-Italic.woff2' ),
							'font-family'  => 'DM Sans',
							'font-stretch' => 'normal',
							'font-style'   => 'italic',
							'font-weight'  => '400',
						),
						array(
							'src'          => array( $uri . 'dm-sans/DMSans-Bold.woff2' ),
							'font-family'  => 'DM Sans',
							'font-stretch' => 'normal',
							'font-style'   => 'normal',
							'font-weight'  => '700',
						),
						array(
							'src'          => array( $uri . 'dm-sans/DMSans-Bold-Italic.woff2' ),
							'font-family'  => 'DM Sans',
							'font-stretch' => 'normal',
							'font-style'   => 'italic',
							'font-weight'  => '700',
						),
					),
					'Source Serif Pro' => array(
						array(
							'src'          => array( $uri . 'source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2' ),
							'font-family'  => 'Source Serif Pro',
							'font-stretch' => 'normal',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
						),
						array(
							'src'          => array( $uri . 'source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2' ),
							'font-family'  => 'Source Serif Pro',
							'font-stretch' => 'normal',
							'font-style'   => 'italic',
							'font-weight'  => '200 900',
						),
					),
				),
				'font_face_styles' => <<<CSS
@font-face{font-family:"DM Sans";font-style:normal;font-weight:400;font-display:fallback;src:url('{$uri}dm-sans/DMSans-Regular.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"DM Sans";font-style:italic;font-weight:400;font-display:fallback;src:url('{$uri}dm-sans/DMSans-Regular-Italic.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"DM Sans";font-style:normal;font-weight:700;font-display:fallback;src:url('{$uri}dm-sans/DMSans-Bold.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"DM Sans";font-style:italic;font-weight:700;font-display:fallback;src:url('{$uri}dm-sans/DMSans-Bold-Italic.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"Source Serif Pro";font-style:normal;font-weight:200 900;font-display:fallback;src:url('{$uri}source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2') format('woff2');font-stretch:normal;}
@font-face{font-family:"Source Serif Pro";font-style:italic;font-weight:200 900;font-display:fallback;src:url('{$uri}source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2') format('woff2');font-stretch:normal;}
CSS
				,
			);
		}

		if ( isset( $data[ $key ] ) ) {
			return $data[ $key ];
		}

		return $data;
	}
}
