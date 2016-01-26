<?php

/**
 * @group post
 */
class Tests_Post_IsPostTypeViewable extends WP_UnitTestCase {
	public function test_should_return_false_for_non_publicly_queryable_types() {
		register_post_type( 'wptests_pt', array(
			'publicly_queryable' => false,
			'_builtin' => false,
			'public' => true,
		) );

		$pt = get_post_type_object( 'wptests_pt' );

		$this->assertFalse( is_post_type_viewable( $pt ) );
	}

	public function test_should_return_true_for_publicly_queryable_types() {
		register_post_type( 'wptests_pt', array(
			'publicly_queryable' => true,
			'_builtin' => false,
			'public' => false,
		) );

		$pt = get_post_type_object( 'wptests_pt' );

		$this->assertTrue( is_post_type_viewable( $pt ) );
	}

	public function test_should_return_false_for_builtin_nonpublic_types() {
		register_post_type( 'wptests_pt', array(
			'publicly_queryable' => false,
			'_builtin' => true,
			'public' => false,
		) );

		$pt = get_post_type_object( 'wptests_pt' );

		$this->assertFalse( is_post_type_viewable( $pt ) );
	}

	public function test_should_return_false_for_nonbuiltin_public_types() {
		register_post_type( 'wptests_pt', array(
			'publicly_queryable' => false,
			'_builtin' => false,
			'public' => true,
		) );

		$pt = get_post_type_object( 'wptests_pt' );

		$this->assertFalse( is_post_type_viewable( $pt ) );
	}

	public function test_should_return_true_for_builtin_public_types() {
		register_post_type( 'wptests_pt', array(
			'publicly_queryable' => false,
			'_builtin' => true,
			'public' => true,
		) );

		$pt = get_post_type_object( 'wptests_pt' );

		$this->assertTrue( is_post_type_viewable( $pt ) );
	}

	public function test_postpage_should_be_viewable() {
		$post = get_post_type_object( 'post' );
		$this->assertTrue( is_post_type_viewable( $post ) );

		$page = get_post_type_object( 'page' );
		$this->assertTrue( is_post_type_viewable( $page ) );
	}

	/**
	 * @ticket 35609
	 */
	public function test_should_accept_post_type_name() {
		register_post_type( 'wptests_pt', array(
			'publicly_queryable' => true,
			'_builtin' => false,
			'public' => false,
		) );

		$this->assertTrue( is_post_type_viewable( 'wptests_pt' ) );
	}

	/**
	 * @ticket 35609
	 */
	public function test_should_return_false_for_bad_post_type_name() {
		$this->assertFalse( is_post_type_viewable( 'foo' ) );
	}
}
