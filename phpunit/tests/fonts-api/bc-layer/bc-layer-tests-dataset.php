<?php
/**
 * Fonts API BC Layer datasets for unit and integration tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

/**
 * Trait for reusing datasets within the Fonts API's BC Layer tests.
 */
trait BC_Layer_Tests_Datasets {

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_deprecated_structure() {
		return array(
			'1 font'                           => array(
				'fonts'    => array(
					array(
						'provider'     => 'local',
						'font-family'  => 'Merriweather',
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					),
				),
				'expected' => array(
					'migration'            => array(
						'Merriweather' => array(
							array(
								'provider'     => 'local',
								'font-family'  => 'Merriweather',
								'font-style'   => 'normal',
								'font-weight'  => '200 900',
								'font-display' => 'fallback',
								'font-stretch' => 'normal',
								'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
							),
						),
					),
					'wp_register_webfonts' => array( 'merriweather' ),
					'get_registered'       => array( 'merriweather', 'merriweather-200-900-normal' ),
				),
			),
			'2 font in same font family'       => array(
				'fonts'    => array(
					array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'normal',
						'font-weight'  => '300',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						'font-display' => 'fallback',
					),
					array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'italic',
						'font-weight'  => '900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
						'font-display' => 'fallback',
					),
				),
				'expected' => array(
					'migration'            => array(
						'Source Serif Pro' => array(
							array(
								'provider'     => 'local',
								'font-family'  => 'Source Serif Pro',
								'font-style'   => 'normal',
								'font-weight'  => '300',
								'font-display' => 'fallback',
								'font-stretch' => 'normal',
								'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
								'font-display' => 'fallback',
							),
							array(
								'provider'     => 'local',
								'font-family'  => 'Source Serif Pro',
								'font-style'   => 'italic',
								'font-weight'  => '900',
								'font-display' => 'fallback',
								'font-stretch' => 'normal',
								'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
								'font-display' => 'fallback',
							),
						),
					),
					'wp_register_webfonts' => array( 'source-serif-pro' ),
					'get_registered'       => array(
						'source-serif-pro',
						'source-serif-pro-300-normal',
						'source-serif-pro-900-italic',
					),
				),
			),
			'Fonts in different font families' => array(
				'fonts'    => array(
					array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'normal',
						'font-weight'  => '300',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						'font-display' => 'fallback',
					),
					array(
						'provider'     => 'local',
						'font-family'  => 'Merriweather',
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					),
					array(
						'provider'     => 'local',
						'font-family'  => 'Source Serif Pro',
						'font-style'   => 'italic',
						'font-weight'  => '900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
						'font-display' => 'fallback',
					),
				),
				'expected' => array(
					'migration'            => array(
						'Source Serif Pro' => array(
							array(
								'provider'     => 'local',
								'font-family'  => 'Source Serif Pro',
								'font-style'   => 'normal',
								'font-weight'  => '300',
								'font-display' => 'fallback',
								'font-stretch' => 'normal',
								'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
								'font-display' => 'fallback',
							),
							array(
								'provider'     => 'local',
								'font-family'  => 'Source Serif Pro',
								'font-style'   => 'italic',
								'font-weight'  => '900',
								'font-display' => 'fallback',
								'font-stretch' => 'normal',
								'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
								'font-display' => 'fallback',
							),
						),
						'Merriweather'     => array(
							array(
								'provider'     => 'local',
								'font-family'  => 'Merriweather',
								'font-style'   => 'normal',
								'font-weight'  => '200 900',
								'font-display' => 'fallback',
								'font-stretch' => 'normal',
								'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
							),
						),
					),
					'wp_register_webfonts' => array( 'source-serif-pro', 'merriweather' ),
					'get_registered'       => array(
						'source-serif-pro',
						'source-serif-pro-300-normal',
						'source-serif-pro-900-italic',
						'merriweather',
						'merriweather-200-900-normal',
					),
				),
			),
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_not_deprecated_structure() {
		return array(
			'1 font'                           => array(
				array(
					'Merriweather' => array(
						array(
							'provider'     => 'local',
							'font-family'  => 'Merriweather',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-display' => 'fallback',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
						),
					),
				),
			),
			'2 font in same font family'       => array(
				array(
					'Source Serif Pro' => array(
						array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '300',
							'font-display' => 'fallback',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
						array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'italic',
							'font-weight'  => '900',
							'font-display' => 'fallback',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
							'font-display' => 'fallback',
						),
					),
				),
			),
			'Fonts in different font families' => array(
				array(
					'source-serif-pro' => array(
						array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '300',
							'font-display' => 'fallback',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
						array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'italic',
							'font-weight'  => '900',
							'font-display' => 'fallback',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
							'font-display' => 'fallback',
						),
					),
					'merriweather'     => array(
						array(
							'provider'     => 'local',
							'font-family'  => 'Merriweather',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-display' => 'fallback',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
						),
					),
				),
			),
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_deprecated_structure_with_invalid_font_family() {
		return array(
			'non-string'                                  => array(
				'fonts'            => array(
					array(
						'provider'     => 'local',
						'font-family'  => null,
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					),
				),
				'expected_message' => 'Font family not defined in the variation.',
			),
			'empty string in deprecated structure'        => array(
				'fonts'            => array(
					'0' => array(
						'provider'     => 'local',
						'font-style'   => 'normal',
						'font-weight'  => '300',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						'font-display' => 'fallback',
					),
				),
				'expected_message' => 'Font family not found.',
			),
			'incorrect parameter in deprecated structure' => array(
				'fonts'            => array(
					array(
						'provider'     => 'local',
						'FontFamily'   => 'Source Serif Pro',
						'font-style'   => 'normal',
						'font-weight'  => '300',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						'font-display' => 'fallback',
					),
					array(
						'provider'     => 'local',
						'font_family'  => 'Merriweather',
						'font-style'   => 'normal',
						'font-weight'  => '200 900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					),
					array(
						'provider'     => 'local',
						'font family'  => 'Source Serif Pro',
						'font-style'   => 'italic',
						'font-weight'  => '900',
						'font-display' => 'fallback',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
						'font-display' => 'fallback',
					),
				),
				'expected_message' => 'Font family not found.',
			),
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_return_registered_webfonts() {
		return array(
			'Single variation'       => array(
				'fonts'    => array(
					'Merriweather' => array(
						array(
							'font-family' => 'Merriweather',
							'font-style'  => 'normal',
							'font-weight' => '400',
							'src'         => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
						),
					),
				),
				'expected' => array(
					'merriweather' => array(
						'merriweather-400-normal' => array(
							'provider'     => 'local',
							'font-family'  => 'Merriweather',
							'font-style'   => 'normal',
							'font-weight'  => '400',
							'font-display' => 'fallback',
							'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
						),
					),
				),
			),
			'2 variations'           => array(
				'fonts'    => array(
					'Source Serif Pro' => array(
						'source-serif-pro-200-900-normal' => array(
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						),
						'source-serif-pro-200-900-italic' => array(
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'italic',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
						),
					),
				),
				'expected' => array(
					'source-serif-pro' => array(
						'source-serif-pro-200-900-normal' => array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-display' => 'fallback',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						),
						'source-serif-pro-200-900-italic' => array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'italic',
							'font-weight'  => '200 900',
							'font-display' => 'fallback',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
						),
					),
				),
			),
			'Multiple font families' => array(
				'fonts'    => array(
					'Merriweather'     => array(
						array(
							'font-family' => 'Merriweather',
							'font-style'  => 'normal',
							'font-weight' => '400',
							'src'         => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
						),
					),
					'Source Serif Pro' => array(
						'source-serif-pro-200-900-normal' => array(
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						),
						'source-serif-pro-200-900-italic' => array(
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'italic',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
						),
					),
				),
				'expected' => array(
					'merriweather'     => array(
						'merriweather-400-normal' => array(
							'provider'     => 'local',
							'font-family'  => 'Merriweather',
							'font-style'   => 'normal',
							'font-weight'  => '400',
							'font-display' => 'fallback',
							'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
						),
					),
					'source-serif-pro' => array(
						'source-serif-pro-200-900-normal' => array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '200 900',
							'font-display' => 'fallback',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						),
						'source-serif-pro-200-900-italic' => array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'italic',
							'font-weight'  => '200 900',
							'font-display' => 'fallback',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
						),
					),
				),
			),
		);
	}
}
