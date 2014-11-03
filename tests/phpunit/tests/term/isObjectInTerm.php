<?php

/**
 * @group taxonomy
 */
class Tests_IsObjectInTerm extends WP_UnitTestCase {
	public function test_terms_are_ints() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		$posts = $this->factory->post->create_many( 2 );
		wp_set_object_terms( $posts[0], array( $t1 ), 'wptests_tax' );

		$this->assertTrue( is_object_in_term( $posts[0], 'wptests_tax', array( $t1, $t2 ) ) );
		$this->assertFalse( is_object_in_term( $posts[1], 'wptests_tax', array( $t1, $t2 ) ) );

		_unregister_taxonomy( 'wptests_tax', 'post' );
	}

	public function test_terms_are_strings_and_match_term_id() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		$posts = $this->factory->post->create_many( 2 );
		wp_set_object_terms( $posts[0], array( $t1 ), 'wptests_tax' );

		$t1_str = (string) $t1;
		$t2_str = (string) $t2;

		$this->assertTrue( is_object_in_term( $posts[0], 'wptests_tax', array( $t1_str, $t2_str ) ) );
		$this->assertFalse( is_object_in_term( $posts[1], 'wptests_tax', array( $t1_str, $t2_str ) ) );

		_unregister_taxonomy( 'wptests_tax', 'post' );
	}

	public function test_terms_are_strings_and_match_term_name() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax', 'name' => 'Foo' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax', 'name' => 'Bar') );

		$posts = $this->factory->post->create_many( 2 );
		wp_set_object_terms( $posts[0], array( $t1 ), 'wptests_tax' );

		$this->assertTrue( is_object_in_term( $posts[0], 'wptests_tax', array( 'Foo', 'Bar' ) ) );
		$this->assertFalse( is_object_in_term( $posts[1], 'wptests_tax', array( 'Foo', 'Bar' ) ) );

		_unregister_taxonomy( 'wptests_tax', 'post' );
	}

	public function test_terms_are_strings_and_match_term_slug() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax', 'slug' => 'foo' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax', 'slug' => 'bar') );

		$posts = $this->factory->post->create_many( 2 );
		wp_set_object_terms( $posts[0], array( $t1 ), 'wptests_tax' );

		$this->assertTrue( is_object_in_term( $posts[0], 'wptests_tax', array( 'foo', 'bar' ) ) );
		$this->assertFalse( is_object_in_term( $posts[1], 'wptests_tax', array( 'foo', 'bar' ) ) );

		_unregister_taxonomy( 'wptests_tax', 'post' );
	}

	public function test_terms_contain_strings_and_ints_and_match_term_id_as_int() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax', 'slug' => 'foo' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax', 'slug' => 'bar') );

		$posts = $this->factory->post->create_many( 2 );
		wp_set_object_terms( $posts[0], array( $t1 ), 'wptests_tax' );

		$this->assertTrue( is_object_in_term( $posts[0], 'wptests_tax', array( $t1, 'bar' ) ) );
		$this->assertFalse( is_object_in_term( $posts[1], 'wptests_tax', array( $t1, 'bar' ) ) );

		_unregister_taxonomy( 'wptests_tax', 'post' );
	}

	/**
	 * @ticket 29467
	 */
	public function test_should_not_return_true_if_term_name_begins_with_existing_term_id() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		$post_ID  = $this->factory->post->create();
		wp_set_object_terms( $post_ID, $t, 'wptests_tax' );

		$int_tax_name = $t . '_term_name';

		$this->assertFalse( is_object_in_term( $post_ID, 'wptests_tax', $int_tax_name ) );

		// Verify it works properly when the post is actually in the term.
		wp_set_object_terms( $post_ID, array( $int_tax_name ), 'wptests_tax' );
		$this->assertTrue( is_object_in_term( $post_ID, 'wptests_tax', $int_tax_name ) );
	}
}
