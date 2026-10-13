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
	 * Reads the materialized configuration out of a container for assertions.
	 *
	 * The container keeps `get_data()` private so filter callbacks cannot read
	 * the built result; the tests reach it through reflection instead.
	 *
	 * @param Gutenberg_View_Config_Data $data The container to read from.
	 * @return array The materialized configuration.
	 */
	private static function read_config( Gutenberg_View_Config_Data $data ) {
		$property = new ReflectionProperty( 'Gutenberg_View_Config_Data', 'config' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}

		return $property->getValue( $data );
	}

	/**
	 * set() replaces the whole value of each top-level key it names, dropping
	 * whatever that key held before instead of merging into it, while a key the
	 * patch omits (`form`) is left untouched. This is where it diverges from
	 * replace(), which would keep the untouched props under `default_view`.
	 *
	 * @covers ::set
	 */
	public function test_set_replaces_named_keys_and_leaves_the_rest() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'       => 'table',
					'perPage'    => 23,
					'showLevels' => true,
					'fields'     => array( 'f1', 'f2' ),
					'sort'       => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			)
		);
		$data->set(
			array(
				'default_view' => array(
					'type' => 'table',
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'type' => 'table',
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * set() resets a top-level key to its default when the patch value is null,
	 * leaving the keys it does not name in place.
	 *
	 * @covers ::set
	 */
	public function test_set_null_resets_top_level_key_to_defaults() {
		$defaults = array(
			'default_view' => array( 'type' => 'table' ),
			'form'         => array( 'layout' => array( 'type' => 'panel' ) ),
		);
		$data     = new Gutenberg_View_Config_Data( $defaults );
		$data->set(
			array(
				'default_view' => array(
					'type' => 'grid',
				),
			),
			1
		);
		$data->set(
			array(
				'default_view' => null,
			),
			1
		);

		$this->assertSame(
			$defaults,
			self::read_config( $data )
		);
	}

	/**
	 * set() drops a property whose value in the patch is null.
	 *
	 * @covers ::set
	 */
	public function test_set_null_unsets_key() {
		$defaults = array(
			'default_view' => array(
				'type'    => 'table',
				'perPage' => 20,
			),
			'form'         => array( 'layout' => array( 'type' => 'panel' ) ),
		);
		$data     = new Gutenberg_View_Config_Data( $defaults );
		$data->set(
			array(
				'default_view' => array(
					'type'    => 'grid',
					'perPage' => null,
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array( 'type' => 'grid' ),
				'form'         => array( 'layout' => array( 'type' => 'panel' ) ),
			),
			self::read_config( $data )
		);
	}

	/**
	 * set() rejects an undocumented top-level key and leaves the configuration
	 * untouched.
	 *
	 * @covers ::set
	 */
	public function test_set_rejects_unknown_key() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::set' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = self::read_config( $data );
		$data->set( array( 'not_a_real_key' => 'nope' ), 1 );

		$this->assertSame( $before, self::read_config( $data ) );
	}

	/**
	 * set() rejects a patch with an unsupported version and leaves the
	 * configuration untouched.
	 *
	 * @covers ::set
	 */
	public function test_set_rejects_updates_with_invalid_version() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::set' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = self::read_config( $data );

		$version = Gutenberg_View_Config_Data::LATEST_VERSION + 1;
		$data->set( array( 'default_view' => array( 'type' => 'grid' ) ), $version );

		$this->assertSame( $before, self::read_config( $data ) );
	}

	/**
	 * remove() with a bare top-level key resets that key to its default — just
	 * like a `null` value does — rather than dropping it, while a key the spec
	 * omits (`form`) is left untouched.
	 *
	 * @covers ::remove
	 */
	public function test_remove_top_level_key_resets_to_defaults() {
		$defaults = array(
			'default_view' => array(
				'type'       => 'table',
				'perPage'    => 23,
				'showLevels' => true,
				'fields'     => array( 'f1', 'f2' ),
				'sort'       => array(
					'field'     => 'title',
					'direction' => 'asc',
				),
			),
			'form'         => array(
				'fields' => array( 'f1', 'f2' ),
			),
		);
		$data     = new Gutenberg_View_Config_Data( $defaults );
		// Mutate the key, then remove it: removal restores its default.
		$data->merge( array( 'default_view' => array( 'type' => 'grid' ) ), 1 );
		$data->remove( array( 'default_view' ), 1 );

		$this->assertSame( $defaults, self::read_config( $data ) );
	}

	/**
	 * remove() deletes a named scalar property from within a top-level key.
	 *
	 * @covers ::remove
	 */
	public function test_remove_deletes_scalar_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'       => 'table',
					'perPage'    => 23,
					'showLevels' => true,
					'fields'     => array( 'f1', 'f2' ),
					'sort'       => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			)
		);
		$data->remove( array( 'default_view' => array( 'showLevels' ) ), 1 );

		$this->assertSame(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 23,
					'fields'  => array( 'f1', 'f2' ),
					'sort'    => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * remove() deletes a named associative-array property from within a
	 * top-level key.
	 *
	 * @covers ::remove
	 */
	public function test_remove_deletes_associative_array_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'       => 'table',
					'perPage'    => 23,
					'showLevels' => true,
					'fields'     => array( 'f1', 'f2' ),
					'sort'       => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			)
		);
		$data->remove( array( 'default_view' => array( 'sort' ) ), 1 );

		$this->assertSame(
			array(
				'default_view' => array(
					'type'       => 'table',
					'perPage'    => 23,
					'showLevels' => true,
					'fields'     => array( 'f1', 'f2' ),
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * remove() deletes a named list property from within a top-level key.
	 *
	 * @covers ::remove
	 */
	public function test_remove_deletes_indexed_array_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'       => 'table',
					'perPage'    => 23,
					'showLevels' => true,
					'fields'     => array( 'f1', 'f2' ),
					'sort'       => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			)
		);
		$data->remove( array( 'default_view' => array( 'fields' ) ), 1 );

		$this->assertSame(
			array(
				'default_view' => array(
					'type'       => 'table',
					'perPage'    => 23,
					'showLevels' => true,
					'sort'       => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * remove() deletes a single member from a list property and renumbers
	 * the list.
	 *
	 * @covers ::remove
	 */
	public function test_remove_deletes_items_in_indexed_array_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'       => 'table',
					'perPage'    => 23,
					'showLevels' => true,
					'fields'     => array( 'f1', 'f2', 'f3' ),
					'sort'       => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			)
		);
		$data->remove( array( 'default_view' => array( 'fields' => array( 'f2' ) ) ), 1 );

		$this->assertSame(
			array(
				'default_view' => array(
					'type'       => 'table',
					'perPage'    => 23,
					'showLevels' => true,
					'fields'     => array( 'f1', 'f3' ),
					'sort'       => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * replace() merges scalar and associative properties within a documented
	 * key just like merge() does — the untouched `fields` and `sort` under
	 * default_view survive; only the keys the patch names change.
	 *
	 * @covers ::replace
	 */
	public function test_replace_scalar_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'       => 'table',
					'perPage'    => 23,
					'showLevels' => true,
					'fields'     => array( 'f1', 'f2' ),
					'sort'       => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			)
		);
		$data->replace(
			array(
				'default_view' => array(
					'type'       => 'grid',
					'perPage'    => 50,
					'showLevels' => false,
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'type'       => 'grid',
					'perPage'    => 50,
					'showLevels' => false,
					'fields'     => array( 'f1', 'f2' ),
					'sort'       => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'form'         => array(
					'fields' => array( 'f1', 'f2' ),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * replace() rejects an undocumented top-level key and leaves the
	 * configuration untouched.
	 *
	 * @covers ::replace
	 */
	public function test_replace_rejects_unknown_key() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::replace' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = self::read_config( $data );
		$data->replace( array( 'not_a_real_key' => 'nope' ), 1 );

		$this->assertSame( $before, self::read_config( $data ) );
	}

	/**
	 * replace() rejects a patch with an unsupported version and leaves the
	 * configuration untouched.
	 *
	 * @covers ::replace
	 */
	public function test_replace_rejects_updates_with_invalid_version() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::replace' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = self::read_config( $data );

		$version = Gutenberg_View_Config_Data::LATEST_VERSION + 1;
		$data->replace( array( 'default_view' => array( 'type' => 'grid' ) ), $version );

		$this->assertSame( $before, self::read_config( $data ) );
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
				'default_view'    => array(
					'sort' => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'default_layouts' => array(
					'table' => array(
						'layout' => array(
							'styles'       => array(
								'width' => 1,
							),
							'density'      => 'd2',
							'enableMoving' => true,
						),
					),
				),
				'form'            => array(
					'layout' => array(
						'type'          => 'panel',
						'labelPosition' => 'top',
						'openAs'        => array(
							'type'       => 'modal',
							'applyLabel' => 'Apply',
						),
					),
				),
			)
		);
		$data->replace(
			array(
				'default_view'    => array(
					'sort' => array(
						'direction' => 'desc',
					),
				),
				'default_layouts' => array(
					'table' => array(
						'layout' => array(
							'styles'  => array(
								'minWidth' => 2,
							),
							'density' => 'd2',
						),
					),
				),
				'form'            => array(
					'layout' => array(
						'type'          => 'panel',
						'labelPosition' => 'side',
						'openAs'        => array(
							'type' => 'drawer',
						),
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view'    => array(
					'sort' => array(
						'field'     => 'title',
						'direction' => 'desc',
					),
				),
				'default_layouts' => array(
					'table' => array(
						'layout' => array(
							'styles'       => array(
								'width'    => 1,
								'minWidth' => 2,
							),
							'density'      => 'd2',
							'enableMoving' => true,
						),
					),
				),
				'form'            => array(
					'layout' => array(
						'type'          => 'panel',
						'labelPosition' => 'side',
						'openAs'        => array(
							'type'       => 'drawer',
							'applyLabel' => 'Apply',
						),
					),
				),
			),
			self::read_config( $data )
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
					'fields'  => array(
						array( 'title' ),
					),
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'op1',
							'value'    => array( 'val1' ),
						),
					),
					'layout'  => array(
						'badgeFields' => array( 'b1', 'b2' ),
					),
				),
				'view_list'    => array(
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
				'form'         => array(
					'layout' => array(
						'summary' => array( 'f1' ),
					),
					'fields' => array(
						'f1',
						array(
							'id'       => 'f2',
							'label'    => 'Field label',
							'children' => array(
								'child1',
								array(
									'id'    => 'child2',
									'label' => 'Child 2 label',
								),
							),
						),
						'f3',
					),
				),
			)
		);
		$data->replace(
			array(
				'default_view' => array(
					'fields'  => array(
						array( 'slug' ),
					),
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'change',
							'isLocked' => true,
						),
						array(
							'field'    => 'id2',
							'operator' => 'op2',
							'value'    => array( 'val2' ),
						),
					),
					'layout'  => array(
						'badgeFields' => array( 'b2' ),
					),
				),
				'view_list'    => array(
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
				'form'         => array(
					'layout' => array(
						'summary' => array( 'f2' ),
					),
					'fields' => array(
						'f4',
						array(
							'id'       => 'f2',
							'label'    => 'Updated label',
							'children' => array(
								array(
									'id'    => 'child2',
									'label' => 'Child 2 updated label',
								),
								array(
									'id'    => 'child3',
									'label' => 'Child 3 label',
								),
							),
						),
						array(
							'id'    => 'f3',
							'label' => 'Field 3 label',
						),
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'fields'  => array(
						array( 'slug' ),
					),
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'change',
							'isLocked' => true,
						),
						array(
							'field'    => 'id2',
							'operator' => 'op2',
							'value'    => array( 'val2' ),
						),
					),
					'layout'  => array(
						'badgeFields' => array( 'b2' ),
					),
				),
				'view_list'    => array(
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
				'form'         => array(
					'layout' => array(
						'summary' => array( 'f2' ),
					),
					'fields' => array(
						'f4',
						array(
							'id'       => 'f2',
							'label'    => 'Updated label',
							'children' => array(
								array(
									'id'    => 'child2',
									'label' => 'Child 2 updated label',
								),
								array(
									'id'    => 'child3',
									'label' => 'Child 3 label',
								),
							),
						),
						array(
							'id'    => 'f3',
							'label' => 'Field 3 label',
						),
					),
				),
			),
			self::read_config( $data )
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

		$this->assertSame( array( 'type' => 'table' ), self::read_config( $data )['default_view'] );
	}

	/**
	 * replace() unsets a deeply nested layout property when the value is null.
	 *
	 * @covers ::replace
	 */
	public function test_replace_null_unsets_associative_array_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view'    => array(
					'type' => 'table',
					'sort' => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
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
				'default_view'    => array(
					'sort' => null,
				),
				'default_layouts' => array(
					'table' => array( 'layout' => array( 'styles' => null ) ),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view'    => array(
					'type' => 'table',
				),
				'default_layouts' => array(
					'table' => array( 'layout' => array( 'density' => 'compact' ) ),
				),
			),
			self::read_config( $data )
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
				'default_view'    => array(
					'type'    => 'table',
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'op1',
							'value'    => array( 'val1' ),
						),
					),
				),
				'default_layouts' => array(
					'grid' => array(
						'layout' => array(
							'density'     => 'compact',
							'badgeFields' => array( 'b1', 'b2' ),
						),
					),
				),
			)
		);
		$data->replace(
			array(
				'default_view'    => array(
					'filters' => null,
				),
				'default_layouts' => array(
					'grid' => array( 'layout' => array( 'badgeFields' => null ) ),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view'    => array(
					'type' => 'table',
				),
				'default_layouts' => array(
					'grid' => array( 'layout' => array( 'density' => 'compact' ) ),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * replace() resets a whole top-level key to its default when the patch value
	 * is null — any documented key, including the identity-keyed view_list —
	 * rather than storing a literal null.
	 *
	 * @covers ::replace
	 */
	public function test_replace_null_resets_top_level_keys_to_defaults() {
		$defaults = array(
			'default_view' => array( 'type' => 'table' ),
			'view_list'    => array(
				array(
					'title' => 'All',
					'slug'  => 'all',
				),
			),
			'form'         => array( 'layout' => array( 'type' => 'panel' ) ),
		);
		$data     = new Gutenberg_View_Config_Data( $defaults );
		// Mutate the keys, then null them: each resets to its default.
		$data->replace(
			array(
				'default_view' => array( 'type' => 'grid' ),
				'view_list'    => array(
					array(
						'slug'  => 'mine',
						'title' => 'Mine',
					),
				),
			),
			1
		);
		$data->replace(
			array(
				'default_view' => null,
				'view_list'    => null,
			),
			1
		);

		$this->assertSame( $defaults, self::read_config( $data ) );
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
						'title',
					),
				),
			)
		);
		$data->replace(
			array(
				'default_view' => array(
					'fields' => array(
						'slug',
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'fields' => array(
						'slug',
					),
				),
			),
			self::read_config( $data )
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
							'id'    => 'slug',
							'label' => 'Slug',
						),
					),
				),
			)
		);
		$data->replace(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'    => 'title',
							'label' => 'Changed',
						),
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'    => 'title',
							'label' => 'Changed',
						),
					),
				),
			),
			self::read_config( $data )
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
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'view_list' => array(
					array(
						'slug'  => 'all',
						'title' => 'Changed',
					),
				),
			),
			self::read_config( $data )
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
						array(
							'field'    => 'id1',
							'operator' => 'op1',
							'value'    => array( 'val1' ),
						),
					),
				),
			)
		);
		$data->replace(
			array(
				'default_view' => array(
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'change',
						),
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'change',
						),
					),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * replace() drops a null member from an incoming list rather than storing
	 * it: a list still replaces the current one wholesale, but a literal null
	 * member carries no meaning and must not be persisted — at the top level
	 * (`view_list`) or nested (`default_view.filters`) alike.
	 *
	 * @covers ::replace
	 */
	public function test_replace_ignores_null_list_members() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'view_list'    => array(
					array(
						'slug'  => 'all',
						'title' => 'All',
					),
				),
				'default_view' => array(
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'op1',
						),
					),
				),
			)
		);
		$data->replace(
			array(
				'view_list'    => array(
					null,
					array(
						'slug'  => 'mine',
						'title' => 'Mine',
					),
				),
				'default_view' => array( 'filters' => array( null ) ),
			),
			1
		);

		$this->assertSame(
			array(
				'view_list'    => array(
					array(
						'slug'  => 'mine',
						'title' => 'Mine',
					),
				),
				'default_view' => array(
					'filters' => array(),
				),
			),
			self::read_config( $data )
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
					'type'       => 'table',
					'perPage'    => 20,
					'showLevels' => false,
				),
			)
		);
		$data->merge(
			array(
				'default_view' => array(
					'type'       => 'grid',
					'perPage'    => 50,
					'showLevels' => false,
				),
			),
			1
		);

		$this->assertSame(
			array(
				'type'       => 'grid',
				'perPage'    => 50,
				'showLevels' => false,
			),
			self::read_config( $data )['default_view']
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
				'default_view'    => array(
					'sort' => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
				'default_layouts' => array(
					'table' => array(
						'layout' => array(
							'styles'       => array(
								'width' => 1,
							),
							'density'      => 'd2',
							'enableMoving' => true,
						),
					),
				),
				'form'            => array(
					'layout' => array(
						'type'          => 'panel',
						'labelPosition' => 'top',
						'openAs'        => array(
							'type'       => 'modal',
							'applyLabel' => 'Apply',
						),
					),
				),
			)
		);
		$data->merge(
			array(
				'default_view'    => array(
					'sort' => array(
						'direction' => 'desc',
					),
				),
				'default_layouts' => array(
					'table' => array(
						'layout' => array(
							'styles'  => array(
								'minWidth' => 2,
							),
							'density' => 'd2',
						),
					),
				),
				'form'            => array(
					'layout' => array(
						'type'          => 'panel',
						'labelPosition' => 'side',
						'openAs'        => array(
							'type' => 'drawer',
						),
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view'    => array(
					'sort' => array(
						'field'     => 'title',
						'direction' => 'desc',
					),
				),
				'default_layouts' => array(
					'table' => array(
						'layout' => array(
							'styles'       => array(
								'width'    => 1,
								'minWidth' => 2,
							),
							'density'      => 'd2',
							'enableMoving' => true,
						),
					),
				),
				'form'            => array(
					'layout' => array(
						'type'          => 'panel',
						'labelPosition' => 'side',
						'openAs'        => array(
							'type'       => 'drawer',
							'applyLabel' => 'Apply',
						),
					),
				),
			),
			self::read_config( $data )
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
					'fields'  => array(
						array( 'title' ),
					),
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'op1',
							'value'    => array( 'val1' ),
						),
					),
					'layout'  => array(
						'badgeFields' => array( 'b1', 'b2' ),
					),
				),
				'view_list'    => array(
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
				'form'         => array(
					'layout' => array(
						'summary' => array( 'f1' ),
					),
					'fields' => array(
						'f1',
						array(
							'id'       => 'f2',
							'label'    => 'Field label',
							'children' => array(
								'child1',
								array(
									'id'    => 'child2',
									'label' => 'Child 2 label',
								),
							),
						),
						'f3',
					),
				),
			)
		);
		$data->merge(
			array(
				'default_view' => array(
					'fields'  => array(
						array( 'slug' ),
					),
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'change',
							'isLocked' => true,
						),
						array(
							'field'    => 'id2',
							'operator' => 'op2',
							'value'    => array( 'val2' ),
						),
					),
					'layout'  => array(
						'badgeFields' => array( 'b2' ),
					),
				),
				'view_list'    => array(
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
				'form'         => array(
					'layout' => array(
						'summary' => array( 'f2' ),
					),
					'fields' => array(
						'f4',
						array(
							'id'       => 'f2',
							'label'    => 'Updated label',
							'children' => array(
								array(
									'id'    => 'child2',
									'label' => 'Child 2 updated label',
								),
								array(
									'id'    => 'child3',
									'label' => 'Child 3 label',
								),
							),
						),
						array(
							'id'    => 'f3',
							'label' => 'Field 3 label',
						),
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'fields'  => array(
						array( 'title' ),
						array( 'slug' ),
					),
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'change',
							'value'    => array( 'val1' ),
							'isLocked' => true,
						),
						array(
							'field'    => 'id2',
							'operator' => 'op2',
							'value'    => array( 'val2' ),
						),
					),
					'layout'  => array(
						'badgeFields' => array( 'b1', 'b2' ),
					),
				),
				'view_list'    => array(
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
				'form'         => array(
					'layout' => array(
						'summary' => array( 'f1', 'f2' ),
					),
					'fields' => array(
						'f1',
						array(
							'id'       => 'f2',
							'label'    => 'Updated label',
							'children' => array(
								'child1',
								array(
									'id'    => 'child2',
									'label' => 'Child 2 updated label',
								),
								array(
									'id'    => 'child3',
									'label' => 'Child 3 label',
								),
							),
						),
						array(
							'id'    => 'f3',
							'label' => 'Field 3 label',
						),
						'f4',
					),
				),
			),
			self::read_config( $data )
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

		$this->assertSame( array( 'type' => 'table' ), self::read_config( $data )['default_view'] );
	}

	/**
	 * merge() unsets a deeply nested layout property when the value is null.
	 *
	 * @covers ::merge
	 */
	public function test_merge_null_unsets_associative_array_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view'    => array(
					'type' => 'table',
					'sort' => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
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
				'default_view'    => array(
					'sort' => null,
				),
				'default_layouts' => array(
					'table' => array( 'layout' => array( 'styles' => null ) ),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view'    => array(
					'type' => 'table',
				),
				'default_layouts' => array(
					'table' => array( 'layout' => array( 'density' => 'compact' ) ),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * merge() unsets a deeply nested list property when the value is null.
	 *
	 * @covers ::merge
	 */
	public function test_merge_null_unsets_indexed_array_properties() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view'    => array(
					'type'    => 'table',
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'op1',
							'value'    => array( 'val1' ),
						),
					),
				),
				'default_layouts' => array(
					'grid' => array(
						'layout' => array(
							'density'     => 'compact',
							'badgeFields' => array( 'b1', 'b2' ),
						),
					),
				),
			)
		);
		$data->merge(
			array(
				'default_view'    => array(
					'filters' => null,
				),
				'default_layouts' => array(
					'grid' => array( 'layout' => array( 'badgeFields' => null ) ),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view'    => array(
					'type' => 'table',
				),
				'default_layouts' => array(
					'grid' => array( 'layout' => array( 'density' => 'compact' ) ),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * merge() resets a whole top-level key to its default when the patch value
	 * is null — any documented key, including the identity-keyed view_list —
	 * rather than storing a literal null.
	 *
	 * @covers ::merge
	 */
	public function test_merge_null_resets_top_level_keys_to_defaults() {
		$defaults = array(
			'default_view' => array( 'type' => 'table' ),
			'view_list'    => array(
				array(
					'title' => 'All',
					'slug'  => 'all',
				),
			),
			'form'         => array( 'layout' => array( 'type' => 'panel' ) ),
		);
		$data     = new Gutenberg_View_Config_Data( $defaults );
		// Mutate the keys, then null them: each resets to its default.
		$data->merge(
			array(
				'default_view' => array( 'type' => 'grid' ),
				'view_list'    => array(
					array(
						'slug'  => 'mine',
						'title' => 'Mine',
					),
				),
			),
			1
		);
		$data->merge(
			array(
				'default_view' => null,
				'view_list'    => null,
			),
			1
		);

		$this->assertSame( $defaults, self::read_config( $data ) );
	}

	/**
	 * merge() rejects a patch with an invalid version.
	 *
	 * @covers ::merge
	 */
	public function test_merge_rejects_updates_with_invalid_version() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::merge' );

		$data   = new Gutenberg_View_Config_Data( array( 'default_view' => array( 'type' => 'table' ) ) );
		$before = self::read_config( $data );

		$version = Gutenberg_View_Config_Data::LATEST_VERSION + 1;
		$data->merge( array( 'default_view' => array( 'type' => 'grid' ) ), $version );

		$this->assertSame( $before, self::read_config( $data ) );
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

		$this->assertSame( array( 'default_view' => array( 'type' => 'table' ) ), self::read_config( $data ) );
	}

	/**
	 * merge() rejects an associative patch value where a list lives: the shapes
	 * do not line up, so merging would have to guess what the string keys mean.
	 * The current list survives untouched instead of being discarded.
	 *
	 * @covers ::merge
	 */
	public function test_merge_rejects_associative_patch_over_a_list() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::merge_properties' );

		$data   = new Gutenberg_View_Config_Data(
			array(
				'view_list' => array(
					array(
						'slug'  => 'all',
						'title' => 'All items',
					),
				),
			)
		);
		$before = self::read_config( $data );

		// The pre-7.1 slug-keyed shape, not the documented list of members.
		$data->merge(
			array(
				'view_list' => array(
					'published' => array( 'title' => 'Live' ),
				),
			),
			1
		);

		$this->assertSame( $before, self::read_config( $data ) );
	}

	/**
	 * merge() rejects a non-empty list patch value where an associative value
	 * lives, the mirror of the associative-over-list mismatch: the current map
	 * survives untouched instead of being discarded.
	 *
	 * @covers ::merge
	 */
	public function test_merge_rejects_list_patch_over_an_associative_value() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::merge_properties' );

		$data   = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'sort' => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
			)
		);
		$before = self::read_config( $data );

		$data->merge(
			array(
				'default_view' => array(
					'sort' => array( 'title', 'asc' ),
				),
			),
			1
		);

		$this->assertSame( $before, self::read_config( $data ) );
	}

	/**
	 * An empty array under merge() is a no-op for both shapes: it has no
	 * members to merge, and being shape-ambiguous it must not reset the
	 * current value either. Clearing a list is spelled replace() with an
	 * empty list; resetting a key is spelled null.
	 *
	 * @covers ::merge
	 */
	public function test_merge_empty_array_is_a_noop() {
		$data   = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'filters' => array(
						array(
							'field'    => 'author',
							'operator' => 'isAny',
						),
					),
					'sort'    => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
			)
		);
		$before = self::read_config( $data );

		$data->merge(
			array(
				'default_view' => array(
					'filters' => array(),
					'sort'    => array(),
				),
			),
			1
		);

		$this->assertSame( $before, self::read_config( $data ) );
	}

	/**
	 * A nested null deletes just the leaf it names in every case, including
	 * inside a list member that did not exist yet: an appended member has no
	 * existing leaf to delete, so its nulls are dropped rather than stored
	 * (the same rationale as set() and the lists replace() swaps in).
	 *
	 * @covers ::merge
	 */
	public function test_merge_appended_member_drops_nested_nulls() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'view_list' => array(
					array(
						'slug'  => 'all',
						'title' => 'All items',
					),
				),
			)
		);
		$data->merge(
			array(
				'view_list' => array(
					array(
						'slug' => 'mine',
						'view' => array( 'filters' => null ),
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'view_list' => array(
					array(
						'slug'  => 'all',
						'title' => 'All items',
					),
					array(
						'slug' => 'mine',
						'view' => array(),
					),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * replace() rejects a non-empty list patch value where an associative value
	 * lives, the same rule merge() enforces: a list in the patch replaces the
	 * current list wholesale, but it cannot land where a map lives. The current
	 * map survives untouched instead of being discarded.
	 *
	 * @covers ::replace
	 */
	public function test_replace_rejects_list_patch_over_an_associative_value() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_View_Config_Data::merge_properties' );

		$data   = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'sort' => array(
						'field'     => 'title',
						'direction' => 'asc',
					),
				),
			)
		);
		$before = self::read_config( $data );

		$data->replace(
			array(
				'default_view' => array(
					'sort' => array( 'title', 'asc' ),
				),
			),
			1
		);

		$this->assertSame( $before, self::read_config( $data ) );
	}

	/**
	 * An empty array is exempt from the shape guard, so replace() with an
	 * empty list stays the documented way to clear a list.
	 *
	 * @covers ::replace
	 */
	public function test_replace_empty_list_still_clears_a_list() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'view_list' => array(
					array(
						'slug'  => 'all',
						'title' => 'All items',
					),
				),
			)
		);

		$data->replace( array( 'view_list' => array() ), 1 );

		$this->assertSame( array( 'view_list' => array() ), self::read_config( $data ) );
	}


	/**
	 * merge() treats a scalar list member as its own identity: an incoming
	 * scalar that already appears is a no-op, and a new one is appended.
	 *
	 * @covers ::merge
	 */
	public function test_merge_identity_for_scalars() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'fields' => array(
						'title',
					),
				),
			)
		);
		$data->merge(
			array(
				'default_view' => array(
					'fields' => array(
						'title',
						'slug',
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'fields' => array(
						'title',
						'slug',
					),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * merge() matches list members by their `id`, and a bare scalar member
	 * (`'title'`) matches an incoming map carrying that same value
	 * (`array( 'id' => 'title' )`), merging into it in place.
	 *
	 * @covers ::merge
	 */
	public function test_merge_identity_for_key_id() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						'title', // this scalar will be matched with array( 'id' => 'title' )
						array(
							'id'    => 'slug',
							'label' => 'Slug',
						),
					),
				),
			)
		);
		$data->merge(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'    => 'title',
							'label' => 'Changed',
						),
						array(
							'id'    => 'slug',
							'label' => 'Changed',
						),
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'    => 'title',
							'label' => 'Changed',
						),
						array(
							'id'    => 'slug',
							'label' => 'Changed',
						),
					),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * merge() matches view_list members by their `slug`, merging an incoming
	 * view into the existing one of the same slug in place.
	 *
	 * @covers ::merge
	 */
	public function test_merge_identity_for_key_slug() {
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
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'view_list' => array(
					array(
						'slug'  => 'all',
						'title' => 'Changed',
					),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * merge() matches filter members by their `field`, merging the incoming
	 * member's keys onto the existing one so untouched props (e.g. `value`)
	 * are preserved — the behavior that distinguishes merge() from replace().
	 *
	 * @covers ::merge
	 */
	public function test_merge_identity_for_key_field() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'op1',
							'value'    => array( 'val1' ),
						),
					),
				),
			)
		);
		$data->merge(
			array(
				'default_view' => array(
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'change',
						),
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'default_view' => array(
					'filters' => array(
						array(
							'field'    => 'id1',
							'operator' => 'change',
							'value'    => array( 'val1' ),
						),
					),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * merge() ignores a null member in an incoming list: null carries no
	 * identity and holds nothing to merge, so it is dropped rather than
	 * appended as a literal null member — `view_list => array( null )` leaves
	 * the existing list untouched. The same applies to lists at any nesting
	 * level, such as `default_view.filters`.
	 *
	 * @covers ::merge
	 */
	public function test_merge_ignores_null_list_members() {
		$existing = array(
			'view_list'    => array(
				array(
					'slug'  => 'all',
					'title' => 'All',
				),
			),
			'default_view' => array(
				'filters' => array(
					array(
						'field'    => 'id1',
						'operator' => 'op1',
					),
				),
			),
		);
		$data     = new Gutenberg_View_Config_Data( $existing );
		$data->merge(
			array(
				'view_list'    => array( null ),
				'default_view' => array( 'filters' => array( null ) ),
			),
			1
		);

		$this->assertSame( $existing, self::read_config( $data ) );
	}

	/**
	 * A field written as a bare name means "show this field with the consumer's
	 * default props", so merging one over a field currently stored as a map resets
	 * it to defaults: the explicit overrides (here `layout`) are discarded and the
	 * member is left as the bare name. This mirrors the reverse — a map merged over
	 * a bare name *adds* overrides. Sibling members are untouched. To reset a single
	 * override without dropping the others, set that prop to `null` instead.
	 *
	 * @covers ::merge
	 */
	public function test_merge_bare_name_resets_field_to_defaults() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'     => 'featured_media',
							'layout' => array( 'type' => 'regular' ),
						),
						'author',
					),
				),
			)
		);
		$data->merge(
			array(
				'form' => array(
					'fields' => array( 'featured_media' ),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'form' => array(
					'fields' => array(
						'featured_media', // Reset to defaults: the `layout` override is discarded.
						'author',
					),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * The same reset-to-defaults rule applies at any nesting level. The parent
	 * field (`status`) merges in place and keeps its `label`, while the bare child
	 * name resets the matching child to defaults, discarding that child's `layout`.
	 *
	 * @covers ::merge
	 */
	public function test_merge_bare_name_resets_nested_child_to_defaults() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'       => 'status',
							'label'    => 'Status',
							'children' => array(
								array(
									'id'     => 'comment_status',
									'layout' => array( 'type' => 'regular' ),
								),
								'ping_status',
							),
						),
					),
				),
			)
		);
		$data->merge(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'       => 'status',
							'children' => array( 'comment_status' ),
						),
					),
				),
			),
			1
		);

		$this->assertSame(
			array(
				'form' => array(
					'fields' => array(
						array(
							'id'       => 'status',
							'label'    => 'Status',
							'children' => array(
								'comment_status', // Reset to defaults: the `layout` override is discarded.
								'ping_status',
							),
						),
					),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * A `null` value resets a top-level key to its default. A later merge()
	 * into that same key merges onto the restored default rather than onto an
	 * empty value, so the default's untouched props (`type`, `fields`) survive
	 * alongside the overridden one (`perPage`).
	 *
	 * @covers ::merge
	 */
	public function test_merge_after_null_merges_onto_defaults() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 10,
					'fields'  => array( 'title', 'author' ),
				),
				'form'         => array(
					'fields' => array( 'title' ),
				),
			)
		);

		$data->merge( array( 'default_view' => null ), 1 );
		$data->merge( array( 'default_view' => array( 'perPage' => 20 ) ), 1 );

		$this->assertSame(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 20,
					'fields'  => array( 'title', 'author' ),
				),
				'form'         => array(
					'fields' => array( 'title' ),
				),
			),
			self::read_config( $data )
		);
	}

	/**
	 * remove() with a bare top-level key resets it to its default, just like a
	 * `null` value does. A later merge() into that same key merges onto the
	 * restored default rather than onto an empty value, so the default's
	 * untouched props (`type`, `fields`) survive alongside the overridden one
	 * (`perPage`).
	 *
	 * @covers ::remove
	 * @covers ::merge
	 */
	public function test_merge_after_remove_merges_onto_defaults() {
		$data = new Gutenberg_View_Config_Data(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 10,
					'fields'  => array( 'title', 'author' ),
				),
				'form'         => array(
					'fields' => array( 'title' ),
				),
			)
		);

		$data->remove( array( 'default_view' ), 1 );
		$data->merge( array( 'default_view' => array( 'perPage' => 20 ) ), 1 );

		$this->assertSame(
			array(
				'default_view' => array(
					'type'    => 'table',
					'perPage' => 20,
					'fields'  => array( 'title', 'author' ),
				),
				'form'         => array(
					'fields' => array( 'title' ),
				),
			),
			self::read_config( $data )
		);
	}
}
