<?php

/**
 * @group  webfonts
 * @covers WP_Webfonts_Google_Provider
 */
class WP_Webfonts_Google_Provider_Test extends WP_UnitTestCase {
	private $provider;

	public static function setUpBeforeClass() {
		require_once dirname( dirname( dirname( __DIR__ ) ) ) . '/lib/webfonts-api/providers/class-wp-webfonts-provider.php';
		require_once dirname( dirname( dirname( __DIR__ ) ) ) . '/lib/webfonts-api/providers/class-wp-webfonts-google-provider.php';
	}

	public function setUp() {
		parent::setUp();

		$this->provider = new WP_Webfonts_Google_Provider();
	}

	/**
	 * @covers WP_Webfonts_Google_Provider::set_webfonts
	 */
	public function test_set_webfonts() {
		$webfonts = array(
			'open-sans.normal.400' => array(
				'provider'     => 'google',
				'font-family'  => 'Open Sans',
				'font-style'   => 'normal',
				'font-weight'  => '400',
				'font-display' => 'fallback',
			),
			'open-sans.italic.700' => array(
				'provider'     => 'google',
				'font-family'  => 'Open Sans',
				'font-style'   => 'italic',
				'font-weight'  => '700',
				'font-display' => 'fallback',
			),
			'roboto.normal.900'    => array(
				'provider'     => 'google',
				'font-family'  => 'Roboto',
				'font-style'   => 'normal',
				'font-weight'  => '900',
				'font-display' => 'fallback',
			),
		);

		$this->provider->set_webfonts( $webfonts );

		$property = $this->get_webfonts_property();
		$this->assertSame( $webfonts, $property->getValue( $this->provider ) );
	}

