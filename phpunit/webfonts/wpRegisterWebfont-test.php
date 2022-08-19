<?php
/**
 * Register webfonts tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers ::wp_register_webfont
 */
class Tests_Webfonts_WpRegisterWebfont extends WP_Webfonts_TestCase {

	/**
	 * Unit test for registering a variation with a variation handle given.
	 *
	 * @dataProvider data_register
	 *
	 * @param string $font_family_handle Font family for this variation.
	 * @param array  $variation          Web font to test.
	 * @param array  $expected           Expected results.
	 */
	public function test_should_register_with_mock_when_handle_given( $font_family_handle, array $variation, $expected ) {
		$mock             = $this->set_up_mock( 'add_variation' );
		$variation_handle = $expected[1];

		$mock->expects( $this->once() )
			->method( 'add_variation' )
			->with(
				$this->identicalTo( $font_family_handle ),
				$this->identicalTo( $variation ),
				$this->identicalTo( $variation_handle )
			)
			->will( $this->returnValue( $font_family_handle ) );

		$this->assertSame( $font_family_handle, wp_register_webfont( $variation, $font_family_handle, $variation_handle ) );
	}

	/**
	 * Integration test for registering a variation when the font family was previously registered.
	 *
	 * @dataProvider data_register
	 *
	 * @param string $font_family_handle Font family for this variation.
	 * @param array  $variation          Web font to test.
	 * @param array  $expected           Expected results.
	 */
	public function test_should_register_variation_but_not_reregister_font_family( $font_family_handle, array $variation, $expected ) {
		$this->setup_font_family( $font_family_handle );

		$this->assertSame( $font_family_handle, wp_register_webfont( $variation, $font_family_handle ), 'Registering should return the font family handle' );
		$this->assertSame( $expected, $this->get_registered_handles(), 'Registry should contain the font family and variant handles' );
	}

	/**
	 * Integration test for testing the font family is registered during the variation registration process.
	 *
	 * @dataProvider data_register_with_deprecated_structure
	 *
	 * @param array $variation Web font to test.
	 * @param array $expected  Expected results.
	 */
	public function test_should_register_font_family( array $variation, $expected ) {
		$font_family_handle = $expected[0];

		wp_register_webfont( $variation );
		$this->assertContains( $font_family_handle, $this->get_registered_handles() );
	}

	/**
	 * Integration test to ensure registration does not automatically enqueue.
	 *
	 * @dataProvider data_register
	 *
	 * @param string $font_family_handle Font family handle.
	 * @param array  $variation          Variation.
	 */
	public function test_does_not_enqueue_when_registering( $font_family_handle, array $variation ) {
		$this->setup_font_family( $font_family_handle );
		wp_register_webfont( $variation, $font_family_handle );

		$this->assertEmpty( $this->get_enqueued_handles() );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_register() {
		return array(
			'Source Serif Pro' => array(
				'font_family' => 'source-serif-pro',
				'variation'   => array(
					'provider'     => 'local',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected'    => array(
					'source-serif-pro',
					'source-serif-pro-200-900-normal',
				),
			),
			'Merriweather'     => array(
				'font_family' => 'merriweather',
				'variation'   => array(
					'font-style' => 'italic',
					'src'        => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
				),
				'expected'    => array(
					'merriweather',
					'merriweather-400-italic',
				),
			),
		);
	}

	/**
	 * @dataProvider data_register_with_deprecated_structure
	 *
	 * @covers WP_Webfonts::add_variation
	 *
	 * @param array $variation Web font to test.
	 * @param array $expected  Expected results.
	 */
	public function test_registers_with_deprecated_structure(
		array $variation, $expected
	) {
		$font_family_handle = $expected[0];
		$this->setup_font_family( $font_family_handle );

		$this->assertSame( $font_family_handle, wp_register_webfont( $variation ), 'Registering should return the registered font family handle' );
		$this->assertSame( $expected, $this->get_registered_handles(), 'Registry should contain the font family and variant handles' );
	}

	/**
	 * @dataProvider data_with_deprecated_structure
	 *
	 * @covers WP_Webfonts::add_variation
	 *
	 * @param array $variation Web font to test.
	 * @param array $expected  Expected results.
	 */
	public function test_should_register_font_family_with_deprecated_structure(
		array $variation, $expected
	) {
		$font_family_handle = $expected[0];

		wp_register_webfont( $variation );
		$this->assertContains( $font_family_handle, $this->get_registered_handles() );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_with_deprecated_structure() {
		return array(
			'font-family as name'        => array(
				'variation' => array(
					'provider'    => 'local',
					'font-family' => 'Source Serif Pro',
					'font-weight' => '200 900',
					'src'         => 'https://example.com/assets/fonts/font.ttf.woff2',
				),
				'expected'  => array(
					'source-serif-pro',
					'source-serif-pro-200-900-normal',
				),
			),
			'font-family as handle/slug' => array(
				'variation' => array(
					'provider'    => 'local',
					'font-family' => 'my-font-family',
					'font-style'  => 'italic',
					'src'         => 'https://example.com/assets/fonts/font.ttf.woff2',
				),
				'expected'  => array(
					'my-font-family',
					'my-font-family-400-italic',
				),
			),
		);
	}

	/**
	 * Integration test for testing when font family registration fails.
	 *
	 * @dataProvider data_invalid_font_family
	 *
	 * @param string $font_family_handle Font family for this variation.
	 * @param array  $variation          Web font to test.
	 * @param string $expected_message   Expected notice message.
	 */
	public function test_should_fail_with_invalid_font_family( $font_family_handle, array $variation, $expected_message ) {
		$this->expectNotice();
		$this->expectNoticeMessage( $expected_message );

		$this->assertNull( wp_register_webfont( $variation, $font_family_handle ), 'Should return null when invalid font family given' );
		$this->assertEmpty( $this->get_registered_handles(), 'Font family and variation should not be registered' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_invalid_font_family() {
		return array(
			'non-string'                           => array(
				'font_family_handle' => null,
				'variation'          => array(
					'provider'     => 'local',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected_message'   => 'Font family not found.',
				'font-family'        => null,
			),
			'empty string'                         => array(
				'font_family_handle' => '',
				'variation'          => array(
					'provider'     => 'local',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected_message'   => 'Font family not found.',
			),
			'non-string in deprecated structure'   => array(
				'font_family_handle' => '',
				'variation'          => array(
					'provider'     => 'local',
					'font-family'  => null,
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected_message'   => 'Font family not defined in the variation.',
			),
			'empty string in deprecated structure' => array(
				'font_family_handle' => '',
				'variation'          => array(
					'provider'     => 'local',
					'font-family'  => '',
					'font-style'   => 'normal',
					'font-weight'  => '200 900',
					'font-stretch' => 'normal',
					'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
					'font-display' => 'fallback',
				),
				'expected_message'   => 'Font family not defined in the variation.',
			),
		);
	}

	/**
	 * Sets up the font family by registering it.
	 *
	 * @param string $handle Handle to register.
	 */
	private function setup_font_family( $handle ) {
		wp_webfonts()->add( $handle, false );
	}
}
