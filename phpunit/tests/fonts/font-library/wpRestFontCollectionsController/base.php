<?php
/**
 * Test WP_REST_Font_Family_Controller
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 */
class Tests_Fonts_Font_Collection_Controller extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();

		// Unregister default font collection so that we start with a clean slate.
		wp_unregister_font_collection( 'default-font-collection' );

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

	/**
	 * Tear down each test method.
	 */
	public function tear_down() {
		parent::tear_down();

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

	public function get_test_collection_data() {
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
