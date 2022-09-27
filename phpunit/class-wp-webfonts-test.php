<?php

/**
 * @group  webfonts
 * @covers WP_Webfonts_Test
 */
class WP_Webfonts_Test extends WP_UnitTestCase {
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
	 * Test wp_register_webfonts() bulk register webfonts.
	 *
	 * @covers wp_register_webfonts
	 * @covers WP_Webfonts::register_font
	 * @covers WP_Webfonts::get_registered_fonts
	 * @covers WP_Webfonts::get_enqueued_fonts
	 */
	public function test_wp_register_webfonts() {
		$font_family_name = 'Source Serif Pro';

		$fonts = array(
			array(
				'provider'     => 'local',
				'font-family'  => $font_family_name,
				'font-style'   => 'normal',
				'font-weight'  => '200 900',
				'font-stretch' => 'normal',
				'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
				'font-display' => 'fallback',
			),
			array(
				'provider'     => 'local',
				'font-family'  => $font_family_name,
				'font-style'   => 'italic',
				'font-weight'  => '200 900',
				'font-stretch' => 'normal',
				'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
				'font-display' => 'fallback',
			),
		);

		$expected = array(
			wp_webfonts()->get_font_slug( $font_family_name ) => $fonts,
		);

		wp_register_webfonts( $fonts );
		$this->assertEquals( $expected, wp_webfonts()->get_registered_webfonts() );
		$this->assertEquals( array(), wp_webfonts()->get_enqueued_webfonts() );
	}

	/**
	 * Test wp_register_webfont() register a single webfont.
	 *
	 * @covers wp_register_webfont
	 * @covers WP_Webfonts::register_font
	 * @covers WP_Webfonts::get_registered_fonts
	 * @covers WP_Webfonts::get_enqueued_fonts
	 */
	public function test_wp_register_webfont() {
		$font_family_name = 'Source Serif Pro';

		$font = array(
			'provider'     => 'local',
			'font-family'  => $font_family_name,
			'font-style'   => 'normal',
			'font-weight'  => '200 900',
			'font-stretch' => 'normal',
			'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
			'font-display' => 'fallback',
		);

		$expected = array(
			wp_webfonts()->get_font_slug( $font_family_name ) => array( $font ),
		);

		wp_register_webfont( $font );
		$this->assertEquals( $expected, wp_webfonts()->get_registered_webfonts() );
		$this->assertEquals( array(), wp_webfonts()->get_enqueued_webfonts() );
	}

	/**
	 * Test wp_register_webfont() does not enqueue the webfont on registration.
	 *
	 * @covers wp_register_webfont
	 * @covers WP_Webfonts::register_font
	 * @covers WP_Webfonts::get_registered_fonts
	 * @covers WP_Webfonts::get_enqueued_fonts
	 */
	public function test_wp_register_webfont_does_not_enqueue_on_registration() {
		$font_family_name = 'Source Serif Pro';

		$font = array(
			'provider'     => 'local',
			'font-family'  => $font_family_name,
			'font-style'   => 'normal',
			'font-weight'  => '200 900',
			'font-stretch' => 'normal',
			'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
			'font-display' => 'fallback',
		);

		$expected = array(
			wp_webfonts()->get_font_slug( $font_family_name ) => array( $font ),
		);

		wp_register_webfont( $font );
		$this->assertEquals( $expected, wp_webfonts()->get_registered_webfonts() );
		$this->assertEquals( array(), wp_webfonts()->get_enqueued_webfonts() );
	}

	/**
	 * Test wp_enqueue_webfonts() bulk enqueue webfonts.
	 *
	 * @covers wp_enqueue_webfonts
	 * @covers WP_Webfonts::enqueue_font
	 * @covers WP_Webfonts::get_enqueued_fonts
	 * @covers WP_Webfonts::get_registered_fonts
	 */
	public function test_wp_enqueue_webfonts() {
		$source_serif_pro = array(
			'provider'     => 'local',
			'font-family'  => 'Source Serif Pro',
			'font-style'   => 'normal',
			'font-weight'  => '200 900',
			'font-stretch' => 'normal',
			'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
			'font-display' => 'fallback',
		);

		wp_register_webfont( $source_serif_pro );

		$roboto = array(
			'provider'     => 'local',
			'font-family'  => 'Roboto',
			'font-style'   => 'normal',
			'font-weight'  => '400',
			'font-stretch' => 'normal',
			'src'          => 'https://example.com/assets/fonts/roboto/Roboto.ttf.woff2',
			'font-display' => 'fallback',
		);

		wp_register_webfont( $roboto );

		$expected = array(
			wp_webfonts()->get_font_slug( $source_serif_pro['font-family'] ) => array( $source_serif_pro ),
			wp_webfonts()->get_font_slug( $roboto['font-family'] ) => array( $roboto ),
		);

		wp_enqueue_webfonts(
			array(
				$source_serif_pro['font-family'],
				$roboto['font-family'],
			)
		);

		$this->assertEquals( $expected, wp_webfonts()->get_enqueued_webfonts() );
		$this->assertEquals( array(), wp_webfonts()->get_registered_webfonts() );
	}

