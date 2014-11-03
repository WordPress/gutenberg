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
}
