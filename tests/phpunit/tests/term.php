<?php

/**
 * @group taxonomy
 */
class Tests_Term extends WP_UnitTestCase {
	protected $taxonomy = 'category';
	protected static $post_ids = array();

	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_ids = $factory->post->create_many( 5 );
	}

	/**
	 * @ticket 29911
	 */
	public function test_wp_delete_term_should_invalidate_cache_for_child_terms() {
		register_taxonomy( 'wptests_tax', 'post', array(
			'hierarchical' => true,
		) );

		$parent = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$child = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'parent' => $parent,
			'slug' => 'foo',
		) );

		// Prime the cache.
		$child_term = get_term( $child, 'wptests_tax' );
		$this->assertSame( $parent, $child_term->parent );

		wp_delete_term( $parent, 'wptests_tax' );
		$child_term = get_term( $child, 'wptests_tax' );
		$this->assertSame( 0, $child_term->parent );
	}

	/**
	 * @ticket 5381
	 */
	function test_is_term_type() {
		// insert a term
		$term = rand_str();
		$t = wp_insert_term( $term, $this->taxonomy );
		$this->assertInternalType( 'array', $t );
		$term_obj = get_term_by('name', $term, $this->taxonomy);
		$this->assertEquals( $t['term_id'], term_exists($term_obj->slug) );

		// clean up
		$this->assertTrue( wp_delete_term($t['term_id'], $this->taxonomy) );
	}

	/**
	 * @ticket 15919
	 */
	function test_wp_count_terms() {
		$count = wp_count_terms( 'category', array( 'hide_empty' => true ) );
		// there are 5 posts, all Uncategorized
		$this->assertEquals( 1, $count );
	}

	/**
	 * @ticket 15475
	 */
	function test_wp_add_remove_object_terms() {
		$posts = self::$post_ids;
		$tags = self::factory()->tag->create_many( 5 );

		$tt = wp_add_object_terms( $posts[0], $tags[1], 'post_tag' );
		$this->assertEquals( 1, count( $tt ) );
		$this->assertEquals( array( $tags[1] ), wp_get_object_terms( $posts[0], 'post_tag', array( 'fields' => 'ids' ) ) );

		$three_tags = array( $tags[0], $tags[1], $tags[2] );
		$tt = wp_add_object_terms( $posts[1], $three_tags, 'post_tag' );
		$this->assertEquals( 3, count( $tt ) );
		$this->assertEquals( $three_tags, wp_get_object_terms( $posts[1], 'post_tag', array( 'fields' => 'ids' ) ) );

		$this->assertTrue( wp_remove_object_terms( $posts[0], $tags[1], 'post_tag' ) );
		$this->assertFalse( wp_remove_object_terms( $posts[0], $tags[0], 'post_tag' ) );
		$this->assertInstanceOf( 'WP_Error', wp_remove_object_terms( $posts[0], $tags[1], 'non_existing_taxonomy' ) );
		$this->assertTrue( wp_remove_object_terms( $posts[1], $three_tags, 'post_tag' ) );
		$this->assertEquals( 0, count( wp_get_object_terms( $posts[1], 'post_tag' ) ) );

		foreach ( $tags as $term_id )
			$this->assertTrue( wp_delete_term( $term_id, 'post_tag' ) );

		foreach ( $posts as $post_id )
			$this->assertTrue( (bool) wp_delete_post( $post_id ) );
	}

	/**
	 * @group category.php
	 */
	function test_term_is_ancestor_of( ) {
		$term = rand_str();
		$term2 = rand_str();

		$t = wp_insert_term( $term, 'category' );
		$this->assertInternalType( 'array', $t );
		$t2 = wp_insert_term( $term, 'category', array( 'parent' => $t['term_id'] ) );
		$this->assertInternalType( 'array', $t2 );
		if ( function_exists( 'term_is_ancestor_of' ) ) {
			$this->assertTrue( term_is_ancestor_of( $t['term_id'], $t2['term_id'], 'category' ) );
			$this->assertFalse( term_is_ancestor_of( $t2['term_id'], $t['term_id'], 'category' ) );
		}
		$this->assertTrue( cat_is_ancestor_of( $t['term_id'], $t2['term_id']) );
		$this->assertFalse( cat_is_ancestor_of( $t2['term_id'], $t['term_id']) );

		wp_delete_term($t['term_id'], 'category');
		wp_delete_term($t2['term_id'], 'category');
	}

	function test_wp_insert_delete_category() {
		$term = rand_str();
		$this->assertNull( category_exists( $term ) );

		$initial_count = wp_count_terms( 'category' );

		$t = wp_insert_category( array( 'cat_name' => $term ) );
		$this->assertTrue( is_numeric($t) );
		$this->assertNotWPError( $t );
		$this->assertTrue( $t > 0 );
		$this->assertEquals( $initial_count + 1, wp_count_terms( 'category' ) );

		// make sure the term exists
		$this->assertTrue( term_exists($term) > 0 );
		$this->assertTrue( term_exists($t) > 0 );

		// now delete it
		$this->assertTrue( wp_delete_category($t) );
		$this->assertNull( term_exists($term) );
		$this->assertNull( term_exists($t) );
		$this->assertEquals( $initial_count, wp_count_terms('category') );
	}

	/**
	 * @ticket 16550
	 */
	function test_wp_set_post_categories() {
		$post_id = self::$post_ids[0];
		$post = get_post( $post_id );

		$this->assertInternalType( 'array', $post->post_category );
		$this->assertEquals( 1, count( $post->post_category ) );
		$this->assertEquals( get_option( 'default_category' ), $post->post_category[0] );
		$term1 = wp_insert_term( 'Foo', 'category' );
		$term2 = wp_insert_term( 'Bar', 'category' );
		$term3 = wp_insert_term( 'Baz', 'category' );
		wp_set_post_categories( $post_id, array( $term1['term_id'], $term2['term_id'] ) );
		$this->assertEquals( 2, count( $post->post_category ) );
		$this->assertEquals( array( $term2['term_id'], $term1['term_id'] ) , $post->post_category );

		wp_set_post_categories( $post_id, $term3['term_id'], true );
		$this->assertEquals( array( $term2['term_id'], $term3['term_id'], $term1['term_id'] ) , $post->post_category );

		$term4 = wp_insert_term( 'Burrito', 'category' );
		wp_set_post_categories( $post_id, $term4['term_id'] );
		$this->assertEquals( array( $term4['term_id'] ), $post->post_category );

		wp_set_post_categories( $post_id, array( $term1['term_id'], $term2['term_id'] ), true );
		$this->assertEquals( array( $term2['term_id'], $term4['term_id'], $term1['term_id'] ), $post->post_category );

		wp_set_post_categories( $post_id, array(), true );
		$this->assertEquals( 1, count( $post->post_category ) );
		$this->assertEquals( get_option( 'default_category' ), $post->post_category[0] );

		wp_set_post_categories( $post_id, array() );
		$this->assertEquals( 1, count( $post->post_category ) );
		$this->assertEquals( get_option( 'default_category' ), $post->post_category[0] );
	}

	/**
	 * @ticket 25852
	 */
	function test_sanitize_term_field() {
		$term = wp_insert_term( 'foo', $this->taxonomy );

		$this->assertEquals( 0, sanitize_term_field( 'parent',  0, $term['term_id'], $this->taxonomy, 'raw' ) );
		$this->assertEquals( 1, sanitize_term_field( 'parent',  1, $term['term_id'], $this->taxonomy, 'raw' ) );
		$this->assertEquals( 0, sanitize_term_field( 'parent', -1, $term['term_id'], $this->taxonomy, 'raw' ) );
		$this->assertEquals( 0, sanitize_term_field( 'parent', '', $term['term_id'], $this->taxonomy, 'raw' ) );
	}

	private function assertPostHasTerms( $post_id, $expected_term_ids, $taxonomy ) {
		$assigned_term_ids = wp_get_object_terms( $post_id, $taxonomy, array(
			'fields' => 'ids'
		) );

		$this->assertEquals( $expected_term_ids, $assigned_term_ids );
	}

	/**
	 * @ticket 19205
	 */
	function test_orphan_category() {
		$cat_id1 = self::factory()->category->create();

		wp_delete_category( $cat_id1 );

		$cat_id2 = self::factory()->category->create( array( 'parent' => $cat_id1 ) );
		$this->assertWPError( $cat_id2 );
	}
}
