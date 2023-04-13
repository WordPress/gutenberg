<?php
/**
 * Fonts API datasets for unit and integration tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

/**
 * Trait for reusing datasets within the Fonts API's tests.
 */
trait WP_Fonts_Tests_Datasets {
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
					'font-family' => 'Lato',
					'src'         => 'https://example.com/assets/fonts/lato/lato.ttf.woff2',
				),
			),

			'font-weight and font-style not defined; with variation handle' => array(
				'expected'           => 'my-custom-handle',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'font-family' => 'Lato',
					'src'         => 'https://example.com/assets/fonts/lato/lato.ttf.woff2',
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
	 * Data provider for testing registration of variations where the font family handle
	 * is not defined.
	 *
	 * @return array
	 */
	public function data_font_family_handle_undefined() {
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
	 * Data provider for testing registration of variations where the font family is not defined
	 * in the variation.
	 *
	 * @return array
	 */
	public function data_font_family_undefined_in_variation() {
		$message = 'Webfont font-family must be a non-empty string.';
		return array(
			'font-family: undefined'    => array(
				'font_family_handle' => 'lato',
				'variation'          => array(
					'src' => 'https://example.com/assets/fonts/lato/lato.ttf.woff2',
				),
				'expected_message'   => $message,
			),
			'font-family: null'         => array(
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-family' => null,
					'font-weight' => '200',
					'src'         => 'https://example.com/assets/fonts/lato/lato.ttf.woff2',
				),
				'expected_message'   => $message,
			),
			'font-family: non string'   => array(
				'font_family_handle' => 'source-serif-pro',
				'variation'          => array(
					'provider'     => 'local',
					'font-family'  => 10,
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected_message'   => $message,
			),
			'font-family: empty string' => array(
				'font_family_handle' => 'lato',
				'variation'          => array(
					'font-family' => '',
					'src'         => 'https://example.com/assets/fonts/lato/lato.ttf.woff2',
				),
				'expected_message'   => $message,
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
					'font-family' => 'Lato',
					'font-weight' => 400,
					'font-style'  => 0,
					'src'         => 'https://example.com/assets/fonts/lato.ttf.woff2',
				),
				'expected_message'   => 'Variant handle could not be determined as font-weight and/or font-style are require',
			),
			'with empty string font-weight and font-style' => array(
				'font_family_handle' => 'merriweather',
				'variation'          => array(
					'font-family' => 'Merriweather',
					'font-weight' => '',
					'font-style'  => '',
					'src'         => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
				),
				'expected_message'   => 'Variant handle could not be determined as font-weight and/or font-style are require',
			),
			'integer font-weight, empty string font-style' => array(
				'font_family'      => 'merriweather',
				'variation'        => array(
					'font-family' => 'Merriweather',
					'font-weight' => 400,
					'font-style'  => '',
					'src'         => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
				),
				'expected_message' => 'Variant handle could not be determined as font-weight and/or font-style are require',
			),
			'empty string font-weight, integer font-style' => array(
				'font_family'      => 'lato',
				'variation'        => array(
					'font-family' => 'Merriweather',
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
			'font-family: undefined'          => array(
				'expected'           => 'Webfont font-family must be a non-empty string.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'src' => 'https://example.com/assets/fonts/lato.ttf.woff2',
				),
			),
			'font-family: null'               => array(
				'expected'           => 'Webfont font-family must be a non-empty string.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'font-family' => null,
					'src'         => 'https://example.com/assets/fonts/lato.ttf.woff2',
				),
			),
			'font-family: empty string'       => array(
				'expected'           => 'Webfont font-family must be a non-empty string.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'font-family' => '',
					'src'         => 'https://example.com/assets/fonts/lato.ttf.woff2',
				),
			),
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
					'font-family' => 'Lato',
					'font-weight' => '200',
					'src'         => array(),
				),
			),
			'src: array of an empty string'   => array(
				'expected'           => 'Each font src must be a non-empty string.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-family' => 'Lato',
					'font-weight' => '200',
					'src'         => array( '' ),
				),
			),
			'src: array of a non-string'      => array(
				'expected'           => 'Each font src must be a non-empty string.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-family' => 'Lato',
					'font-weight' => '200',
					'src'         => array( null ),
				),
			),
			'src: array with an empty string' => array(
				'expected'           => 'Each font src must be a non-empty string.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-family' => 'Lato',
					'font-weight' => '200',
					'src'         => array(
						'https://example.com/assets/fonts/merriweather.ttf.woff2',
						'',
						'https://example.com/assets/fonts/lato.ttf.woff2',
					),
				),
			),
			'src: array with a non-string'    => array(
				'expected'           => 'Each font src must be a non-empty string.',
				'font_family_handle' => 'lato',
				'variation'          => array(
					'provider'    => 'local',
					'font-family' => 'Lato',
					'font-weight' => '200',
					'src'         => array(
						'https://example.com/assets/fonts/merriweather.ttf.woff2',
						null,
						'https://example.com/assets/fonts/lato.ttf.woff2',
					),
				),
			),
			'provider does not exist'         => array(
				'expected'           => 'The provider "doesnotexit" is not registered',
				'font_family_handle' => 'merriweather',
				'variation'          => array(
					'provider'    => 'doesnotexit',
					'font-family' => 'Merriweather',
					'font-weight' => '200 900',
				),
			),
			'font-weight: null'               => array(
				'expected'           => 'Webfont font-weight must be a properly formatted string or integer.',
				'font_family_handle' => 'merriweather',
				'variation'          => array(
					'font-family' => 'Merriweather',
					'font-weight' => null,
					'font-style'  => 'normal',
					'src'         => 'https://example.com/assets/fonts/lato.ttf.woff2',
				),
			),
		);
	}

	/**
	 * Data provider for testing one or more font families with varying number of variations.
	 *
	 * @return array
	 */
	public function data_one_to_many_font_families_and_zero_to_many_variations() {
		return array(
			'one family family no variations'           => array(
				'font_family' => 'lato',
				'inputs'      => array(
					'lato' => array(),
				),
				'handles'     => array( 'lato' ),
				'expected'    => array(),
			),
			'one family family with 1 variation'        => array(
				'font_family' => 'merriweather',
				'inputs'      => array(
					'merriweather' => array(
						'merriweather-200-900-normal' => array(
							'font-family'  => 'Merriweather',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
						),
					),
				),
				'handles'     => array( 'merriweather', 'merriweather-200-900-normal' ),
				'expected'    => array(),
			),
			'font family with multiple variations'      => array(
				'font_family' => 'source-serif-pro',
				'inputs'      => array(
					'Source Serif Pro' => array(
						'Source Serif Pro-300-normal' => array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '300',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
						'Source Serif Pro-900-italic' => array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'italic',
							'font-weight'  => '900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
							'font-display' => 'fallback',
						),
					),
				),
				'handles'     => array( 'source-serif-pro', 'Source Serif Pro-300-normal', 'Source Serif Pro-900-italic' ),
				'expected'    => array(),
			),
			'multiple font families without variations' => array(
				'font_family' => 'source-serif-pro',
				'inputs'      => array(
					'lato'             => array(),
					'my-font'          => array(),
					'Source Serif Pro' => array(),
					'some other font'  => array(),
				),
				'handles'     => array( 'lato', 'my-font', 'source-serif-pro', 'some-other-font' ),
				'expected'    => array( 'lato', 'my-font', 'some-other-font' ),
			),
			'multiple font families with variations'    => array(
				'font_family' => 'my-font',
				'inputs'      => array(
					'merriweather'     => array(
						'merriweather-200-900-normal' => array(
							'font-family'  => 'Merriweather',
							'font-weight'  => '200 900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
						),
					),
					'Source Serif Pro' => array(
						'Source Serif Pro-300-normal' => array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'normal',
							'font-weight'  => '300',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
							'font-display' => 'fallback',
						),
						'Source Serif Pro-900-italic' => array(
							'provider'     => 'local',
							'font-family'  => 'Source Serif Pro',
							'font-style'   => 'italic',
							'font-weight'  => '900',
							'font-stretch' => 'normal',
							'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
							'font-display' => 'fallback',
						),
					),
					'my-font'          => array(
						'my-font-300-italic' => array(
							'font-family' => 'My Font',
							'font-weight' => '300',
							'src'         => 'https://example.com/assets/fonts/my-font.ttf.woff2',
						),
					),
				),
				'handles'     => array(
					'merriweather',
					'merriweather-200-900-normal',
					'source-serif-pro',
					'Source Serif Pro-300-normal',
					'Source Serif Pro-900-italic',
					'my-font',
					'my-font-300-italic',
				),
				'expected'    => array(
					'merriweather',
					'merriweather-200-900-normal',
					'source-serif-pro',
					'Source Serif Pro-300-normal',
					'Source Serif Pro-900-italic',
				),
			),
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_font_family_handles() {
		return array(
			'single word handle'   => array( 'lato' ),
			'multiple word handle' => array( 'source-sans-pro' ),
			'single word name'     => array( 'Merriweather' ),
			'multiple word name'   => array( 'My Cool Font' ),
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_providers() {
		$local = array(
			'local' => array(
				'class' => WP_Fonts_Provider_Local::class,
				'fonts' => array(),
			),
		);
		$mock  = array(
			'mock' => array(
				'class' => Mock_Provider::class,
				'fonts' => array(),
			),
		);

		return array(
			'local provider'           => array(
				'providers' => array(
					'local' => WP_Fonts_Provider_Local::class,
				),
				'expected'  => $local,
			),
			'mock provider'            => array(
				'providers' => array(
					'mock' => Mock_Provider::class,
				),
				'expected'  => $mock,
			),
			'local and mock providers' => array(
				'providers' => array(
					'local' => WP_Fonts_Provider_Local::class,
					'mock'  => Mock_Provider::class,
				),
				'expected'  => array_merge( $local, $mock ),
			),
		);
	}

	/**
	 * Data provider for testing removal of variations.
	 *
	 * @return array
	 */
	public function data_remove_variations() {
		return array(
			'Font with 1 variation'         => array(
				'font_family'      => 'merriweather',
				'variation_handle' => 'merriweather-200-900-normal',
				'expected'         => array(
					'registered'       => array(
						'merriweather',
						'source-serif-pro',
						'Source Serif Pro-300-normal',
						'Source Serif Pro-900-italic',
					),
					'font_family_deps' => array(),
				),
			),
			'Font with multiple variations' => array(
				'font_family'      => 'source-serif-pro',
				'variation_handle' => 'Source Serif Pro-300-normal',
				'expected'         => array(
					'registered'       => array(
						'merriweather',
						'merriweather-200-900-normal',
						'source-serif-pro',
						'Source Serif Pro-900-italic',
					),
					'font_family_deps' => array( 'Source Serif Pro-900-italic' ),
				),
			),
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_enqueue() {
		return array(
			'1 font-family'   => array(
				'handles'                         => 'lato',
				'expected_queue'                  => array( 'lato' ),
				'expected_queued_before_register' => array(
					'lato' => null,
				),
			),
			'2 font families' => array(
				'handles'                         => array( 'merriweather', 'my-font' ),
				'expected_queue'                  => array( 'merriweather', 'my-font' ),
				'expected_queued_before_register' => array(
					'merriweather' => null,
					'my-font'      => null,
				),
			),
			'3 font families' => array(
				'handles'                         => array( 'merriweather', 'my-font', 'source-serif-pro' ),
				'expected_queue'                  => array( 'merriweather', 'my-font', 'source-serif-pro' ),
				'expected_queued_before_register' => array(
					'merriweather'     => null,
					'my-font'          => null,
					'source-serif-pro' => null,
				),
			),
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_enqueue_variations() {
		return array(
			'1 variation'                               => array(
				'handles'                         => array( 'my-font-300-normal' ),
				'expected_queue'                  => array( 'my-font-300-normal' ),
				'expected_queued_before_register' => array(
					'my-font-300-normal' => null,
				),
			),
			'1 variation from different font families'  => array(
				'handles'                         => array( 'merriweather-200-900-normal', 'my-font-300-normal' ),
				'expected_queue'                  => array( 'merriweather-200-900-normal', 'my-font-300-normal' ),
				'expected_queued_before_register' => array(
					'merriweather-200-900-normal' => null,
					'my-font-300-normal'          => null,
				),
			),
			'enqueue one variation and its font family' => array(
				'handles'                         => array( 'merriweather', 'merriweather-200-900-normal' ),
				'expected_queue'                  => array( 'merriweather', 'merriweather-200-900-normal' ),
				'expected_queued_before_register' => array(
					'merriweather'                => null,
					'merriweather-200-900-normal' => null,
				),
			),
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_print_enqueued() {
		$providers          = $this->get_provider_definitions();
		$mock_fonts         = $this->get_registered_mock_fonts();
		$mock_font_handles  = $this->get_handles_for_provider( $mock_fonts, 'mock' );
		$local_fonts        = $this->get_registered_local_fonts();
		$local_font_handles = $this->get_handles_for_provider( $local_fonts, 'local' );
		$font_faces         = $this->get_registered_fonts_css();

		$all_variation_handles = array_merge( $mock_font_handles, $local_font_handles );
		$setup_all             = array(
			'provider'         => array(
				'local' => $providers['local'],
				'mock'  => $providers['mock'],
			),
			'provider_handles' => array(
				'local' => $local_font_handles,
				'mock'  => $mock_font_handles,
			),
			'registered'       => array_merge( $mock_fonts, $local_fonts ),
		);

		return array(

			// One provider registered with multiple fonts.

			'print font2 for mock provider'             => array(
				'setup'           => array(
					'provider'         => array( 'mock' => $providers['mock'] ),
					'provider_handles' => array( 'mock' => $mock_font_handles ),
					'registered'       => $mock_fonts,
					'enqueued'         => array( 'font2' ),
				),
				'expected_done'   => array( 'font2', 'font2-200-900-normal', 'font2-200-900-italic' ),
				'expected_output' => sprintf(
					'<mock id="wp-fonts-mock" attr="some-attr">%s; %s</mock>\n',
					$font_faces['font2-200-900-normal'],
					$font_faces['font2-200-900-italic']
				),
			),
			'print all fonts for mock provider'         => array(
				'setup'           => array(
					'provider'         => array( 'mock' => $providers['mock'] ),
					'provider_handles' => array( 'mock' => $mock_font_handles ),
					'registered'       => $mock_fonts,
					'enqueued'         => array( 'font1', 'font2', 'font3' ),
				),
				'expected_done'   => array(
					'font1',
					'font1-300-normal',
					'font1-300-italic',
					'font1-900-normal',
					'font2',
					'font2-200-900-normal',
					'font2-200-900-italic',
					'font3',
					'font3-bold-normal',
				),
				'expected_output' => sprintf(
					'<mock id="wp-fonts-mock" attr="some-attr">%s; %s; %s; %s; %s; %s</mock>\n',
					$font_faces['font1-300-normal'],
					$font_faces['font1-300-italic'],
					$font_faces['font1-900-normal'],
					$font_faces['font2-200-900-normal'],
					$font_faces['font2-200-900-italic'],
					$font_faces['font3-bold-normal']
				),
			),
			'print merriweather for local provider'     => array(
				'setup'           => array(
					'provider'         => array( 'local' => $providers['local'] ),
					'provider_handles' => array( 'local' => $local_font_handles ),
					'registered'       => $local_fonts,
					'enqueued'         => array( 'merriweather' ),
				),
				'expected_done'   => array( 'merriweather', 'merriweather-200-900-normal' ),
				'expected_output' => sprintf(
					"<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
					$font_faces['merriweather-200-900-normal']
				),
			),
			'print Source Serif Pro for local provider' => array(
				'setup'           => array(
					'provider'         => array( 'local' => $providers['local'] ),
					'provider_handles' => array( 'local' => $local_font_handles ),
					'registered'       => $local_fonts,
					'enqueued'         => array( 'source-serif-pro' ),
				),
				'expected_done'   => array( 'source-serif-pro', 'Source Serif Pro-300-normal', 'Source Serif Pro-900-italic' ),
				'expected_output' => sprintf(
					"<style id='wp-fonts-local' type='text/css'>\n%s%s\n</style>\n",
					$font_faces['Source Serif Pro-300-normal'],
					$font_faces['Source Serif Pro-900-italic']
				),
			),
			'print all fonts for local provider'        => array(
				'setup'           => array(
					'provider'         => array( 'local' => $providers['local'] ),
					'provider_handles' => array( 'local' => $local_font_handles ),
					'registered'       => $local_fonts,
					'enqueued'         => array( 'merriweather', 'source-serif-pro' ),
				),
				'expected_done'   => array(
					'merriweather',
					'merriweather-200-900-normal',
					'source-serif-pro',
					'Source Serif Pro-300-normal',
					'Source Serif Pro-900-italic',
				),
				'expected_output' => sprintf(
					"<style id='wp-fonts-local' type='text/css'>\n%s%s%s\n</style>\n",
					$font_faces['merriweather-200-900-normal'],
					$font_faces['Source Serif Pro-300-normal'],
					$font_faces['Source Serif Pro-900-italic']
				),
			),

			// All providers registered with multiple fonts.

			'print font1 when all providers registered' => array(
				'setup'           => array_merge( $setup_all, array( 'enqueued' => array( 'font1' ) ) ),
				'expected_done'   => array( 'font1', 'font1-300-normal', 'font1-300-italic', 'font1-900-normal' ),
				'expected_output' => sprintf(
					'<mock id="wp-fonts-mock" attr="some-attr">%s; %s; %s</mock>\n',
					$font_faces['font1-300-normal'],
					$font_faces['font1-300-italic'],
					$font_faces['font1-900-normal']
				),
			),
			'print all mock fonts when all providers registered' => array(
				'setup'           => array_merge( $setup_all, array( 'enqueued' => array( 'font1', 'font2', 'font3' ) ) ),
				'expected_done'   => array(
					'font1',
					'font1-300-normal',
					'font1-300-italic',
					'font1-900-normal',
					'font2',
					'font2-200-900-normal',
					'font2-200-900-italic',
					'font3',
					'font3-bold-normal',
				),
				'expected_output' => sprintf(
					'<mock id="wp-fonts-mock" attr="some-attr">%s; %s; %s; %s; %s; %s</mock>\n',
					$font_faces['font1-300-normal'],
					$font_faces['font1-300-italic'],
					$font_faces['font1-900-normal'],
					$font_faces['font2-200-900-normal'],
					$font_faces['font2-200-900-italic'],
					$font_faces['font3-bold-normal']
				),
			),
			'print merriweather when all providers registered' => array(
				'setup'           => array_merge( $setup_all, array( 'enqueued' => array( 'merriweather' ) ) ),
				'expected_done'   => array( 'merriweather', 'merriweather-200-900-normal' ),
				'expected_output' => sprintf(
					"<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
					$font_faces['merriweather-200-900-normal']
				),
			),
			'print all local fonts when all providers registered' => array(
				'setup'           => array_merge( $setup_all, array( 'enqueued' => array( 'merriweather', 'source-serif-pro' ) ) ),
				'expected_done'   => array(
					'merriweather',
					'merriweather-200-900-normal',
					'source-serif-pro',
					'Source Serif Pro-300-normal',
					'Source Serif Pro-900-italic',
				),
				'expected_output' => sprintf(
					"<style id='wp-fonts-local' type='text/css'>\n%s%s%s\n</style>\n",
					$font_faces['merriweather-200-900-normal'],
					$font_faces['Source Serif Pro-300-normal'],
					$font_faces['Source Serif Pro-900-italic']
				),
			),

			'print all fonts for all providers'         => array(
				'setup'           => array_merge( $setup_all, array( 'enqueued' => $all_variation_handles ) ),
				'expected_done'   => $all_variation_handles,
				'expected_output' =>
					sprintf(
						"<style id='wp-fonts-local' type='text/css'>\n%s%s%s\n</style>\n",
						$font_faces['merriweather-200-900-normal'],
						$font_faces['Source Serif Pro-300-normal'],
						$font_faces['Source Serif Pro-900-italic']
					) .
					sprintf(
						'<mock id="wp-fonts-mock" attr="some-attr">%s; %s; %s; %s; %s; %s</mock>\n',
						$font_faces['font1-300-normal'],
						$font_faces['font1-300-italic'],
						$font_faces['font1-900-normal'],
						$font_faces['font2-200-900-normal'],
						$font_faces['font2-200-900-italic'],
						$font_faces['font3-bold-normal']
					),
			),

			// Specific variations enqueued.
			// Validates that only these specific variations print once.

			'specific variation: 1 local'               => array(
				'setup'           => array_merge( $setup_all, array( 'enqueued' => array( 'merriweather-200-900-normal' ) ) ),
				'expected_done'   => array( 'merriweather-200-900-normal' ),
				'expected_output' => sprintf(
					"<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n",
					$font_faces['merriweather-200-900-normal']
				),
			),
			'specific variation: 1 local from different font families' => array(
				'setup'           => array_merge( $setup_all, array( 'enqueued' => array( 'merriweather-200-900-normal', 'Source Serif Pro-900-italic' ) ) ),
				'expected_done'   => array( 'merriweather-200-900-normal', 'Source Serif Pro-900-italic' ),
				'expected_output' => sprintf(
					"<style id='wp-fonts-local' type='text/css'>\n%s%s\n</style>\n",
					$font_faces['merriweather-200-900-normal'],
					$font_faces['Source Serif Pro-900-italic']
				),
			),
			'specific variation: 1 local and 1 mock'    => array(
				'setup'           => array_merge( $setup_all, array( 'enqueued' => array( 'merriweather-200-900-normal', 'font2-200-900-normal' ) ) ),
				'expected_done'   => array( 'merriweather-200-900-normal', 'font2-200-900-normal' ),
				'expected_output' => sprintf(
					"<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n" .
					'<mock id="wp-fonts-mock" attr="some-attr">%s</mock>\n',
					$font_faces['merriweather-200-900-normal'],
					$font_faces['font2-200-900-normal']
				),
			),
			'specific variation: 1 mock and 1 local'    => array(
				'setup'           => array_merge( $setup_all, array( 'enqueued' => array( 'font2-200-900-normal', 'Source Serif Pro-300-normal' ) ) ),
				'expected_done'   => array( 'font2-200-900-normal', 'Source Serif Pro-300-normal' ),
				'expected_output' => sprintf(
					"<style id='wp-fonts-local' type='text/css'>\n%s\n</style>\n" .
					'<mock id="wp-fonts-mock" attr="some-attr">%s</mock>\n',
					$font_faces['Source Serif Pro-300-normal'],
					$font_faces['font2-200-900-normal']
				),
			),
		);
	}

	protected function get_data_registry() {
		return array(
			'lato'             => array(),
			'merriweather'     => array(
				'merriweather-200-900-normal' => array(
					'font-family'  => 'Merriweather',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
				),
			),
			'Source Serif Pro' => array(
				'Source Serif Pro-300-normal' => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '300',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'Source Serif Pro-900-italic' => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'italic',
					'font-weight'  => '900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
					'font-display' => 'fallback',
				),
			),
			'my-font'          => array(
				'my-font-300-normal' => array(
					'font-family' => 'My Font',
					'font-weight' => '300',
					'src'         => 'https://example.com/assets/fonts/my-font.ttf.woff2',
				),
				'my-font-300-italic' => array(
					'font-family' => 'My Font',
					'font-weight' => '300',
					'font-style'  => 'italic',
					'src'         => 'https://example.com/assets/fonts/my-font.ttf.woff2',
				),
				'my-font-900-normal' => array(
					'font-family' => 'My Font',
					'font-weight' => '900',
					'src'         => 'https://example.com/assets/fonts/my-font.ttf.woff2',
				),
			),
		);
	}

	/**
	 * Gets the provider definitions.
	 *
	 * @since X.X.X
	 *
	 * @param string $provider_id Optional. Provider ID to get. Default empty string.
	 * @return array
	 */
	protected function get_provider_definitions( $provider_id = '' ) {
		$providers = array(
			'mock'  => array(
				'id'    => 'mock',
				'class' => Mock_Provider::class,
			),
			'local' => array(
				'id'    => 'local',
				'class' => WP_Fonts_Provider_Local::class,
			),
		);

		if ( '' === $provider_id ) {
			return $providers;
		}

		if ( isset( $providers[ $provider_id ] ) ) {
			return $providers[ $provider_id ];
		}

		return array(
			'id'    => $provider_id,
			'class' => '',
		);
	}

	/**
	 * Gets font definitions for both local and mock providers.
	 *
	 * @since X.X.X
	 *
	 * @return array|string[][][]
	 */
	protected function get_registered_fonts() {
		return array_merge(
			$this->get_registered_local_fonts(),
			$this->get_registered_mock_fonts()
		);
	}

	/**
	 * Returns an array of font-face styles that matches the font definitions
	 * in get_registered_local_fonts() and get_registered_mock_fonts().
	 *
	 * @since X.X.X
	 *
	 * @return string[]
	 */
	protected function get_registered_fonts_css() {
		return array(
			'merriweather-200-900-normal' => <<<CSS
@font-face{font-family:Merriweather;font-style:normal;font-weight:200 900;font-display:fallback;font-stretch:normal;src:url('https://example.com/assets/fonts/merriweather.ttf.woff2') format('woff2');}
CSS
		,
			'Source Serif Pro-300-normal' => <<<CSS
@font-face{font-family:"Source Serif Pro";font-style:normal;font-weight:300;font-display:fallback;font-stretch:normal;src:url('https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2') format('woff2');}
CSS
		,
			'Source Serif Pro-900-italic' => <<<CSS
@font-face{font-family:"Source Serif Pro";font-style:italic;font-weight:900;font-display:fallback;font-stretch:normal;src:url('https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2') format('woff2');}
CSS
		,
			'font1-300-normal'            => 'font1-300-normal',
			'font1-300-italic'            => 'font1-300-italic',
			'font1-900-normal'            => 'font1-900-normal',
			'font2-200-900-normal'        => 'font2-200-900-normal',
			'font2-200-900-italic'        => 'font2-200-900-italic',
			'font3-bold-normal'           => 'font3-bold-normal',
		);
	}

	/**
	 * Gets font definitions for local provider.
	 *
	 * @since X.X.X
	 *
	 * @return string[][][]
	 */
	protected function get_registered_local_fonts() {
		return array(
			'lato'             => array(),
			'merriweather'     => array(
				'merriweather-200-900-normal' => array(
					'provider'     => 'local',
					'font-family'  => 'Merriweather',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-display' => 'fallback',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
				),
			),
			'Source Serif Pro' => array(
				'Source Serif Pro-300-normal' => array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '300',
					'font-display' => 'fallback',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'Source Serif Pro-900-italic' => array(
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
		);
	}

	/**
	 * Gets font definitions for mock provider.
	 *
	 * @since X.X.X
	 *
	 * @return string[][][]
	 */
	protected function get_registered_mock_fonts() {
		return array(
			'font1' => array(
				'font1-300-normal' => array(
					'provider'     => 'mock',
					'font-family'  => 'Font 1',
					'font-weight'  => '300',
					'font-style'   => 'normal',
					'font-display' => 'fallback',
				),
				'font1-300-italic' => array(
					'provider'     => 'mock',
					'font-family'  => 'Font 1',
					'font-weight'  => '300',
					'font-style'   => 'italic',
					'font-display' => 'fallback',
				),
				'font1-900-normal' => array(
					'provider'     => 'mock',
					'font-family'  => 'Font 1',
					'font-weight'  => '900',
					'font-style'   => 'normal',
					'font-display' => 'fallback',
				),
			),
			'font2' => array(
				'font2-200-900-normal' => array(
					'provider'     => 'mock',
					'font-family'  => 'Font 2',
					'font-weight'  => '200 900',
					'font-style'   => 'normal',
					'font-display' => 'fallback',
				),
				'font2-200-900-italic' => array(
					'provider'     => 'mock',
					'font-family'  => 'Font 2',
					'font-weight'  => '200 900',
					'font-style'   => 'italic',
					'font-display' => 'fallback',
				),
			),
			'font3' => array(
				'font3-bold-normal' => array(
					'provider'     => 'mock',
					'font-family'  => 'Font 3',
					'font-weight'  => 'bold',
					'font-style'   => 'normal',
					'font-display' => 'fallback',
					'font-stretch' => 'normal',
				),
			),
		);
	}
}
