<?php
/**
 * REST API: WP_REST_Batch_Controller tests.
 *
 * @package Gutenberg
 */

/**
 * Tests for the batch controller.
 */
class REST_Batch_Controller_Test extends WP_Test_REST_TestCase {

	/**
	 * Administrator user ID.
	 *
	 * @since 9.2.0
	 *
	 * @var int
	 */
	protected static $administrator_id;

	/**
	 * Tag id.
	 *
	 * @since 9.2.0
	 *
	 * @var int
	 */
	protected $tag_id;

	/**
	 * Menu id.
	 *
	 * @since 9.2.0
	 *
	 * @var int
	 */
	protected $menu_id;

	/**
	 * Menu item id.
	 *
	 * @since 9.2.0
	 *
	 * @var int
	 */
	protected $menu_item_id;

	/**
	 * Create test data before the tests run.
	 *
	 * @since 9.2.0
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$administrator_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	/**
	 * Delete test data after our tests run.
	 *
	 * @since 9.2.0
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$administrator_id );
	}

	/**
	 * @since 9.2.0
	 */
	public function setUp() {
		parent::setUp();

		$this->tag_id       = self::factory()->tag->create();
		$this->menu_id      = wp_create_nav_menu( rand_str() );
		$this->menu_item_id = wp_update_nav_menu_item(
			$this->menu_id,
			0,
			array(
				'menu-item-type'      => 'taxonomy',
				'menu-item-object'    => 'post_tag',
				'menu-item-object-id' => $this->tag_id,
				'menu-item-status'    => 'publish',
			)
		);

		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$wp_rest_server = new Spy_REST_Server;
		do_action( 'rest_api_init', $wp_rest_server );
	}

	/**
	 * @since 9.2.0
	 */
	public function tearDown() {
		parent::tearDown();
		/** @var WP_REST_Server $wp_rest_server */
		global $wp_rest_server;
		$wp_rest_server = null;
	}

	/**
	 * @ticket 50244
	 */
	public function test_batch_requires_allow_batch_opt_in() {
		register_rest_route(
			'test-ns/v1',
			'/test',
			array(
				'methods'             => 'POST',
				'callback'            => static function () {
					return new WP_REST_Response( 'data' );
				},
				'permission_callback' => '__return_true',
			)
		);

		$request = new WP_REST_Request( 'POST', '/v1/batch' );
		$request->set_body_params(
			array(
				'requests' => array(
					array(
						'path' => '/test-ns/v1/test',
					),
				),
			)
		);

		$response = rest_do_request( $request );

		$this->assertEquals( 207, $response->get_status() );
		$this->assertEquals( 'rest_batch_not_allowed', $response->get_data()['responses'][0]['body']['code'] );
	}

	/**
	 * @ticket 50244
	 */
	public function test_batch_pre_validation() {
		wp_set_current_user( self::$administrator_id );

		$request = new WP_REST_Request( 'POST', '/v1/batch' );
		$request->set_body_params(
			array(
				'validation' => 'require-all-validate',
				'requests'   => array(
					array(
						'path' => '/__experimental/menu-items',
						'body' => array(
							'title'   => 'Hello World',
							'content' => 'From the moon.',
							'type'    => 'custom',
							'url'     => '#',
							'menus'   => $this->menu_id,
						),
					),
					array(
						'path' => '/__experimental/menu-items',
						'body' => array(
							'title'   => 'Hello Moon',
							'content' => 'From the world.',
							'status'  => 'garbage',
							'type'    => 'custom',
							'url'     => '#',
							'menus'   => $this->menu_id,
						),
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 207, $response->get_status() );
		$this->assertArrayHasKey( 'failed', $data );
		$this->assertEquals( 'validation', $data['failed'] );
		$this->assertCount( 2, $data['responses'] );
		$this->assertNull( $data['responses'][0] );
		$this->assertEquals( 400, $data['responses'][1]['status'] );
	}

	/**
	 * @ticket 50244
	 */
	public function test_batch_create() {
		wp_set_current_user( self::$administrator_id );

		$request = new WP_REST_Request( 'POST', '/v1/batch' );
		$request->set_body_params(
			array(
				'requests' => array(
					array(
						'path' => '/__experimental/menu-items',
						'body' => array(
							'title'   => 'Hello World',
							'content' => 'From the moon.',
							'type'    => 'custom',
							'url'     => '#',
							'menus'   => $this->menu_id,
						),
					),
					array(
						'path' => '/__experimental/menu-items',
						'body' => array(
							'title'   => 'Hello Moon',
							'status'  => 'draft',
							'content' => 'From the world.',
							'type'    => 'custom',
							'url'     => '#',
							'menus'   => $this->menu_id,
						),
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 207, $response->get_status() );
		$this->assertArrayHasKey( 'responses', $data );
		$this->assertCount( 2, $data['responses'] );
		$this->assertEquals( 'Hello World', $data['responses'][0]['body']['title']['rendered'] );
		$this->assertEquals( 'Hello Moon', $data['responses'][1]['body']['title']['rendered'] );
	}
}
