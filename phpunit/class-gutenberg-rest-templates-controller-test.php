<?php
/**
 * Unit tests covering Gutenberg_REST_Templates_Controller_6_7 functionality.
 */
class Gutenberg_REST_Templates_Controller_6_7_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function test_get_item() {
		wp_set_current_user( self::$admin_id );

		$template_name = 'test-template';
		$args          = array(
			'plugin'      => 'test-plugin',
			'content'     => 'Template content',
			'title'       => 'Test Template',
			'description' => 'Description of test template',
			'post_types'  => array( 'post', 'page' ),
		);

		wp_register_template( $template_name, $args );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/test-plugin//test-template' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertNotWPError( $response );

		$data = $response->get_data();

		$this->assertEquals( 'default//test-template', $data['id'] );
		$this->assertEquals( 'default', $data['theme'] );
		$this->assertEquals( 'Template content', $data['content']['raw'] );
		$this->assertEquals( 'test-template', $data['slug'] );
		$this->assertEquals( 'plugin', $data['source'] );
		$this->assertEquals( 'plugin', $data['origin'] );
		$this->assertEquals( 'Description of test template', $data['description'] );
		$this->assertEquals( 'Test Template', $data['title']['rendered'] );
		$this->assertEquals( 'test-plugin', $data['plugin'] );

		wp_unregister_template( 'test-plugin//' . $template_name );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates/test-plugin//test-template' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertNotWPError( $response );
		$this->assertEquals( 404, $response->get_status() );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_register_routes() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {
		// Already present in core test class: Tests_REST_WpRestTemplatesController.
	}
}
