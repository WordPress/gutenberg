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
	 * Builds a representative view configuration container.
	 *
	 * The form intentionally includes a group with nested `children` so identity
	 * resolution can be exercised across nesting levels.
	 *
	 * @return Gutenberg_View_Config_Data A fresh container.
	 */
	private function make_data() {
		$config = array(
			'default_view'    => array(
				'type'    => 'table',
				'perPage' => 20,
				'sort'    => array(
					'field'     => 'title',
					'direction' => 'asc',
				),
				'fields'  => array( 'author', 'status' ),
			),
			'default_layouts' => array(
				'table' => array(),
				'grid'  => array(),
				'list'  => array(),
			),
			'view_list'       => array(
				array(
					'title' => 'All',
					'slug'  => 'all',
				),
				array(
					'title' => 'Published',
					'slug'  => 'published',
				),
			),
			'form'            => array(
				'layout' => array( 'type' => 'panel' ),
				'fields' => array(
					array(
						'id'    => 'excerpt',
						'label' => 'Excerpt',
					),
					array(
						'id'       => 'discussion',
						'label'    => 'Discussion',
						'children' => array(
							'comment_status',
							'ping_status',
						),
					),
					'date',
					'slug',
				),
			),
		);

		return new Gutenberg_View_Config_Data( $config );
	}

	/**
	 * set() replaces a whole documented key.
	 *
	 * @covers ::set
	 */
	public function test_set_replaces_key() {
		$data = $this->make_data();
		$data->set( 'default_view', array( 'type' => 'grid' ) );

		$this->assertSame( array( 'type' => 'grid' ), $data->get_config()['default_view'] );
	}

	/**
	 * set() rejects an undocumented key.
	 *
	 * @covers ::set
	 */
	public function test_set_unknown_key_triggers_doing_it_wrong() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::set' );

		$data   = $this->make_data();
		$before = $data->get_config();
		$data->set( 'not_a_real_key', 'nope' );

		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * update_with() merges a documented key that is absent from the config.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_merges_a_documented_key_absent_from_config() {
		$data = new Gutenberg_View_Config_Data( array( 'default_view' => array() ) );
		$data->update_with( array( 'form' => array( 'fields' => array( 'excerpt' ) ) ), 1 );

		$this->assertSame( array( 'fields' => array( 'excerpt' ) ), $data->get_config()['form'] );
	}

	/**
	 * update_with() merges object-shaped keys recursively.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_merges_default_view_recursively() {
		$data = $this->make_data();
		$data->update_with(
			array(
				'default_view' => array(
					'perPage' => 50,
					'sort'    => array( 'direction' => 'desc' ),
				),
			),
			1
		);

		$default_view = $data->get_config()['default_view'];
		$this->assertSame( 50, $default_view['perPage'] );
		$this->assertSame(
			array(
				'field'     => 'title',
				'direction' => 'desc',
			),
			$default_view['sort']
		);
		// Untouched values are preserved.
		$this->assertSame( 'table', $default_view['type'] );
	}

	/**
	 * update_with() merges default_layouts by map key and adds unknown ones.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_merges_default_layouts_by_key() {
		$data = $this->make_data();
		$data->update_with(
			array(
				'default_layouts' => array(
					'table'    => array( 'density' => 'compact' ),
					'activity' => array(),
				),
			),
			1
		);

		$default_layouts = $data->get_config()['default_layouts'];
		$this->assertSame( array( 'density' => 'compact' ), $default_layouts['table'] );
		$this->assertArrayHasKey( 'activity', $default_layouts );
		// Existing keys are preserved.
		$this->assertArrayHasKey( 'grid', $default_layouts );
		$this->assertArrayHasKey( 'list', $default_layouts );
	}

	/**
	 * update_with() merges a `view_list` entry by matching slug and appends an unknown one.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_merges_view_by_slug_and_appends_unknown() {
		$data = $this->make_data();
		$data->update_with(
			array(
				'view_list' => array(
					array(
						'slug'  => 'published',
						'title' => 'Live',
					),
					array(
						'slug'  => 'mine',
						'title' => 'Mine',
					),
				),
			),
			1
		);

		$view_list = $data->get_config()['view_list'];
		$this->assertCount( 3, $view_list );
		// Matching slug merges in place.
		$this->assertSame(
			array(
				'title' => 'Live',
				'slug'  => 'published',
			),
			$view_list[1]
		);
		// Unknown slug appends to the end.
		$this->assertSame(
			array(
				'slug'  => 'mine',
				'title' => 'Mine',
			),
			$view_list[2]
		);
	}

	/**
	 * update_with() merges a form field by matching id.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_merges_existing_field_by_id() {
		$data = $this->make_data();
		$data->update_with(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'    => 'excerpt',
							'label' => 'Summary',
						),
					),
				),
			),
			1
		);

		$fields = $data->get_config()['form']['fields'];
		// No new field is appended.
		$this->assertCount( 4, $fields );
		$this->assertSame(
			array(
				'id'    => 'excerpt',
				'label' => 'Summary',
			),
			$fields[0]
		);
	}

	/**
	 * update_with() appends a form field with an unknown id to the end.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_appends_unknown_field() {
		$data = $this->make_data();
		$data->update_with(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'    => 'my_field',
							'label' => 'Mine',
						),
					),
				),
			),
			1
		);

		$fields = $data->get_config()['form']['fields'];
		$this->assertCount( 5, $fields );
		$last = end( $fields );
		$this->assertSame( 'my_field', $last['id'] );
	}

	/**
	 * update_with() reaches a nested group child when the group is targeted.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_merges_nested_group_child_by_id() {
		$data = $this->make_data();
		$data->update_with(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'       => 'discussion',
							'children' => array(
								array(
									'id'    => 'ping_status',
									'label' => 'Pings',
								),
							),
						),
					),
				),
			),
			1
		);

		$fields = $data->get_config()['form']['fields'];
		// The group merges in place rather than being appended.
		$this->assertCount( 4, $fields );
		// comment_status stays a bare string; the matched ping_status child is
		// promoted from a bare string and merged with the incoming overrides.
		$this->assertSame(
			array(
				'id'       => 'discussion',
				'label'    => 'Discussion',
				'children' => array(
					'comment_status',
					array(
						'id'    => 'ping_status',
						'label' => 'Pings',
					),
				),
			),
			$fields[1]
		);
	}

	/**
	 * update_with() appends at top level when the id only exists nested.
	 *
	 * Adding is append-only at the top level; only remove_fields() reaches
	 * nested members by identity.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_appends_when_id_only_exists_nested() {
		$data = $this->make_data();
		$data->update_with(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'    => 'ping_status',
							'label' => 'Pings',
						),
					),
				),
			),
			1
		);

		$fields = $data->get_config()['form']['fields'];
		$this->assertCount( 5, $fields );
		$last = end( $fields );
		$this->assertSame( 'ping_status', $last['id'] );
		// The nested ping_status is left untouched.
		$this->assertSame( array( 'comment_status', 'ping_status' ), $fields[1]['children'] );
	}

	/**
	 * update_with() discards keys outside the documented shape.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_discards_unknown_keys() {
		$data = $this->make_data();
		$data->update_with( array( 'not_a_real_key' => 'nope' ), 1 );

		$this->assertArrayNotHasKey( 'not_a_real_key', $data->get_config() );
	}

	/**
	 * update_with() rejects a patch whose version cannot be migrated — omitted, or
	 * newer than the latest supported version.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_rejects_unmigratable_version() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );

		$data   = $this->make_data();
		$before = $data->get_config();

		// Omitted: no version declared.
		$data->update_with( array( 'default_view' => array( 'type' => 'grid' ) ) );
		$this->assertSame( $before, $data->get_config() );

		// Newer than the latest supported version.
		$data->update_with(
			array( 'default_view' => array( 'type' => 'grid' ) ),
			Gutenberg_View_Config_Data::LATEST_VERSION + 1
		);
		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * update_with() unsets a default_view property when the patch value is null.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_null_unsets_default_view_prop() {
		$data = $this->make_data();
		$data->update_with(
			array( 'default_view' => array( 'perPage' => null ) ),
			1
		);

		$default_view = $data->get_config()['default_view'];
		$this->assertArrayNotHasKey( 'perPage', $default_view );
		// Sibling properties are preserved.
		$this->assertSame( 'table', $default_view['type'] );
		$this->assertSame( array( 'author', 'status' ), $default_view['fields'] );
	}

	/**
	 * update_with() unsets a default_layouts entry when the patch value is null.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_null_unsets_default_layout() {
		$data = $this->make_data();
		$data->update_with(
			array( 'default_layouts' => array( 'grid' => null ) ),
			1
		);

		$this->assertSame(
			array( 'table', 'list' ),
			array_keys( $data->get_config()['default_layouts'] )
		);
	}

	/**
	 * update_with() unsets several default_layouts entries in one patch.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_null_unsets_multiple_default_layouts() {
		$data = $this->make_data();
		$data->update_with(
			array(
				'default_layouts' => array(
					'grid' => null,
					'list' => null,
				),
			),
			1
		);

		$this->assertSame(
			array( 'table' ),
			array_keys( $data->get_config()['default_layouts'] )
		);
	}

	/**
	 * update_with() unsets a deeply nested layout property when the value is null.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_null_unsets_nested_layout_prop() {
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
		$data->update_with(
			array( 'default_layouts' => array( 'table' => array( 'layout' => array( 'styles' => null ) ) ) ),
			1
		);

		$layout = $data->get_config()['default_layouts']['table']['layout'];
		$this->assertArrayNotHasKey( 'styles', $layout );
		// The sibling property is preserved.
		$this->assertSame( 'compact', $layout['density'] );
	}

	/**
	 * update_with() unsets a form field property when the patch value is null,
	 * finding the field by identity first.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_null_unsets_field_property() {
		$data = $this->make_data();
		$data->update_with(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'    => 'excerpt',
							'label' => null,
						),
					),
				),
			),
			1
		);

		$fields = $data->get_config()['form']['fields'];
		// The field is merged in place, not appended.
		$this->assertCount( 4, $fields );
		$this->assertSame( array( 'id' => 'excerpt' ), $fields[0] );
	}

	/**
	 * update_with() drops a whole top-level key when the patch value is null,
	 * rather than storing a literal null.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_null_drops_whole_top_level_key() {
		$data = $this->make_data();
		$data->update_with(
			array(
				'default_view' => null,
				'view_list'    => null,
			),
			1
		);

		$config = $data->get_config();
		$this->assertArrayNotHasKey( 'default_view', $config );
		$this->assertArrayNotHasKey( 'view_list', $config );
		// Untouched keys are preserved.
		$this->assertArrayHasKey( 'form', $config );
	}

	/**
	 * update_with() consumes a null delete-marker merged into an empty base
	 * instead of storing it as a literal value.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_null_into_empty_base_is_consumed() {
		$data = $this->make_data();
		// The `table` layout entry is an empty array in the base config.
		$data->update_with(
			array( 'default_layouts' => array( 'table' => array( 'layout' => null ) ) ),
			1
		);

		$this->assertSame( array(), $data->get_config()['default_layouts']['table'] );
	}

	/**
	 * update_with() strips nulls from a subtree assigned to a key absent from
	 * the base instead of storing them as literal values.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_null_stripped_from_absent_key_subtree() {
		$data = $this->make_data();
		// The base default_view has no `layout` key.
		$data->update_with(
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
	 * update_with() rejects a null patch value for the identity-keyed `fields`
	 * and `children` lists: only remove_fields() may remove list content.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_null_cannot_delete_field_lists() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );

		$data   = $this->make_data();
		$before = $data->get_config();

		$data->update_with( array( 'form' => array( 'fields' => null ) ), 1 );
		$this->assertSame( $before['form']['fields'], $data->get_config()['form']['fields'] );

		$data->update_with(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'       => 'discussion',
							'children' => null,
						),
					),
				),
			),
			1
		);
		$this->assertSame(
			array( 'comment_status', 'ping_status' ),
			$data->get_config()['form']['fields'][1]['children']
		);
	}

	/**
	 * update_with() rejects a list member that declares no identity: it could
	 * never be matched, merged, or removed afterwards.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_rejects_member_without_identity() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );

		$data   = $this->make_data();
		$before = $data->get_config();

		$data->update_with(
			array(
				'view_list' => array(
					array(
						'slug'  => null,
						'title' => 'Broken',
					),
				),
			),
			1
		);
		$data->update_with(
			array(
				'form' => array(
					'fields' => array(
						array( 'label' => 'No id' ),
						null,
					),
				),
			),
			1
		);

		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * update_with() rejects patches whose shape does not match the key: a
	 * map where a list is expected, or a list where a map is expected.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_rejects_shape_mismatched_patches() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );

		$data   = $this->make_data();
		$before = $data->get_config();

		// A map where the view_list list is expected.
		$data->update_with(
			array(
				'view_list' => array(
					'slug'  => 'mine',
					'title' => 'Mine',
				),
			),
			1
		);
		// A list where the form map is expected.
		$data->update_with( array( 'form' => array( array( 'id' => 'my_field' ) ) ), 1 );
		// A map where the fields list is expected.
		$data->update_with( array( 'form' => array( 'fields' => array( 'id' => 'my_field' ) ) ), 1 );

		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * remove_view_list_items() drops a view by slug.
	 *
	 * @covers ::remove_view_list_items
	 */
	public function test_remove_view_list_items_by_slug() {
		$data = $this->make_data();
		$data->remove_view_list_items( 'published' );

		$slugs = wp_list_pluck( $data->get_config()['view_list'], 'slug' );
		$this->assertSame( array( 'all' ), $slugs );
	}

	/**
	 * remove_view_list_items() drops several views when given an array of slugs.
	 *
	 * @covers ::remove_view_list_items
	 */
	public function test_remove_view_list_items_multiple_by_array() {
		$data = $this->make_data();
		$data->remove_view_list_items( array( 'all', 'published' ) );

		$this->assertSame( array(), $data->get_config()['view_list'] );
	}

	/**
	 * remove_view_list_items() removes the found slugs in an array and silently
	 * ignores the rest.
	 *
	 * @covers ::remove_view_list_items
	 */
	public function test_remove_view_list_items_mixes_found_and_missing_silently() {
		$data = $this->make_data();
		$data->remove_view_list_items( array( 'published', 'does_not_exist' ) );

		$slugs = wp_list_pluck( $data->get_config()['view_list'], 'slug' );
		$this->assertSame( array( 'all' ), $slugs );
	}

	/**
	 * remove_fields() drops a nested field by id, walking the current structure.
	 *
	 * @covers ::remove_fields
	 */
	public function test_remove_fields_nested_by_id() {
		$data = $this->make_data();
		$data->remove_fields( 'ping_status' );

		$fields     = $data->get_config()['form']['fields'];
		$discussion = $fields[1];
		$this->assertSame( 'discussion', $discussion['id'] );
		// Only ping_status is dropped from the group's children.
		$this->assertSame( array( 'comment_status' ), $discussion['children'] );
	}

	/**
	 * remove_fields() drops several form fields when given an array of ids.
	 *
	 * @covers ::remove_fields
	 */
	public function test_remove_fields_multiple_by_array() {
		$data = $this->make_data();
		$data->remove_fields( array( 'ping_status', 'comment_status' ) );

		$fields = $data->get_config()['form']['fields'];
		// Top-level fields are untouched.
		$this->assertCount( 4, $fields );
		$this->assertSame( 'excerpt', $fields[0]['id'] );
		// Both nested children were dropped; the group itself remains.
		$discussion = $fields[1];
		$this->assertSame( 'discussion', $discussion['id'] );
		$this->assertSame( array(), $discussion['children'] );
	}

	/**
	 * The remove helpers are a silent no-op when the identity is not found.
	 *
	 * A member that is not present may have been removed by another filter or
	 * simply not apply to this entity, so it is not treated as misuse.
	 *
	 * @covers ::remove_fields
	 * @covers ::remove_view_list_items
	 */
	public function test_remove_not_found_is_silent_no_op() {
		$data   = $this->make_data();
		$before = $data->get_config();

		$data->remove_fields( 'does_not_exist' );
		$data->remove_view_list_items( 'does_not_exist' );

		$this->assertSame( $before, $data->get_config() );
	}
}