	/**
	 * @covers WP_Webfonts_Google_Provider::build_collection_api_urls
	 *
	 * @dataProvider data_build_collection_api_urls
	 *
	 * @since 5.9.0
	 *
	 * @param array $webfonts Webfonts input.
	 * @param array $expected Expected urls.
	 */
	public function test_build_collection_api_urls( array $webfonts, array $expected ) {
		$property = new ReflectionProperty( $this->provider, 'webfonts' );
		$property->setAccessible( true );
		$property->setValue( $this->provider, $webfonts );

		$method = new ReflectionMethod( $this->provider, 'build_collection_api_urls' );
		$method->setAccessible( true );
		$actual = $method->invoke( $this->provider );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Data Provider.
	 *
	 * @return array
	 */
	public function data_build_collection_api_urls() {
		return array(
			'single font-family + single variation'    => array(
				'webfonts' => array(
					'open-sans.normal.400' => array(
						'provider'     => 'google',
						'font-family'  => 'Open Sans',
						'font-style'   => 'normal',
						'font-weight'  => '400',
						'font-display' => 'fallback',
					),
				),
				'expected' => array(
					'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400&display=fallback',
				),
			),
			'single font-family + multiple variations' => array(
				'webfonts' => array(
					'open-sans.normal.400' => array(
						'provider'     => 'google',
						'font-family'  => 'Open Sans',
						'font-style'   => 'normal',
						'font-weight'  => '400',
						'font-display' => 'fallback',
					),
					'open-sans.italic.700' => array(
						'provider'     => 'google',
						'font-family'  => 'Open Sans',
						'font-style'   => 'italic',
						'font-weight'  => '700',
						'font-display' => 'fallback',
					),
				),
				'expected' => array(
					'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;1,700&display=fallback',
				),
			),
			'multiple font-families and variations'    => array(
				'webfonts' => array(
					'open-sans.normal.400' => array(
						'provider'     => 'google',
						'font-family'  => 'Open Sans',
						'font-style'   => 'normal',
						'font-weight'  => '400',
						'font-display' => 'fallback',
					),
					'open-sans.italic.700' => array(
						'provider'     => 'google',
						'font-family'  => 'Open Sans',
						'font-style'   => 'italic',
						'font-weight'  => '700',
						'font-display' => 'fallback',
					),
					'roboto.normal.900'    => array(
						'provider'     => 'google',
						'font-family'  => 'Roboto',
						'font-style'   => 'normal',
						'font-weight'  => '900',
						'font-display' => 'fallback',
					),
				),
				'expected' => array(
					'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;1,700&family=Roboto:wght@900&display=fallback',
				),
			),
			'range of font-weight values'              => array(
				'webfonts' => array(
					'open-sans.normal.400 900' => array(
						'provider'     => 'google',
						'font-family'  => 'Open Sans',
						'font-style'   => 'normal',
						'font-weight'  => '400 900',
						'font-display' => 'fallback',
					),
					'open-sans.normal.100 400' => array(
						'provider'     => 'google',
						'font-family'  => 'Open Sans',
						'font-style'   => 'normal',
						'font-weight'  => '100 400',
						'font-display' => 'fallback',
					),
				),
				'expected' => array(
					'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800;900;100;200;300&display=fallback',
				),
			),
			'duplicate font-weight values'             => array(
				'webfonts' => array(
					'open-sans.normal.400 900' => array(
						'provider'     => 'google',
						'font-family'  => 'Open Sans',
						'font-style'   => 'normal',
						'font-weight'  => '400 600',
						'font-display' => 'fallback',
					),
					'open-sans.normal.400'     => array(
						'provider'     => 'google',
						'font-family'  => 'Open Sans',
						'font-style'   => 'normal',
						'font-weight'  => '400',
						'font-display' => 'fallback',
					),
				),
				'expected' => array(
					'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=fallback',
				),
			),
		);
	}

	/**
	 * @covers WP_Webfonts_Google_Provider::get_css
	 *
	 * @dataProvider data_get_css
	 *
	 * @param array  $webfonts      Prepared webfonts (to store in WP_Webfonts_Local_Provider::$webfonts property).
	 * @param int    $response_code Remote request response code.
	 * @param string $expected      Expected CSS.
	 */
	public function test_get_css( array $webfonts, $response_code, $expected ) {
		$property = $this->get_webfonts_property();
		$property->setValue( $this->provider, $webfonts );

		add_filter(
			'pre_http_request',
			static function() use ( $response_code, $expected ) {
				return array(
					'headers'  => array(),
					'body'     => $expected,
					'response' => array(
						'code' => $response_code,
					),
					'cookies'  => array(),
					'filename' => null,
				);
			}
		);

		$this->assertSame( $expected, $this->provider->get_css() );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_css() {
		return array(
			'failure: invalid font-family' => array(
				'webfonts'      => array(
					'open-sans.normal.400' => array(
						'provider'     => 'google',
						'font-family'  => 'Invalid',
						'font-style'   => 'normal',
						'font-weight'  => '400',
						'font-display' => '',
					),
				),
				'response_code' => 400, // The requested font families are not available.
				'expected'      => '',
			),
			'success: single font-family'  => array(
				'webfonts'      => array(
					'open-sans.normal.400' => array(
						'provider'     => 'google',
						'font-family'  => 'Open Sans',
						'font-style'   => 'normal',
						'font-weight'  => '400',
						'font-display' => 'fallback',
					),
				),
				'response_code' => 200,
				'expected'      => <<<CSS
/* cyrillic-ext */
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: fallback;
  src: url(https://fonts.gstatic.com/s/opensans/v27/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4taVQUwaEQbjB_mQ.woff) format('woff');
  unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
/* cyrillic */
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: fallback;
  src: url(https://fonts.gstatic.com/s/opensans/v27/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4kaVQUwaEQbjB_mQ.woff) format('woff');
  unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* greek-ext */
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: fallback;
  src: url(https://fonts.gstatic.com/s/opensans/v27/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4saVQUwaEQbjB_mQ.woff) format('woff');
  unicode-range: U+1F00-1FFF;
}
/* greek */
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: fallback;
  src: url(https://fonts.gstatic.com/s/opensans/v27/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4jaVQUwaEQbjB_mQ.woff) format('woff');
  unicode-range: U+0370-03FF;
}
/* hebrew */
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: fallback;
  src: url(https://fonts.gstatic.com/s/opensans/v27/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4iaVQUwaEQbjB_mQ.woff) format('woff');
  unicode-range: U+0590-05FF, U+20AA, U+25CC, U+FB1D-FB4F;
}
/* vietnamese */
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: fallback;
  src: url(https://fonts.gstatic.com/s/opensans/v27/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4vaVQUwaEQbjB_mQ.woff) format('woff');
  unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB;
}
/* latin-ext */
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: fallback;
  src: url(https://fonts.gstatic.com/s/opensans/v27/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4uaVQUwaEQbjB_mQ.woff) format('woff');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 400;
  font-stretch: 100%;
  font-display: fallback;
  src: url(https://fonts.gstatic.com/s/opensans/v27/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVQUwaEQbjA.woff) format('woff');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

CSS
			,
			),
		);
	}

	private function get_webfonts_property() {
		$property = new ReflectionProperty( $this->provider, 'webfonts' );
		$property->setAccessible( true );

		return $property;
	}
}
