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
	 * @covers ::replace
	 */
	public function test_replace_scalar_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 23,
					'showLevels' => true,
					'fields' => array( 'f1', 'f2' ),
					'sort' => array(
						'field'     => 'title',
						'direction' => 'asc',
					)
				),
				'form' => array(
					'fields' => array( 'f1', 'f2' )
				)
			)
		);
		$data->replace( array(
			'default_view' => array(
				'type'    => 'grid',
				'perPage' => 50,
				'showLevels' => false,
			)
		), 1 );

		$this->assertSame( array(
			'default_view' => array(
				'type'    => 'grid',
				'perPage' => 50,
				'showLevels' => false,
				'fields' => array( 'f1', 'f2' ),
				'sort' => array(
					'field'     => 'title',
					'direction' => 'asc',
				)
			),
			'form' => array(
				'fields' => array( 'f1', 'f2' )
			)
		), $data->get_data() );
	}

	/**
	 * set() rejects an undocumented key.
	 *
	 * @covers ::replace
	 */
	public function test_replace_rejects_unknown_key() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::replace' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = $data->get_data();
		$data->replace( array( 'not_a_real_key' => 'nope' ), 1 );

		$this->assertSame( $before, $data->get_data() );
	}

	/**
	 * set() rejects a patch with an invalid version.
	 *
	 * @covers ::replace
	 */
	public function test_replace_rejects_updates_with_invalid_version() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::replace' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = $data->get_data();

		$version = Gutenberg_View_Config_Data::LATEST_VERSION + 1;
		$data->replace( array( 'default_view' => array( 'type' => 'grid' ) ), $version );

		$this->assertSame( $before, $data->get_data() );
	}

	/**
	 * replace() updates object property values. With no lists involved it
	 * behaves exactly like merge(): associative arrays merge key by key.
	 *
	 * @covers ::replace
	 */
	public function test_replace_associative_array_properties() {
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
		$data->replace(
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
			$data->get_data()
		);
	}

	/**
	 * replace() replaces list property values wholesale instead of merging
	 * them by member identity — this is the one way it differs from merge().
	 * Associative arrays around the lists still merge key by key, so an
	 * untouched associative key is preserved while every list the patch names
	 * (fields, filters, badgeFields, view_list, summary, form fields) is
	 * swapped for exactly what the patch carries.
	 *
	 * @covers ::replace
	 */
	public function test_replace_indexed_array_properties() {
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
				'view_list' => array(
					array(
						'title' => 'All',
						'slug'  => 'all',
					),
					array(
						'title' => 'Published',
						'slug'  => 'published',
						'view'  => array(
							'type' => 'list',
							'sort' => array(
								'field'     => 'title',
								'direction' => 'asc',
							),
						),
					),
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
		$data->replace(
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
				'view_list' => array(
					array(
						'slug'  => 'published',
						'title' => 'Live',
						'view'  => array(
							'sort' => array( 'direction' => 'desc' ),
						),
					),
					array(
						'slug'  => 'mine',
						'title' => 'Mine',
					),
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
			'view_list' => array(
				array(
					'slug'  => 'published',
					'title' => 'Live',
					'view'  => array(
						'sort' => array( 'direction' => 'desc' ),
					),
				),
				array(
					'slug'  => 'mine',
					'title' => 'Mine',
				),
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
			$data->get_data()
		);
	}

	/**
	 * replace() unsets a property when the patch value is null.
	 *
	 * @covers ::replace
	 */
	public function test_replace_null_unsets_scalar_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 20,
				),
			)
		);
		$data->replace( array( 'default_view' => array( 'perPage' => null ) ), 1 );

		$this->assertSame( array( 'type' => 'table' ), $data->get_data()['default_view'] );
	}

	/**
	 * replace() unsets a deeply nested layout property when the value is null.
	 *
	 * @covers ::replace
	 */
	public function test_replace_null_unsets_associative_array_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'   => 'table',
					'sort'    => array(
						'field'     => 'title',
						'direction' => 'asc',
					)
				),
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
		$data->replace(
			array(
				'default_view' => array(
					'sort' => null
				),
				'default_layouts' => array(
					'table' => array( 'layout' => array( 'styles' => null ) ) )
				),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'type' => 'table',
				),
				'default_layouts' => array(
					'table' => array( 'layout' => array( 'density' => 'compact' ) ),
				)
			),
			$data->get_data()
		);
	}

	/**
	 * replace() unsets a deeply nested list property when the value is null.
	 *
	 * @covers ::replace
	 */
	public function test_replace_null_unsets_indexed_array_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'   => 'table',
					'filters'    => array(
						array( 'field' => 'id1', 'operator' => 'op1', 'value' => [ 'val1' ] ),
					)
				),
				'default_layouts' => array(
					'grid' => array(
						'layout' => array(
							'density' => 'compact',
							'badgeFields'  => array( 'b1', 'b2' ),
						),
					),
				),
			)
		);
		$data->replace(
			array(
				'default_view' => array(
					'filters' => null
				),
				'default_layouts' => array(
					'grid' => array( 'layout' => array( 'badgeFields' => null ) ) )
				),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'type' => 'table',
				),
				'default_layouts' => array(
					'grid' => array( 'layout' => array( 'density' => 'compact' ) ),
				)
			),
			$data->get_data()
		);
	}

	/**
	 * replace() drops a whole top-level key when the patch value is null —
	 * any documented key, including the identity-keyed view_list — rather than
	 * storing a literal null.
	 *
	 * @covers ::replace
	 */
	public function test_replace_null_unsets_top_level_keys() {
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
		$data->replace(
			array(
				'default_view' => null,
				'view_list'    => null,
			),
			1
		);

		$this->assertSame(
			array( 'form' => array( 'layout' => array( 'type' => 'panel' ) ) ),
			$data->get_data()
		);
	}

	/**
	 * replace() swaps a scalar list wholesale rather than appending to it.
	 *
	 * @covers ::replace
	 */
	public function test_replace_identity_for_scalars() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'fields' => array(
						'title'
					),
				),
			)
		);
		$data->replace(
			array(
				'default_view' => array(
					'fields' => array(
						'slug'
					),
				),
			),
			1
		);

		$this->assertSame( array(
			'default_view' => array(
				'fields' => array(
					'slug'
				),
			),
			),
			$data->get_data()
		);
	}

	/**
	 * replace() swaps an id-keyed list wholesale, dropping members the patch
	 * omits rather than matching them by identity.
	 *
	 * @covers ::replace
	 */
	public function test_replace_identity_for_key_id() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						'title',
						array(
							'id' => 'slug',
							'label' => 'Slug'
						)
					),
				),
			)
		);
		$data->replace(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id' => 'title',
							'label' => 'Changed'
						)
					),
				),
			),
			1
		);

		$this->assertSame( array(
			'form' => array(
				'fields' => array(
					array(
						'id' => 'title',
						'label' => 'Changed'
					)
				),
			),
			),
			$data->get_data()
		);
	}

	/**
	 * replace() swaps a slug-keyed list wholesale.
	 *
	 * @covers ::replace
	 */
	public function test_replace_identity_for_key_slug() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'view_list' => array(
					array(
						'slug'  => 'all',
						'title' => 'All',
					),
					array(
						'slug'  => 'published',
						'title' => 'Published',
					),
				),
			)
		);
		$data->replace(
			array(
				'view_list' => array(
					array(
						'slug'  => 'all',
						'title' => 'Changed',
					)
				),
			),
			1
		);

		$this->assertSame( array(
			'view_list' => array(
				array(
					'slug'  => 'all',
					'title' => 'Changed',
				),
			),
			),
			$data->get_data()
		);
	}

	/**
	 * replace() swaps a field-keyed list wholesale: the matched member's
	 * untouched props (e.g. `value`) are dropped rather than preserved, which
	 * is exactly where it diverges from merge().
	 *
	 * @covers ::replace
	 */
	public function test_replace_identity_for_key_field() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'filters' => array(
						array( 'field' => 'id1', 'operator' => 'op1', 'value' => [ 'val1' ] ),
					)
				),
			)
		);
		$data->replace(
			array(
				'default_view' => array(
					'filters' => array(
						array( 'field' => 'id1', 'operator' => 'change' ),
					)
				),
			),
			1
		);

		$this->assertSame( array(
			'default_view' => array(
				'filters' => array(
					array( 'field' => 'id1', 'operator' => 'change' ),
				)
			),
			),
			$data->get_data()
		);
	}

	/**
	 * merge() updates scalar property values
	 *
	 * @covers ::merge
	 */
	public function test_merge_scalar_properties() {
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
			$data->get_data()['default_view']
		);
	}

	/**
	 * merge() updates object property values
	 *
	 * @covers ::merge
	 */
	public function test_merge_associative_array_properties() {
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
			$data->get_data()
		);
	}

	/**
	 * merge() updates list property values, including an identity-keyed
	 * view_list whose matching entries merge in place by slug (keeping their
	 * position and deep-merging nested props) while unknown ones are appended.
	 *
	 * @covers ::merge
	 */
	public function test_merge_indexed_array_properties() {
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
				'view_list' => array(
					array(
						'title' => 'All',
						'slug'  => 'all',
					),
					array(
						'title' => 'Published',
						'slug'  => 'published',
						'view'  => array(
							'type' => 'list',
							'sort' => array(
								'field'     => 'title',
								'direction' => 'asc',
							),
						),
					),
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
				'view_list' => array(
					array(
						'slug'  => 'published',
						'title' => 'Live',
						'view'  => array(
							'sort' => array( 'direction' => 'desc' ),
						),
					),
					array(
						'slug'  => 'mine',
						'title' => 'Mine',
					),
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
			'view_list' => array(
				array(
					'title' => 'All',
					'slug'  => 'all',
				),
				array(
					'title' => 'Live',
					'slug'  => 'published',
					'view'  => array(
						'type' => 'list',
						'sort' => array(
							'field'     => 'title',
							'direction' => 'desc',
						),
					),
				),
				array(
					'slug'  => 'mine',
					'title' => 'Mine',
				),
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
			$data->get_data()
		);
	}

	/**
	 * merge() unsets a property when the patch value is null.
	 *
	 * @covers ::merge
	 */
	public function test_merge_null_unsets_scalar_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 20,
				),
			)
		);
		$data->merge( array( 'default_view' => array( 'perPage' => null ) ), 1 );

		$this->assertSame( array( 'type' => 'table' ), $data->get_data()['default_view'] );
	}

	/**
	 * merge() unsets a deeply nested layout property when the value is null.
	 *
	 * @covers ::merge
	 */
	public function test_merge_null_unsets_associative_array_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'   => 'table',
					'sort'    => array(
						'field'     => 'title',
						'direction' => 'asc',
					)
				),
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
			array(
				'default_view' => array(
					'sort' => null
				),
				'default_layouts' => array(
					'table' => array( 'layout' => array( 'styles' => null ) ) )
				),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'type' => 'table',
				),
				'default_layouts' => array(
					'table' => array( 'layout' => array( 'density' => 'compact' ) ),
				)
			),
			$data->get_data()
		);
	}

	/**
	 * merge() unsets a deeply nested layout property when the value is null.
	 *
	 * @covers ::merge
	 */
	public function test_merge_null_unsets_indexed_array_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'   => 'table',
					'filters'    => array(
						array( 'field' => 'id1', 'operator' => 'op1', 'value' => [ 'val1' ] ),
					)
				),
				'default_layouts' => array(
					'grid' => array(
						'layout' => array(
							'density' => 'compact',
							'badgeFields'  => array( 'b1', 'b2' ),
						),
					),
				),
			)
		);
		$data->merge(
			array(
				'default_view' => array(
					'filters' => null
				),
				'default_layouts' => array(
					'grid' => array( 'layout' => array( 'badgeFields' => null ) ) )
				),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'type' => 'table',
				),
				'default_layouts' => array(
					'grid' => array( 'layout' => array( 'density' => 'compact' ) ),
				)
			),
			$data->get_data()
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
	public function test_merge_null_unsets_top_level_keys() {
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
			$data->get_data()
		);
	}

	/**
	 * merge() rejects a patch with an invalid version.
	 *
	 * @covers ::merge
	 */
	public function test_merge_rejects_updates_with_invalid_version() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::merge' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = $data->get_data();

		$version = Gutenberg_View_Config_Data::LATEST_VERSION + 1;
		$data->merge( array( 'default_view' => array( 'type' => 'grid' ) ), $version );

		$this->assertSame( $before, $data->get_data() );
	}

	/**
	 * merge() rejects an undocumented top-level key. Nested
	 * properties are not validated: their vocabulary is owned by the
	 * client-side consumers.
	 *
	 * @covers ::merge
	 */
	public function test_merge_rejects_unknown_key() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::merge' );

		$data = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$data->merge( array( 'not_a_real_key' => 'nope' ), 1 );

		$this->assertSame( array( 'default_view' => array( 'type' => 'table' ) ), $data->get_data() );
	}


	public function test_identity_for_scalars(){
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'fields' => array(
						'title'
					),
				),
			)
		);
		$data->merge(
			array(
				'default_view' => array(
					'fields' => array(
						'title',
						'slug'
					),
				),
			),
			1
		);

		$this->assertSame( array(
			'default_view' => array(
				'fields' => array(
					'title',
					'slug'
				),
			),
			),
			$data->get_data()
		);
	}

	public function test_identity_for_key_id(){
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						'title', // this scalar will be matched with array( 'id' => 'title' )
						array(
							'id' => 'slug',
							'label' => 'Slug'
						)
					),
				),
			)
		);
		$data->merge(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id' => 'title',
							'label' => 'Changed'
						),
						array(
							'id' => 'slug',
							'label' => 'Changed'
						)
					),
				),
			),
			1
		);

		$this->assertSame( array(
			'form' => array(
				'fields' => array(
					array(
						'id' => 'title',
						'label' => 'Changed'
					),
					array(
						'id' => 'slug',
						'label' => 'Changed'
					)
				),
			),
			),
			$data->get_data()
		);
	}

	public function test_identity_for_key_slug(){
		$data = new Gutenberg_View_Config_Data(
			array(
				'view_list' => array(
					array(
						'slug'  => 'all',
						'title' => 'All',
					),
				),
			)
		);
		$data->merge(
			array(
				'view_list' => array(
					array(
						'slug'  => 'all',
						'title' => 'Changed',
					)
				),
			),
			1
		);

		$this->assertSame( array(
			'view_list' => array(
				array(
					'slug'  => 'all',
					'title' => 'Changed',
				),
			),
			),
			$data->get_data()
		);
	}

	public function test_identity_for_key_field(){
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'filters' => array(
						array( 'field' => 'id1', 'operator' => 'op1', 'value' => [ 'val1' ] ),
					)
				),
			)
		);
		$data->merge(
			array(
				'default_view' => array(
					'filters' => array(
						array( 'field' => 'id1', 'operator' => 'change' ),
					)
				),
			),
			1
		);

		$this->assertSame( array(
			'default_view' => array(
				'filters' => array(
					array( 'field' => 'id1', 'operator' => 'change', 'value' => [ 'val1' ] ),
				)
			),
			),
			$data->get_data()
		);
	}

}
