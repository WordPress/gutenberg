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

	/**
	 * @group 27238
	 */
	public function test_get_the_taxonomies_term_template() {
		$post_id = $this->factory->post->create();

		$taxes = get_the_taxonomies( $post_id, array( 'term_template' => '%2$s' ) );
		$this->assertEquals( 'Categories: Uncategorized.', $taxes['category'] );

		$taxes = get_the_taxonomies( $post_id, array( 'term_template' => '<span class="foo"><a href="%1$s">%2$s</a></span>' ) );
		$link = get_category_link( 1 );
		$this->assertEquals( 'Categories: <span class="foo"><a href="' . $link . '">Uncategorized</a></span>.', $taxes['category'] );
	}

	function test_the_taxonomies() {
		$post_id = $this->factory->post->create();

		ob_start();
		the_taxonomies( array( 'post' => $post_id ) );
		$output = ob_get_clean();

		$link = get_category_link( 1 );
		$expected = 'Categories: <a href="' . $link . '">Uncategorized</a>.';
		$this->assertEquals( $expected, $output );
	}

	/**
	 * @group 27238
	 */
	function test_the_taxonomies_term_template() {
		$post_id = $this->factory->post->create();

		$output = get_echo( 'the_taxonomies', array( array( 'post' => $post_id, 'term_template' => '%2$s' ) ) );
		$this->assertEquals( 'Categories: Uncategorized.', $output );

		$output = get_echo( 'the_taxonomies', array( array( 'post' => $post_id, 'term_template' => '<span class="foo"><a href="%1$s">%2$s</a></span>' ) ) );
		$link = get_category_link( 1 );
		$this->assertEquals( 'Categories: <span class="foo"><a href="' . $link . '">Uncategorized</a></span>.', $output );
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
	function test_register_taxonomy_with_too_long_name() {
		$this->assertInstanceOf( 'WP_Error', register_taxonomy( 'abcdefghijklmnopqrstuvwxyz0123456789', 'post', array() ) );
	}

	/**
	 * @ticket 31135
	 *
	 * @expectedIncorrectUsage register_taxonomy
	 */
	function test_register_taxonomy_with_empty_name() {
		$this->assertInstanceOf( 'WP_Error', register_taxonomy( '', 'post', array() ) );
	}

	/**
	 * @ticket 26948
	 */
	public function test_register_taxonomy_show_in_quick_edit_should_default_to_value_of_show_ui() {
		register_taxonomy( 'wptests_tax_1', 'post', array(
			'show_ui' => true,
		) );

		register_taxonomy( 'wptests_tax_2', 'post', array(
			'show_ui' => false,
		) );

		$tax_1 = get_taxonomy( 'wptests_tax_1' );
		$this->assertTrue( $tax_1->show_in_quick_edit );

		$tax_2 = get_taxonomy( 'wptests_tax_2' );
		$this->assertFalse( $tax_2->show_in_quick_edit );
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
	 * @ticket 32590
	 */
	public function test_register_taxonomy_for_post_type_for_taxonomy_with_no_object_type_should_filter_out_empty_object_types() {
		register_taxonomy( 'wptests_tax', '' );
		register_taxonomy_for_object_type( 'wptests_tax', 'post' );
		$tax = get_taxonomy( 'wptests_tax' );

		$expected = array( 'post' );
		$this->assertEqualSets( $expected, $tax->object_type );
	}

	public function test_get_objects_in_term_should_return_invalid_taxonomy_error() {
		$terms = get_objects_in_term( 1, 'invalid_taxonomy' );
		$this->assertInstanceOf( 'WP_Error', $terms );
		$this->assertEquals( 'Invalid taxonomy', $terms->get_error_message() );
	}

	public function test_get_objects_in_term_should_return_empty_array() {
		$this->assertEquals( array(), get_objects_in_term( 1, 'post_tag' ) );
	}

	public function test_get_objects_in_term_should_return_objects_ids() {
		$tag_id = $this->factory->tag->create();
		$cat_id = $this->factory->category->create();
		$posts_with_tag = array();
		$posts_with_category = array();

		for ( $i = 0; $i < 3; $i++ ) {
			$post_id = $this->factory->post->create();
			wp_set_post_tags( $post_id, array( $tag_id ) );
			$posts_with_tag[] = $post_id;
		}

		for ( $i = 0; $i < 3; $i++ ) {
			$post_id = $this->factory->post->create();
			wp_set_post_categories( $post_id, array( $cat_id ) );
			$posts_with_category[] = $post_id;
		}

		for ( $i = 0; $i < 3; $i++ ) {
			$this->factory->post->create();
		}

		$posts_with_terms = array_merge( $posts_with_tag, $posts_with_category );

		$this->assertEquals( $posts_with_tag, get_objects_in_term( $tag_id, 'post_tag' ) );
		$this->assertEquals( $posts_with_category, get_objects_in_term( $cat_id, 'category' ) );
		$this->assertEquals( $posts_with_terms, get_objects_in_term( array( $tag_id, $cat_id ), array( 'post_tag', 'category' ) ) );
		$this->assertEquals( array_reverse( $posts_with_tag ), get_objects_in_term( $tag_id, 'post_tag', array( 'order' => 'desc' ) ) );
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

	public function test_get_ancestors_taxonomy_non_hierarchical() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$this->assertSame( array(), get_ancestors( $t, 'wptests_tax' ) );
		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_get_ancestors_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post', array(
			'hierarchical' => true,
		) );
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'parent' => $t1,
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'parent' => $t2,
		) );
		$t4 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'parent' => $t1,
		) );

		$this->assertEqualSets( array( $t2, $t1 ), get_ancestors( $t3, 'wptests_tax' ) );
		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_get_ancestors_post_type_non_hierarchical() {
		register_post_type( 'wptests_pt' );
		$p = $this->factory->post->create( array(
			'taxonomy' => 'wptests_pt',
		) );

		$this->assertEqualSets( array(), get_ancestors( $p, 'wptests_tax' ) );
	}

	public function test_get_ancestors_post_type() {
		register_post_type( 'wptests_pt', array(
			'hierarchical' => true,
		) );
		$p1 = $this->factory->post->create( array(
			'post_type' => 'wptests_pt',
		) );
		$p2 = $this->factory->post->create( array(
			'post_type' => 'wptests_pt',
			'post_parent' => $p1,
		) );
		$p3 = $this->factory->post->create( array(
			'post_type' => 'wptests_pt',
			'post_parent' => $p2,
		) );
		$p4 = $this->factory->post->create( array(
			'post_type' => 'wptests_pt',
			'post_parent' => $p1,
		) );

		$this->assertEqualSets( array( $p2, $p1 ), get_ancestors( $p3, 'wptests_pt' ) );
		_unregister_post_type( 'wptests_pt' );
	}

	/**
	 * @ticket 15029
	 */
	public function test_get_ancestors_taxonomy_post_type_conflict_resource_type_taxonomy() {
		register_post_type( 'wptests_conflict', array(
			'hierarchical' => true,
		) );
		$p1 = $this->factory->post->create( array(
			'post_type' => 'wptests_conflict',
		) );
		$p2 = $this->factory->post->create( array(
			'post_type' => 'wptests_conflict',
			'post_parent' => $p1,
		) );

		register_taxonomy( 'wptests_conflict', 'post', array(
			'hierarchical' => true,
		) );
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_conflict',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_conflict',
			'parent' => $t1,
		) );

		$this->assertEqualSets( array( $p1 ), get_ancestors( $p2, 'wptests_conflict', 'post_type' ) );
		$this->assertEqualSets( array( $t1 ), get_ancestors( $t2, 'wptests_conflict', 'taxonomy' ) );
		$this->assertEqualSets( array( $t1 ), get_ancestors( $t2, 'wptests_conflict' ) );
		_unregister_post_type( 'wptests_pt' );
	}
}
