<?php

class Gutenberg_REST_Templates_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 * @group something
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
			'/wp/v2/templates/fallback_content',
			$routes,
			'Get template fallback content route does not exist'
		);
	}

	public function test_get_template_fallback_content() {
		$base_path = gutenberg_dir_path() . 'test/emptytheme/block-templates/';
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates/fallback_content' );
		// Should match `category.html`.
		$request->set_param( 'slug', 'category-fruits' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$expected = file_get_contents( $base_path . 'category.html' );
		$this->assertEquals( $expected, $data );
		// Should fallback to `index.html` .
		$request->set_param( 'slug', 'tag-status' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$expected = file_get_contents( $base_path . 'index.html' );
		$this->assertEquals( $expected, $data );
		// Should fallback to `singular.html` .
		$request->set_param( 'slug', 'page-hello' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
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
