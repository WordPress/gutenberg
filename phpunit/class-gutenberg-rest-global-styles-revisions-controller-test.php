<?php

class Gutenberg_REST_Global_Styles_Revisions_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 */
	protected static $admin_id;

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
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		// This creates the global styles for the current theme.
		self::$global_styles_id = wp_insert_post(
			array(
				'post_content' => '{"version": ' . WP_Theme_JSON_Gutenberg::LATEST_SCHEMA . ', "isGlobalStylesUserThemeJSON": true }',
				'post_status'  => 'publish',
				'post_title'   => __( 'Custom Styles', 'default' ),
				'post_type'    => 'wp_global_styles',
				'post_name'    => 'wp-global-styles-emptytheme',
				'tax_input'    => array(
					'wp_theme' => 'emptytheme',
				),
			),
			true
		);
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey(
			// '/wp/v2/global-styles/(?P<parent>[\d]+)/revisions',
			'/wp/v2/global-styles/(?P<parent>[\d]+)/revisions',
			$routes,
			'Global style revisions based on the given parentID route does not exist'
		);
	}

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

		$post_id  = wp_update_post( $new_styles_post, true, false );
		$post     = get_post( $post_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/global-styles/' . self::$global_styles_id . '/revisions' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertCount( 1, $data, 'Check that only one revision exists' );
		$this->assertArrayHasKey( 'id', $data[0], 'Check that an id key exists' );
		$this->assertEquals( self::$global_styles_id, $data[0]['parent'], 'Check that an id for the parent exists' );


		// Dates.
		$this->assertArrayHasKey( 'date', $data[0], 'Check that an date key exists' );
		$this->assertArrayHasKey( 'date_gmt', $data[0], 'Check that an date_gmt key exists' );
		$this->assertArrayHasKey( 'date_display', $data[0], 'Check that an date_display key exists' );
		$this->assertArrayHasKey( 'modified', $data[0], 'Check that an modified key exists' );
		$this->assertArrayHasKey( 'modified_gmt', $data[0], 'Check that an modified_gmt key exists' );
		$this->assertArrayHasKey( 'modified_gmt', $data[0], 'Check that an modified_gmt key exists' );

		// Author information.
		$this->assertEquals( $post->post_author, $data[0]['author'], 'Check that author id returns expected value' );
		$this->assertEquals( get_the_author_meta( 'display_name', $post->post_author ), $data[0]['author_display_name'], 'Check that author display_name returns expected value' );
		$this->assertIsString(
			$data[0]['author_avatar_url'],
			'Check that author avatar_url returns expected value type'
		);

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
	public function test_get_item_schema() {
		// Covered by the core.
	}
}
