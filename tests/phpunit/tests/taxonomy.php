<?php

/**
 * @group taxonomy
 */
class Tests_Taxonomy extends WP_UnitTestCase {
	function test_get_post_taxonomies() {
		$this->assertEquals(array('category', 'post_tag', 'post_format'), get_object_taxonomies('post'));
	}

	function test_get_link_taxonomies() {
		$this->assertEquals(array('link_category'), get_object_taxonomies('link'));
	}

	/**
	 * @ticket 5417
	 */
	function test_get_unknown_taxonomies() {
		// taxonomies for an unknown object type
		$this->assertEquals( array(), get_object_taxonomies(rand_str()) );
		$this->assertEquals( array(), get_object_taxonomies('') );
		$this->assertEquals( array(), get_object_taxonomies(0) );
		$this->assertEquals( array(), get_object_taxonomies(NULL) );
	}

	function test_get_post_taxonomy() {
		foreach ( get_object_taxonomies('post') as $taxonomy ) {
			$tax = get_taxonomy($taxonomy);
			// should return an object with the correct taxonomy object type
			$this->assertTrue( is_object( $tax ) );
			$this->assertTrue( is_array( $tax->object_type ) );
			$this->assertEquals( array( 'post' ), $tax->object_type );
		}
	}

	function test_get_the_taxonomies() {
		$post_id = $this->factory->post->create();

		$taxes = get_the_taxonomies( $post_id );
		$this->assertNotEmpty( $taxes );
		$this->assertEquals( array( 'category' ), array_keys( $taxes ) );

		$id = $this->factory->tag->create();
		wp_set_post_tags( $post_id, array( $id ) );

		$taxes = get_the_taxonomies( $post_id );
		$this->assertNotEmpty( $taxes );
		$this->assertCount( 2, $taxes );
		$this->assertEquals( array( 'category', 'post_tag' ), array_keys( $taxes ) );
	}

	function test_the_taxonomies() {
		$post_id = $this->factory->post->create();

		ob_start();
		the_taxonomies( array( 'post' => $post_id ) );
		$output = ob_get_clean();

		$link = get_category_link( 1 );
		$expected = "Categories: <a href='$link'>Uncategorized</a>.";
		$this->assertEquals( $expected, $output );
	}

	function test_get_link_taxonomy() {
		foreach ( get_object_taxonomies('link') as $taxonomy ) {
			$tax = get_taxonomy($taxonomy);
			// should return an object with the correct taxonomy object type
			$this->assertTrue( is_object($tax) );
			$this->assertTrue( is_array( $tax->object_type ) );
			$this->assertEquals( array( 'link' ), $tax->object_type );
		}
	}

	function test_taxonomy_exists_known() {
		$this->assertTrue( taxonomy_exists('category') );
		$this->assertTrue( taxonomy_exists('post_tag') );
		$this->assertTrue( taxonomy_exists('link_category') );
	}

	function test_taxonomy_exists_unknown() {
		$this->assertFalse( taxonomy_exists(rand_str()) );
		$this->assertFalse( taxonomy_exists('') );
		$this->assertFalse( taxonomy_exists(0) );
		$this->assertFalse( taxonomy_exists(NULL) );
	}

	function test_is_taxonomy_hierarchical() {
		$this->assertTrue( is_taxonomy_hierarchical('category') );
		$this->assertFalse( is_taxonomy_hierarchical('post_tag') );
		$this->assertFalse( is_taxonomy_hierarchical('link_category') );
	}

	function test_is_taxonomy_hierarchical_unknown() {
		$this->assertFalse( is_taxonomy_hierarchical(rand_str()) );
		$this->assertFalse( is_taxonomy_hierarchical('') );
		$this->assertFalse( is_taxonomy_hierarchical(0) );
		$this->assertFalse( is_taxonomy_hierarchical(NULL) );
	}

	function test_register_taxonomy() {

		// make up a new taxonomy name, and ensure it's unused
		$tax = rand_str();
		$this->assertFalse( taxonomy_exists($tax) );

		register_taxonomy( $tax, 'post' );
		$this->assertTrue( taxonomy_exists($tax) );
		$this->assertFalse( is_taxonomy_hierarchical($tax) );

		// clean up
		unset($GLOBALS['wp_taxonomies'][$tax]);
	}

