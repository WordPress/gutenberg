<?php
/**
 * Tests for the entity view configuration API.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_get_entity_view_config
 */
class Tests_View_Config_API extends WP_UnitTestCase {

	/**
	 * The documented top-level keys of a view configuration.
	 *
	 * @var string[]
	 */
	const CONFIG_KEYS = array( 'default_view', 'default_layouts', 'view_list', 'form' );

	/**
	 * The default view configuration shared by all entities.
	 *
	 * @var array
	 */
	const DEFAULT_VIEW = array(
		'type'       => 'table',
		'filters'    => array(),
		'sort'       => array(
			'field'     => 'title',
			'direction' => 'asc',
		),
		'perPage'    => 20,
		'fields'     => array( 'author', 'status' ),
		'titleField' => 'title',
	);

	/**
	 * The default layouts shared by all entities.
	 *
	 * @var array
	 */
	const DEFAULT_LAYOUTS = array(
		'table' => array(),
		'grid'  => array(),
		'list'  => array(),
	);

	/**
	 * The default view list for an entity with no specific provider.
	 *
	 * @var array
	 */
	const DEFAULT_VIEW_LIST = array(
		array(
			'title' => 'All items',
			'slug'  => 'all',
		),
	);

	/**
	 * The default form configuration shared by all entities.
	 *
	 * @var array
	 */
	const DEFAULT_FORM = array();

	/**
	 * Tears down each test.
	 */
	public function tear_down() {
		remove_all_filters( 'get_entity_view_config_posttype_unregistered_cpt' );
		remove_all_filters( 'get_entity_view_config_custom_kind_custom_name' );
		parent::tear_down();
	}

	/**
	 * The default configuration exposes the documented shape for an unknown entity.
	 */
	public function test_default_config_for_unknown_entity() {
		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertIsArray( $config );
		$this->assertSameSets( self::CONFIG_KEYS, array_keys( $config ) );
		$this->assertSame( self::DEFAULT_VIEW, $config['default_view'] );
		$this->assertSame( self::DEFAULT_LAYOUTS, $config['default_layouts'] );
		$this->assertSame( self::DEFAULT_VIEW_LIST, $config['view_list'] );
		$this->assertSame( self::DEFAULT_FORM, $config['form'] );
	}

	/**
	 * The base "all items" view falls back to a generic title for an unknown post type.
	 */
	public function test_view_list_falls_back_to_generic_all_items_title() {
		$config = gutenberg_get_entity_view_config( 'postType', 'does_not_exist' );

		$this->assertCount( 1, $config['view_list'] );
		$this->assertSame( 'all', $config['view_list'][0]['slug'] );
		$this->assertSame( 'All items', $config['view_list'][0]['title'] );
	}

	/**
	 * For a registered post type, the "all items" view uses the post type's label.
	 */
	public function test_view_list_uses_post_type_all_items_label() {
		register_post_type(
			'view_config_cpt',
			array(
				'labels' => array(
					'all_items' => 'All Custom Things',
				),
			)
		);

		$config = gutenberg_get_entity_view_config( 'postType', 'view_config_cpt' );

		$this->assertSame( 'All Custom Things', $config['view_list'][0]['title'] );

		unregister_post_type( 'view_config_cpt' );
	}

