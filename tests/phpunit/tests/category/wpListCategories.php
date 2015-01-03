<?php

/**
 * @group taxonomy
 */
class Tests_Category_WpListCategories extends WP_UnitTestCase {
	public function test_class() {
		$c = $this->factory->category->create();

		$found = wp_list_categories( array(
			'hide_empty' => false,
			'echo' => false,
		) );

		$this->assertContains( 'class="cat-item cat-item-' . $c . '"', $found );
	}

	public function test_class_containing_current_cat() {
		$c1 = $this->factory->category->create();
		$c2 = $this->factory->category->create();

		$found = wp_list_categories( array(
			'hide_empty' => false,
			'echo' => false,
			'current_category' => $c2,
		) );

		$this->assertNotRegExp( '/class="[^"]*cat-item-' . $c1 . '[^"]*current-cat[^"]*"/', $found );
		$this->assertRegExp( '/class="[^"]*cat-item-' . $c2 . '[^"]*current-cat[^"]*"/', $found );
	}

	public function test_class_containing_current_cat_parent() {
		$c1 = $this->factory->category->create();
		$c2 = $this->factory->category->create( array(
			'parent' => $c1,
		) );

		$found = wp_list_categories( array(
			'hide_empty' => false,
			'echo' => false,
			'current_category' => $c2,
		) );

		$this->assertRegExp( '/class="[^"]*cat-item-' . $c1 . '[^"]*current-cat-parent[^"]*"/', $found );
		$this->assertNotRegExp( '/class="[^"]*cat-item-' . $c2 . '[^"]*current-cat-parent[^"]*"/', $found );
	}

	/**
	 * @ticket 16792
	 */
	public function test_should_not_create_element_when_cat_name_is_filtered_to_empty_string() {
		$c1 = $this->factory->category->create( array(
			'name' => 'Test Cat 1',
		) );
		$c2 = $this->factory->category->create( array(
			'name' => 'Test Cat 2',
		) );

		add_filter( 'list_cats', array( $this, 'list_cats_callback' ) );
		$found = wp_list_categories( array(
			'hide_empty' => false,
			'echo' => false,
		) );
		remove_filter( 'list_cats', array( $this, 'list_cats_callback' ) );

		$this->assertContains( "cat-item-$c2", $found );
		$this->assertContains( 'Test Cat 2', $found );

		$this->assertNotContains( "cat-item-$c1", $found );
		$this->assertNotContains( 'Test Cat 1', $found );
	}

	public function list_cats_callback( $cat ) {
		if ( 'Test Cat 1' === $cat ) {
			return '';
		}

		return $cat;
	}
}