	function test_register_hierarchical_taxonomy() {

		// make up a new taxonomy name, and ensure it's unused
		$tax = rand_str();
		$this->assertFalse( taxonomy_exists($tax) );

		register_taxonomy( $tax, 'post', array('hierarchical'=>true) );
		$this->assertTrue( taxonomy_exists($tax) );
		$this->assertTrue( is_taxonomy_hierarchical($tax) );

		// clean up
		unset($GLOBALS['wp_taxonomies'][$tax]);
	}

	/**
	 * @ticket 21593
	 *
	 * @expectedIncorrectUsage register_taxonomy
	 */
	function test_register_long_taxonomy() {
		$this->assertInstanceOf( 'WP_Error', register_taxonomy( 'abcdefghijklmnopqrstuvwxyz0123456789', 'post', array() ) );
	}

	/**
	 * @ticket 11058
	 */
	function test_registering_taxonomies_to_object_types() {
		// Create a taxonomy to test with
		$tax = 'test_tax';
		$this->assertFalse( taxonomy_exists($tax) );
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		// Create a post type to test with
		$post_type = 'test_cpt';
		$this->assertFalse( get_post_type( $post_type ) );
		$this->assertObjectHasAttribute( 'name', register_post_type( $post_type ) );

		// Core taxonomy, core post type
		$this->assertTrue( unregister_taxonomy_for_object_type( 'category', 'post' ) );
		$this->assertFalse( unregister_taxonomy_for_object_type( 'category', 'post' ) );
		$this->assertTrue( register_taxonomy_for_object_type( 'category', 'post' ) );

		// Core taxonomy, non-core post type
		$this->assertTrue( register_taxonomy_for_object_type( 'category', $post_type ) );
		$this->assertTrue( unregister_taxonomy_for_object_type( 'category', $post_type ) );
		$this->assertFalse( unregister_taxonomy_for_object_type( 'category', $post_type ) );
		$this->assertTrue( register_taxonomy_for_object_type( 'category', $post_type ) );

		// Core taxonomies, non-post object types
		$this->assertFalse( register_taxonomy_for_object_type( 'category', 'user' ) );
		$this->assertFalse( unregister_taxonomy_for_object_type( 'category', 'user' ) );

		// Non-core taxonomy, core post type
		$this->assertTrue( unregister_taxonomy_for_object_type( $tax, 'post' ) );
		$this->assertFalse( unregister_taxonomy_for_object_type( $tax, 'post' ) );
		$this->assertTrue( register_taxonomy_for_object_type( $tax, 'post' ) );

		// Non-core taxonomy, non-core post type
		$this->assertTrue( register_taxonomy_for_object_type( $tax, $post_type ) );
		$this->assertTrue( unregister_taxonomy_for_object_type( $tax, $post_type ) );
		$this->assertFalse( unregister_taxonomy_for_object_type( $tax, $post_type ) );
		$this->assertTrue( register_taxonomy_for_object_type( $tax, $post_type ) );

		// Non-core taxonomies, non-post object types
		$this->assertFalse( register_taxonomy_for_object_type( $tax, 'user' ) );
		$this->assertFalse( unregister_taxonomy_for_object_type( $tax, 'user' ) );

		unset($GLOBALS['wp_taxonomies'][$tax]);
		_unregister_post_type( $post_type );

	}
	/**
	 * @ticket 25706
	 */
	function test_in_category() {
		$post = $this->factory->post->create_and_get();

		// in_category() returns false when first parameter is empty()
		$this->assertFalse( in_category( '', $post ) );
		$this->assertFalse( in_category( false, $post ) );
		$this->assertFalse( in_category( null, $post ) );

		// Test expected behavior of in_category()
		$term = wp_insert_term( 'Test', 'category' );
		wp_set_object_terms( $post->ID, $term['term_id'], 'category' );
		$this->assertTrue( in_category( $term['term_id'], $post ) );
	}

	function test_insert_category_create() {
		$cat = array(
			'cat_ID' => 0,
			'taxonomy' => 'category',
			'cat_name' => 'test1'
		);
		$this->assertTrue( is_numeric( wp_insert_category( $cat, true ) ) );
	}

	function test_insert_category_update() {
		$cat = array(
			'cat_ID' => 1,
			'taxonomy' => 'category',
			'cat_name' => 'Updated Name'
		);
		$this->assertEquals( 1, wp_insert_category( $cat ) );
	}

