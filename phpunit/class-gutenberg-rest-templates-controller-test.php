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
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/templates/lookup' );
		// Should fallback to `category.html`.
		$request->set_param( 'slug', 'category-fruits' );
		$request->set_param( 'is_custom', false );
		$request->set_param( 'template_prefix', 'category' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 'category', $response->get_data()['slug'], 'Should fallback to `category.html`.' );
		// Should fallback to `singular.html`.
		$request->set_param( 'slug', 'page-hello' );
		$request->set_param( 'is_custom', false );
		$request->set_param( 'template_prefix', 'page' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 'singular', $response->get_data()['slug'], 'Should fallback to `singular.html`.' );
		// Should fallback to `index.html`.
		$request->set_param( 'slug', 'tag-rigas' );
		$request->set_param( 'is_custom', false );
		$request->set_param( 'template_prefix', 'tag' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 'index', $response->get_data()['slug'], 'Should fallback to `index.html`.' );
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
