<?php
/**
 * Unit tests for the field collections API and REST controller.
 *
 * @package gutenberg
 *
 * @group rest-api
 */
class Gutenberg_REST_Field_Collections_Controller_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	public function set_up() {
		parent::set_up();

		// Reset the global collections for each test.
		global $gutenberg_field_collections;
		$gutenberg_field_collections = array();

		// Reset the script modules registry for each test.
		unset( $GLOBALS['wp_script_modules'] );
	}

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp/v2/field-collections', $routes );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Context param testing is not applicable; the endpoint uses custom kind/name params.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {
		// Single-item retrieval is not supported.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Creation via REST is not supported.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Update via REST is not supported.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Deletion via REST is not supported.
	}

	public function test_get_items() {
		gutenberg_register_field_collection(
			'test/basic',
			'postType',
			'test_entity',
			array(
				array(
					'id'   => 'title',
					'type' => 'text',
				),
			)
		);

		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/field-collections' );
		$request->set_param( 'kind', 'postType' );
		$request->set_param( 'name', 'test_entity' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertCount( 1, $data );
		$this->assertSame( 'test/basic', $data[0]['id'] );
		$this->assertArrayHasKey( 'fields_modules', $data[0] );
		$this->assertSame( array(), $data[0]['fields_modules'] );
	}

	public function test_prepare_item() {
		gutenberg_register_field_collection(
			'test/with-module',
			'postType',
			'test_entity',
			array(
				array(
					'id'   => 'status',
					'type' => 'text',
				),
			),
			'my-plugin-page-fields'
		);

		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/field-collections' );
		$request->set_param( 'kind', 'postType' );
		$request->set_param( 'name', 'test_entity' );

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( array( 'my-plugin-page-fields' ), $data[0]['fields_modules'] );
	}

	public function test_get_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/field-collections' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$schema     = $data['schema'];
		$properties = $schema['properties'];

		$this->assertArrayHasKey( 'fields_modules', $properties );
		$this->assertSame( 'array', $properties['fields_modules']['type'] );
		$this->assertSame( array( 'view' ), $properties['fields_modules']['context'] );
		$this->assertTrue( $properties['fields_modules']['readonly'] );
	}

	public function test_register_field_collection_with_fields_module() {
		gutenberg_register_field_collection(
			'test/module-collection',
			'postType',
			'post',
			array(
				array(
					'id'   => 'featured',
					'type' => 'boolean',
				),
			),
			'my-plugin-post-fields'
		);

		$collections = gutenberg_get_field_collections( 'postType', 'post' );

		$this->assertCount( 1, $collections );
		$this->assertSame( array( 'my-plugin-post-fields' ), $collections[0]['fields_modules'] );
	}

	public function test_register_field_collection_without_fields_module() {
		gutenberg_register_field_collection(
			'test/no-module',
			'postType',
			'post',
			array(
				array(
					'id'   => 'rating',
					'type' => 'integer',
				),
			)
		);

		$collections = gutenberg_get_field_collections( 'postType', 'post' );

		$this->assertCount( 1, $collections );
		$this->assertSame( array(), $collections[0]['fields_modules'] );
	}

	public function test_field_collection_fields_filter_can_modify_fields() {
		$callback = function ( $fields, $id, $kind, $name ) {
			if ( 'postType' !== $kind || 'post' !== $name ) {
				return $fields;
			}

			// Remove an existing field, relabel another, and add a new one.
			$fields = array_values(
				array_filter(
					$fields,
					static function ( $field ) {
						return 'drop_me' !== $field['id'];
					}
				)
			);

			foreach ( $fields as &$field ) {
				if ( 'title' === $field['id'] ) {
					$field['label'] = 'Renamed';
				}
			}
			unset( $field );

			$fields[] = array(
				'id'   => 'added',
				'type' => 'text',
			);

			return $fields;
		};

		add_filter( 'gutenberg_field_collection_fields', $callback, 10, 4 );

		gutenberg_register_field_collection(
			'test/filtered',
			'postType',
			'post',
			array(
				array(
					'id'    => 'title',
					'type'  => 'text',
					'label' => 'Title',
				),
				array(
					'id'   => 'drop_me',
					'type' => 'text',
				),
			)
		);

		remove_filter( 'gutenberg_field_collection_fields', $callback, 10 );

		$collections = gutenberg_get_field_collections( 'postType', 'post' );
		$ids         = array_column( $collections[0]['fields'], 'id' );

		$this->assertSame( array( 'title', 'added' ), $ids );
		$this->assertSame( 'Renamed', $collections[0]['fields'][0]['label'] );
	}

	public function test_field_collection_modules_filter_appends_modules() {
		$callback = function ( $modules, $id, $kind, $name ) {
			if ( 'postType' === $kind && 'post' === $name ) {
				$modules[] = 'my-plugin-extra-module';
			}

			return $modules;
		};

		add_filter( 'gutenberg_field_collection_modules', $callback, 10, 4 );

		gutenberg_register_field_collection(
			'test/with-extra-module',
			'postType',
			'post',
			array(
				array(
					'id'   => 'title',
					'type' => 'text',
				),
			),
			'my-plugin-own-module'
		);

		remove_filter( 'gutenberg_field_collection_modules', $callback, 10 );

		$collections = gutenberg_get_field_collections( 'postType', 'post' );

		$this->assertSame(
			array( 'my-plugin-own-module', 'my-plugin-extra-module' ),
			$collections[0]['fields_modules']
		);
	}

	public function test_enqueue_field_collections_loader_adds_modules_to_import_map() {
		gutenberg_register_field_collection(
			'test/with-module',
			'postType',
			'test_entity',
			array(
				array(
					'id'   => 'status',
					'type' => 'text',
				),
			),
			'test-page-fields-module'
		);

		wp_register_script_module( '@wordpress/field-collections/loader', 'https://example.com/loader.js' );
		wp_register_script_module( 'test-page-fields-module', 'https://example.com/page-fields.js' );

		gutenberg_enqueue_field_collections_loader();

		$this->assertContains( '@wordpress/field-collections/loader', wp_script_modules()->get_queue() );

		$import_map = get_echo( array( wp_script_modules(), 'print_import_map' ) );

		$this->assertStringContainsString( 'test-page-fields-module', $import_map );
		$this->assertStringContainsString( 'page-fields.js', $import_map );
	}

	public function test_enqueue_field_collections_loader_without_modules_is_a_noop() {
		gutenberg_register_field_collection(
			'test/basic',
			'postType',
			'test_entity',
			array(
				array(
					'id'   => 'title',
					'type' => 'text',
				),
			)
		);

		wp_register_script_module( '@wordpress/field-collections/loader', 'https://example.com/loader.js' );

		gutenberg_enqueue_field_collections_loader();

		$this->assertNotContains( '@wordpress/field-collections/loader', wp_script_modules()->get_queue() );
	}

	public function test_get_items_permissions_check() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'GET', '/wp/v2/field-collections' );
		$request->set_param( 'kind', 'postType' );
		$request->set_param( 'name', 'test_entity' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}
}
