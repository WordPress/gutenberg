<?php

/**
 * @group query
 */
class Tests_Query_PostStatus extends WP_UnitTestCase {
	public static $editor_user;
	public static $author_user;
	public static $editor_private_post;
	public static $author_private_post;
	public static $editor_privatefoo_post;
	public static $author_privatefoo_post;

	public static function setUpBeforeClass() {
		$f = new WP_UnitTest_Factory;

		self::$editor_user = $f->user->create( array( 'role' => 'editor' ) );
		self::$author_user = $f->user->create( array( 'role' => 'author' ) );

		self::$editor_private_post = $f->post->create( array( 'post_author' => self::$editor_user, 'post_status' => 'private' ) );
		self::$author_private_post = $f->post->create( array( 'post_author' => self::$author_user, 'post_status' => 'private' ) );

		// Custom status with private=true.
		register_post_status( 'privatefoo', array( 'private' => true ) );
		self::$editor_privatefoo_post = $f->post->create( array( 'post_author' => self::$editor_user, 'post_status' => 'privatefoo' ) );
		self::$author_privatefoo_post = $f->post->create( array( 'post_author' => self::$author_user, 'post_status' => 'privatefoo' ) );
		_unregister_post_status( 'privatefoo' );

		self::commit_transaction();
	}

	public static function tearDownAfterClass() {
		if ( is_multisite() ) {
			wpmu_delete_user( self::$editor_user );
			wpmu_delete_user( self::$author_user );
		} else {
			wp_delete_user( self::$editor_user );
			wp_delete_user( self::$author_user );
		}

		wp_delete_post( self::$editor_private_post, true );
		wp_delete_post( self::$author_private_post, true );
		wp_delete_post( self::$editor_privatefoo_post, true );
		wp_delete_post( self::$author_privatefoo_post, true );

		self::commit_transaction();
	}

	public function test_any_should_not_include_statuses_where_exclude_from_search_is_true() {
		register_post_status( 'foo', array( 'exclude_from_search' => true ) );

		$q = new WP_Query( array(
			'post_status' => array( 'any' ),
		) );

		$this->assertContains( "post_status <> 'foo'", $q->request );
	}

	public function test_any_should_include_statuses_where_exclude_from_search_is_false() {
		register_post_status( 'foo', array( 'exclude_from_search' => false ) );

		$q = new WP_Query( array(
			'post_status' => array( 'any' ),
		) );

		$this->assertNotContains( "post_status <> 'foo'", $q->request );
	}

	public function test_private_should_be_included_if_perm_is_false() {
		$q = new WP_Query( array(
			'post_status' => array( 'private' ),
			'perm' => false,
		) );

		$expected = array(
			self::$editor_private_post,
			self::$author_private_post,
		);

		$this->assertEqualSets( $expected, wp_list_pluck( $q->posts, 'ID' ) );
	}

	public function test_private_should_not_be_included_for_non_author_if_perm_is_not_false() {
		// Current user is 0.

		$q = new WP_Query( array(
			'post_status' => array( 'private' ),
			'perm' => 'editable',
		) );

		$this->assertEmpty( $q->posts );
	}

	public function test_private_should_be_included_only_for_current_user_if_perm_is_readable_and_user_cannot_read_others_posts() {
		wp_set_current_user( self::$author_user );

		$q = new WP_Query( array(
			'post_status' => array( 'private' ),
			'perm' => 'readable',
		) );

		$expected = array(
			self::$author_private_post,
		);

		$this->assertEqualSets( $expected, wp_list_pluck( $q->posts, 'ID' ) );
	}

	public function test_private_should_be_included_for_all_users_if_perm_is_readable_and_user_can_read_others_posts() {
		wp_set_current_user( self::$editor_user );

		$q = new WP_Query( array(
			'post_status' => array( 'private' ),
			'perm' => 'readable',
		) );

		$expected = array(
			self::$author_private_post,
			self::$editor_private_post,
		);

		$this->assertEqualSets( $expected, wp_list_pluck( $q->posts, 'ID' ) );
	}

	public function test_private_should_be_included_only_for_current_user_if_perm_is_editable_and_user_cannot_read_others_posts() {
		wp_set_current_user( self::$author_user );

		$q = new WP_Query( array(
			'post_status' => array( 'private' ),
			'perm' => 'editable',
		) );

		$expected = array(
			self::$author_private_post,
		);

		$this->assertEqualSets( $expected, wp_list_pluck( $q->posts, 'ID' ) );
	}

	public function test_private_should_be_included_for_all_users_if_perm_is_editable_and_user_can_read_others_posts() {
		wp_set_current_user( self::$editor_user );

		$q = new WP_Query( array(
			'post_status' => array( 'private' ),
			'perm' => 'editable',
		) );

		$expected = array(
			self::$author_private_post,
			self::$editor_private_post,
		);

		$this->assertEqualSets( $expected, wp_list_pluck( $q->posts, 'ID' ) );
	}

	public function test_all_public_post_stati_should_be_included_when_no_post_status_is_provided() {
		register_post_status( 'foo', array( 'public' => true ) );

		$q = new WP_Query( array(
			'posts_per_page' => 1, // Or the query will short-circuit.
		) );

		foreach ( get_post_stati( array( 'public' => true ) ) as $status ) {
			$this->assertContains( "post_status = '$status'", $q->request );
		}
	}

