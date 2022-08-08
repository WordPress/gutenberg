<?php
/**
 * Register font family tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-testcase.php';

/**
 * @group  webfonts
 * @covers ::wp_enqueue_webfont
 * @covers WP_Webfonts::enqueue
 */
class Tests_Webfonts_WpEnqueueWebfont extends WP_Webfonts_TestCase {

	/**
	 * Unit test for registering a font-family that mocks WP_Webfonts.
	 *
	 * @dataProvider data_unit_enqueue
	 *
	 * @param string|string[] $font_family Font family to test.
	 */
	public function test_unit_enqueue( $font_family ) {
		$mock = $this->set_up_mock( 'enqueue' );
		$mock->expects( $this->once() )
			->method( 'enqueue' )
			->with(
				$this->identicalTo( $font_family )
			);

		wp_enqueue_webfont( $font_family );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_unit_enqueue() {
		return array(
			'single word handle'   => array( 'lato' ),
			'multiple word handle' => array( 'source-sans-pro' ),
			'single word name'     => array( 'Merriweather' ),
			'multiple word name'   => array( 'My Cool Font' ),
		);
	}

	/**
	 * Integration test for enqueuing a font family and all of its variations.
	 *
	 * @dataProvider data_enqueue
	 *
	 * @param string $font_family      Font family to test.
	 * @param array  $variations       Variations.
	 * @param array  $expected_handles Array of expected handles.
	 */
	public function test_enqueue_after_registration( $font_family, $variations, $expected_handles ) {
		$this->setup_register( $font_family, $variations );

		wp_enqueue_webfont( $font_family );
		$this->assertSame( $expected_handles, $this->get_enqueued_handles() );
	}

	/**
	 * Integration test for enqueuing before registering a font family and all of its variations.
	 *
	 * @dataProvider data_enqueue
	 *
	 * @param string $font_family Font family to test.
	 */
	public function test_enqueue_before_registration( $font_family ) {
		wp_enqueue_webfont( $font_family );

		$expected = array( $font_family => null );
		$this->assertSame( $expected, $this->get_queued_before_register(), 'Font family should be added to before registered queue' );
		$this->assertEmpty( $this->get_enqueued_handles(), 'Font family should not be added to the enqueue queue' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_enqueue() {
		return array(
			'one family family without variations' => array(
				'font_family'      => 'lato',
				'variations'       => array(),
				'expected_handles' => array( 'lato' ),
			),
			'one family family with 1 variation'   => array(
				'font_family'      => 'merriweather',
				'variations'       => array(
					'merriweather-200-900-normal' => array(
						'font-weight'  => '200 900',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/merriweather.ttf.woff2',
					),
				),
				'expected_handles' => array( 'merriweather' ),
			),
			'font family keyed with name'          => array(
				'font_family'      => 'Source Serif Pro',
				'variations'       => array(
					'Source Serif Pro-300-normal' => array(
						'provider'     => 'local',
						'font-style'   => 'normal',
						'font-weight'  => '300',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2',
						'font-display' => 'fallback',
					),
					'Source Serif Pro-900-italic' => array(
						'provider'     => 'local',
						'font-style'   => 'italic',
						'font-weight'  => '900',
						'font-stretch' => 'normal',
						'src'          => 'https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2',
						'font-display' => 'fallback',
					),
				),
				'expected_handles' => array( 'Source Serif Pro' ),
			),
		);
	}

	/**
	 * Register one or more font-family and its variations to set up a test.
	 *
	 * @param string $font_family Font family to test.
	 * @param array  $variations  Variations.
	 */
	private function setup_register( $font_family, $variations ) {
		$wp_webfonts = wp_webfonts();

		$wp_webfonts->add( $font_family, false );

		foreach ( $variations as $variation_handle => $variation ) {
			if ( ! is_string( $variation_handle ) ) {
				$variation_handle = '';
			}
			$wp_webfonts->add_variation( $font_family, $variation, $variation_handle );
		}
	}
}
