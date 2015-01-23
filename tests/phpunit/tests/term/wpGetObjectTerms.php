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

	public function test_orderby_name() {
		$p = $this->factory->post->create();

		$t1 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'name' => 'AAA',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'name' => 'ZZZ',
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'name' => 'JJJ',
		) );

		wp_set_object_terms( $p, array( $t1, $t2, $t3 ), $this->taxonomy );

		$found = wp_get_object_terms( $p, $this->taxonomy, array(
			'orderby' => 'name',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $t1, $t3, $t2 ), $found );
	}

	public function test_orderby_count() {
		$posts = $this->factory->post->create_many( 3 );

		$t1 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'name' => 'AAA',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'name' => 'ZZZ',
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'name' => 'JJJ',
		) );

		wp_set_object_terms( $posts[0], array( $t3, $t2, $t1 ), $this->taxonomy );
		wp_set_object_terms( $posts[1], array( $t3, $t1 ), $this->taxonomy );
		wp_set_object_terms( $posts[2], array( $t3 ), $this->taxonomy );

		$found = wp_get_object_terms( $posts[0], $this->taxonomy, array(
			'orderby' => 'count',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $t2, $t1, $t3 ), $found );
	}

	public function test_orderby_slug() {
		$p = $this->factory->post->create();

		$t1 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'slug' => 'aaa',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'slug' => 'zzz',
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'slug' => 'jjj',
		) );

		wp_set_object_terms( $p, array( $t1, $t2, $t3 ), $this->taxonomy );

		$found = wp_get_object_terms( $p, $this->taxonomy, array(
			'orderby' => 'slug',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $t1, $t3, $t2 ), $found );
	}

	public function test_orderby_term_group() {
		$p = $this->factory->post->create();

		$t1 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );

		// No great way to do this in the API.
		global $wpdb;
		$wpdb->update( $wpdb->terms, array( 'term_group' => 1 ), array( 'term_id' => $t1 ) );
		$wpdb->update( $wpdb->terms, array( 'term_group' => 3 ), array( 'term_id' => $t2 ) );
		$wpdb->update( $wpdb->terms, array( 'term_group' => 2 ), array( 'term_id' => $t3 ) );

		wp_set_object_terms( $p, array( $t1, $t2, $t3 ), $this->taxonomy );

		$found = wp_get_object_terms( $p, $this->taxonomy, array(
			'orderby' => 'term_group',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $t1, $t3, $t2 ), $found );
	}

	public function test_orderby_term_order() {
		$p = $this->factory->post->create();

		$t1 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );

		$set = wp_set_object_terms( $p, array( $t1, $t2, $t3 ), $this->taxonomy );

		// No great way to do this in the API.
		$term_1 = get_term( $t1, $this->taxonomy );
		$term_2 = get_term( $t2, $this->taxonomy );
		$term_3 = get_term( $t3, $this->taxonomy );

		global $wpdb;
		$wpdb->update( $wpdb->term_relationships, array( 'term_order' => 1 ), array( 'term_taxonomy_id' => $term_1->term_taxonomy_id, 'object_id' => $p ) );
		$wpdb->update( $wpdb->term_relationships, array( 'term_order' => 3 ), array( 'term_taxonomy_id' => $term_2->term_taxonomy_id, 'object_id' => $p ) );
		$wpdb->update( $wpdb->term_relationships, array( 'term_order' => 2 ), array( 'term_taxonomy_id' => $term_3->term_taxonomy_id, 'object_id' => $p ) );

		$found = wp_get_object_terms( $p, $this->taxonomy, array(
			'orderby' => 'term_order',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $t1, $t3, $t2 ), $found );
	}

	/**
	 * @ticket 28688
	 */
	public function test_orderby_parent() {
		$p = $this->factory->post->create();

		$t1 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );

		$set = wp_set_object_terms( $p, array( $t1, $t2, $t3 ), $this->taxonomy );

		$term_1 = get_term( $t1, $this->taxonomy );
		$term_2 = get_term( $t2, $this->taxonomy );
		$term_3 = get_term( $t3, $this->taxonomy );

		global $wpdb;
		$wpdb->update( $wpdb->term_taxonomy, array( 'parent' => 1 ), array( 'term_taxonomy_id' => $term_1->term_taxonomy_id ) );
		$wpdb->update( $wpdb->term_taxonomy, array( 'parent' => 3 ), array( 'term_taxonomy_id' => $term_2->term_taxonomy_id ) );
		$wpdb->update( $wpdb->term_taxonomy, array( 'parent' => 2 ), array( 'term_taxonomy_id' => $term_3->term_taxonomy_id ) );

		$found = wp_get_object_terms( $p, $this->taxonomy, array(
			'orderby' => 'parent',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $t1, $t3, $t2 ), $found );
	}

	/**
	 * @ticket 28688
	 */
	public function test_orderby_taxonomy() {
		register_taxonomy( 'wptests_tax_2', 'post' );
		register_taxonomy( 'wptests_tax_3', 'post' );

		$p = $this->factory->post->create();

		$t1 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax_3',
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax_2',
		) );

		wp_set_object_terms( $p, $t1, $this->taxonomy );
		wp_set_object_terms( $p, $t2, 'wptests_tax_3' );
		wp_set_object_terms( $p, $t3, 'wptests_tax_2' );

		$found = wp_get_object_terms( $p, array( $this->taxonomy, 'wptests_tax_2', 'wptests_tax_3' ), array(
			'orderby' => 'taxonomy',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $t1, $t3, $t2 ), $found );
	}

	/**
	 * @ticket 28688
	 */
	public function test_orderby_tt_id() {
		$p = $this->factory->post->create();

		$t1 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );

		// term_taxonomy_id will only have a different order from term_id in legacy situations.
		$term_1 = get_term( $t1, $this->taxonomy );
		$term_2 = get_term( $t2, $this->taxonomy );
		$term_3 = get_term( $t3, $this->taxonomy );

		global $wpdb;
		$wpdb->update( $wpdb->term_taxonomy, array( 'term_taxonomy_id' => 100004 ), array( 'term_taxonomy_id' => $term_1->term_taxonomy_id ) );
		$wpdb->update( $wpdb->term_taxonomy, array( 'term_taxonomy_id' => 100006 ), array( 'term_taxonomy_id' => $term_2->term_taxonomy_id ) );
		$wpdb->update( $wpdb->term_taxonomy, array( 'term_taxonomy_id' => 100005 ), array( 'term_taxonomy_id' => $term_3->term_taxonomy_id ) );

		$set = wp_set_object_terms( $p, array( $t1, $t2, $t3 ), $this->taxonomy );

		$found = wp_get_object_terms( $p, $this->taxonomy, array(
			'orderby' => 'term_taxonomy_id',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $t1, $t3, $t2 ), $found );
	}

	public function test_order_desc() {
		$p = $this->factory->post->create();

		$t1 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'name' => 'AAA',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'name' => 'ZZZ',
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'name' => 'JJJ',
		) );

		wp_set_object_terms( $p, array( $t1, $t2, $t3 ), $this->taxonomy );

		$found = wp_get_object_terms( $p, $this->taxonomy, array(
			'orderby' => 'name',
			'order' => 'DESC',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $t2, $t3, $t1 ), $found );
	}

	/**
	 * @ticket 15675
	 */
	public function test_parent() {
		$t1 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'parent' => $t1,
		) );
		$t4 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'parent' => $t2,
		) );

		$p = $this->factory->post->create();

		wp_set_object_terms( $p, array( $t1, $t2, $t3, $t3 ), $this->taxonomy );

		$found = wp_get_object_terms( $p, $this->taxonomy, array(
			'parent' => $t1,
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $t3 ), $found );
	}

	/**
	 * @ticket 15675
	 */
	public function test_parent_0() {
		$t1 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'parent' => $t1,
		) );
		$t4 = $this->factory->term->create( array(
			'taxonomy' => $this->taxonomy,
			'parent' => $t2,
		) );

		$p = $this->factory->post->create();

		wp_set_object_terms( $p, array( $t1, $t2, $t3, $t3 ), $this->taxonomy );

		$found = wp_get_object_terms( $p, $this->taxonomy, array(
			'parent' => 0,
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $t1, $t2 ), $found );
	}

	public function filter_get_object_terms( $terms ) {
		$term_ids = wp_list_pluck( $terms, 'term_id' );
		// all terms should still be objects
		return $terms;
	}
}
