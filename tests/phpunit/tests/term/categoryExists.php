<?php

class Tests_Term_CategoryExists extends WP_UnitTestCase {
	/**
	 * @ticket 30975
	 */
	public function test_category_exists_should_return_only_top_level_categories_when_parent_is_0() {
		$c1 = $this->factory->category->create();
		$c2 = $this->factory->category->create( array(
			'name' => 'Foo',
			'parent' => $c1,
		) );
		$c3 = $this->factory->category->create( array(
			'name' => 'Foo',
		) );

		$found = category_exists( 'Foo', 0 );

		$this->assertEquals( $found, $c3 );
	}

	/**
	 * @ticket 30975
	 */
	public function test_category_exists_should_select_oldest_matching_category_when_no_parent_is_specified_1() {
		// Foo child of c1 is created first.
		$c1 = $this->factory->category->create();
		$c2 = $this->factory->category->create( array(
			'name' => 'Foo',
			'parent' => $c1,
		) );
		$c3 = $this->factory->category->create( array(
			'name' => 'Foo',
		) );

		$found = category_exists( 'Foo' );

		$this->assertEquals( $found, $c2 );
	}

	/**
	 * @ticket 30975
	 */
	public function test_category_exists_should_select_oldest_matching_category_when_no_parent_is_specified_2() {
		// Top-level Foo is created first.
		$c1 = $this->factory->category->create();
		$c2 = $this->factory->category->create( array(
			'name' => 'Foo',
		) );
		$c3 = $this->factory->category->create( array(
			'name' => 'Foo',
			'parent' => $c1,
		) );

		$found = category_exists( 'Foo' );

		$this->assertEquals( $found, $c2 );
	}

	/**
	 * @ticket 30975
	 */
	public function test_category_exists_should_respect_nonempty_parent() {
		$c1 = $this->factory->category->create();
		$c2 = $this->factory->category->create( array(
			'name' => 'Foo',
			'parent' => $c1,
		) );
		$c3 = $this->factory->category->create( array(
			'name' => 'Foo',
		) );

		$found = category_exists( 'Foo', $c1 );

		$this->assertEquals( $found, $c2 );
	}
}
