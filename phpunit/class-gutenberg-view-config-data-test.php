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
	 * Wraps a contribution in the current schema version.
	 *
	 * @param array $data The contribution.
	 * @return array The versioned contribution.
	 */
	private function versioned( array $data ) {
		return array_merge( array( 'version' => 1 ), $data );
	}

	/**
	 * update_with() requires a supported contribution version.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_requires_supported_version() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = $data->get_config();

		$data->update_with( array( 'default_view' => array( 'type' => 'grid' ) ) );
		$data->update_with(
			array(
				'version'      => Gutenberg_View_Config_Data::LATEST_VERSION + 1,
				'default_view' => array( 'type' => 'grid' ),
			)
		);

		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * update_with() rejects undocumented top-level keys.
	 *
	 * Nested properties are not validated: their vocabulary is owned by the
	 * client-side consumers.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_rejects_unknown_top_level_key() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );

		$data = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$data->update_with( $this->versioned( array( 'not_a_real_key' => 'nope' ) ) );

		$this->assertSame( array( 'default_view' => array( 'type' => 'table' ) ), $data->get_config() );
	}

	/**
	 * update_with() merges object-shaped keys recursively.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_merges_properties_recursively() {
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

		$data->update_with(
			$this->versioned(
				array(
					'default_view' => array(
						'perPage' => 50,
						'sort'    => array( 'direction' => 'desc' ),
					),
				)
			)
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
	 * update_with() unsets nested properties when the patch value is null.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_null_unsets_nested_property() {
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
			$this->versioned(
				array(
					'default_layouts' => array(
						'table' => array(
							'layout' => array( 'styles' => null ),
						),
					),
				)
			)
		);

		$this->assertSame(
			array( 'layout' => array( 'density' => 'compact' ) ),
			$data->get_config()['default_layouts']['table']
		);
	}

	/**
	 * update_with() drops a whole top-level key when the contribution value is null.
	 *
	 * gutenberg_get_entity_view_config() backfills a dropped documented key
	 * from the defaults, so that reads as a reset.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_null_drops_whole_top_level_key() {
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

		$data->update_with(
			$this->versioned(
				array(
					'default_view' => null,
					'view_list'    => null,
				)
			)
		);

		$this->assertSame(
			array( 'form' => array( 'layout' => array( 'type' => 'panel' ) ) ),
			$data->get_config()
		);
	}

	/**
	 * Inherited map keys are removed explicitly with nested null patches.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_removes_inherited_map_keys_explicitly() {
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

		$data->update_with(
			$this->versioned(
				array(
					'default_view' => array(
						'type' => 'grid',
						'sort' => null,
					),
				)
			)
		);

		$this->assertSame(
			array(
				'type'    => 'grid',
				'perPage' => 20,
			),
			$data->get_config()['default_view']
		);
	}

	/**
	 * An associative view_list contribution patches views by slug.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_view_list_map_merges_by_slug_appends_and_removes() {
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
					array(
						'title' => 'Trash',
						'slug'  => 'trash',
					),
				),
			)
		);

		$data->update_with(
			$this->versioned(
				array(
					'view_list' => array(
						'published' => array( 'title' => 'Live' ),
						'mine'      => array(
							'slug'  => 'other',
							'title' => 'Mine',
						),
						'trash'     => null,
					),
				)
			)
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
	 * A list-shaped view_list contribution replaces the full view list.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_view_list_replaces_with_list() {
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

		$data->update_with(
			$this->versioned(
				array(
					'view_list' => array(
						array(
							'title' => 'Mine',
							'slug'  => 'mine',
						),
					),
				)
			)
		);

		$this->assertSame(
			array(
				array(
					'title' => 'Mine',
					'slug'  => 'mine',
				),
			),
			$data->get_config()['view_list']
		);
	}

	/**
	 * Invalid view list shapes are rejected.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_rejects_invalid_view_list_shapes() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );

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

		$data->update_with( $this->versioned( array( 'view_list' => 'nope' ) ) );
		$data->update_with( $this->versioned( array( 'view_list' => array( 'all' => 'nope' ) ) ) );

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
	 * Form properties merge normally, and associative fields patch by id.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_form_merges_properties_and_fields_by_id() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'layout' => array( 'type' => 'panel' ),
					'fields' => array(
						array(
							'id'     => 'excerpt',
							'layout' => array(
								'type'          => 'panel',
								'labelPosition' => 'top',
							),
						),
						array(
							'id'       => 'discussion',
							'label'    => 'Discussion',
							'children' => array( 'comment_status', 'ping_status' ),
						),
					),
				),
			)
		);

		$data->update_with(
			$this->versioned(
				array(
					'form' => array(
						'layout' => array( 'type' => 'card' ),
						'fields' => array(
							'excerpt'     => array( 'layout' => array( 'labelPosition' => 'side' ) ),
							'ping_status' => array( 'layout' => array( 'labelPosition' => 'none' ) ),
						),
					),
				)
			)
		);

		$this->assertSame(
			array(
				'layout' => array( 'type' => 'card' ),
				'fields' => array(
					array(
						'id'     => 'excerpt',
						'layout' => array(
							'type'          => 'panel',
							'labelPosition' => 'side',
						),
					),
					array(
						'id'       => 'discussion',
						'label'    => 'Discussion',
						'children' => array(
							'comment_status',
							array(
								'id'     => 'ping_status',
								'layout' => array( 'labelPosition' => 'none' ),
							),
						),
					),
				),
			),
			$data->get_config()['form']
		);
	}

	/**
	 * Form fields are visited in document order, so a group matches before its children.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_form_fields_match_group_before_children() {
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

		$data->update_with(
			$this->versioned(
				array(
					'form' => array(
						'fields' => array(
							'status' => array(
								'label'    => 'Visibility',
								'children' => array( 'status' => array( 'layout' => array( 'labelPosition' => 'none' ) ) ),
							),
						),
					),
				)
			)
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
	 * Field children maps merge by id and append unknown children.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_form_field_children_map_merges_by_id() {
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

		$data->update_with(
			$this->versioned(
				array(
					'form' => array(
						'fields' => array(
							'discussion' => array(
								'children' => array(
									'comment_status' => array( 'layout' => array( 'labelPosition' => 'none' ) ),
									'my_field'       => array(),
								),
							),
						),
					),
				)
			)
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
	 * Field children lists replace wholesale, and null deletes the key.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_form_field_children_list_replaces_and_null_deletes() {
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

		$data->update_with(
			$this->versioned(
				array(
					'form' => array(
						'fields' => array(
							'discussion' => array( 'children' => array( 'ping_status', 'my_field' ) ),
						),
					),
				)
			)
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

		$data->update_with(
			$this->versioned(
				array(
					'form' => array(
						'fields' => array(
							'discussion' => array( 'children' => null ),
						),
					),
				)
			)
		);

		$this->assertSame(
			array(
				'excerpt',
				array(
					'id'    => 'discussion',
					'label' => 'Discussion',
				),
				'date',
			),
			$data->get_config()['form']['fields']
		);
	}

	/**
	 * Field patches append unknown ids and remove known ids wherever they live.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_form_fields_appends_and_removes_by_id() {
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

		$data->update_with(
			$this->versioned(
				array(
					'form' => array(
						'fields' => array(
							'excerpt'     => null,
							'ping_status' => null,
							'my_field'    => array( 'layout' => array( 'labelPosition' => 'side' ) ),
							'other_field' => array(),
						),
					),
				)
			)
		);

		$this->assertSame(
			array(
				array(
					'id'       => 'discussion',
					'label'    => 'Discussion',
					'children' => array( 'comment_status' ),
				),
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
	 * The field patch key is the identity.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_form_field_patch_key_wins_over_id_property() {
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

		$data->update_with(
			$this->versioned(
				array(
					'form' => array(
						'fields' => array(
							'excerpt' => array(
								'id'     => 'other',
								'layout' => array( 'labelPosition' => 'side' ),
							),
						),
					),
				)
			)
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
	 * A list-shaped form fields contribution replaces the full fields list.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_form_fields_replaces_with_list() {
		$data = new Gutenberg_View_Config_Data( array( 'form' => array( 'fields' => array( 'date', 'slug' ) ) ) );

		$data->update_with(
			$this->versioned(
				array(
					'form' => array(
						'fields' => array( 'title' ),
					),
				)
			)
		);

		$this->assertSame( array( 'title' ), $data->get_config()['form']['fields'] );
	}

	/**
	 * Invalid form shapes are rejected without changing the config.
	 *
	 * @covers ::update_with
	 */
	public function test_update_with_rejects_invalid_form_shapes() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_with' );

		$data   = new Gutenberg_View_Config_Data( array( 'form' => array( 'fields' => array( 'date' ) ) ) );
		$before = $data->get_config();

		$data->update_with( $this->versioned( array( 'form' => array( array( 'id' => 'my_field' ) ) ) ) );
		$data->update_with( $this->versioned( array( 'form' => 'nope' ) ) );
		$data->update_with( $this->versioned( array( 'form' => array( 'fields' => 'nope' ) ) ) );
		$data->update_with(
			$this->versioned(
				array(
					'form' => array(
						'fields' => array( 'date' => 'nope' ),
					),
				)
			)
		);

		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * A null patch for an unknown identity is a silent no-op.
	 *
	 * A member that is not present may have been removed by another filter or
	 * simply not apply to this entity, so it is not treated as misuse.
	 *
	 * @covers ::update_with
	 */
	public function test_null_patch_for_unknown_identity_is_silent_no_op() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form'      => array( 'fields' => array( 'date' ) ),
				'view_list' => array(
					array(
						'title' => 'All',
						'slug'  => 'all',
					),
				),
			)
		);

		$data->update_with(
			$this->versioned(
				array(
					'form'      => array( 'fields' => array( 'does_not_exist' => null ) ),
					'view_list' => array( 'also_missing' => null ),
				)
			)
		);

		$this->assertSame( array( 'date' ), $data->get_config()['form']['fields'] );
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