	function test_insert_category_force_error_handle() {
		$cat = array(
			'cat_ID' => 0,
			'taxonomy' => 'force_error',
			'cat_name' => 'Error'
		);
		$this->assertTrue( is_a( wp_insert_category( $cat, true ), 'WP_Error' ) );
	}

	function test_insert_category_force_error_no_handle() {
		$cat = array(
			'cat_ID' => 0,
			'taxonomy' => 'force_error',
			'cat_name' => 'Error'
		);
		$this->assertEquals( 0, wp_insert_category( $cat, false ) );
	}

	/**
	 * @ticket 17689
	 */
	function test_duplicate_name() {
		$term = $this->factory->tag->create_and_get( array( 'name' => 'Bozo' ) );
		$this->assertFalse( is_wp_error( $term ) );
		$this->assertTrue( empty( $term->errors ) );

		// Test existing term name with unique slug
		$term1 = $this->factory->tag->create( array( 'name' => 'Bozo', 'slug' => 'bozo1' ) );
		$this->assertFalse( is_wp_error( $term1 ) );
		$this->assertTrue( empty($term1->errors ) );

		// Test an existing term name
		$term2 = $this->factory->tag->create( array( 'name' => 'Bozo' ) );
		$this->assertTrue( is_wp_error( $term2 ) );
		$this->assertNotEmpty( $term2->errors );

		// Test named terms ending in special characters
		$term3 = $this->factory->tag->create( array( 'name' => 'T$' ) );
		$term4 = $this->factory->tag->create( array( 'name' => 'T$$' ) );
		$term5 = $this->factory->tag->create( array( 'name' => 'T$$$' ) );
		$term6 = $this->factory->tag->create( array( 'name' => 'T$$$$' ) );
		$term7 = $this->factory->tag->create( array( 'name' => 'T$$$$' ) );
		$this->assertTrue( is_wp_error( $term7 ) );
		$this->assertNotEmpty( $term7->errors );
		$this->assertEquals( $term6, $term7->error_data['term_exists'] );

		$terms = array_map( 'get_tag', array( $term3, $term4, $term5, $term6 ) );
		$this->assertCount( 4, array_unique( wp_list_pluck( $terms, 'slug' ) ) );

		// Test named terms with only special characters
		$term8 = $this->factory->tag->create( array( 'name' => '$' ) );
		$term9 = $this->factory->tag->create( array( 'name' => '$$' ) );
		$term10 = $this->factory->tag->create( array( 'name' => '$$$' ) );
		$term11 = $this->factory->tag->create( array( 'name' => '$$$$' ) );
		$term12 = $this->factory->tag->create( array( 'name' => '$$$$' ) );
		$this->assertTrue( is_wp_error( $term12 ) );
		$this->assertNotEmpty( $term12->errors );
		$this->assertEquals( $term11, $term12->error_data['term_exists'] );

		$terms = array_map( 'get_tag', array( $term8, $term9, $term10, $term11 ) );
		$this->assertCount( 4, array_unique( wp_list_pluck( $terms, 'slug' ) ) );

		$term13 = $this->factory->tag->create( array( 'name' => 'A' ) );
		$this->assertFalse( is_wp_error( $term13 ) );
		$term14 = $this->factory->tag->create( array( 'name' => 'A' ) );
		$this->assertTrue( is_wp_error( $term14 ) );
		$term15 = $this->factory->tag->create( array( 'name' => 'A+', 'slug' => 'a' ) );
		$this->assertFalse( is_wp_error( $term15 ) );
		$term16 = $this->factory->tag->create( array( 'name' => 'A+' ) );
		$this->assertTrue( is_wp_error( $term16 ) );
		$term17 = $this->factory->tag->create( array( 'name' => 'A++' ) );
		$this->assertFalse( is_wp_error( $term17 ) );
		$term18 = $this->factory->tag->create( array( 'name' => 'A-', 'slug' => 'a' ) );
		$this->assertFalse( is_wp_error( $term18 ) );
		$term19 = $this->factory->tag->create( array( 'name' => 'A-' ) );
		$this->assertTrue( is_wp_error( $term19 ) );
		$term20 = $this->factory->tag->create( array( 'name' => 'A--' ) );
		$this->assertFalse( is_wp_error( $term20 ) );
	}
}
