<?php

class Gutenberg_REST_Global_Styles_Revisions_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $second_admin_id;

	/**
	 * @var int
	 */
	protected static $author_id;

	/**
	 * @var int
	 */
	protected static $global_styles_id;

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
		self::$admin_id        = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$second_admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$author_id       = $factory->user->create(
			array(
				'role' => 'author',
			)
		);
		// This creates the global styles for the current theme.
		self::$global_styles_id = $factory->post->create(
			array(
				'post_content' => '{"version": ' . WP_Theme_JSON_Gutenberg::LATEST_SCHEMA . ', "isGlobalStylesUserThemeJSON": true }',
				'post_status'  => 'publish',
				'post_title'   => __( 'Custom Styles', 'default' ),
				'post_type'    => 'wp_global_styles',
				'post_name'    => 'wp-global-styles-emptytheme-revisions',
				'tax_input'    => array(
					'wp_theme' => 'emptytheme',
				),
			)
		);
	}

	/**
	 * Removes users after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$second_admin_id );
		self::delete_user( self::$author_id );
	}

	/**
	 * @covers Gutenberg_REST_Global_Styles_Revisions_Controller::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey(
			'/wp/v2/global-styles/(?P<parent>[\d]+)/revisions',
			$routes,
			'Global style revisions based on the given parentID route does not exist'
		);
	}

	/**
	 * @covers Gutenberg_REST_Global_Styles_Revisions_Controller::get_items
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );
		// Update post to create a new revision.
		$config          = array(
			'version'                     => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
			'isGlobalStylesUserThemeJSON' => true,
			'styles'                      => array(
				'color' => array(
					'background' => 'hotpink',
				),
			),
		);
		$new_styles_post = array(
			'ID'           => self::$global_styles_id,
			'post_content' => wp_json_encode( $config ),
		);

		wp_update_post( $new_styles_post, true, false );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/global-styles/' . self::$global_styles_id . '/revisions' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertCount( 1, $data, 'Check that only one revision exists' );
		$this->assertArrayHasKey( 'id', $data[0], 'Check that an id key exists' );
		$this->assertEquals( self::$global_styles_id, $data[0]['parent'], 'Check that an id for the parent exists' );

		// Dates.
		$this->assertArrayHasKey( 'date', $data[0], 'Check that an date key exists' );
		$this->assertArrayHasKey( 'date_gmt', $data[0], 'Check that an date_gmt key exists' );
		$this->assertArrayHasKey( 'modified', $data[0], 'Check that an modified key exists' );
		$this->assertArrayHasKey( 'modified_gmt', $data[0], 'Check that an modified_gmt key exists' );
		$this->assertArrayHasKey( 'modified_gmt', $data[0], 'Check that an modified_gmt key exists' );

		// Author information.
		$this->assertEquals( self::$admin_id, $data[0]['author'], 'Check that author id returns expected value' );

		// Global styles.
		$this->assertEquals(
			$data[0]['settings'],
			new stdClass(),
			'Check that the revision settings exist in the response.'
		);
		$this->assertEquals(
			$data[0]['styles'],
			array(
				'color' => array(
					'background' => 'hotpink',
				),
			),
			'Check that the revision styles match the last updated styles.'
		);

		// Checks that the revisions are returned for all eligible users.
		wp_set_current_user( self::$second_admin_id );
		$config['styles']['color']['background'] = 'blue';
		$new_styles_post                         = array(
			'ID'           => self::$global_styles_id,
			'post_content' => wp_json_encode( $config ),
		);

		wp_update_post( $new_styles_post, true, false );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/global-styles/' . self::$global_styles_id . '/revisions' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertCount( 2, $data, 'Check that two revisions exists' );
		$this->assertEquals( self::$second_admin_id, $data[0]['author'], 'Check that second author id returns expected value' );
		$this->assertEquals( self::$admin_id, $data[1]['author'], 'Check that second author id returns expected value' );
	}

	/**
	 * @covers Gutenberg_REST_Global_Styles_Revisions_Controller::get_item_schema
	 */
	public function test_get_item_schema() {
		$request    = new WP_REST_Request( 'OPTIONS', '/wp/v2/global-styles/' . self::$global_styles_id . '/revisions' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertCount( 9, $properties, 'Schema properties array does not have exactly 9 elements' );
		$this->assertArrayHasKey( 'id', $properties, 'Schema properties array does not have "id" key' );
		$this->assertArrayHasKey( 'styles', $properties, 'Schema properties array does not have "styles" key' );
		$this->assertArrayHasKey( 'settings', $properties, 'Schema properties array does not have "settings" key' );
		$this->assertArrayHasKey( 'parent', $properties, 'Schema properties array does not have "parent" key' );
		$this->assertArrayHasKey( 'author', $properties, 'Schema properties array does not have "author" key' );
		$this->assertArrayHasKey( 'date', $properties, 'Schema properties array does not have "date" key' );
		$this->assertArrayHasKey( 'date_gmt', $properties, 'Schema properties array does not have "date_gmt" key' );
		$this->assertArrayHasKey( 'modified', $properties, 'Schema properties array does not have "modified" key' );
		$this->assertArrayHasKey( 'modified_gmt', $properties, 'Schema properties array does not have "modified_gmt" key' );
	}

	/**
	 * @covers Gutenberg_REST_Global_Styles_Revisions_Controller::get_item_permissions_check
	 */
	public function test_get_item_permissions_check() {
		wp_set_current_user( self::$author_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/global-styles/' . self::$global_styles_id . '/revisions' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, 403 );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Controller does not use get_context_param().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {
		// Controller does not implement get_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Controller does not implement create_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Controller does not implement delete_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Controller does not implement prepare_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Controller does not implement update_item().
	}
}
