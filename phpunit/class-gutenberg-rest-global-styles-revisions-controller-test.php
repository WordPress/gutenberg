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
	protected static $second_admin_id;

	/**
	 * @var int
	 */
	protected static $author_id;

	/**
	 * @var int
	 */
	protected static $global_styles_id;

	/**
	 * @var int
	 */
	private $total_revisions;

	/**
	 * @var array
	 */
	private $revision_1;

	/**
	 * @var int
	 */
	private $revision_1_id;

	/**
	 * @var array
	 */
	private $revision_2;

	/**
	 * @var int
	 */
	private $revision_2_id;

	/**
	 * @var array
	 */
	private $revision_3;

	/**
	 * @var int
	 */
	private $revision_3_id;

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
		self::delete_user( self::$second_admin_id );
		self::delete_user( self::$author_id );
	}

	/**
	 * Sets up before tests.
	 */
	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
		$revisions             = wp_get_post_revisions( self::$global_styles_id );
		$this->total_revisions = count( $revisions );

		$this->revision_1    = array_pop( $revisions );
		$this->revision_1_id = $this->revision_1->ID;

		$this->revision_2    = array_pop( $revisions );
		$this->revision_2_id = $this->revision_2->ID;

		$this->revision_3    = array_pop( $revisions );
		$this->revision_3_id = $this->revision_3->ID;

		/*
		 * For some reason the `rest_api_init` doesn't run early enough to ensure an overwritten `get_item_schema()`
		 * is used. So we manually call it here.
		 * See: https://github.com/WordPress/gutenberg/pull/52370#issuecomment-1643331655.
		 */
		$global_styles_revisions_controller = new Gutenberg_REST_Global_Styles_Revisions_Controller_6_4();
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
			'/wp/v2/global-styles/(?P<parent>[\d]+)/revisions',
			$routes,
			'Global style revisions based on the given parentID route does not exist.'
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
	 * @ticket 58524
	 *
	 * @covers Gutenberg_REST_Global_Styles_Revisions_Controller_6_4::get_items
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/global-styles/' . self::$global_styles_id . '/revisions' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'Response status is 200.' );
		$this->assertCount( $this->total_revisions, $data, 'Check that correct number of revisions exists.' );

		// Reverse chronology.
		$this->assertSame( $this->revision_3_id, $data[0]['id'] );
		$this->check_get_revision_response( $data[0], $this->revision_3 );

		$this->assertSame( $this->revision_2_id, $data[1]['id'] );
		$this->check_get_revision_response( $data[1], $this->revision_2 );

		$this->assertSame( $this->revision_1_id, $data[2]['id'] );
		$this->check_get_revision_response( $data[2], $this->revision_1 );
	}

	/**
	 * @ticket 58524
	 *
	 * @covers Gutenberg_REST_Global_Styles_Revisions_Controller_6_4::get_item_schema
	 */
	public function test_get_item_schema() {
		$request    = new WP_REST_Request( 'OPTIONS', '/wp/v2/global-styles/' . self::$global_styles_id . '/revisions' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];

		$this->assertCount( 9, $properties, 'Schema properties array has exactly 9 elements.' );
		$this->assertArrayHasKey( 'id', $properties, 'Schema properties array has "id" key.' );
		$this->assertArrayHasKey( 'styles', $properties, 'Schema properties array has "styles" key.' );
		$this->assertArrayHasKey( 'settings', $properties, 'Schema properties array has "settings" key.' );
		$this->assertArrayHasKey( 'parent', $properties, 'Schema properties array has "parent" key.' );
		$this->assertArrayHasKey( 'author', $properties, 'Schema properties array has "author" key.' );
		$this->assertArrayHasKey( 'date', $properties, 'Schema properties array has "date" key.' );
		$this->assertArrayHasKey( 'date_gmt', $properties, 'Schema properties array has "date_gmt" key.' );
		$this->assertArrayHasKey( 'modified', $properties, 'Schema properties array has "modified" key.' );
		$this->assertArrayHasKey( 'modified_gmt', $properties, 'Schema properties array has "modified_gmt" key.' );
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
