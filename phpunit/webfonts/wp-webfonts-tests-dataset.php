<?php

trait WP_Webfonts_Tests_Datasets {
	/**
	 * Data provider for testing variation registration that has valid structure.
	 *
	 * @return array
	 */
	public function data_valid_variation() {
		return array(
			'font-weight and font-style not defined; without variation handle' => array(
				'expected'           => 'lato-400-normal',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'src' => 'https://example.com/assets/fonts/lato/lato.ttf.woff2',
				),
			),

			'font-weight and font-style not defined; with variation handle' => array(
				'expected'           => 'my-custom-handle',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'src' => 'https://example.com/assets/fonts/lato/lato.ttf.woff2',
				),
				'variation_handle'   => 'my-custom-handle',
			),

			'font-weight defined; without variation handle' => array(
				'expected'           => 'source-serif-pro-200-900-normal',
				'font_family_handle' => 'source-serif-pro',
				'variation'          => array(
					'font-family'  => 'Source Serif Pro',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
				),
			),

			'font-weight defined; with variation handle' => array(
				'expected'           => 'my_custom_handle',
				'font_family_handle' => 'source-serif-pro',
				'variation'          => array(
					'font-family'  => 'Source Serif Pro',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
				),
				'variation_handle'   => 'my_custom_handle',
			),

			'font-weight defined; without variation handle' => array(
				'expected'           => 'source-serif-pro-200-900-normal',
				'font_family_handle' => 'source-serif-pro',
				'variation'          => array(
					'font-family'  => 'Source Serif Pro',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
				),
			),

			'font-weight defined; with variation handle' => array(
				'expected'           => 'my_custom_handle',
				'font_family_handle' => 'source-serif-pro',
				'variation'          => array(
					'font-family'  => 'Source Serif Pro',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
				),
				'variation_handle'   => 'my_custom_handle',
			),

			'font-weight defined; without variation handle' => array(
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

			'more variation properties; with variation handle' => array(
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

	/**
	 * Data provider for testing registration of variations where the font family is not defined.
	 *
	 * @return array
	 */
	public function data_font_family_not_define_in_variation() {
		return array(
			'empty string font family handle' => array(
				'font_family_handle' => '',
				'variation'          => array(
					'src' => 'https://example.com/assets/fonts/lato/lato.ttf.woff2',
				),
				'expected_message'   => 'Font family handle must be a non-empty string',
			),
			'empty string font family handle with font-family defined in variant' => array(
				'font_family_handle' => '',
				'variation'          => array(
					'provider'    => 'local',
					'font-family' => 'Lato',
					'font-weight' => '200',
					'src'         => 'https://example.com/assets/fonts/lato/lato.ttf.woff2',
				),
				'expected_message'   => 'Font family handle must be a non-empty string',
			),
			'non string font family handle'   => array(
				'font_family_handle' => 10,
				'variation'          => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected_message'   => 'Font family handle must be a non-empty string',
			),
		);
	}

	/**
	 * Data provider for testing when the variation's handle can't be determine from the given input.
	 *
	 * @return array
	 */
	public function data_unable_determine_variation_handle() {
		return array(
			'integer values'                               => array(
				'font_family_handle' => 'lato',
				'variation'          => array(
					'font-weight' => 400,
					'font-style'  => 0,
					'src'         => 'https://example.com/assets/fonts/lato.ttf.woff2',
				),
				'expected_message'   => 'Variant handle could not be determined as font-weight and/or font-style are require',
			),
			'with empty string font-weight and font-style' => array(
				'font_family_handle' => 'merriweather',
				'variation'          => array(
					'font-weight' => '',
					'font-style'  => '',
					'src'         => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
				),
				'expected_message'   => 'Variant handle could not be determined as font-weight and/or font-style are require',
			),
			'integer font-weight, empty string font-style' => array(
				'font_family'      => 'merriweather',
				'variation'        => array(
					'font-weight' => 400,
					'font-style'  => '',
					'src'         => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
				),
				'expected_message' => 'Variant handle could not be determined as font-weight and/or font-style are require',
			),
			'empty string font-weight, integer font-style' => array(
				'font_family'      => 'lato',
				'variation'        => array(
					'font-weight' => '',
					'font-style'  => 400,
					'src'         => 'https://example.com/assets/fonts/lato.ttf.woff2',
				),
				'expected_message' => 'Variant handle could not be determined as font-weight and/or font-style are require',
			),
		);
	}

	/**
	 * Data provider for testing an invalid variation.
	 *
	 * @return array
	 */
	public function data_invalid_variation() {
		return array(
			'src: undefined'                  => array(
				'expected'           => 'Webfont src must be a non-empty string or an array of strings.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-family' => 'Some font',
					'font-weight' => '200',
				),
			),
			'src: null'                       => array(
				'expected'           => 'Webfont src must be a non-empty string or an array of strings.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-family' => 'Some font',
					'font-weight' => '200',
					'src'         => null,
				),
			),
			'src: empty string'               => array(
				'expected'           => 'Webfont src must be a non-empty string or an array of strings.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-family' => 'Some font',
					'font-weight' => '200',
					'src'         => '',
				),
			),
			'src: empty array'                => array(
				'expected'           => 'Webfont src must be a non-empty string or an array of strings.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-weight' => '200',
					'src'         => array(),
				),
			),
			'src: array of an empty string'   => array(
				'expected'           => 'Each webfont src must be a non-empty string.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-weight' => '200',
					'src'         => array( '' ),
				),
			),
			'src: array of a non-string'      => array(
				'expected'           => 'Each webfont src must be a non-empty string.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-weight' => '200',
					'src'         => array( null ),
				),
			),
			'src: array with an empty string' => array(
				'expected'           => 'Each webfont src must be a non-empty string.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-weight' => '200',
					'src'         => array(
						'https://example.com/assets/fonts/merriweather.ttf.woff2',
						'',
						'https://example.com/assets/fonts/lato.ttf.woff2',
					),
				),
			),
			'src: array with a non-string'    => array(
				'expected'           => 'Each webfont src must be a non-empty string.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-weight' => '200',
					'src'         => array(
						'https://example.com/assets/fonts/merriweather.ttf.woff2',
						null,
						'https://example.com/assets/fonts/lato.ttf.woff2',
					),
				),
			),
			'provider does not exist'         => array(
				'expected'           => 'The provider class specified does not exist.',
				'font_family_handle' => 'merriweather',
				'variation'          => array(
					'provider'    => 'doesnotexit',
					'font-weight' => '200 900',
				),
			),
			'font-weight: null'               => array(
				'expected'           => 'Webfont font-weight must be a properly formatted string or integer.',
				'font_family_handle' => 'merriweather',
				'variation'          => array(
					'font-weight' => null,
					'font-style'  => 'normal',
					'src'         => 'https://example.com/assets/fonts/lato.ttf.woff2',
				),
			),
		);
	}
}
