<?php
/**
 * Tests for the entity view configuration data container.
 *
 * @package gutenberg
 *
 * @coversDefaultClass Gutenberg_View_Config_Data
 */
class Tests_View_Config_Data extends WP_UnitTestCase {

	/**
	 * set() replaces a whole documented key.
	 *
	 * @covers ::set
	 */
	public function test_set_replaces_key() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 20,
				),
			)
		);
		$data->set( 'default_view', array( 'type' => 'grid' ), 1 );

		$this->assertSame( array( 'type' => 'grid' ), $data->get_config()['default_view'] );
	}

	/**
	 * set() rejects an undocumented key.
	 *
	 * @covers ::set
	 */
	public function test_set_unknown_key_triggers_doing_it_wrong() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::set' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = $data->get_config();
		$data->set( 'not_a_real_key', 'nope', 1 );

		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * update_properties() merges object-shaped keys recursively.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_merges_default_view_recursively() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 20,
					'sort'    => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
			)
		);
		$data->update_properties(
			array(
				'default_view' => array(
					'perPage' => 50,
					'sort'    => array( 'direction' => 'desc' ),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'type'    => 'table',
				'perPage' => 50,
				'sort'    => array(
					'field'     => 'title',
					'direction' => 'desc',
				),
			),
			$data->get_config()['default_view']
		);
	}

	/**
	 * update_properties() merges default_layouts by map key and adds unknown ones.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_merges_default_layouts_by_key() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_layouts' => array(
					'table' => array(),
					'grid'  => array(),
				),
			)
		);
		$data->update_properties(
			array(
				'default_layouts' => array(
					'table'    => array( 'density' => 'compact' ),
					'activity' => array(),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'table'    => array( 'density' => 'compact' ),
				'grid'     => array(),
				'activity' => array(),
			),
			$data->get_config()['default_layouts']
		);
	}

	/**
	 * update_properties() merges the form's plain properties and leaves its
	 * fields untouched.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_merges_form_layout() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'layout' => array( 'type' => 'panel' ),
					'fields' => array( 'date', 'slug' ),
				),
			)
		);
		$data->update_properties(
			array( 'form' => array( 'layout' => array( 'type' => 'card' ) ) ),
			1
		);

		$this->assertSame(
			array(
				'layout' => array( 'type' => 'card' ),
				'fields' => array( 'date', 'slug' ),
			),
			$data->get_config()['form']
		);
	}

	/**
	 * update_properties() merges a documented key that is absent from the config.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_merges_a_documented_key_absent_from_config() {
		$data = new Gutenberg_View_Config_Data( array( 'default_view' => array() ) );
		$data->update_properties(
			array( 'default_layouts' => array( 'table' => array( 'density' => 'compact' ) ) ),
			1
		);

		$this->assertSame(
			array( 'table' => array( 'density' => 'compact' ) ),
			$data->get_config()['default_layouts']
		);
	}

	/**
	 * update_properties() unsets a property when the patch value is null.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_null_unsets_property() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 20,
				),
			)
		);
		$data->update_properties( array( 'default_view' => array( 'perPage' => null ) ), 1 );

		$this->assertSame( array( 'type' => 'table' ), $data->get_config()['default_view'] );
	}

	/**
	 * update_properties() unsets a deeply nested layout property when the value is null.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_null_unsets_nested_layout_prop() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_layouts' => array(
					'table' => array(
						'layout' => array(
							'styles'  => array( 'title' => array( 'width' => '20%' ) ),
							'density' => 'compact',
						),
					),
				),
			)
		);
		$data->update_properties(
			array( 'default_layouts' => array( 'table' => array( 'layout' => array( 'styles' => null ) ) ) ),
			1
		);

		$this->assertSame(
			array( 'layout' => array( 'density' => 'compact' ) ),
			$data->get_config()['default_layouts']['table']
		);
	}

	/**
	 * update_properties() drops a whole top-level key when the patch value is
	 * null — any documented key, including the identity-keyed view_list —
	 * rather than storing a literal null. gutenberg_get_entity_view_config()
	 * backfills a dropped documented key from the defaults, so that reads as
	 * a reset.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_null_drops_whole_top_level_key() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array( 'type' => 'table' ),
				'view_list'    => array(
					array(
						'title' => 'All',
						'slug'  => 'all',
					),
				),
				'form'         => array( 'layout' => array( 'type' => 'panel' ) ),
			)
		);
		$data->update_properties(
			array(
				'default_view' => null,
				'view_list'    => null,
			),
			1
		);

		$this->assertSame(
			array( 'form' => array( 'layout' => array( 'type' => 'panel' ) ) ),
			$data->get_config()
		);
	}

	/**
	 * update_properties() consumes a null delete-marker merged into an empty
	 * base instead of storing it as a literal value.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_null_into_empty_base_is_consumed() {
		$data = new Gutenberg_View_Config_Data( array( 'default_layouts' => array( 'table' => array() ) ) );
		$data->update_properties(
			array( 'default_layouts' => array( 'table' => array( 'layout' => null ) ) ),
			1
		);

		$this->assertSame( array(), $data->get_config()['default_layouts']['table'] );
	}

	/**
	 * update_properties() strips nulls from a subtree assigned to a key absent
	 * from the base instead of storing them as literal values.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_null_stripped_from_absent_key_subtree() {
		$data = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		// The base default_view has no `layout` key.
		$data->update_properties(
			array(
				'default_view' => array(
					'layout' => array(
						'type'        => 'flex',
						'badgeFields' => null,
					),
				),
			),
			1
		);

		$this->assertSame( array( 'type' => 'flex' ), $data->get_config()['default_view']['layout'] );
	}

	/**
	 * update_properties() rejects the identity-keyed branches: a non-null
	 * view_list value and form fields belong to their dedicated functions. A
	 * valid sibling form property still merges.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_rejects_identity_keyed_branches() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_properties' );

		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'layout' => array( 'type' => 'panel' ),
					'fields' => array( 'date' ),
				),
			)
		);

		$data->update_properties(
			array(
				'view_list' => array(
					array(
						'slug'  => 'mine',
						'title' => 'Mine',
					),
				),
			),
			1
		);
		$this->assertArrayNotHasKey( 'view_list', $data->get_config() );

		$data->update_properties(
			array(
				'form' => array(
					'layout' => array( 'type' => 'card' ),
					'fields' => array( 'my_field' ),
				),
			),
			1
		);
		$this->assertSame(
			array(
				'layout' => array( 'type' => 'card' ),
				'fields' => array( 'date' ),
			),
			$data->get_config()['form']
		);
	}

	/**
	 * update_properties() rejects an undocumented top-level key. Nested
	 * properties are not validated: their vocabulary is owned by the
	 * client-side consumers.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_warns_on_unknown_top_level_key() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_properties' );

		$data = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$data->update_properties( array( 'not_a_real_key' => 'nope' ), 1 );

		$this->assertSame( array( 'default_view' => array( 'type' => 'table' ) ), $data->get_config() );
	}

	/**
	 * update_properties() rejects a list where the form map is expected.
	 *
	 * @covers ::update_properties
	 */
	public function test_update_properties_rejects_list_shaped_form_patch() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_properties' );

		$data   = new Gutenberg_View_Config_Data( array( 'form' => array( 'layout' => array( 'type' => 'panel' ) ) ) );
		$before = $data->get_config();
		$data->update_properties( array( 'form' => array( array( 'id' => 'my_field' ) ) ), 1 );

		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * Every update function and set() reject a patch whose version cannot be
	 * migrated — newer than the latest supported version.
	 *
	 * @covers ::update_properties
	 * @covers ::update_view_list_items
	 * @covers ::update_form_fields
	 * @covers ::set
	 */
	public function test_update_functions_reject_unmigratable_version() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_properties' );
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_view_list_items' );
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_form_fields' );
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::set' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = $data->get_config();

		$version = Gutenberg_View_Config_Data::LATEST_VERSION + 1;
		$data->update_properties( array( 'default_view' => array( 'type' => 'grid' ) ), $version );
		$data->update_view_list_items( array( 'mine' => array( 'title' => 'Mine' ) ), $version );
		$data->update_form_fields( array( 'excerpt' => array( 'layout' => array( 'labelPosition' => 'side' ) ) ), $version );
		$data->set( 'default_view', array( 'type' => 'grid' ), $version );

		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * update_view_list_items() merges a matching slug in place and appends an
	 * unknown one, injecting the slug from the patch key.
	 *
	 * @covers ::update_view_list_items
	 */
	public function test_update_view_list_items_merges_by_slug_and_appends_unknown() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'view_list' => array(
					array(
						'title' => 'All',
						'slug'  => 'all',
					),
					array(
						'title' => 'Published',
						'slug'  => 'published',
					),
				),
			)
		);
		$data->update_view_list_items(
			array(
				'published' => array( 'title' => 'Live' ),
				'mine'      => array( 'title' => 'Mine' ),
			),
			1
		);

		$this->assertSame(
			array(
				array(
					'title' => 'All',
					'slug'  => 'all',
				),
				array(
					'title' => 'Live',
					'slug'  => 'published',
				),
				array(
					'slug'  => 'mine',
					'title' => 'Mine',
				),
			),
			$data->get_config()['view_list']
		);
	}

	/**
	 * update_view_list_items() removes a view when the patch value is null.
	 *
	 * @covers ::update_view_list_items
	 */
	public function test_update_view_list_items_null_removes_view() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'view_list' => array(
					array(
						'title' => 'All',
						'slug'  => 'all',
					),
					array(
						'title' => 'Published',
						'slug'  => 'published',
					),
				),
			)
		);
		$data->update_view_list_items( array( 'published' => null ), 1 );

		$this->assertSame(
			array(
				array(
					'title' => 'All',
					'slug'  => 'all',
				),
			),
			$data->get_config()['view_list']
		);
	}

	/**
	 * The patch key is the identity: a conflicting `slug` property inside the
	 * value is ignored.
	 *
	 * @covers ::update_view_list_items
	 */
	public function test_update_view_list_items_patch_key_wins_over_slug_property() {
		$data = new Gutenberg_View_Config_Data( array( 'view_list' => array() ) );
		$data->update_view_list_items(
			array(
				'mine' => array(
					'slug'  => 'other',
					'title' => 'Mine',
				),
			),
			1
		);

		$this->assertSame(
			array(
				array(
					'slug'  => 'mine',
					'title' => 'Mine',
				),
			),
			$data->get_config()['view_list']
		);
	}

	/**
	 * update_view_list_items() rejects patches that are not keyed by slug and
	 * members that are not view objects.
	 *
	 * @covers ::update_view_list_items
	 */
	public function test_update_view_list_items_rejects_off_shape_patches() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_view_list_items' );

		$data   = new Gutenberg_View_Config_Data(
			array(
				'view_list' => array(
					array(
						'title' => 'All',
						'slug'  => 'all',
					),
				),
			)
		);
		$before = $data->get_config();

		// A positional list where a map keyed by slug is expected.
		$data->update_view_list_items(
			array(
				array(
					'slug'  => 'mine',
					'title' => 'Mine',
				),
			),
			1
		);
		// A scalar where a view object (or null) is expected.
		$data->update_view_list_items( array( 'all' => 'nope' ), 1 );

		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * update_form_fields() merges a top-level field by its id: in place, with
	 * siblings untouched and nothing appended.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_merges_top_level_field_by_id() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'     => 'excerpt',
							'layout' => array(
								'type'          => 'panel',
								'labelPosition' => 'top',
							),
						),
						'date',
					),
				),
			)
		);
		$data->update_form_fields( array( 'excerpt' => array( 'layout' => array( 'labelPosition' => 'side' ) ) ), 1 );

		$this->assertSame(
			array(
				array(
					'id'     => 'excerpt',
					'layout' => array(
						'type'          => 'panel',
						'labelPosition' => 'side',
					),
				),
				'date',
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * update_form_fields() finds a nested field by its bare id: the caller does
	 * not need to know (or address) the group the field lives in.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_merges_nested_field_without_addressing_group() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'       => 'discussion',
							'label'    => 'Discussion',
							'children' => array( 'comment_status', 'ping_status' ),
						),
					),
				),
			)
		);
		$data->update_form_fields( array( 'ping_status' => array( 'layout' => array( 'labelPosition' => 'side' ) ) ), 1 );

		// comment_status stays a bare string; the matched ping_status child is
		// promoted from a bare string and merged with the incoming overrides.
		$this->assertSame(
			array(
				array(
					'id'       => 'discussion',
					'label'    => 'Discussion',
					'children' => array(
						'comment_status',
						array(
							'id'     => 'ping_status',
							'layout' => array( 'labelPosition' => 'side' ),
						),
					),
				),
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * Fields are visited in document order and a group matches before its own
	 * children, so a group and a child sharing an id (as in core's default
	 * `status` group) resolve to the group; the child is reached through a
	 * `children` patch on the group.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_matches_group_before_its_children() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'       => 'status',
							'label'    => 'Status',
							'children' => array( 'status', 'password' ),
						),
					),
				),
			)
		);
		$data->update_form_fields(
			array(
				'status' => array(
					'label'    => 'Visibility',
					'children' => array( 'status' => array( 'layout' => array( 'labelPosition' => 'none' ) ) ),
				),
			),
			1
		);

		$this->assertSame(
			array(
				array(
					'id'       => 'status',
					'label'    => 'Visibility',
					'children' => array(
						array(
							'id'     => 'status',
							'layout' => array( 'labelPosition' => 'none' ),
						),
						'password',
					),
				),
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * update_form_fields() appends an unknown id to the end of the top-level
	 * list: as an object when the patch carries overrides, as a bare string
	 * reference otherwise.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_appends_unknown_field() {
		$data = new Gutenberg_View_Config_Data( array( 'form' => array( 'fields' => array( 'date' ) ) ) );
		$data->update_form_fields(
			array(
				'my_field'    => array( 'layout' => array( 'labelPosition' => 'side' ) ),
				'other_field' => array(),
			),
			1
		);

		$this->assertSame(
			array(
				'date',
				array(
					'id'     => 'my_field',
					'layout' => array( 'labelPosition' => 'side' ),
				),
				'other_field',
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * A null patch value removes the field wherever it lives, including nested
	 * inside a group's children.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_null_removes_field_wherever_it_lives() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'     => 'excerpt',
							'layout' => array( 'type' => 'panel' ),
						),
						array(
							'id'       => 'discussion',
							'label'    => 'Discussion',
							'children' => array( 'comment_status', 'ping_status' ),
						),
						'date',
					),
				),
			)
		);
		$data->update_form_fields(
			array(
				'excerpt'     => null,
				'ping_status' => null,
			),
			1
		);

		$this->assertSame(
			array(
				array(
					'id'       => 'discussion',
					'label'    => 'Discussion',
					'children' => array( 'comment_status' ),
				),
				'date',
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * A `children` map merges into the group's children by id, appending
	 * unknown ones.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_children_map_merges_by_id() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'       => 'discussion',
							'label'    => 'Discussion',
							'children' => array( 'comment_status', 'ping_status' ),
						),
					),
				),
			)
		);
		$data->update_form_fields(
			array(
				'discussion' => array(
					'children' => array(
						'comment_status' => array( 'layout' => array( 'labelPosition' => 'none' ) ),
						'my_field'       => array(),
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				array(
					'id'       => 'discussion',
					'label'    => 'Discussion',
					'children' => array(
						array(
							'id'     => 'comment_status',
							'layout' => array( 'labelPosition' => 'none' ),
						),
						'ping_status',
						'my_field',
					),
				),
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * A `children` list replaces the group's children wholesale while the group
	 * keeps its position among the other top-level fields.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_children_list_replaces_wholesale() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						'excerpt',
						array(
							'id'       => 'discussion',
							'label'    => 'Discussion',
							'children' => array( 'comment_status', 'ping_status' ),
						),
						'date',
					),
				),
			)
		);
		$data->update_form_fields(
			array( 'discussion' => array( 'children' => array( 'ping_status', 'my_field' ) ) ),
			1
		);

		$this->assertSame(
			array(
				'excerpt',
				array(
					'id'       => 'discussion',
					'label'    => 'Discussion',
					'children' => array( 'ping_status', 'my_field' ),
				),
				'date',
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * A null `children` value deletes the key, turning the group into a plain
	 * field.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_children_null_drops_key() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'       => 'discussion',
							'label'    => 'Discussion',
							'children' => array( 'comment_status' ),
						),
					),
				),
			)
		);
		$data->update_form_fields( array( 'discussion' => array( 'children' => null ) ), 1 );

		$this->assertSame(
			array(
				array(
					'id'    => 'discussion',
					'label' => 'Discussion',
				),
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * The patch key is the identity: a conflicting `id` property inside the
	 * value is ignored.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_patch_key_wins_over_id_property() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'     => 'excerpt',
							'layout' => array( 'labelPosition' => 'top' ),
						),
					),
				),
			)
		);
		$data->update_form_fields(
			array(
				'excerpt' => array(
					'id'     => 'other',
					'layout' => array( 'labelPosition' => 'side' ),
				),
			),
			1
		);

		$this->assertSame(
			array(
				array(
					'id'     => 'excerpt',
					'layout' => array( 'labelPosition' => 'side' ),
				),
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * update_form_fields() rejects patches that are not keyed by id and members
	 * that are not field objects.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_rejects_off_shape_patches() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_form_fields' );

		$data   = new Gutenberg_View_Config_Data( array( 'form' => array( 'fields' => array( 'date' ) ) ) );
		$before = $data->get_config();

		// A positional list where a map keyed by id is expected.
		$data->update_form_fields( array( array( 'id' => 'my_field' ) ), 1 );
		// A scalar where a field object (or null) is expected.
		$data->update_form_fields( array( 'date' => 'nope' ), 1 );

		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * Several null field patches drop several members in one patch: both nested
	 * children are removed while the group itself remains.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_null_removes_multiple_nested_fields() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						'excerpt',
						array(
							'id'       => 'discussion',
							'label'    => 'Discussion',
							'children' => array( 'comment_status', 'ping_status' ),
						),
					),
				),
			)
		);
		$data->update_form_fields(
			array(
				'ping_status'    => null,
				'comment_status' => null,
			),
			1
		);

		$this->assertSame(
			array(
				'excerpt',
				array(
					'id'       => 'discussion',
					'label'    => 'Discussion',
					'children' => array(),
				),
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * Removing a group removes its children with it: they are not hoisted to
	 * the top level.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_null_removes_group_with_its_children() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'       => 'discussion',
							'label'    => 'Discussion',
							'children' => array( 'comment_status', 'ping_status' ),
						),
						'date',
					),
				),
			)
		);
		$data->update_form_fields( array( 'discussion' => null ), 1 );

		$this->assertSame( array( 'date' ), $data->get_config()['form']['fields'] );
	}

	/**
	 * Patch entries apply in order and a null removes every occurrence of the
	 * id, so a field moves into a group by removing it first and appending it
	 * to the group's children later in the same patch.
	 *
	 * @covers ::update_form_fields
	 */
	public function test_update_form_fields_moves_field_into_group_in_one_patch() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						'author',
						array(
							'id'       => 'discussion',
							'label'    => 'Discussion',
							'children' => array( 'comment_status' ),
						),
					),
				),
			)
		);
		$data->update_form_fields(
			array(
				'author'     => null,
				'discussion' => array( 'children' => array( 'author' => array() ) ),
			),
			1
		);

		$this->assertSame(
			array(
				array(
					'id'       => 'discussion',
					'label'    => 'Discussion',
					'children' => array( 'comment_status', 'author' ),
				),
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * A null patch for an identity that is not found is a silent no-op.
	 *
	 * A member that is not present may have been removed by another filter or
	 * simply not apply to this entity, so it is not treated as misuse.
	 *
	 * @covers ::update_form_fields
	 * @covers ::update_view_list_items
	 */
	public function test_null_patch_for_unknown_identity_is_silent_no_op() {
		$data = new Gutenberg_View_Config_Data( array( 'form' => array( 'fields' => array( 'date' ) ) ) );
		$data->update_form_fields( array( 'does_not_exist' => null ), 1 );

		$this->assertSame( array( 'date' ), $data->get_config()['form']['fields'] );

		$data = new Gutenberg_View_Config_Data(
			array(
				'view_list' => array(
					array(
						'title' => 'All',
						'slug'  => 'all',
					),
				),
			)
		);
		$data->update_view_list_items( array( 'does_not_exist' => null ), 1 );

		$this->assertSame(
			array(
				array(
					'title' => 'All',
					'slug'  => 'all',
				),
			),
			$data->get_config()['view_list']
		);
	}
}
