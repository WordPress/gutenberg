<?php

/**
 * @group taxonomy
 * @covers ::wp_get_object_terms
 */
class Tests_Term_WpGetObjectTerms extends WP_UnitTestCase {
	private $taxonomy = 'wptests_tax';

	public function setUp() {
		parent::setUp();
		register_taxonomy( 'wptests_tax', 'post' );
	}

	public function test_get_object_terms_by_slug() {
		$post_id = $this->factory->post->create();

		$terms_1 = array('Foo', 'Bar', 'Baz');
		$terms_1_slugs = array('foo', 'bar', 'baz');

		// set the initial terms
		$tt_1 = wp_set_object_terms( $post_id, $terms_1, $this->taxonomy );
		$this->assertEquals( 3, count($tt_1) );

		// make sure they're correct
		$terms = wp_get_object_terms($post_id, $this->taxonomy, array('fields' => 'slugs', 'orderby' => 't.term_id'));
		$this->assertEquals( $terms_1_slugs, $terms );
	}

	/**
	 * @ticket 11003
	 */
	public function test_should_not_filter_out_duplicate_terms_associated_with_different_objects() {
		$post_id1 = $this->factory->post->create();
		$post_id2 = $this->factory->post->create();
		$cat_id = $this->factory->category->create();
		$cat_id2 = $this->factory->category->create();
		wp_set_post_categories( $post_id1, array( $cat_id, $cat_id2 ) );
		wp_set_post_categories( $post_id2, $cat_id );

		$terms = wp_get_object_terms( array( $post_id1, $post_id2 ), 'category' );
		$this->assertCount( 2, $terms );
		$this->assertEquals( array( $cat_id, $cat_id2 ), wp_list_pluck( $terms, 'term_id' ) );

		$terms2 = wp_get_object_terms( array( $post_id1, $post_id2 ), 'category', array(
			'fields' => 'all_with_object_id'
		) );

		$this->assertCount( 3, $terms2 );
		$this->assertEquals( array( $cat_id, $cat_id, $cat_id2 ), wp_list_pluck( $terms2, 'term_id' ) );
	}

	/**
	 * @ticket 17646
	 */
	public function test_should_return_objects_with_int_properties() {
		$post_id = $this->factory->post->create();
		$term = wp_insert_term( 'one', $this->taxonomy );
		wp_set_object_terms( $post_id, $term, $this->taxonomy );

		$terms = wp_get_object_terms( $post_id, $this->taxonomy, array( 'fields' => 'all_with_object_id' ) );
		$term = array_shift( $terms );
		$int_fields = array( 'parent', 'term_id', 'count', 'term_group', 'term_taxonomy_id', 'object_id' );
		foreach ( $int_fields as $field )
			$this->assertInternalType( 'int', $term->$field, $field );

		$terms = wp_get_object_terms( $post_id, $this->taxonomy, array( 'fields' => 'ids' ) );
		$term = array_shift( $terms );
		$this->assertInternalType( 'int', $term, 'term' );
	}

	/**
	 * @ticket 26339
	 */
	public function test_references_should_be_reset_after_wp_get_object_terms_filter() {
		$post_id = $this->factory->post->create();
		$terms_1 = array('foo', 'bar', 'baz');

		wp_set_object_terms( $post_id, $terms_1, $this->taxonomy );
		add_filter( 'wp_get_object_terms', array( $this, 'filter_get_object_terms' ) );
		$terms = wp_get_object_terms( $post_id, $this->taxonomy );
		remove_filter( 'wp_get_object_terms', array( $this, 'filter_get_object_terms' ) );
		foreach ( $terms as $term ) {
			$this->assertInternalType( 'object', $term );
		}
	}

	public function filter_get_object_terms( $terms ) {
		$term_ids = wp_list_pluck( $terms, 'term_id' );
		// all terms should still be objects
		return $terms;
	}
}