	/**
	 * Test wp_enqueue_font() enqueues a registered webfont.
	 *
	 * @covers wp_enqueue_webfont
	 * @covers WP_Webfonts::enqueued_font
	 * @covers WP_Webfonts::get_enqueued_fonts
	 * @covers WP_Webfonts::get_registered_fonts
	 */
	public function test_wp_enqueue_webfont_enqueues_registered_webfont() {
		$font_family_name = 'Source Serif Pro';

		$font = array(
			'provider'     => 'local',
			'font-family'  => $font_family_name,
			'font-style'   => 'normal',
			'font-weight'  => '200 900',
			'font-stretch' => 'normal',
			'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
			'font-display' => 'fallback',
		);

		$expected = array(
			wp_webfonts()->get_font_slug( $font_family_name ) => array( $font ),
		);

		wp_register_webfont( $font );
		wp_enqueue_webfont( $font_family_name );

		$this->assertEquals( array(), wp_webfonts()->get_registered_webfonts() );
		$this->assertEquals( $expected, wp_webfonts()->get_enqueued_webfonts() );
	}

	/**
	 * Test wp_enqueue_font() does not enqueue a webfont that was not registered.
	 *
	 * @covers wp_enqueue_webfont
	 * @covers WP_Webfonts::enqueued_font
	 * @covers WP_Webfonts::get_enqueued_fonts
	 * @covers WP_Webfonts::get_registered_fonts
	 *
	 * @expectedIncorrectUsage WP_Webfonts::enqueue_webfont
	 */
	public function test_wp_enqueue_webfont_does_not_enqueue_unregistered_webfont() {
		$font_family_name = 'Source Serif Pro';

		wp_enqueue_webfont( $font_family_name );

		$this->assertSame( array(), wp_webfonts()->get_registered_webfonts(), 'WP_Webfonts::get_registered_webfonts should return an empty array' );
		$this->assertSame( array(), wp_webfonts()->get_enqueued_webfonts(), 'WP_Webfonts::get_enqueued_webfonts should return an empty array' );
	}

	/**
	 * @covers wp_register_webfont
	 * @covers WP_Webfonts::register_provider
	 * @covers WP_Webfonts::get_providers
	 */
	public function test_get_providers() {
		wp_register_webfont_provider( 'test-provider', 'Test_Provider' );
		$this->assertEquals(
			array(
				'local'         => 'WP_Webfonts_Provider_Local',
				'test-provider' => 'Test_Provider',
			),
			wp_get_webfont_providers()
		);
	}

