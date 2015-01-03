<?php

/**
 * @group category
 */
class Tests_Category_WpListCategories extends WP_UnitTestCase {
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
