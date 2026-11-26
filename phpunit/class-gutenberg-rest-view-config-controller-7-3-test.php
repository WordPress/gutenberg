<?php
/**
 * Unit tests covering Gutenberg_REST_View_Config_Controller_7_3 functionality.
 *
 * @package gutenberg
 *
 * @coversDefaultClass Gutenberg_REST_View_Config_Controller_7_3
 */
class Tests_REST_View_Config_Controller_7_3 extends WP_Test_REST_TestCase {

	/**
	 * The REST route the controller registers.
	 */
	const ROUTE = '/wp/v2/view-config';

	/**
	 * Editor user id (has `edit_posts`).
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Creates a shared user and the pages the view counts are made of.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );

		$factory->post->create_many(
			2,
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
			)
		);
		$factory->post->create(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
			)
		);
		$factory->post->create(
			array(
				'post_type'   => 'page',
				'post_status' => 'pending',
			)
		);
		$factory->post->create(
			array(
				'post_type'   => 'page',
				'post_status' => 'private',
			)
		);
		$factory->post->create(
			array(
				'post_type'   => 'page',
				'post_status' => 'trash',
			)
		);
		// A post, so that a count on the `post` view list would not be zero.
		$factory->post->create(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
			)
		);
	}

	/**
	 * Deletes the shared user.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
	}

	/**
	 * Returns a post type's view list from the view-config route, keyed by slug.
	 *
	 * @param string $post_type The post type whose view list to return.
	 * @return array The view list entries, keyed by slug.
	 */
	private function get_view_list( $post_type = 'page' ) {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'kind', 'postType' );
		$request->set_param( 'name', $post_type );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$data = json_decode( wp_json_encode( $response->get_data() ), true );
		return array_column( $data['view_list'], null, 'slug' );
	}

	/**
	 * The route is served by the 7.3 controller, not the 7.2 one.
	 */
	public function test_route_is_served_by_the_7_3_controller() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE, $routes );
		$this->assertCount( 1, $routes[ self::ROUTE ], 'The route should be registered once.' );
		$this->assertInstanceOf( 'Gutenberg_REST_View_Config_Controller_7_3', $routes[ self::ROUTE ][0]['callback'][0] );
	}

	/**
	 * The item schema describes the count of each view list entry.
	 *
	 * @covers ::get_item_schema
	 */
	public function test_item_schema_describes_view_list_count() {
		$controller = new Gutenberg_REST_View_Config_Controller_7_3();
		$schema     = $controller->get_item_schema();

		$count = $schema['properties']['view_list']['items']['properties']['count'];

		$this->assertSame( 'integer', $count['type'] );
		$this->assertTrue( $count['readonly'] );
	}

	/**
	 * Each status view of the `page` view list counts the pages in its status,
	 * and the "All" view counts every status but trash, private included.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_counts_page_status_views() {
		$view_list = $this->get_view_list();

		$this->assertSame( 5, $view_list['all']['count'] );
		$this->assertSame( 1, $view_list['published']['count'] );
		$this->assertSame( 0, $view_list['future']['count'] );
		$this->assertSame( 2, $view_list['drafts']['count'] );
		$this->assertSame( 1, $view_list['pending']['count'] );
		$this->assertSame( 1, $view_list['private']['count'] );
		$this->assertSame( 1, $view_list['trash']['count'] );
	}

	/**
	 * A view narrowed by more than its status gets no count, since a status
	 * total would not describe it.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_omits_count_of_view_narrowed_by_other_filters() {
		$narrow_drafts = static function ( $data ) {
			return $data->merge(
				array(
					'view_list' => array(
						array(
							'slug' => 'drafts',
							'view' => array(
								'filters' => array(
									array(
										'field'    => 'date',
										'operator' => 'after',
										'value'    => '2018-01-01T00:00:00',
									),
								),
							),
						),
					),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $narrow_drafts );
		$view_list = $this->get_view_list();
		remove_filter( 'get_entity_view_config_posttype_page', $narrow_drafts );

		$this->assertArrayNotHasKey( 'count', $view_list['drafts'] );
		$this->assertSame( 1, $view_list['published']['count'], 'Views the filter leaves alone keep their count.' );
	}

	/**
	 * A view a plugin adds gets a count when the status is all it filters by.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_counts_added_status_only_view() {
		$add_unpublished = static function ( $data ) {
			return $data->merge(
				array(
					'view_list' => array(
						array(
							'slug'  => 'unpublished',
							'title' => 'Unpublished',
							'view'  => array(
								'filters' => array(
									array(
										'field'    => 'status',
										'operator' => 'isAny',
										'value'    => array( 'draft', 'pending' ),
									),
								),
							),
						),
					),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $add_unpublished );
		$view_list = $this->get_view_list();
		remove_filter( 'get_entity_view_config_posttype_page', $add_unpublished );

		$this->assertSame( 3, $view_list['unpublished']['count'] );
	}

	/**
	 * A view without filters of its own inherits those of the default view, so
	 * a filter there leaves the "All" view without a count. The status views
	 * set their own filters, which replace the inherited ones, so they keep
	 * theirs.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_omits_count_of_view_inheriting_default_view_filters() {
		$filter_default_view = static function ( $data ) {
			return $data->merge(
				array(
					'default_view' => array(
						'filters' => array(
							array(
								'field'    => 'author',
								'operator' => 'isAny',
								'value'    => array( 1 ),
							),
						),
					),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $filter_default_view );
		$view_list = $this->get_view_list();
		remove_filter( 'get_entity_view_config_posttype_page', $filter_default_view );

		$this->assertArrayNotHasKey( 'count', $view_list['all'] );
		$this->assertSame( 2, $view_list['drafts']['count'] );
	}

	/**
	 * A view without filters of its own also inherits those of its layout's
	 * defaults, which take precedence over the default view's.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_omits_count_of_view_inheriting_layout_filters() {
		$filter_table_layout = static function ( $data ) {
			return $data->merge(
				array(
					'default_view'    => array( 'type' => 'table' ),
					'default_layouts' => array(
						'table' => array(
							'filters' => array(
								array(
									'field'    => 'author',
									'operator' => 'isAny',
									'value'    => array( 1 ),
								),
							),
						),
					),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $filter_table_layout );
		$view_list = $this->get_view_list();
		remove_filter( 'get_entity_view_config_posttype_page', $filter_table_layout );

		$this->assertArrayNotHasKey( 'count', $view_list['all'] );
		$this->assertSame( 2, $view_list['drafts']['count'] );
	}

	/**
	 * The user can switch a view to any layout on offer, which the server cannot
	 * see, so a filter in the defaults of a layout other than the default one
	 * also leaves the "All" view without a count.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_omits_count_when_another_layout_has_filters() {
		$filter_table_layout = static function ( $data ) {
			return $data->merge(
				array(
					'default_layouts' => array(
						'table' => array(
							'filters' => array(
								array(
									'field'    => 'author',
									'operator' => 'isAny',
									'value'    => array( 1 ),
								),
							),
						),
					),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $filter_table_layout );
		$view_list = $this->get_view_list();
		remove_filter( 'get_entity_view_config_posttype_page', $filter_table_layout );

		$this->assertArrayNotHasKey( 'count', $view_list['all'] );
		$this->assertSame( 2, $view_list['drafts']['count'], 'Views with filters of their own keep their count in every layout.' );
	}

	/**
	 * A search in the config does not narrow the views: the client drops it and
	 * takes the search from the URL instead.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_counts_views_despite_a_search_in_the_config() {
		$search_default_view = static function ( $data ) {
			return $data->merge(
				array(
					'default_view' => array( 'search' => 'hello' ),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $search_default_view );
		$view_list = $this->get_view_list();
		remove_filter( 'get_entity_view_config_posttype_page', $search_default_view );

		$this->assertSame( 5, $view_list['all']['count'] );
		$this->assertSame( 2, $view_list['drafts']['count'] );
	}

	/**
	 * A status listed twice in a view's filter is counted once, as the query
	 * lists it once.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_counts_a_repeated_status_once() {
		$add_repeated = static function ( $data ) {
			return $data->merge(
				array(
					'view_list' => array(
						array(
							'slug'  => 'repeated',
							'title' => 'Repeated',
							'view'  => array(
								'filters' => array(
									array(
										'field'    => 'status',
										'operator' => 'isAny',
										'value'    => array( 'draft', 'draft', 'pending' ),
									),
								),
							),
						),
					),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $add_repeated );
		$view_list = $this->get_view_list();
		remove_filter( 'get_entity_view_config_posttype_page', $add_repeated );

		$this->assertSame( 3, $view_list['repeated']['count'] );
	}

	/**
	 * A view whose status filter lists several statuses in one comma-separated
	 * value, as the REST API accepts, counts each of them.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_counts_comma_separated_statuses() {
		$add_comma_separated = static function ( $data ) {
			return $data->merge(
				array(
					'view_list' => array(
						array(
							'slug'  => 'comma-separated',
							'title' => 'Comma-separated',
							'view'  => array(
								'filters' => array(
									array(
										'field'    => 'status',
										'operator' => 'is',
										'value'    => 'draft, pending',
									),
								),
							),
						),
					),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $add_comma_separated );
		$view_list = $this->get_view_list();
		remove_filter( 'get_entity_view_config_posttype_page', $add_comma_separated );

		$this->assertSame( 3, $view_list['comma-separated']['count'] );
	}

	/**
	 * A view whose status filter lists several statuses in one space-separated
	 * value, as the REST API also accepts, counts each of them.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_counts_space_separated_statuses() {
		$add_space_separated = static function ( $data ) {
			return $data->merge(
				array(
					'view_list' => array(
						array(
							'slug'  => 'space-separated',
							'title' => 'Space-separated',
							'view'  => array(
								'filters' => array(
									array(
										'field'    => 'status',
										'operator' => 'is',
										'value'    => 'draft pending',
									),
								),
							),
						),
					),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $add_space_separated );
		$view_list = $this->get_view_list();
		remove_filter( 'get_entity_view_config_posttype_page', $add_space_separated );

		$this->assertSame( 3, $view_list['space-separated']['count'] );
	}

	/**
	 * A view filtered on the `any` status counts every status the REST API
	 * queries for it, which includes private and leaves out trash.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_counts_any_status() {
		$add_any = static function ( $data ) {
			return $data->merge(
				array(
					'view_list' => array(
						array(
							'slug'  => 'any',
							'title' => 'Any',
							'view'  => array(
								'filters' => array(
									array(
										'field'    => 'status',
										'operator' => 'is',
										'value'    => 'any',
									),
								),
							),
						),
					),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $add_any );
		$view_list = $this->get_view_list();
		remove_filter( 'get_entity_view_config_posttype_page', $add_any );

		$this->assertSame( 5, $view_list['any']['count'] );
	}

	/**
	 * Only the `page` view list gets counts: the view list of another post type,
	 * such as `post`, has none, even on its unfiltered "All" view.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_omits_counts_for_other_post_types() {
		$view_list = $this->get_view_list( 'post' );

		$this->assertArrayHasKey( 'all', $view_list );
		foreach ( $view_list as $slug => $entry ) {
			$this->assertArrayNotHasKey( 'count', $entry, "The `$slug` view should have no count." );
		}
	}

	/**
	 * The counts are not computed when the request leaves out the view list.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_skips_counts_when_view_list_is_not_requested() {
		wp_set_current_user( self::$editor_id );

		$count_calls = 0;
		$count_posts = static function ( $counts ) use ( &$count_calls ) {
			++$count_calls;
			return $counts;
		};
		add_filter( 'wp_count_posts', $count_posts );

		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'kind', 'postType' );
		$request->set_param( 'name', 'page' );
		$request->set_param( '_fields', 'form' );
		$response = rest_get_server()->dispatch( $request );

		remove_filter( 'wp_count_posts', $count_posts );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 0, $count_calls );
	}
}