	/**
	 * @dataProvider data_get_font_slug_when_cannot_determine_fontfamily
	 * @covers       WP_Webfonts::get_font_slug
	 *
	 * @expectedIncorrectUsage WP_Webfonts::get_font_slug
	 */
	public function test_get_font_slug_when_cannot_determine_fontfamily( $to_convert ) {
		$this->assertFalse( wp_webfonts()->get_font_slug( $to_convert ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_get_font_slug_when_cannot_determine_fontfamily() {
		return array(
			'empty array'                     => array( array() ),
			'array without a font-family key' => array(
				array(
					'provider'     => 'local',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-display' => 'fallback',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
				),
			),
			"array with 'font family' key"    => array(
				array( 'font family' => 'Source Serif Pro' ),
			),
			"array with 'Font-Family' key"    => array(
				array( 'Font-Family' => 'Source Serif Pro' ),
			),
			"array with 'FontFamily' key"     => array(
				array( 'FontFamily' => 'Source Serif Pro' ),
			),
		);
	}

	/**
	 * @dataProvider data_get_font_slug
	 * @covers       WP_Webfonts::get_font_slug
	 */
	public function test_get_font_slug( $to_convert, $expected ) {
		$this->assertSame( $expected, wp_webfonts()->get_font_slug( $to_convert ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_get_font_slug() {
		return array(
			"array using 'fontFamily' format"  => array(
				'to_convert' => array( 'fontFamily' => 'Source Serif Pro' ),
				'expected'   => 'source-serif-pro',
			),
			"array using 'font-family' format" => array(
				'to_convert' => array( 'font-family' => 'Source Serif Pro' ),
				'expected'   => 'source-serif-pro',
			),
			'string with font family name'     => array(
				'to_convert' => 'Source Serif Pro',
				'expected'   => 'source-serif-pro',
			),
			'empty string'                     => array(
				'to_convert' => '',
				'expected'   => '',
			),
		);
	}

	/**
	 * @covers WP_Webfonts::validate_webfont
	 */
	public function test_validate_webfont() {
		$this->expectNotice();

		// Test empty array.
		$this->assertFalse( wp_webfonts()->validate_webfont( array() ) );

		$font = array(
			'font-family' => 'Test Font 1',
			'src'         => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
		);

		// Test missing provider fallback to local.
		$this->assertEquals( 'local', wp_webfonts()->validate_webfont( $font )['provider'] );

		// Test missing font-weight fallback to 400.
		$this->assertEquals( '400', wp_webfonts()->validate_webfont( $font )['font-weight'] );

		// Test missing font-style fallback to normal.
		$this->assertEquals( 'normal', wp_webfonts()->validate_webfont( $font )['font-style'] );

		// Test missing font-display fallback to fallback.
		$this->assertEquals( 'fallback', wp_webfonts()->validate_webfont( $font )['font-display'] );

		// Test local font with missing "src".
		$this->assertFalse( wp_webfonts()->validate_webfont( array( 'font-family' => 'Test Font 2' ) ) );

		// Test valid src URL, without a protocol.
		$font['src'] = '//example.com/SourceSerif4Variable-Roman.ttf.woff2';
		$this->assertEquals( wp_webfonts()->validate_webfont( $font )['src'], $font['src'] );

		// Test font-weight.
		$font_weights = array( 100, '100', '100 900', 'normal' );
		foreach ( $font_weights as $value ) {
			$font['font-weight'] = $value;
			$this->assertEquals( wp_webfonts()->validate_webfont( $font )['font-weight'], $value );
		}

		// Test that invalid keys get removed from the font.
		$font['invalid-key'] = 'invalid';
		$this->assertArrayNotHasKey( 'invalid-key', wp_webfonts()->validate_webfont( $font ) );
	}

	/**
	 * Test generate_and_enqueue_styles outputs only enqueued webfonts.
	 *
	 * @covers WP_Webfonts::generate_and_enqueue_styles
	 */
	public function test_generate_and_enqueue_styles() {
		wp_register_webfonts(
			array(
				array(
					'provider'     => 'local',
					'font-family'  => 'Roboto',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/roboto/Roboto-Regular.ttf',
					'font-display' => 'fallback',
				),
				array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
			)
		);

		wp_enqueue_webfont( 'Source Serif Pro' );

		wp_webfonts()->generate_and_enqueue_styles();

		$expected = <<<EOF
@font-face{font-family:"Source Serif Pro";font-style:normal;font-weight:200 900;font-display:fallback;font-stretch:normal;src:local("Source Serif Pro"), url('https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2') format('woff2');}
EOF;

		$this->assertStringContainsString(
			$expected,
			get_echo( 'wp_print_styles' )
		);
	}

	/**
	 * Test generate_and_enqueue_editor_styles outputs registered and enqueued webfonts.
	 * Both are necessary so the editor correctly loads webfonts picked while in the editor.
	 *
	 * @covers WP_Webfonts::generate_and_enqueue_editor_styles
	 */
	public function test_generate_and_enqueue_editor_styles() {
		wp_register_webfonts(
			array(
				array(
					'provider'     => 'local',
					'font-family'  => 'Roboto',
					'font-style'   => 'normal',
					'font-weight'  => '400',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/roboto/Roboto-Regular.ttf',
					'font-display' => 'fallback',
				),
				array(
					'provider'     => 'local',
					'font-family'  => 'Source Serif Pro',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
			)
		);

		wp_enqueue_webfont( 'Source Serif Pro' );

		wp_webfonts()->generate_and_enqueue_editor_styles();

		$expected = <<<EOF
@font-face{font-family:Roboto;font-style:normal;font-weight:400;font-display:fallback;font-stretch:normal;src:local(Roboto), url('https://example.com/assets/fonts/roboto/Roboto-Regular.ttf') format('truetype');}@font-face{font-family:"Source Serif Pro";font-style:normal;font-weight:200 900;font-display:fallback;font-stretch:normal;src:local("Source Serif Pro"), url('https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2') format('woff2');}
EOF;

		$this->assertStringContainsString(
			$expected,
			get_echo( 'wp_print_styles' )
		);
	}
}