	/**
	 * The dynamic filter receives the data container and the entity descriptor.
	 */
	public function test_filter_receives_data_and_entity() {
		$received_entity = null;
		$received_data   = null;
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $data, $entity ) use ( &$received_entity, &$received_data ) {
				$received_entity = $entity;
				$received_data   = $data;
				return $data;
			},
			10,
			2
		);

		gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertInstanceOf( 'Gutenberg_View_Config_Data', $received_data );
		$this->assertSame(
			array(
				'kind' => 'custom_kind',
				'name' => 'custom_name',
			),
			$received_entity
		);
	}

	/**
	 * The dynamic filter name lowercases the entity kind and name.
	 */
	public function test_filter_hook_name_is_lowercased() {
		$called = false;
		add_filter(
			'get_entity_view_config_posttype_unregistered_cpt',
			function ( $data ) use ( &$called ) {
				$called = true;
				return $data;
			}
		);

		gutenberg_get_entity_view_config( 'postType', 'Unregistered_CPT' );

		$this->assertTrue( $called );
		$this->assertSame(
			'get_entity_view_config_posttype_unregistered_cpt',
			gutenberg_get_entity_view_config_hook_name( 'postType', 'Unregistered_CPT' )
		);
	}

	/**
	 * A filter can override configuration values through merge().
	 */
	public function test_filter_data_is_merged() {
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $data ) {
				return $data->merge(
					array( 'default_view' => array( 'type' => 'grid' ) ),
					1
				);
			}
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertSame( 'grid', $config['default_view']['type'] );
	}

	/**
	 * Successive filters share the same Gutenberg_View_Config_Data instance, so
	 * their effects compose: a later filter can add a form field to a group that
	 * an earlier one defined.
	 */
	public function test_filter_data_chain() {
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $data ) {
				return $data->replace(
					array(
						'form' => array(
							'fields' => array(
								array(
									'id'       => 'discussion',
									'children' => array( 'comment_status' ),
								),
							),
						),
					),
					1
				);
			},
			9
		);
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $data ) {
				return $data->merge(
					array(
						'form' => array(
							'fields' => array(
								array(
									'id'       => 'discussion',
									'children' => array( 'ping_status' ),
								),
							),
						),
					),
					1
				);
			},
			11
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertSame(
			array( 'comment_status', 'ping_status' ),
			$config['form']['fields'][0]['children']
		);
	}

	/**
	 * A filter that returns its own off-shape container has the result normalized:
	 * undocumented keys are dropped and dropped documented keys are backfilled
	 * from the defaults.
	 */
	public function test_filter_data_normalized() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::set' );

		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $data ) {
				return $data->set(
					array(
						'default_view'   => array( 'type' => 'grid' ),
						'not_a_real_key' => 'nope',
					),
					1
				);
			},
			10,
			2
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		// Undocumented key dropped; shape is exactly the documented keys.
		$this->assertSameSets( self::CONFIG_KEYS, array_keys( $config ) );
		// The container's own value is respected.
		$this->assertSame( array( 'type' => 'grid' ), $config['default_view'] );
		// Documented keys the container omitted are backfilled from the defaults.
		$this->assertSame( self::DEFAULT_LAYOUTS, $config['default_layouts'] );
		$this->assertSame( self::DEFAULT_VIEW_LIST, $config['view_list'] );
		$this->assertSame( self::DEFAULT_FORM, $config['form'] );
	}

	/**
	 * A documented key dropped through a null patch value is backfilled from
	 * the defaults, so a null never reaches the response.
	 */
	public function test_filter_data_backfilled_if_null() {
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $data ) {
				return $data->merge( array( 'default_view' => null ), 1 );
			}
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertSame( self::DEFAULT_VIEW, $config['default_view'] );
	}

	public function test_filter_default_view_merge_fields() {
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $data ) {
				return $data->merge(
					array(
						'default_view' => array(
							'fields' => array( 'title', 'author' ),
						),
					),
					1
				);
			}
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertSame(
			array( 'author', 'status', 'title' ),
			$config['default_view']['fields']
		);
	}

	public function test_filter_default_view_replace_fields() {
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $data ) {
				return $data->replace(
					array(
						'default_view' => array(
							'fields' => array( 'title' ),
						),
					),
					1
				);
			}
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertSame(
			array( 'title' ),
			$config['default_view']['fields']
		);
	}

	public function test_filter_default_view_remove_fields() {
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $data ) {
				$data->merge(
					array(
						'default_view' => array(
							'fields' => null,
						),
					),
					1
				);
				$data->merge(
					array(
						'default_view' => array(
							'fields' => array( 'author' ),
						),
					),
					1
				);
				return $data;
			}
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertSame(
			array( 'author' ),
			$config['default_view']['fields']
		);
	}

	public function test_filter_view_list_add_view() {
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $data ) {
				return $data->merge(
					array(
						'view_list' => array(
							array(
								'slug'  => 'my_view',
								'title' => 'My View',
							),
						),
					),
					1
				);
			}
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertSame(
			array(
				array(
					'title' => 'All items',
					'slug'  => 'all',
				),
				array(
					'slug'  => 'my_view',
					'title' => 'My View',
				),
			),
			$config['view_list']
		);
	}
}
