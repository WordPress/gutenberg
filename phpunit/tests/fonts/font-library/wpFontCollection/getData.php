<?php
/**
 * Test WP_Font_Collection::get_data.
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Collection::get_data
 */
class Tests_Fonts_WpFontCollection_GetData extends WP_UnitTestCase {

	private static $mock_collection_data;

	/**
	 * @dataProvider data_create_font_collection
	 *
	 * @param string $slug          Font collection slug.
	 * @param array  $config        Font collection config.
	 * @param array  $expected_data Expected collection data.
	 */
	public function test_should_get_data_from_config_array( $slug, $config, $expected_data ) {
		$collection = new WP_Font_Collection( $slug, $config );
		$data       = $collection->get_data();

		$this->assertSame( $slug, $collection->slug, 'The slug should match.' );
		$this->assertSame( $expected_data, $data, 'The collection data should match.' );
	}

	/**
	 * @dataProvider data_create_font_collection
	 *
	 * @param string $slug          Font collection slug.
	 * @param array  $config        Font collection config.
	 * @param array  $expected_data Expected collection data.
	 */
	public function test_should_get_data_from_json_file( $slug, $config, $expected_data ) {
		$mock_file = wp_tempnam( 'my-collection-data-' );
		file_put_contents( $mock_file, wp_json_encode( $config ) );

		$collection = new WP_Font_Collection( $slug, $mock_file );
		$data       = $collection->get_data();

		$this->assertSame( $slug, $collection->slug, 'The slug should match.' );
		$this->assertSame( $expected_data, $data, 'The collection data should match.' );
	}

