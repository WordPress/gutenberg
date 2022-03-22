<?php

class WP_REST_Block_Patterns_Controller_Test extends WP_Test_REST_Controller_Testcase {
	protected static $admin_id;

	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

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
			'/__experimental/block-patterns/patterns',
			$routes,
			'The patterns route does not exist'
		);
	}

	public function test_get_items() {
		// Change this when the registered Core patterns change.
		$expected_names  = array(
			'core/query-standard-posts',
			'core/query-medium-posts',
			'core/query-small-posts',
			'core/query-grid-posts',
			'core/query-large-title-posts',
			'core/query-offset-posts',
			'core/social-links-shared-background-color',
		);
		$expected_fields = array( 'name', 'content' );

		wp_set_current_user( self::$admin_id );

		$request            = new WP_REST_Request( 'GET', '/__experimental/block-patterns/patterns' );
		$request['_fields'] = 'name,content';
		$response           = rest_get_server()->dispatch( $request );
		$data               = $response->get_data();

		$this->assertCount( count( $expected_names ), $data );
		foreach ( $data as $idx => $item ) {
			$this->assertEquals( $expected_names[ $idx ], $item['name'] );
			$this->assertEquals( $expected_fields, array_keys( $item ) );
		}
	}

	/**
	 * Abstract methods that we must implement.
	 */
	public function test_context_param() {}
	public function test_get_item() {}
	public function test_create_item() {}
	public function test_update_item() {}
	public function test_delete_item() {}
	public function test_prepare_item() {}
	public function test_get_item_schema() {}
}
