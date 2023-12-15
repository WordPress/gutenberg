<?php
/**
 * Test WP_REST_Font_Family_Controller
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 * @group font-library-refactor
 *
 * @covers WP_REST_Font_Collection_Controller
 */

class Tests_Fonts_Font_Collection_Controller extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		// Mock the wp_remote_request() function.
		add_filter( 'pre_http_request', array( $this, 'mock_request' ), 10, 3 );

		// Create a user with administrator role.
		$admin_id = $this->factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );
	}

	public function tear_down() {

		// Reset $collections static property of WP_Font_Library class.
		$reflection = new ReflectionClass( 'WP_Font_Library' );
		$property   = $reflection->getProperty( 'collections' );
		$property->setAccessible( true );
		$property->setValue( null, array() );

		// Remove the mock to not affect other tests.
		remove_filter( 'pre_http_request', array( $this, 'mock_request' ) );
		parent::tear_down();
	}

	public function mock_request( $preempt, $args, $url ) {
		// Check if it's the URL you want to mock.
		if ( 'https://wordpress.org/fonts/mock-font-collection.json' === $url ) {
			return array(
				'body'     => $this->get_test_collection_data(),
				'response' => array(
					'code' => 200,
				),
			);
		}
		// For any other URL, return false which ensures the request is made as usual (or you can return other mock data).
		return false;
	}

	public function test_get_font_collections_with_no_collection_registered() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	public function test_get_font_collections_with_a_single_simple_collection() {

		// Add a font collection with included data.
		$config = array(
			'slug'        => 'my-font-collection',
			'name'        => 'My Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'data'        => array('this is mock data'=>true),
		);

		wp_register_font_collection( $config );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertCount( 1, $data, 'The response data is not an array with one element.' );
		$this->assertArrayHasKey( 'slug', $data[0], 'The response data does not have the key with the collection ID.' );
		$this->assertArrayHasKey( 'name', $data[0], 'The response data does not have the key with the collection name.' );
	}

	public function test_get_font_collection_with_included_data() {

		$collection_data = json_decode( $this->get_test_collection_data(), true );

		// Add a font collection with included data.
		$config = array(
			'slug'        => 'included-data-font-collection',
			'name'        => 'Included Data Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'data'        => $collection_data,
		);

		wp_register_font_collection( $config );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/included-data-font-collection' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertArrayHasKey( 'data', $data, 'The response data does not have the key with the file data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['name'], 'The response data does not have the expected data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['fontFace'][0]['fontFamily'], 'The response data does not have the expected data.' );
	}


	public function test_get_font_collection_with_data_from_file() {

		$mock_file = wp_tempnam( 'one-collection-' );
		file_put_contents( $mock_file, $this->get_test_collection_data() );

		$config = array(
			'slug'        => 'file-data-font-collection',
			'name'        => 'File Data Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => $mock_file,
		);

		wp_register_font_collection( $config );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/file-data-font-collection' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertArrayHasKey( 'data', $data, 'The response data does not have the key with the file data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['name'], 'The response data does not have the expected data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['fontFace'][0]['fontFamily'], 'The response data does not have the expected data.' );
	}

	public function test_get_font_collection_with_data_from_missing_file() {

		$config = array(
			'slug'        => 'missing-file-data-font-collection',
			'name'        => 'File Data Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => '/home/non-existing-file.json',
		);

		wp_register_font_collection( $config );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/missing-file-data-font-collection' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 500, $response->get_status(), 'The response status is not 500.' );
	}

	public function test_get_font_collection_with_data_from_missing_url() {

		$config = array(
			'slug'        => 'missing-url-data-font-collection',
			'name'        => 'File Data Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => 'https://non-existing-url-1234x.com.ar/fake-path/missing-file.json',
		);

		wp_register_font_collection( $config );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/missing-url-data-font-collection' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 500, $response->get_status(), 'The response status is not 500.' );
	}

	public function test_get_font_collection_with_data_from_url() {

		$config = array(
			'slug'        => 'url-data-font-collection',
			'name'        => 'File Data Font Collection',
			'description' => 'Demo about how to a font collection to your WordPress Font Library.',
			'src'         => 'https://wordpress.org/fonts/mock-font-collection.json',
		);

		wp_register_font_collection( $config );

		// Mock the wp_remote_request() function.
		// add_filter( 'pre_http_request', array( $this, 'mock_request' ), 10, 3 );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/font-collections/url-data-font-collection' );

		// Remove the mock to not affect other tests.
		// remove_filter( 'pre_http_request', array( $this, 'mock_request' ) );


		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 200, $response->get_status(), 'The response status is not 200.' );
		$this->assertArrayHasKey( 'data', $data, 'The response data does not have the key with the file data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['name'], 'The response data does not have the expected data.' );
		$this->assertSame( 'ABeeZee', $data['data']['fontFamilies'][0]['fontFace'][0]['fontFamily'], 'The response data does not have the expected data.' );
	}

	private function get_test_collection_data() {
		return '{
			"fontFamilies": [
				{
					"name": "ABeeZee",
					"fontFamily": "ABeeZee, sans-serif",
					"slug": "abeezee",
					"category": "sans-serif",
					"fontFace": [
						{
							"downloadFromUrl": "https://fonts.gstatic.com/s/abeezee/v22/esDR31xSG-6AGleN6tKukbcHCpE.ttf",
							"fontWeight": "400",
							"fontStyle": "normal",
							"fontFamily": "ABeeZee",
							"preview": "https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-normal.svg"
						},
						{
							"downloadFromUrl": "https://fonts.gstatic.com/s/abeezee/v22/esDT31xSG-6AGleN2tCklZUCGpG-GQ.ttf",
							"fontWeight": "400",
							"fontStyle": "italic",
							"fontFamily": "ABeeZee",
							"preview": "https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee-400-italic.svg"
						}
					],
					"preview": "https://s.w.org/images/fonts/16.7/previews/abeezee/abeezee.svg"
				},
				{
					"name": "ADLaM Display",
					"fontFamily": "ADLaM Display, system-ui",
					"slug": "adlam-display",
					"category": "display",
					"fontFace": [
						{
							"downloadFromUrl": "https://fonts.gstatic.com/s/adlamdisplay/v1/KFOhCnGXkPOLlhx6jD8_b1ZECsHYkYBPY3o.ttf",
							"fontWeight": "400",
							"fontStyle": "normal",
							"fontFamily": "ADLaM Display",
							"preview": "https://s.w.org/images/fonts/16.7/previews/adlam-display/adlam-display-400-normal.svg"
						}
					],
					"preview": "https://s.w.org/images/fonts/16.7/previews/adlam-display/adlam-display.svg"
				}
			]
		}';
	}


}