	/**
	 * @dataProvider data_create_font_collection
	 *
	 * @param string $slug          Font collection slug.
	 * @param array  $config        Font collection config.
	 * @param array  $expected_data Expected collection data.
	 */
	public function test_should_get_data_from_json_url( $slug, $config, $expected_data ) {
		add_filter( 'pre_http_request', array( $this, 'mock_request' ), 10, 3 );

		self::$mock_collection_data = $config;
		$collection                 = new WP_Font_Collection( $slug, 'https://localhost/fonts/mock-font-collection.json' );
		$data                       = $collection->get_data();

		remove_filter( 'pre_http_request', array( $this, 'mock_request' ) );

		$this->assertSame( $slug, $collection->slug, 'The slug should match.' );
		$this->assertSame( $expected_data, $data, 'The collection data should match.' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_create_font_collection() {
		return array(

			'font collection with required data' => array(
				'slug'          => 'my-collection',
				'config'        => array(
					'name'          => 'My Collection',
					'font_families' => array( array() ),
				),
				'expected_data' => array(
					'description'   => '',
					'categories'    => array(),
					'name'          => 'My Collection',
					'font_families' => array( array() ),
				),
			),

			'font collection with all data'      => array(
				'slug'          => 'my-collection',
				'config'        => array(
					'name'          => 'My Collection',
					'description'   => 'My collection description',
					'font_families' => array( array() ),
					'categories'    => array(),
				),
				'expected_data' => array(
					'description'   => 'My collection description',
					'categories'    => array(),
					'name'          => 'My Collection',
					'font_families' => array( array() ),
				),
			),

			'font collection with risky data'      => array(
				'slug'          => 'my-collection',
				'config'        => array(
					'name'          => 'My Collection<script>alert("xss")</script>',
					'description'   => 'My collection description<script>alert("xss")</script>',
					'font_families' => array( 
						array(
							'font_family_settings' => array(
								'fontFamily' => 'Open Sans, sans-serif<script>alert("xss")</script>',
								'slug' => 'open-sans',
								'name' => 'Open Sans<script>alert("xss")</script>',
								'unwanted_property'=> 'potentially evil value'
							),
							'categories' => [ 'sans-serif<script>alert("xss")</script>' ]
						)
					 ),
					'categories'    => array(
						array (
							'name' => 'Mock col<script>alert("xss")</script>',
							'slug' => 'mock-col<script>alert("xss")</script>',
							'unwanted_property'=> 'potentially evil value'
						)
					),
					'unwanted_property'=> 'potentially evil value'
				),
				'expected_data' => array(
					'description'   => 'My collection description',
					'categories'    => array(
						array (
							'name' => 'Mock col',
							'slug' => 'mock-colalertxss'
						)
					),
					'name'          => 'My Collection',
					'font_families' => array( 
						array(
							'font_family_settings' => array(
								'fontFamily' => 'Open Sans, sans-serif',
								'slug' => 'open-sans',
								'name' => 'Open Sans',
							),
							'categories' => [ 'sans-serifalertxss' ]
						)
					 ),
				),
			),

		);
	}

	/**
	 * @dataProvider data_should_error_when_missing_properties
	 *
	 * @param array $config Font collection config.
	 */
	public function test_should_error_when_missing_properties( $config ) {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::validate_data' );

		$collection = new WP_Font_Collection( 'my-collection', $config );
		$data       = $collection->get_data();

		$this->assertWPError( $data, 'Error is not returned when property is missing or invalid.' );
		$this->assertSame(
			$data->get_error_code(),
			'font_collection_missing_property',
			'Incorrect error code when property is missing or invalid.'
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_should_error_when_missing_properties() {
		return array(
			'missing name'          => array(
				'config' => array(
					'font_families' => array( 'mock' ),
				),
			),
			'empty name'            => array(
				'config' => array(
					'name'          => '',
					'font_families' => array( 'mock' ),
				),
			),
			'missing font_families' => array(
				'config' => array(
					'name' => 'My Collection',
				),
			),
			'empty font_families'   => array(
				'config' => array(
					'name'          => 'My Collection',
					'font_families' => array(),
				),
			),
		);
	}

	public function test_should_error_with_invalid_json_file_path() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::load_from_json' );

		$collection = new WP_Font_Collection( 'my-collection', 'non-existing.json' );
		$data       = $collection->get_data();

		$this->assertWPError( $data, 'Error is not returned when invalid file path is provided.' );
		$this->assertSame(
			$data->get_error_code(),
			'font_collection_json_missing',
			'Incorrect error code when invalid file path is provided.'
		);
	}

	public function test_should_error_with_invalid_json_from_file() {
		$mock_file = wp_tempnam( 'my-collection-data-' );
		file_put_contents( $mock_file, 'invalid-json' );

		$collection = new WP_Font_Collection( 'my-collection', $mock_file );

		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- Testing error response returned by `load_from_json`, not the underlying error from `wp_json_file_decode`.
		$data = @$collection->get_data();

		$this->assertWPError( $data, 'Error is not returned with invalid json file contents.' );
		$this->assertSame(
			$data->get_error_code(),
			'font_collection_decode_error',
			'Incorrect error code with invalid json file contents.'
		);
	}

	public function test_should_error_with_invalid_url() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::load_from_json' );

		$collection = new WP_Font_Collection( 'my-collection', 'not-a-url' );
		$data       = $collection->get_data();

		$this->assertWPError( $data, 'Error is not returned when invalid url is provided.' );
		$this->assertSame(
			$data->get_error_code(),
			'font_collection_json_missing',
			'Incorrect error code when invalid url is provided.'
		);
	}

	public function test_should_error_with_unsuccessful_response_status() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_unsuccessful_response' ), 10, 3 );

		$collection = new WP_Font_Collection( 'my-collection', 'https://localhost/fonts/missing-collection.json' );
		$data       = $collection->get_data();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_unsuccessful_response' ) );

		$this->assertWPError( $data, 'Error is not returned when response is unsuccessful.' );
		$this->assertSame(
			$data->get_error_code(),
			'font_collection_request_error',
			'Incorrect error code when response is unsuccussful.'
		);
	}

	public function test_should_error_with_invalid_json_from_url() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_invalid_json' ), 10, 3 );

		$collection = new WP_Font_Collection( 'my-collection', 'https://localhost/fonts/invalid-collection.json' );
		$data       = $collection->get_data();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_invalid_json' ) );

		$this->assertWPError( $data, 'Error is not returned when response is invalid json.' );
		$this->assertSame(
			$data->get_error_code(),
			'font_collection_decode_error',
			'Incorrect error code when response is invalid json.'
		);
	}

	public function mock_request( $preempt, $args, $url ) {
		if ( 'https://localhost/fonts/mock-font-collection.json' !== $url ) {
			return false;
		}

		return array(
			'body'     => wp_json_encode( self::$mock_collection_data ),
			'response' => array(
				'code' => 200,
			),
		);
	}

	public function mock_request_unsuccessful_response( $preempt, $args, $url ) {
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
}
