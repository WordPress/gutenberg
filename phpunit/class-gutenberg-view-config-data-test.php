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
	 * merge() updates scalar property values
	 *
	 * @covers ::merge
	 */
	public function test_merge_scalar_values() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 20,
					'showLevels' => false
				),
			)
		);
		$data->merge(
			array(
				'default_view' => array(
					'type' => 'grid',
					'perPage' => 50,
					'showLevels' => false,
				),
			),
			1
		);

		$this->assertSame(
			array(
				'type'    => 'grid',
				'perPage' => 50,
				'showLevels' => false
			),
			$data->get_config()['default_view']
		);
	}

	/**
	 * merge() updates object property values
	 *
	 * @covers ::merge
	 */
	public function test_merge_object_values() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'sort' => array(
						'field' => 'title',
						'direction' => 'asc'
					)
				),
				'default_layouts' => array(
					'table' => array(
		            	'layout' => array(
		                	'styles' => array(
		                    	'width' => 1,
		                	),
		                	'density' => 'd2',
		                	'enableMoving' => true
		            	)
			    	)
				),
				'form' => array(
					'layout' => array(
						'type' => 'panel',
						'labelPosition' => 'top',
						'openAs' => array(
							'type' => 'modal',
							'applyLabel' => 'Apply'
						),
					)
				)
			)
		);
		$data->merge(
			array(
				'default_view' => array(
					'sort' => array(
						'direction' => 'desc'
					)
				),
				'default_layouts' => array(
					'table' => array(
						'layout' => array(
							'styles' => array(
								'minWidth' => 2
							),
							'density' => 'd2',
						)
					)
				),
				'form' => array(
					'layout' => array(
						'type' => 'panel',
						'labelPosition' => 'side',
						'openAs' => array(
							'type' => 'drawer'
						),
					)
				)
			),
			1
		);

		$this->assertSame(
			array(
				'default_view'=> array(
					'sort' => array(
						'field' => 'title',
						'direction' => 'desc'
						)
				),
				'default_layouts' => array(
					'table' => array(
						'layout' => array(
							'styles' => array(
								'width' => 1,
								'minWidth' => 2
							),
							'density' => 'd2',
							'enableMoving' => true
						)
					)
				),
				'form' => array(
					'layout' => array(
						'type' => 'panel',
						'labelPosition' => 'side',
						'openAs' => array(
							'type' => 'drawer',
							'applyLabel' => 'Apply'
						),
					)
				)
			),
			$data->get_config()
		);
	}

	/**
	 * merge() updates list property values
	 *
	 * @covers ::merge
	 */
	public function test_merge_list_values() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'fields' => array(
						array( 'title' )
					),
					'filters' => array(
						array( 'field' => 'id1', 'operator' => 'op1', 'value' => [ 'val1' ] ),
					),
					'layout' => array(
						'badgeFields' => array( 'b1', 'b2' )
					)
				),
				'form' => array(
					'layout' => array(
						'summary' => array( 'f1' )
					),
					'fields' => array(
						'f1',
						array(
							'id' => 'f2',
							'label' => 'Field label',
							'children' => array(
								'child1',
								array(
									'id' => 'child2',
									'label' => 'Child 2 label'
								)
							)
						),
						'f3'
					)
				)
			)
		);
		$data->merge(
			array(
				'default_view' => array(
					'fields' => array(
						array( 'slug' )
					),
					'filters' => array(
						array( 'field' => 'id1', 'operator' => 'change', 'isLocked' => true ),
						array( 'field' => 'id2', 'operator' => 'op2', 'value' => [ 'val2' ] ),
					),
					'layout' => array(
						'badgeFields' => array( 'b2' )
					)
				),
				'form' => array(
					'layout' => array(
						'summary' => array( 'f2' )
					),
					'fields' => array(
						'f4',
						array(
							'id' => 'f2',
							'label' => 'Updated label',
							'children' => array(
								array(
									'id' => 'child2',
									'label' => 'Child 2 updated label'
								),
								array(
									'id' => 'child3',
									'label' => 'Child 3 label'
								)
							)
						),
						array(
							'id' => 'f3',
							'label' => 'Field 3 label'
						)
					)
				)
			),
			1
		);

		$this->assertSame( array(
			'default_view' => array(
				'fields' => array(
					array( 'title' ),
					array( 'slug' )
				),
				'filters' => array(
					array( 'field' => 'id1', 'operator' => 'change', 'value' => [ 'val1' ], 'isLocked' => true ),
					array( 'field' => 'id2', 'operator' => 'op2', 'value' => [ 'val2' ] ),
				),
				'layout' => array(
					'badgeFields' => array( 'b1', 'b2' )
				)
			),
			'form' => array(
				'layout' => array(
					'summary' => array( 'f1', 'f2' )
				),
				'fields' => array(
					'f1',
					array(
						'id' => 'f2',
						'label' => 'Updated label',
						'children' => array(
							'child1',
							array(
								'id' => 'child2',
								'label' => 'Child 2 updated label'
							),
							array(
								'id' => 'child3',
								'label' => 'Child 3 label'
							)
						)
					),
					array(
						'id' => 'f3',
						'label' => 'Field 3 label'
					),
					'f4'
				)
			)
			),
			$data->get_config()
		);
	}

	/**
	 * merge() rejects an undocumented top-level key. Nested
	 * properties are not validated: their vocabulary is owned by the
	 * client-side consumers.
	 *
	 * @covers ::merge
	 */
	public function test_merge_key_unknown_is_rejected() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::merge' );

		$data = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$data->merge( array( 'not_a_real_key' => 'nope' ), 1 );

		$this->assertSame( array( 'default_view' => array( 'type' => 'table' ) ), $data->get_config() );
	}

	/**
	 * merge() merges a documented key that is absent from the config.
	 *
	 * @covers ::merge
	 */
	public function test_merge_key_known_is_merged() {
		$data = new Gutenberg_View_Config_Data( array( 'default_view' => array() ) );
		$data->merge(
			array( 'default_layouts' => array( 'table' => array( 'density' => 'compact' ) ) ),
			1
		);

		$this->assertSame(
			array( 'table' => array( 'density' => 'compact' ) ),
			$data->get_config()['default_layouts']
		);
	}

	/**
	 * merge() unsets a property when the patch value is null.
	 *
	 * @covers ::merge
	 */
	public function test_merge_null_unsets_property() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 20,
				),
			)
		);
		$data->merge( array( 'default_view' => array( 'perPage' => null ) ), 1 );

		$this->assertSame( array( 'type' => 'table' ), $data->get_config()['default_view'] );
	}

	/**
	 * merge() unsets a deeply nested layout property when the value is null.
	 *
	 * @covers ::merge
	 */
	public function test_merge_null_unsets_nested_layout_prop() {
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
		$data->merge(
			array( 'default_layouts' => array( 'table' => array( 'layout' => array( 'styles' => null ) ) ) ),
			1
		);

		$this->assertSame(
			array( 'layout' => array( 'density' => 'compact' ) ),
			$data->get_config()['default_layouts']['table']
		);
	}

	/**
	 * merge() drops a whole top-level key when the patch value is
	 * null — any documented key, including the identity-keyed view_list —
	 * rather than storing a literal null. gutenberg_get_entity_view_config()
	 * backfills a dropped documented key from the defaults, so that reads as
	 * a reset.
	 *
	 * @covers ::merge
	 */
	public function test_merge_null_drops_whole_top_level_key() {
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
		$data->merge(
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
	 * merge() consumes a null delete-marker merged into an empty
	 * base instead of storing it as a literal value.
	 *
	 * @covers ::merge
	 */
	public function test_merge_null_into_empty_base_is_consumed() {
		$data = new Gutenberg_View_Config_Data( array( 'default_layouts' => array( 'table' => array() ) ) );
		$data->merge(
			array( 'default_layouts' => array( 'table' => array( 'layout' => null ) ) ),
			1
		);

		$this->assertSame( array(), $data->get_config()['default_layouts']['table'] );
	}

	/**
	 * merge() strips nulls from a subtree assigned to a key absent
	 * from the base instead of storing them as literal values.
	 *
	 * @covers ::merge
	 */
	public function test_merge_null_stripped_from_absent_key_subtree() {
		$data = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		// The base default_view has no `layout` key.
		$data->merge(
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
	 * merge() rejects a list where the form map is expected.
	 *
	 * @covers ::merge
	 */
	public function test_merge_rejects_list_shaped_form_patch() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::merge' );

		$data   = new Gutenberg_View_Config_Data( array( 'form' => array( 'layout' => array( 'type' => 'panel' ) ) ) );
		$before = $data->get_config();
		$data->merge( array( 'form' => array( array( 'id' => 'my_field' ) ) ), 1 );

		$this->assertSame( $before, $data->get_config() );
	}

	/**
	 * Every update function and set() reject a patch whose version cannot be
	 * migrated — newer than the latest supported version.
	 *
	 * @covers ::merge
	 * @covers ::update_view_list_items
	 * @covers ::set
	 */
	public function test_update_functions_reject_unmigratable_version() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::merge' );
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::update_view_list_items' );
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::set' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = $data->get_config();

		$version = Gutenberg_View_Config_Data::LATEST_VERSION + 1;
		$data->merge( array( 'default_view' => array( 'type' => 'grid' ) ), $version );
		$data->update_view_list_items( array( 'mine' => array( 'title' => 'Mine' ) ), $version );
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
	 * A null patch for an identity that is not found is a silent no-op.
	 *
	 * A member that is not present may have been removed by another filter or
	 * simply not apply to this entity, so it is not treated as misuse.
	 *
	 * @covers ::update_view_list_items
	 */
	public function test_null_patch_for_unknown_identity_is_silent_no_op() {
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
