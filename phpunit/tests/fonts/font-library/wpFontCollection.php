<?php
/**
 * Test WP_Font_Collection properties.
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Collection::load_from_json
 * @covers WP_Font_Collection::__construct
 */
class Tests_Fonts_WpFontCollection extends WP_UnitTestCase {

	private static $mock_collection_data;

	/**
	 * Test WP_Font_Collection missing properties
	 */
	public function test_should_do_it_wrong_invalid_slug() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::__construct' );
		new WP_Font_Collection( 'slug with spaces', array( 'font_families' => array( 'mock' ) ) );
	}

	/**
	 * Test WP_Font_Collection provided data missing font_families
	 */
	public function test_should_do_it_wrong_missing_font_families() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::validate_data' );
		$config     = array(
			'name' => 'My Collection',
		);
		$collection = new WP_Font_Collection( 'my-collection', $config );
		$data       = $collection->get_data();

		$this->assertWPError( $data, 'Error is not returned when invalid font_families is provided.' );
		$this->assertSame( $data->get_error_code(), 'font_collection_missing_property' );
	}

	/**
	 * Test WP_Font_Collection provided data missing name
	 */
	public function test_should_do_it_wrong_missing_name() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::validate_data' );
		$config     = array(
			'font_families' => array( 'mock' ),
		);
		$collection = new WP_Font_Collection( 'my-collection', $config );
		$data       = $collection->get_data();

		$this->assertWPError( $data, 'Error is not returned when invalid name is provided.' );
		$this->assertSame( $data->get_error_code(), 'font_collection_missing_property' );
	}

	/**
	 * Test WP_Font_Collection invalid file path
	 */
	public function test_should_error_with_invalid_file_path() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::load_from_json' );

		$collection = new WP_Font_Collection( 'my-collection', 'non-existing.json' );
		$data       = $collection->get_data();

		$this->assertWPError( $data, 'Error is not returned when invalid file path is provided.' );
		$this->assertSame( $data->get_error_code(), 'font_collection_json_missing' );
	}

	/**
	 * Test WP_Font_Collection invalid url
	 */
	public function test_should_error_with_invalid_url() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::load_from_json' );

		$collection = new WP_Font_Collection( 'my-collection', 'http://not-a-url.com / fonts.json' );
		$data       = $collection->get_data();

		$this->assertWPError( $data, 'Error is not returned when invalid url is provided.' );
		$this->assertSame( $data->get_error_code(), 'font_collection_json_missing' );
	}

	/**
	 * Test WP_Font_Collection invalid url response
	 */
	public function test_should_error_with_invalid_url_response() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_invalid_response' ), 10, 3 );

		$collection = new WP_Font_Collection( 'my-collection', 'https://localhost/fonts/missing-collection.json' );
		$data       = $collection->get_data();

		$this->assertWPError( $data, 'Error is not returned when invalid url response results.' );
		$this->assertSame( $data->get_error_code(), 'font_collection_request_error' );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_invalid_response' ) );
	}

	/**
	 * Test WP_Font_Collection invalid url contents
	 */
	public function test_should_error_with_invalid_json_from_url() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_invalid_json' ), 10, 3 );

		$collection = new WP_Font_Collection( 'my-collection', 'https://localhost/fonts/invalid-collection.json' );
		$data       = $collection->get_data();

		$this->assertWPError( $data, 'Error is not returned when invalid json response results.' );
		$this->assertSame( $data->get_error_code(), 'font_collection_decode_error' );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_invalid_json' ) );
	}

	/**
	 * Test WP_Font_Collection invalid file contents
	 */
	public function test_should_error_with_invalid_json_from_file() {
		$mock_file = wp_tempnam( 'my-collection-data-' );
		file_put_contents( $mock_file, 'invalid-json' );

		$collection = new WP_Font_Collection( 'my-collection', $mock_file );

		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- Testing error response returned by `get_data()`, not the underlying error from `wp_json_file_decode`.
		$data = @$collection->get_data();

		$this->assertWPError( $data, 'Error is not returned when invalid json file contents.' );
		$this->assertSame( $data->get_error_code(), 'font_collection_decode_error' );
	}

	/**
	 * Test setting data via config array
	 *
	 * @dataProvider data_should_create_font_families
	 *
	 * @param string $slug Font collection slug.
	 * @param array  $config Font collection config options.
	 * @param array  $expected_data Expected output data.
	 */
	public function test_should_assign_properties_from_config_array( $slug, $config, $expected_data ) {
		$collection = new WP_Font_Collection( $slug, $config );
		$data       = $collection->get_data();
		$this->assertSame( $expected_data, $data );
		$this->assertSame( $slug, $collection->slug );
	}

	/**
	 * Test setting data via json file
	 *
	 * @dataProvider data_should_create_font_families
	 *
	 * @param string $slug Font collection slug.
	 * @param array  $config Font collection config options.
	 * @param array  $expected_data Expected output data.
	 */
	public function test_should_assign_properties_from_json_file( $slug, $config, $expected_data ) {
		$mock_file = wp_tempnam( 'my-collection-data-' );
		file_put_contents( $mock_file, wp_json_encode( $config ) );
		$collection = new WP_Font_Collection( $slug, $mock_file );
		$data       = $collection->get_data();
		$this->assertSame( $expected_data, $data );
		$this->assertSame( $slug, $collection->slug );
	}

	/**
	 * Test setting data via json url
	 *
	 * @dataProvider data_should_create_font_families
	 *
	 * @param string $slug Font collection slug.
	 * @param array  $config Font collection config options.
	 * @param array  $expected_data Expected output data.
	 */
	public function test_should_assign_properties_from_url( $slug, $config, $expected_data ) {
		add_filter( 'pre_http_request', array( $this, 'mock_request' ), 10, 3 );
		self::$mock_collection_data = $config;
		$collection                 = new WP_Font_Collection( $slug, 'https://localhost/fonts/mock-font-collection.json' );
		$data                       = $collection->get_data();
		$this->assertSame( $expected_data, $data );
		remove_filter( 'pre_http_request', array( $this, 'mock_request' ) );
	}


	public function mock_request( $preempt, $args, $url ) {
		// if the URL is not the URL you want to mock, return false.
		if ( 'https://localhost/fonts/mock-font-collection.json' !== $url ) {
			return false;
		}

		return array(
			'body'     => json_encode( self::$mock_collection_data ),
			'response' => array(
				'code' => 200,
			),
		);
	}

	public function mock_request_invalid_response( $preempt, $args, $url ) {
		// if the URL is not the URL you want to mock, return false.
		if ( 'https://localhost/fonts/missing-collection.json' !== $url ) {
			return false;
		}

		return array(
			'body'     => '',
			'response' => array(
				'code' => 404,
			),
		);
	}

	public function mock_request_invalid_json( $preempt, $args, $url ) {
		// if the URL is not the URL you want to mock, return false.
		if ( 'https://localhost/fonts/invalid-collection.json' !== $url ) {
			return false;
		}

		return array(
			'body'     => 'invalid',
			'response' => array(
				'code' => 200,
			),
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_create_font_families() {
		return array(

			'simple font collection'          => array(
				'slug'          => 'my-collection',
				'config'        => array(
					'name'          => 'My Collection',
					'font_families' => array( 'mock' ),
				),
				'expected_data' => array(
					'description'   => '',
					'categories'    => array(),
					'name'          => 'My Collection',
					'font_families' => array( 'mock' ),
				),
			),

			'font collection with everything' => array(
				'slug'          => 'my-collection',
				'config'        => array(
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'font_families' => array( 'mock' ),
					'categories'    => array( 'mock' ),
				),
				'expected_data' => array(
					'description'   => 'My collection description',
					'categories'    => array( 'mock' ),
					'name'          => 'My Collection',
					'font_families' => array( 'mock' ),
				),
			),

		);
	}
}
