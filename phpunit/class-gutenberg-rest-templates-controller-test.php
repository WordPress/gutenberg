<?php

class Gutenberg_REST_Templates_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 */
	protected static $admin_id;

	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey(
			'/wp/v2/templates/lookup',
			$routes,
			'Get template fallback content route does not exist'
		);
	}

	public function test_get_template_fallback() {
		$base_path = gutenberg_dir_path() . 'test/emptytheme/block-templates/';
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates/lookup' );
		// Should match `category.html`.
		$request->set_param( 'slug', 'category-fruits' );
		$request->set_param( 'hierarchy', array( 'category-fruits', 'category', 'archive', 'index' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data()->content;
		$expected = file_get_contents( $base_path . 'category.html' );
		$this->assertEquals( $expected, $data );
		// Should fallback to `index.html` .
		$request->set_param( 'slug', 'tag-status' );
		$request->set_param( 'hierarchy', array( 'tag-status', 'tag', 'archive', 'index' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data()->content;
		$expected = file_get_contents( $base_path . 'index.html' );
		$this->assertEquals( $expected, $data );
		// Should fallback to `singular.html` .
		$request->set_param( 'slug', 'page-hello' );
		$request->set_param( 'hierarchy', array( 'page-hello', 'page', 'singular', 'index' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data()->content;
		$expected = file_get_contents( $base_path . 'singular.html' );
		$this->assertEquals( $expected, $data );
	}

	public function test_context_param() {
		$this->markTestIncomplete();
	}

	public function test_get_items() {
		$this->markTestIncomplete();
	}

	public function test_get_item() {
		$this->markTestIncomplete();
	}

	public function test_create_item() {
		$this->markTestIncomplete();
	}

	public function test_update_item() {
		$this->markTestIncomplete();
	}

	public function test_delete_item() {
		$this->markTestIncomplete();
	}

	public function test_prepare_item() {
		$this->markTestIncomplete();
	}

	public function test_get_item_schema() {
		$this->markTestIncomplete();
	}
}
