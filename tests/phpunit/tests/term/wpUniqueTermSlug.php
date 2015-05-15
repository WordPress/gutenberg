<?php

/**
 * @group taxonomy
 */
class Tests_Term_WpUniqueTermSlug extends WP_UnitTestCase {
	public function setUp() {
		parent::setUp();
		register_taxonomy( 'wptests_tax1', 'post', array( 'hierarchical' => false ) );
		register_taxonomy( 'wptests_tax2', 'post', array( 'hierarchical' => true ) );
	}

	public function test_unique_slug_should_be_unchanged() {
		$term = $this->factory->term->create_and_get( array(
			'taxonomy' => 'wptests_tax1',
			'name' => 'foo',
			'slug' => 'foo',
		) );

		$actual = wp_unique_term_slug( 'bar', $term );
		$this->assertEquals( 'bar', $actual );
	}

	public function test_nonunique_slug_in_different_taxonomy_should_be_unchanged() {
		$term1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'name' => 'bar',
			'slug' => 'bar',
		) );

		$term2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax1',
			'name' => 'foo',
			'slug' => 'foo',
		) );
		$term2_object = get_term( $term2, 'wptests_tax1' );

		$actual = wp_unique_term_slug( 'bar', $term2_object );
		$this->assertEquals( 'bar', $actual );
	}

	public function test_nonunique_slug_in_same_nonhierarchical_taxonomy_should_be_changed() {
		$term1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax1',
			'name' => 'bar',
			'slug' => 'bar',
		) );

		$term2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax1',
			'name' => 'foo',
			'slug' => 'foo',
		) );
		$term2_object = get_term( $term2, 'wptests_tax1' );

		$actual = wp_unique_term_slug( 'bar', $term2_object );
		$this->assertEquals( 'bar-2', $actual );
	}

	public function test_nonunique_slug_in_same_hierarchical_taxonomy_with_same_parent_should_be_suffixed_with_parent_slug() {
		$parent = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'parent-term',
		) );

		$term1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'name' => 'bar',
			'slug' => 'bar',
			'parent' => $parent,
		) );

		$term2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'name' => 'foo',
			'slug' => 'foo',
			'parent' => $parent,
		) );
		$term2_object = get_term( $term2, 'wptests_tax2' );

		$actual = wp_unique_term_slug( 'bar', $term2_object );
		$this->assertEquals( 'bar-parent-term', $actual );
	}

	public function test_nonunique_slug_in_same_hierarchical_taxonomy_at_different_level_of_hierarchy_should_be_suffixed_with_number() {
		$parent = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'slug' => 'parent-term',
		) );

		$term1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'name' => 'bar',
			'slug' => 'bar',
			'parent' => $parent,
		) );

		$term2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax2',
			'name' => 'foo',
			'slug' => 'foo',
		) );
		$term2_object = get_term( $term2, 'wptests_tax2' );

		$actual = wp_unique_term_slug( 'bar', $term2_object );
		$this->assertEquals( 'bar-2', $actual );
	}
}
