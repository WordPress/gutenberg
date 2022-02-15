<?php

/**
 * @group  webfonts
 * @covers WP_Webfonts_Test
 */
class WP_Webfonts_Test extends WP_UnitTestCase {

	/**
	 * @covers wp_register_webfonts
	 * @covers WP_Webfonts::register_font
	 * @covers WP_Webfonts::get_fonts
	 * @covers WP_Webfonts::get_font_id
	 */
	public function test_get_fonts() {
		$fonts = array(
			array(
				'provider'     => 'local',
				'font-family'  => 'Source Serif Pro',
				'font-style'   => 'normal',
				'font-weight'  => '200 900',
				'font-stretch' => 'normal',
				'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
				'font-display' => 'fallback',
			),
			array(
				'provider'     => 'local',
				'font-family'  => 'Source Serif Pro',
				'font-style'   => 'italic',
				'font-weight'  => '200 900',
				'font-stretch' => 'normal',
				'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
				'font-display' => 'fallback',
			),
		);

		$expected = array(
			'source-serif-pro-200-900-normal-local' => $fonts[0],
			'source-serif-pro-200-900-italic-local' => $fonts[1],
		);

		wp_register_webfonts( $fonts );
		$this->assertEquals( $expected, wp_webfonts()->get_fonts() );
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
	 * @covers WP_Webfonts::validate_font
	 */
	public function test_validate_font() {
		// Test empty array.
		$this->assertFalse( wp_webfonts()->validate_font( array() ) );

		$font = array(
			'font-family' => 'Test Font 1',
			'src'         => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
		);

		// Test missing provider fallback to local.
		$this->assertEquals( 'local', wp_webfonts()->validate_font( $font )['provider'] );

		// Test missing font-weight fallback to 400.
		$this->assertEquals( '400', wp_webfonts()->validate_font( $font )['font-weight'] );

		// Test missing font-style fallback to normal.
		$this->assertEquals( 'normal', wp_webfonts()->validate_font( $font )['font-style'] );

		// Test missing font-display fallback to fallback.
		$this->assertEquals( 'fallback', wp_webfonts()->validate_font( $font )['font-display'] );

		// Test local font with missing "src".
		$this->assertFalse( wp_webfonts()->validate_font( array( 'font-family' => 'Test Font 2' ) ) );

		// Test valid src URL, without a protocol.
		$font['src'] = '//example.com/SourceSerif4Variable-Roman.ttf.woff2';
		$this->assertEquals( wp_webfonts()->validate_font( $font )['src'], $font['src'] );

		// Test font-weight.
		$font_weights = array( 100, '100', '100 900', 'normal' );
		foreach ( $font_weights as $value ) {
			$font['font-weight'] = $value;
			$this->assertEquals( wp_webfonts()->validate_font( $font )['font-weight'], $value );
		}

		// Test that invalid keys get removed from the font.
		$font['invalid-key'] = 'invalid';
		$this->assertArrayNotHasKey( 'invalid-key', wp_webfonts()->validate_font( $font ) );
	}

	/**
	 * @covers WP_Webfonts::generate_styles
	 */
	public function test_generate_styles() {
		$this->assertEquals(
			'@font-face{font-family:"Source Serif Pro";font-style:normal;font-weight:200 900;font-display:fallback;font-stretch:normal;src:local("Source Serif Pro"), url(\'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2\') format(\'woff2\');}@font-face{font-family:"Source Serif Pro";font-style:italic;font-weight:200 900;font-display:fallback;font-stretch:normal;src:local("Source Serif Pro"), url(\'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2\') format(\'woff2\');}body{--wp--preset--font-family--source-serif-pro:Source Serif Pro;}.has-source-serif-pro-font-family{font-family:var(--wp--preset--font-family--source-serif-pro);}',
			wp_webfonts()->generate_styles(),
		);
	}
}
