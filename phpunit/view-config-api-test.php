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
		remove_all_filters( 'get_entity_view_config_postType_unregistered_cpt' );
		remove_all_filters( 'get_entity_view_config_custom_kind_custom_name' );
		parent::tear_down();
	}

	/**
	 * The default configuration exposes the documented shape for an unknown entity.
	 */
	public function test_returns_default_config_shape_for_unknown_entity() {
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
	 * The dynamic filter receives the default config and the entity descriptor.
	 */
	public function test_filter_receives_config_and_entity() {
		$received_entity = null;
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $config, $entity ) use ( &$received_entity ) {
				$received_entity = $entity;
				return $config;
			},
			10,
			2
		);

		gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertSame(
			array(
				'kind' => 'custom_kind',
				'name' => 'custom_name',
			),
			$received_entity
		);
	}

	/**
	 * A filter can override the configuration values.
	 */
	public function test_filter_can_override_config() {
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $config ) {
				$config['default_view']['type'] = 'grid';
				return $config;
			}
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertSame( 'grid', $config['default_view']['type'] );
	}

	/**
	 * Dropped keys are backfilled with their defaults.
	 */
	public function test_filter_dropped_keys_are_backfilled() {
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function () {
				// Return a config that is missing most of the documented keys.
				return array( 'form' => array( 'custom' => true ) );
			}
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertSameSets( self::CONFIG_KEYS, array_keys( $config ) );
		$this->assertSame( array( 'custom' => true ), $config['form'] );
		// Backfilled from defaults.
		$this->assertSameSets( self::CONFIG_KEYS, array_keys( $config ) );
		$this->assertSame( self::DEFAULT_VIEW, $config['default_view'] );
		$this->assertSame( self::DEFAULT_LAYOUTS, $config['default_layouts'] );
		$this->assertSame( self::DEFAULT_VIEW_LIST, $config['view_list'] );
	}

	/**
	 * Keys introduced by a filter that are not part of the documented shape are discarded.
	 */
	public function test_filter_unknown_keys_are_discarded() {
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function ( $config ) {
				$config['not_a_real_key'] = 'nope';
				return $config;
			}
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertArrayNotHasKey( 'not_a_real_key', $config );
		$this->assertSameSets( self::CONFIG_KEYS, array_keys( $config ) );
	}

	/**
	 * A non-array filter return falls back to the default config.
	 */
	public function test_non_array_filter_return_falls_back_to_default() {
		add_filter(
			'get_entity_view_config_custom_kind_custom_name',
			function () {
				return 'not an array';
			}
		);

		$config = gutenberg_get_entity_view_config( 'custom_kind', 'custom_name' );

		$this->assertIsArray( $config );
		$this->assertSameSets( self::CONFIG_KEYS, array_keys( $config ) );
		$this->assertSame( self::DEFAULT_VIEW, $config['default_view'] );
		$this->assertSame( self::DEFAULT_LAYOUTS, $config['default_layouts'] );
		$this->assertSame( self::DEFAULT_VIEW_LIST, $config['view_list'] );
		$this->assertSame( self::DEFAULT_FORM, $config['form'] );
	}
}
