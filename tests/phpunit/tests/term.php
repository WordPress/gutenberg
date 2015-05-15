<?php

/**
 * @group taxonomy
 */
class Tests_Term extends WP_UnitTestCase {
	var $taxonomy = 'category';

	/**
	 * @ticket 29911
	 */
	public function test_wp_delete_term_should_invalidate_cache_for_child_terms() {
		register_taxonomy( 'wptests_tax', 'post', array(
			'hierarchical' => true,
		) );

		$parent = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$child = $this->factory->term->create( array(
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
	 * @ticket 21651
	 */
	function test_get_term_by_tt_id() {
		$term1 = wp_insert_term( 'Foo', 'category' );
		$term2 = get_term_by( 'term_taxonomy_id', $term1['term_taxonomy_id'], 'category' );
		$this->assertEquals( get_term( $term1['term_id'], 'category' ), $term2 );
	}

	/**
	 * @ticket 15919
	 */
	function test_wp_count_terms() {
		$count = wp_count_terms( 'category', array( 'hide_empty' => true ) );
		// the terms inserted in setUp aren't attached to any posts, so should return 0
		// this previously returned 2
		$this->assertEquals( 0, $count );
	}

	/**
	 * @ticket 26570
	 */
	function test_set_object_terms() {
		$non_hier = rand_str( 10 );
		$hier     = rand_str( 10 );

		// Register taxonomies
		register_taxonomy( $non_hier, array() );
		register_taxonomy( $hier, array( 'hierarchical' => true ) );

		// Create a post.
		$post_id = $this->factory->post->create();

		/*
		 * Set a single term (non-hierarchical) by ID.
		 */
		$tag = wp_insert_term( 'Foo', $non_hier );
		$this->assertFalse( has_term( $tag['term_id'], $non_hier, $post_id ) );

		wp_set_object_terms( $post_id, $tag['term_id'], $non_hier );
		$this->assertTrue( has_term( $tag['term_id'], $non_hier, $post_id ) );

		/*
		 * Set a single term (non-hierarchical) by slug.
		 */
		$tag = wp_insert_term( 'Bar', $non_hier );
		$tag = get_term( $tag['term_id'], $non_hier );

		$this->assertFalse( has_term( $tag->slug, $non_hier, $post_id ) );

		wp_set_object_terms( $post_id, $tag->slug, $non_hier );
		$this->assertTrue( has_term( $tag->slug, $non_hier, $post_id ) );

		/*
		 * Set a single term (hierarchical) by ID.
		 */
		$cat = wp_insert_term( 'Baz', $hier );
		$this->assertFalse( has_term( $cat['term_id'], $hier, $post_id ) );

		wp_set_object_terms( $post_id, $cat['term_id'], $hier );
		$this->assertTrue( has_term( $cat['term_id'], $hier, $post_id ) );

		/*
		 * Set a single term (hierarchical) by slug.
		 */
		$cat = wp_insert_term( 'Qux', $hier );
		$cat = get_term( $cat['term_id'], $hier );

		$this->assertFalse( has_term( $cat->slug, $hier, $post_id ) );

		wp_set_object_terms( $post_id, $cat->slug, $hier );
		$this->assertTrue( has_term( $cat->slug, $hier, $post_id ) );

		/*
		 * Set an array of term IDs (non-hierarchical) by ID.
		 */
		$tag1 = wp_insert_term( '_tag1', $non_hier );
		$this->assertFalse( has_term( $tag1['term_id'], $non_hier, $post_id ) );

		$tag2 = wp_insert_term( '_tag2', $non_hier );
		$this->assertFalse( has_term( $tag2['term_id'], $non_hier, $post_id ) );

		$tag3 = wp_insert_term( '_tag3', $non_hier );
		$this->assertFalse( has_term( $tag3['term_id'], $non_hier, $post_id ) );

		wp_set_object_terms( $post_id, array( $tag1['term_id'], $tag2['term_id'], $tag3['term_id'] ), $non_hier );
		$this->assertTrue( has_term( array( $tag1['term_id'], $tag2['term_id'], $tag3['term_id'] ), $non_hier, $post_id ) );

		/*
		 * Set an array of term slugs (hierarchical) by slug.
		 */
		$cat1 = wp_insert_term( '_cat1', $hier );
		$cat1 = get_term( $cat1['term_id'], $hier );
		$this->assertFalse( has_term( $cat1->slug, $hier, $post_id ) );

		$cat2 = wp_insert_term( '_cat2', $hier );
		$cat2 = get_term( $cat2['term_id'], $hier );
		$this->assertFalse( has_term( $cat2->slug, $hier, $post_id ) );

		$cat3 = wp_insert_term( '_cat3', $hier );
		$cat3 = get_term( $cat3['term_id'], $hier );
		$this->assertFalse( has_term( $cat3->slug, $hier, $post_id ) );

		wp_set_object_terms( $post_id, array( $cat1->slug, $cat2->slug, $cat3->slug ), $hier );
		$this->assertTrue( has_term( array( $cat1->slug, $cat2->slug, $cat3->slug ), $hier, $post_id ) );
	}

	function test_set_object_terms_by_id() {
		$ids = $this->factory->post->create_many(5);

		$terms = array();
		for ($i=0; $i<3; $i++ ) {
			$term = rand_str();
			$result = wp_insert_term( $term, $this->taxonomy );
			$this->assertInternalType( 'array', $result );
			$term_id[$term] = $result['term_id'];
		}

		foreach ($ids as $id) {
				$tt = wp_set_object_terms( $id, array_values($term_id), $this->taxonomy );
				// should return three term taxonomy ids
				$this->assertEquals( 3, count($tt) );
		}

		// each term should be associated with every post
		foreach ($term_id as $term=>$id) {
			$actual = get_objects_in_term($id, $this->taxonomy);
			$this->assertEquals( $ids, array_map('intval', $actual) );
		}

		// each term should have a count of 5
		foreach (array_keys($term_id) as $term) {
			$t = get_term_by('name', $term, $this->taxonomy);
			$this->assertEquals( 5, $t->count );
		}
	}

	function test_set_object_terms_by_name() {
		$ids = $this->factory->post->create_many(5);

		$terms = array(
				rand_str(),
				rand_str(),
				rand_str());

		foreach ($ids as $id) {
				$tt = wp_set_object_terms( $id, $terms, $this->taxonomy );
				// should return three term taxonomy ids
				$this->assertEquals( 3, count($tt) );
				// remember which term has which term_id
				for ($i=0; $i<3; $i++) {
					$term = get_term_by('name', $terms[$i], $this->taxonomy);
					$term_id[$terms[$i]] = intval($term->term_id);
				}
		}

		// each term should be associated with every post
		foreach ($term_id as $term=>$id) {
			$actual = get_objects_in_term($id, $this->taxonomy);
			$this->assertEquals( $ids, array_map('intval', $actual) );
		}

		// each term should have a count of 5
		foreach ($terms as $term) {
			$t = get_term_by('name', $term, $this->taxonomy);
			$this->assertEquals( 5, $t->count );
		}
	}

	function test_set_object_terms_invalid() {
		$post_id = $this->factory->post->create();

		// bogus taxonomy
		$result = wp_set_object_terms( $post_id, array(rand_str()), rand_str() );
		$this->assertTrue( is_wp_error($result) );
	}

	public function test_wp_set_object_terms_append_true() {
		register_taxonomy( 'wptests_tax', 'post' );
		$p = $this->factory->post->create();
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$added1 = wp_set_object_terms( $p, array( $t1 ), 'wptests_tax' );
		$this->assertNotEmpty( $added1 );
		$this->assertEqualSets( array( $t1 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		$added2 = wp_set_object_terms( $p, array( $t2 ), 'wptests_tax', true );
		$this->assertNotEmpty( $added2 );
		$this->assertEqualSets( array( $t1, $t2 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_wp_set_object_terms_append_false() {
		register_taxonomy( 'wptests_tax', 'post' );
		$p = $this->factory->post->create();
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$added1 = wp_set_object_terms( $p, array( $t1 ), 'wptests_tax' );
		$this->assertNotEmpty( $added1 );
		$this->assertEqualSets( array( $t1 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		$added2 = wp_set_object_terms( $p, array( $t2 ), 'wptests_tax', false );
		$this->assertNotEmpty( $added2 );
		$this->assertEqualSets( array( $t2 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_wp_set_object_terms_append_default_to_false() {
		register_taxonomy( 'wptests_tax', 'post' );
		$p = $this->factory->post->create();
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$added1 = wp_set_object_terms( $p, array( $t1 ), 'wptests_tax' );
		$this->assertNotEmpty( $added1 );
		$this->assertEqualSets( array( $t1 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		$added2 = wp_set_object_terms( $p, array( $t2 ), 'wptests_tax' );
		$this->assertNotEmpty( $added2 );
		$this->assertEqualSets( array( $t2 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		_unregister_taxonomy( 'wptests_tax' );
	}

	function test_change_object_terms_by_id() {
		// set some terms on an object; then change them while leaving one intact

		$post_id = $this->factory->post->create();

		// first set: 3 terms
		$terms_1 = array();
		for ($i=0; $i<3; $i++ ) {
			$term = rand_str();
			$result = wp_insert_term( $term, $this->taxonomy );
			$this->assertInternalType( 'array', $result );
			$terms_1[$i] = $result['term_id'];
		}

		// second set: one of the original terms, plus one new term
		$terms_2 = array();
		$terms_2[0] = $terms_1[1];

		$term = rand_str();
		$result = wp_insert_term( $term, $this->taxonomy );
		$terms_2[1] = $result['term_id'];


		// set the initial terms
		$tt_1 = wp_set_object_terms( $post_id, $terms_1, $this->taxonomy );
		$this->assertEquals( 3, count($tt_1) );

		// make sure they're correct
		$terms = wp_get_object_terms($post_id, $this->taxonomy, array('fields' => 'ids', 'orderby' => 't.term_id'));
		$this->assertEquals( $terms_1, $terms );

		// change the terms
		$tt_2 = wp_set_object_terms( $post_id, $terms_2, $this->taxonomy );
		$this->assertEquals( 2, count($tt_2) );

		// make sure they're correct
		$terms = wp_get_object_terms($post_id, $this->taxonomy, array('fields' => 'ids', 'orderby' => 't.term_id'));
		$this->assertEquals( $terms_2, $terms );

		// make sure the tt id for 'bar' matches
		$this->assertEquals( $tt_1[1], $tt_2[0] );

	}

	function test_change_object_terms_by_name() {
		// set some terms on an object; then change them while leaving one intact

		$post_id = $this->factory->post->create();

		$terms_1 = array('foo', 'bar', 'baz');
		$terms_2 = array('bar', 'bing');

		// set the initial terms
		$tt_1 = wp_set_object_terms( $post_id, $terms_1, $this->taxonomy );
		$this->assertEquals( 3, count($tt_1) );

		// make sure they're correct
		$terms = wp_get_object_terms($post_id, $this->taxonomy, array('fields' => 'names', 'orderby' => 't.term_id'));
		$this->assertEquals( $terms_1, $terms );

		// change the terms
		$tt_2 = wp_set_object_terms( $post_id, $terms_2, $this->taxonomy );
		$this->assertEquals( 2, count($tt_2) );

		// make sure they're correct
		$terms = wp_get_object_terms($post_id, $this->taxonomy, array('fields' => 'names', 'orderby' => 't.term_id'));
		$this->assertEquals( $terms_2, $terms );

		// make sure the tt id for 'bar' matches
		$this->assertEquals( $tt_1[1], $tt_2[0] );

	}

	/**
	 * @ticket 15475
	 */
	function test_wp_add_remove_object_terms() {
		$posts = $this->factory->post->create_many( 5 );
		$tags = $this->factory->tag->create_many( 5 );

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
			$this->assertTrue( (bool) wp_delete_post( $post_id, true ) );
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
		$this->assertFalse( is_wp_error($t) );
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
		$post_id = $this->factory->post->create();
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
	 * @ticket 22560
	 */
	function test_object_term_cache() {
		$post_id = $this->factory->post->create();

		$terms_1 = array('foo', 'bar', 'baz');
		$terms_2 = array('bar', 'bing');

		// Cache should be empty after a set.
		$tt_1 = wp_set_object_terms( $post_id, $terms_1, $this->taxonomy );
		$this->assertEquals( 3, count($tt_1) );
		$this->assertFalse( wp_cache_get( $post_id, $this->taxonomy . '_relationships') );

		// wp_get_object_terms() does not prime the cache.
		wp_get_object_terms( $post_id, $this->taxonomy, array('fields' => 'names', 'orderby' => 't.term_id') );
		$this->assertFalse( wp_cache_get( $post_id, $this->taxonomy . '_relationships') );

		// get_the_terms() does prime the cache.
		$terms = get_the_terms( $post_id, $this->taxonomy );
		$cache = wp_cache_get( $post_id, $this->taxonomy . '_relationships');
		$this->assertInternalType( 'array', $cache );

		// Cache should be empty after a set.
		$tt_2 = wp_set_object_terms( $post_id, $terms_2, $this->taxonomy );
		$this->assertEquals( 2, count($tt_2) );
		$this->assertFalse( wp_cache_get( $post_id, $this->taxonomy . '_relationships') );
	}

	/**
	 * @ticket 24189
	 */
	function test_object_term_cache_when_term_changes() {
		$post_id = $this->factory->post->create();
		$tag_id = $this->factory->tag->create( array( 'description' => 'My Amazing Tag' ) );

		$tt_1 = wp_set_object_terms( $post_id, $tag_id, 'post_tag' );

		$terms = get_the_terms( $post_id, 'post_tag' );
		$this->assertEquals( $tag_id, $terms[0]->term_id );
		$this->assertEquals( 'My Amazing Tag', $terms[0]->description );

		$_updated = wp_update_term( $tag_id, 'post_tag', array(
			'description' => 'This description is even more amazing!'
		) );

		$_new_term = get_term( $tag_id, 'post_tag' );
		$this->assertEquals( $tag_id, $_new_term->term_id );
		$this->assertEquals( 'This description is even more amazing!', $_new_term->description );

		$terms = get_the_terms( $post_id, 'post_tag' );
		$this->assertEquals( $tag_id, $terms[0]->term_id );
		$this->assertEquals( 'This description is even more amazing!', $terms[0]->description );
	}

	/**
	 * @ticket 31086
	 */
	public function test_get_the_terms_should_return_zero_indexed_array_when_cache_is_empty() {
		register_taxonomy( 'wptests_tax', 'post' );
		$p = $this->factory->post->create();
		wp_set_object_terms( $p, array( 'foo', 'bar' ), 'wptests_tax' );

		$found = get_the_terms( $p, 'wptests_tax' );

		$this->assertEqualSets( array( 0, 1 ), array_keys( $found ) );
	}

	/**
	 * @ticket 31086
	 */
	public function test_get_the_terms_should_return_zero_indexed_array_when_cache_is_primed() {
		register_taxonomy( 'wptests_tax', 'post' );
		$p = $this->factory->post->create();
		wp_set_object_terms( $p, array( 'foo', 'bar' ), 'wptests_tax' );

		// Prime cache.
		update_object_term_cache( array( $p ), array( 'post' ) );

		$found = get_the_terms( $p, 'wptests_tax' );

		$this->assertEqualSets( array( 0, 1 ), array_keys( $found ) );
	}

	/**
	 * @ticket 19205
	 */
	function test_orphan_category() {
		$cat_id1 = $this->factory->category->create();

		wp_delete_category( $cat_id1 );

		$cat_id2 = $this->factory->category->create( array( 'parent' => $cat_id1 ) );
		$this->assertWPError( $cat_id2 );
	}
}
