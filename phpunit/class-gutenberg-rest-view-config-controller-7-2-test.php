<?php
/**
 * Unit tests covering Gutenberg_REST_View_Config_Controller_7_2 functionality.
 *
 * @package gutenberg
 *
 * @coversDefaultClass Gutenberg_REST_View_Config_Controller_7_2
 */
class Tests_REST_View_Config_Controller_7_2 extends WP_Test_REST_TestCase {

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
				'post_status' => 'trash',
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
	 * Returns the `page` view list from the view-config route, keyed by slug.
	 *
	 * @return array The view list entries, keyed by slug.
	 */
	private function get_page_view_list() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'kind', 'postType' );
		$request->set_param( 'name', 'page' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$data = json_decode( wp_json_encode( $response->get_data() ), true );
		return array_column( $data['view_list'], null, 'slug' );
	}

	/**
	 * The route is served by the 7.2 controller, not the 7.1 one.
	 */
	public function test_route_is_served_by_the_7_2_controller() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE, $routes );
		$this->assertCount( 1, $routes[ self::ROUTE ], 'The route should be registered once.' );
		$this->assertInstanceOf( 'Gutenberg_REST_View_Config_Controller_7_2', $routes[ self::ROUTE ][0]['callback'][0] );
	}

	/**
	 * The table layout schema describes the column styles.
	 *
	 * @covers ::get_item_schema
	 * @covers ::get_table_layout_schema
	 * @covers ::get_column_style_schema
	 */
	public function test_item_schema_describes_table_column_styles() {
		$controller = new Gutenberg_REST_View_Config_Controller_7_2();
		$schema     = $controller->get_item_schema();

		$styles = $schema['properties']['default_layouts']['properties']['table']['properties']['layout']['properties']['styles'];

		$this->assertArrayHasKey( 'description', $styles );
		foreach ( array( 'width', 'maxWidth', 'minWidth', 'align' ) as $property ) {
			$this->assertArrayHasKey( 'description', $styles['additionalProperties']['properties'][ $property ], "The `$property` column style should be described." );
		}
	}

	/**
	 * Each status view of the `page` view list counts the pages in its status,
	 * and the "All" view counts every status but trash.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_counts_page_status_views() {
		$view_list = $this->get_page_view_list();

		$this->assertSame( 4, $view_list['all']['count'] );
		$this->assertSame( 1, $view_list['published']['count'] );
		$this->assertSame( 0, $view_list['future']['count'] );
		$this->assertSame( 2, $view_list['drafts']['count'] );
		$this->assertSame( 1, $view_list['pending']['count'] );
		$this->assertSame( 0, $view_list['private']['count'] );
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
		$view_list = $this->get_page_view_list();
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
		$view_list = $this->get_page_view_list();
		remove_filter( 'get_entity_view_config_posttype_page', $add_unpublished );

		$this->assertSame( 3, $view_list['unpublished']['count'] );
	}
}
