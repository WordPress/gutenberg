<?php
/**
 * Unit tests covering Gutenberg_REST_Global_Styles_Revisions_Controller_6_4 functionality.
 *
 * Note: the bulk of the tests covering this class and its methods have been ported to Core as of 6.3.
 *
 * @package WordPress
 * @subpackage REST API
 */

class Gutenberg_REST_Global_Styles_Revisions_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $global_styles_id;

	/**
	 * @var array
	 */
	private $revision_1;

	/**
	 * @var int
	 */
	private $revision_1_id;

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

		wp_set_current_user( self::$admin_id );
		// This creates the global styles for the current theme.
		self::$global_styles_id = $factory->post->create(
			array(
				'post_content' => '{"version": ' . WP_Theme_JSON::LATEST_SCHEMA . ', "isGlobalStylesUserThemeJSON": true }',
				'post_status'  => 'publish',
				'post_title'   => __( 'Custom Styles', 'default' ),
				'post_type'    => 'wp_global_styles',
				'post_name'    => 'wp-global-styles-tt1-blocks-revisions',
				'tax_input'    => array(
					'wp_theme' => 'tt1-blocks',
				),
			)
		);

		// Update post to create a new revisions.
		$new_styles_post = array(
			'ID'           => self::$global_styles_id,
			'post_content' => wp_json_encode(
				array(
					'version'                     => WP_Theme_JSON::LATEST_SCHEMA,
					'isGlobalStylesUserThemeJSON' => true,
					'styles'                      => array(
						'color' => array(
							'background' => 'hotpink',
						),
					),
					'settings'                    => array(
						'color' => array(
							'palette' => array(
								'custom' => array(
									array(
										'name'  => 'Ghost',
										'slug'  => 'ghost',
										'color' => 'ghost',
									),
								),
							),
						),
					),
				)
			),
		);

		wp_update_post( $new_styles_post, true, true );

		$new_styles_post = array(
			'ID'           => self::$global_styles_id,
			'post_content' => wp_json_encode(
				array(
					'version'                     => WP_Theme_JSON::LATEST_SCHEMA,
					'isGlobalStylesUserThemeJSON' => true,
					'styles'                      => array(
						'color' => array(
							'background' => 'lemonchiffon',
						),
					),
					'settings'                    => array(
						'color' => array(
							'palette' => array(
								'custom' => array(
									array(
										'name'  => 'Gwanda',
										'slug'  => 'gwanda',
										'color' => 'gwanda',
									),
								),
							),
						),
					),
				)
			),
		);

		wp_update_post( $new_styles_post, true, true );

		$new_styles_post = array(
			'ID'           => self::$global_styles_id,
			'post_content' => wp_json_encode(
				array(
					'version'                     => WP_Theme_JSON::LATEST_SCHEMA,
					'isGlobalStylesUserThemeJSON' => true,
					'styles'                      => array(
						'color' => array(
							'background' => 'chocolate',
						),
					),
					'settings'                    => array(
						'color' => array(
							'palette' => array(
								'custom' => array(
									array(
										'name'  => 'Stacy',
										'slug'  => 'stacy',
										'color' => 'stacy',
									),
								),
							),
						),
					),
				)
			),
		);

		wp_update_post( $new_styles_post, true, true );
		wp_set_current_user( 0 );
	}

	/**
	 * Removes users after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	/**
	 * Sets up before tests.
	 */
	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
		$revisions           = wp_get_post_revisions( self::$global_styles_id );
		$this->revision_1    = array_pop( $revisions );
		$this->revision_1_id = $this->revision_1->ID;

		/*
		 * For some reason the `rest_api_init` doesn't run early enough to ensure an overwritten `get_item_schema()`
		 * is used. So we manually call it here.
		 * See: https://github.com/WordPress/gutenberg/pull/52370#issuecomment-1643331655.
		 */
		$global_styles_revisions_controller = new Gutenberg_REST_Global_Styles_Revisions_Controller_6_5();
		$global_styles_revisions_controller->register_routes();
	}

	/**
	 * @ticket 58524
	 *
	 * @covers WP_REST_Global_Styles_Controller::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey(
			'/wp/v2/global-styles/(?P<parent>[\d]+)/revisions/(?P<id>[\d]+)',
			$routes,
			'Single global style revisions based on the given parentID and revision ID route does not exist.'
		);
	}

	/**
	 * Utility function to check the items in WP_REST_Global_Styles_Controller::get_items
	 * against the expected values.
	 *
	 * @ticket 58524
	 */
	protected function check_get_revision_response( $response_revision_item, $revision_expected_item ) {
		$this->assertSame( (int) $revision_expected_item->post_author, $response_revision_item['author'], 'Check that the revision item `author` exists.' );
		$this->assertSame( mysql_to_rfc3339( $revision_expected_item->post_date ), $response_revision_item['date'], 'Check that the revision item `date` exists.' );
		$this->assertSame( mysql_to_rfc3339( $revision_expected_item->post_date_gmt ), $response_revision_item['date_gmt'], 'Check that the revision item `date_gmt` exists.' );
		$this->assertSame( mysql_to_rfc3339( $revision_expected_item->post_modified ), $response_revision_item['modified'], 'Check that the revision item `modified` exists.' );
		$this->assertSame( mysql_to_rfc3339( $revision_expected_item->post_modified_gmt ), $response_revision_item['modified_gmt'], 'Check that the revision item `modified_gmt` exists.' );
		$this->assertSame( $revision_expected_item->post_parent, $response_revision_item['parent'], 'Check that an id for the parent exists.' );

		// Global styles.
		$config = ( new WP_Theme_JSON_Gutenberg( json_decode( $revision_expected_item->post_content, true ), 'custom' ) )->get_raw_data();
		$this->assertEquals(
			$config['settings'],
			$response_revision_item['settings'],
			'Check that the revision settings exist in the response.'
		);
		$this->assertEquals(
			$config['styles'],
			$response_revision_item['styles'],
			'Check that the revision styles match the updated styles.'
		);
	}

	/**
	 * @ticket 59810
	 *
	 * @covers Gutenberg_REST_Global_Styles_Revisions_Controller_6_4::get_item
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/global-styles/' . self::$global_styles_id . '/revisions/' . $this->revision_1_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'Response status is 200.' );
		$this->check_get_revision_response( $data, $this->revision_1 );
	}

	/**
	 * @ticket 59810
	 *
	 * @covers Gutenberg_REST_Global_Styles_Revisions_Controller_6_4::get_revision
	 */
	public function test_get_item_invalid_revision_id_should_error() {
		wp_set_current_user( self::$admin_id );

		$expected_error  = 'rest_post_invalid_id';
		$expected_status = 404;
		$request         = new WP_REST_Request( 'GET', '/wp/v2/global-styles/' . self::$global_styles_id . '/revisions/20000001' );
		$response        = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( $expected_error, $response, $expected_status );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {
		// Unit tests have been more to WordPress Core for test_get_items().
		// No unique compat unit tests exist.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {
		// Unit tests have been more to WordPress Core for test_get_item_schema().
		// No unique compat unit tests exist.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Controller does not implement test_context_param().
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