	public function test_protected_should_not_be_included_when_not_in_the_admin() {
		register_post_status( 'foo', array( 'protected' => true ) );

		$q = new WP_Query( array(
			'posts_per_page' => 1, // Or the query will short-circuit.
		) );

		$this->assertNotContains( "post_status = 'foo", $q->request );
	}

	public function test_protected_should_be_included_when_in_the_admin() {
		set_current_screen( 'dashboard' );
		register_post_status( 'foo', array( 'protected' => true, 'show_in_admin_all_list' => true ) );

		$q = new WP_Query( array(
			'posts_per_page' => -1, // Or the query will short-circuit.
		) );

		$this->assertContains( "post_status = 'foo", $q->request );
		set_current_screen( 'front' );
	}

	public function test_private_statuses_should_be_included_when_current_user_can_read_private_posts() {
		wp_set_current_user( self::$editor_user );

		register_post_status( 'privatefoo', array( 'private' => true ) );

		$q = new WP_Query( array(
			'posts_per_page' => -1,
		) );

		$this->assertContains( self::$author_privatefoo_post, wp_list_pluck( $q->posts, 'ID' ) );
		$this->assertContains( self::$editor_privatefoo_post, wp_list_pluck( $q->posts, 'ID' ) );
	}

	public function test_private_statuses_should_not_be_included_when_current_user_cannot_read_private_posts() {
		wp_set_current_user( self::$author_user );

		register_post_status( 'privatefoo', array( 'private' => true ) );

		$q = new WP_Query( array(
			'posts_per_page' => 2, // Or the query will short-circuit.
		) );

		$expected = array(
			self::$author_privatefoo_post,
		);

		$this->assertContains( self::$author_privatefoo_post, wp_list_pluck( $q->posts, 'ID' ) );
		$this->assertNotContains( self::$editor_privatefoo_post, wp_list_pluck( $q->posts, 'ID' ) );
	}

	public function test_single_post_with_nonpublic_status_should_not_be_shown_to_logged_out_users() {
		register_post_type( 'foo_pt' );
		register_post_status( 'foo_ps', array( 'public' => false ) );
		$p = $this->factory->post->create( array( 'post_status' => 'foo_ps' ) );

		$q = new WP_Query( array(
			'p' => $p,
		) );

		$this->assertEmpty( $q->posts );
	}

	public function test_single_post_with_nonpublic_and_protected_status_should_not_be_shown_for_user_who_cannot_edit_others_posts() {
		register_post_type( 'foo_pt' );
		register_post_status( 'foo_ps', array( 'public' => false, 'protected' => true ) );
		$p = $this->factory->post->create( array( 'post_status' => 'foo_ps', 'post_author' => self::$editor_user ) );

		wp_set_current_user( self::$author_user );

		$q = new WP_Query( array(
			'p' => $p,
		) );

		$this->assertEmpty( $q->posts );
	}

	public function test_single_post_with_nonpublic_and_protected_status_should_be_shown_for_user_who_can_edit_others_posts() {
		register_post_type( 'foo_pt' );
		register_post_status( 'foo_ps', array( 'public' => false, 'protected' => true ) );
		$p = $this->factory->post->create( array( 'post_status' => 'foo_ps', 'post_author' => self::$author_user ) );

		wp_set_current_user( self::$editor_user );

		$q = new WP_Query( array(
			'p' => $p,
		) );

		$this->assertEquals( array( $p ), wp_list_pluck( $q->posts, 'ID' ) );
	}

	public function test_single_post_with_nonpublic_and_private_status_should_not_be_shown_for_user_who_cannot_edit_others_posts() {
		register_post_type( 'foo_pt' );
		register_post_status( 'foo_ps', array( 'public' => false, 'private' => true ) );
		$p = $this->factory->post->create( array( 'post_status' => 'foo_ps', 'post_author' => self::$editor_user ) );

		wp_set_current_user( self::$author_user );

		$q = new WP_Query( array(
			'p' => $p,
		) );

		$this->assertEmpty( $q->posts );
	}

	public function test_single_post_with_nonpublic_and_private_status_should_be_shown_for_user_who_can_edit_others_posts() {
		register_post_type( 'foo_pt' );
		register_post_status( 'foo_ps', array( 'public' => false, 'private' => true ) );
		$p = $this->factory->post->create( array( 'post_status' => 'foo_ps', 'post_author' => self::$author_user ) );

		wp_set_current_user( self::$editor_user );

		$q = new WP_Query( array(
			'p' => $p,
		) );

		$this->assertEquals( array( $p ), wp_list_pluck( $q->posts, 'ID' ) );
	}

	public function test_single_post_with_nonpublic_and_protected_status_should_not_be_shown_for_any_user() {
		register_post_type( 'foo_pt' );
		register_post_status( 'foo_ps', array( 'public' => false ) );
		$p = $this->factory->post->create( array( 'post_status' => 'foo_ps', 'post_author' => self::$author_user ) );

		wp_set_current_user( self::$editor_user );

		$q = new WP_Query( array(
			'p' => $p,
		) );

		$this->assertEmpty( $q->posts );
	}

	/**
	 * @ticket 29167
	 */
	public function test_specific_post_should_be_returned_if_trash_is_one_of_the_requested_post_statuses() {
		$p1 = $this->factory->post->create( array( 'post_status' => 'trash' ) );
		$p2 = $this->factory->post->create( array( 'post_status' => 'publish' ) );

		$q = new WP_Query( array(
			'p' => $p1,
			'post_status' => array( 'trash', 'publish' ),
		) );

		$this->assertContains( $p1, wp_list_pluck( $q->posts, 'ID' ) );
	}
}
