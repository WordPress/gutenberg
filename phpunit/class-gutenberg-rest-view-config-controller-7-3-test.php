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
	 * An administrator, who can read every view configuration.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Creates the users shared by the tests.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that creates fake data.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Requests the view configuration of an entity as an administrator.
	 *
	 * @param string $kind The entity kind.
	 * @param string $name The entity name.
	 * @return array The response data, decoded as JSON.
	 */
	private function get_view_config( $kind, $name ) {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'kind', $kind );
		$request->set_param( 'name', $name );

		return json_decode( wp_json_encode( rest_get_server()->dispatch( $request )->get_data() ), true );
	}

	/**
	 * Returns the ids of the top-level fields of a form.
	 *
	 * @param array $form The form configuration.
	 * @return string[] The field ids.
	 */
	private function get_field_ids( $form ) {
		return array_map(
			static function ( $field ) {
				return is_string( $field ) ? $field : $field['id'];
			},
			$form['fields']
		);
	}

	/**
	 * The route is served by the 7.3 controller.
	 */
	public function test_route_is_served_by_the_7_3_controller() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE, $routes );
		$this->assertCount( 1, $routes[ self::ROUTE ], 'The route should be registered once.' );
		$this->assertInstanceOf( 'Gutenberg_REST_View_Config_Controller_7_3', $routes[ self::ROUTE ][0]['callback'][0] );
	}

	/**
	 * The item schema describes the quick edit form and the `config` of a
	 * form field.
	 *
	 * @covers ::get_item_schema
	 * @covers ::get_form_field_schema
	 */
	public function test_item_schema_describes_the_quick_edit_form() {
		$controller = new Gutenberg_REST_View_Config_Controller_7_3();
		$schema     = $controller->get_item_schema();

		$this->assertArrayHasKey( 'quick_edit_form', $schema['properties'] );

		$field_schema = $schema['properties']['quick_edit_form']['properties']['fields']['items']['oneOf'][1];
		$this->assertSame( 'object', $field_schema['properties']['config']['type'] );
	}

	/**
	 * A post type using the default form gets the default quick edit form,
	 * with the status as a compact control and no scheduled date.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_returns_the_default_quick_edit_form_for_pages() {
		$data = $this->get_view_config( 'postType', 'page' );

		$ids = $this->get_field_ids( $data['quick_edit_form'] );
		$this->assertContains( 'status', $ids );
		$this->assertNotContains( 'scheduled_date', $ids );
		$this->assertSame( 'password', $ids[ array_search( 'discussion', $ids, true ) + 1 ], 'The password should follow the discussion.' );

		$status = $data['quick_edit_form']['fields'][ array_search( 'status', $ids, true ) ];
		$this->assertSame( array( 'compact' => true ), $status['config'] );
		$this->assertSame( 'regular', $status['layout']['type'] );
	}

	/**
	 * A post type providing its own form has no quick edit form, so the
	 * drawer uses its form.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_returns_an_empty_quick_edit_form_for_post_types_with_their_own_form() {
		$data = $this->get_view_config( 'postType', 'wp_template' );

		$this->assertEmpty( $data['quick_edit_form'] );
	}

	/**
	 * A field a plugin adds to the form of a post type is added to the end of
	 * its quick edit form, keeping its layout, as the drawer used the form
	 * before it had its own.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_adds_the_fields_plugins_add_to_the_form_to_the_quick_edit_form() {
		$add_fields = static function ( $data ) {
			return $data->merge(
				array(
					'form' => array(
						'fields' => array(
							'subtitle',
							array(
								'id'     => 'rating',
								'layout' => array( 'type' => 'regular' ),
							),
						),
					),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $add_fields );

		$data = $this->get_view_config( 'postType', 'page' );

		remove_filter( 'get_entity_view_config_posttype_page', $add_fields );

		$fields = $data['quick_edit_form']['fields'];
		$this->assertSame( array( 'subtitle', 'rating' ), array_slice( $this->get_field_ids( $data['quick_edit_form'] ), -2 ) );
		$this->assertSame( array( 'type' => 'regular' ), end( $fields )['layout'], 'The field should keep its layout.' );
		$this->assertNotContains( 'scheduled_date', $this->get_field_ids( $data['quick_edit_form'] ), 'The fields of the default form should not be added.' );
	}

	/**
	 * A field a plugin adds to both forms keeps the place the quick edit form
	 * gives it, and is not added twice.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_does_not_add_a_field_the_quick_edit_form_lists() {
		$add_fields = static function ( $data ) {
			return $data->merge(
				array(
					'form'            => array( 'fields' => array( 'subtitle' ) ),
					'quick_edit_form' => array( 'fields' => array( 'subtitle', 'date' ) ),
				),
				1
			);
		};
		add_filter( 'get_entity_view_config_posttype_page', $add_fields );

		$data = $this->get_view_config( 'postType', 'page' );

		remove_filter( 'get_entity_view_config_posttype_page', $add_fields );

		$ids = $this->get_field_ids( $data['quick_edit_form'] );
		$this->assertCount( 1, array_keys( $ids, 'subtitle', true ) );
		$this->assertSame( 'subtitle', end( $ids ) );
	}
}
