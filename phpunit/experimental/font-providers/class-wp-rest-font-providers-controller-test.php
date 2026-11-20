<?php
/**
 * Unit tests covering WP_REST_Font_Providers_Controller.
 *
 * @package gutenberg
 */
class WP_Test_REST_Font_Providers_Controller extends WP_Test_REST_TestCase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $editor_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
	}

	public function set_up() {
		parent::set_up();
		wp_register_font_provider(
			'example-emoji',
			array(
				'label'        => 'Example Emoji',
				'fontFamilies' => array(
					array(
						'name'       => 'Example Color Emoji',
						'slug'       => 'example-color-emoji',
						'fontFamily' => '"Example Color Emoji"',
						'fontFace'   => array(
							array(
								'fontFamily' => 'Example Color Emoji',
								'src'        => 'https://example.org/fonts/emoji.woff2',
							),
						),
					),
				),
			)
		);
	}

	public function tear_down() {
		wp_unregister_font_provider( 'example-emoji' );
		parent::tear_down();
	}

	public function test_routes_are_registered() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/font-providers', $routes );
		$this->assertArrayHasKey( '/wp/v2/font-providers/(?P<slug>[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?)', $routes );
	}

	public function test_get_items() {
		wp_set_current_user( self::$admin_id );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/wp/v2/font-providers' ) );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 1, $data );
		$this->assertSame( 'example-emoji', $data[0]['slug'] );
		$this->assertSame( 'Example Emoji', $data[0]['label'] );
		$this->assertSame( '', $data[0]['description'] );
		$this->assertSame( 'example-color-emoji', $data[0]['font_families'][0]['slug'] );
	}

	public function test_get_item() {
		wp_set_current_user( self::$admin_id );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/wp/v2/font-providers/example-emoji' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Example Emoji', $response->get_data()['label'] );
	}

	public function test_get_item_not_found() {
		wp_set_current_user( self::$admin_id );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/wp/v2/font-providers/missing' ) );

		$this->assertErrorResponse( 'rest_font_provider_not_found', $response, 404 );
	}

	public function test_get_items_requires_edit_theme_options() {
		wp_set_current_user( self::$editor_id );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/wp/v2/font-providers' ) );

		$this->assertErrorResponse( 'rest_cannot_read', $response, 403 );
	}

	public function test_get_items_requires_login() {
		wp_set_current_user( 0 );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/wp/v2/font-providers' ) );

		$this->assertErrorResponse( 'rest_cannot_read', $response, 401 );
	}
}
