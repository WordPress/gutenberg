<?php

/**
 * @group user
 * @group capabilities
 */
class Tests_User_MapMetaCap extends WP_UnitTestCase {
	var $super_admins = null;

	function setUp() {
		parent::setUp();

		$this->user_ids = array();

		$this->user_id   = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$this->author_id = $this->factory->user->create( array( 'role' => 'administrator' ) );

		if ( isset( $GLOBALS['super_admins'] ) )
			$this->super_admins = $GLOBALS['super_admins'];
		$user = new WP_User( $this->user_id );
		$GLOBALS['super_admins'] = array( $user->user_login );

		$this->post_type = rand_str( 20 );
		register_post_type( $this->post_type );

		$this->post_id = wp_insert_post( array(
			'post_title' => rand_str(),
			'post_type' => $this->post_type,
			'post_status' => 'private',
			'post_author' => $this->author_id,
		) );
	}

	function tearDown() {
		$GLOBALS['super_admins'] = $this->super_admins;
		unset( $GLOBALS['wp_post_types'][ $this->post_type ] );
		parent::tearDown();
	}

	function test_capability_type_post_with_no_extra_caps() {

		register_post_type( $this->post_type, array(
			'capability_type' => 'post',
		) );
		$post_type_object = get_post_type_object( $this->post_type );

		$this->assertTrue( $post_type_object->map_meta_cap );

		$this->assertEquals( array( 'edit_others_posts', 'edit_private_posts' ),
			map_meta_cap( 'edit_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'edit_others_posts', 'edit_private_posts' ),
			map_meta_cap( $post_type_object->cap->edit_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'read_private_posts' ),
			map_meta_cap( 'read_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'read_private_posts' ),
			map_meta_cap( $post_type_object->cap->read_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'delete_others_posts', 'delete_private_posts' ),
			map_meta_cap( 'delete_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'delete_others_posts', 'delete_private_posts' ),
			map_meta_cap( $post_type_object->cap->delete_post, $this->user_id, $this->post_id ) );
	}

	function test_custom_capability_type_with_map_meta_cap() {
		register_post_type( $this->post_type, array(
			'capability_type' => 'book',
			'map_meta_cap' => true,
		) );

		$post_type_object = get_post_type_object( $this->post_type );

		$this->assertEquals( array( 'edit_others_books', 'edit_private_books' ),
			map_meta_cap( 'edit_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'edit_others_books', 'edit_private_books' ),
			map_meta_cap( $post_type_object->cap->edit_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'read_private_books' ),
			map_meta_cap( 'read_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'read_private_books' ),
			map_meta_cap( $post_type_object->cap->read_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'delete_others_books', 'delete_private_books' ),
			map_meta_cap( 'delete_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'delete_others_books', 'delete_private_books' ),
			map_meta_cap( $post_type_object->cap->delete_post, $this->user_id, $this->post_id ) );
	}

	function test_capability_type_post_with_one_renamed_cap() {
		register_post_type( $this->post_type, array(
			'capability_type' => 'post',
			'capabilities' => array( 'edit_posts' => 'edit_books' ),
		) );

		$post_type_object = get_post_type_object( $this->post_type );

		$this->assertFalse( $post_type_object->map_meta_cap );

		$this->assertEquals( array( 'edit_post' ),
			map_meta_cap( 'edit_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'edit_post' ),
			map_meta_cap( $post_type_object->cap->edit_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'read_post' ),
			map_meta_cap( 'read_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'read_post' ),
			map_meta_cap( $post_type_object->cap->read_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'delete_post' ),
			map_meta_cap( 'delete_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'delete_post' ),
			map_meta_cap( $post_type_object->cap->delete_post, $this->user_id, $this->post_id ) );
	}

	function test_capability_type_post_map_meta_cap_true_with_renamed_cap() {
		register_post_type( $this->post_type, array(
			'capability_type' => 'post',
			'map_meta_cap' => true,
			'capabilities' => array(
				'edit_post' => 'edit_book', // maps back to itself.
				'edit_others_posts' => 'edit_others_books',
			),
		) );

		$post_type_object = get_post_type_object( $this->post_type );

		$this->assertTrue( $post_type_object->map_meta_cap );

		$this->assertEquals( array( 'edit_others_books', 'edit_private_posts' ),
			map_meta_cap( 'edit_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'edit_others_books', 'edit_private_posts' ),
			map_meta_cap( $post_type_object->cap->edit_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'read_private_posts' ),
			map_meta_cap( 'read_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'read_private_posts' ),
			map_meta_cap( $post_type_object->cap->read_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'delete_others_posts', 'delete_private_posts' ),
			map_meta_cap( 'delete_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'delete_others_posts', 'delete_private_posts' ),
			map_meta_cap( $post_type_object->cap->delete_post, $this->user_id, $this->post_id ) );
	}

	function test_capability_type_post_with_all_meta_caps_renamed() {
		register_post_type( $this->post_type, array(
			'capability_type' => 'post',
			'capabilities' => array(
				'edit_post' => 'edit_book',
				'read_post' => 'read_book',
				'delete_post' => 'delete_book',
			),
		) );

		$post_type_object = get_post_type_object( $this->post_type );

		$this->assertFalse( $post_type_object->map_meta_cap );

		$this->assertEquals( array( 'edit_book' ),
			map_meta_cap( 'edit_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'edit_book' ),
			map_meta_cap( $post_type_object->cap->edit_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'read_book' ),
			map_meta_cap( 'read_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'read_book' ),
			map_meta_cap( $post_type_object->cap->read_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'delete_book' ),
			map_meta_cap( 'delete_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'delete_book' ),
			map_meta_cap( $post_type_object->cap->delete_post, $this->user_id, $this->post_id ) );
	}

	function test_capability_type_post_with_all_meta_caps_renamed_mapped() {
		register_post_type( $this->post_type, array(
			'capability_type' => 'post',
			'map_meta_cap' => true,
			'capabilities' => array(
				'edit_post'   => 'edit_book',
				'read_post'   => 'read_book',
				'delete_post' => 'delete_book',
			),
		) );

		$post_type_object = get_post_type_object( $this->post_type );

		$this->assertTrue( $post_type_object->map_meta_cap );

		$this->assertEquals( array( 'edit_others_posts', 'edit_private_posts' ),
			map_meta_cap( 'edit_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'edit_others_posts', 'edit_private_posts' ),
			map_meta_cap( $post_type_object->cap->edit_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'read_private_posts' ),
			map_meta_cap( 'read_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'read_private_posts' ),
			map_meta_cap( $post_type_object->cap->read_post, $this->user_id, $this->post_id ) );

		$this->assertEquals( array( 'delete_others_posts', 'delete_private_posts' ),
			map_meta_cap( 'delete_post', $this->user_id, $this->post_id ) );
		$this->assertEquals( array( 'delete_others_posts', 'delete_private_posts' ),
			map_meta_cap( $post_type_object->cap->delete_post, $this->user_id, $this->post_id ) );
	}

	function test_unfiltered_html_cap() {
		if ( defined( 'DISALLOW_UNFILTERED_HTML' ) && DISALLOW_UNFILTERED_HTML )
			$this->markTestSkipped( 'DISALLOW_UNFILTERED_HTML is defined.' );
		if ( is_multisite() ) {
			$this->assertEquals( array( 'do_not_allow' ), map_meta_cap( 'unfiltered_html', 0 ) );
			$this->assertEquals( array( 'unfiltered_html' ), map_meta_cap( 'unfiltered_html', $this->user_id ) );
		} else {
			$this->assertEquals( array( 'unfiltered_html' ), map_meta_cap( 'unfiltered_html', $this->user_id ) );
		}
	}

	/**
	 * @ticket 20488
	 */
	function test_file_edit_caps_not_reliant_on_unfiltered_html_constant() {
		if ( defined( 'DISALLOW_FILE_MODS' ) || defined( 'DISALLOW_FILE_EDIT' ) )
			$this->markTestSkipped('DISALLOW_FILE_MODS or DISALLOW_FILE_EDIT is defined.');

		if ( defined( 'DISALLOW_UNFILTERED_HTML' ) ) {
			if ( ! DISALLOW_UNFILTERED_HTML )
				$this->markTestSkipped( 'DISALLOW_UNFILTERED_HTML is defined.' );
		} else {
			define( 'DISALLOW_UNFILTERED_HTML', true );
		}

		$this->assertEquals( array( 'update_core' ), map_meta_cap( 'update_core', $this->user_id ) );
		$this->assertEquals( array( 'edit_plugins' ), map_meta_cap( 'edit_plugins', $this->user_id ) );
	}

	/**
	 * Test a post without an author.
	 *
	 * @ticket 27020
	 */
	function test_authorless_posts_capabilties() {
		$post_id = $this->factory->post->create( array( 'post_author' => 0, 'post_type' => 'post', 'post_status' => 'publish' ) );
		$editor = $this->factory->user->create( array( 'role' => 'editor' ) );

		$this->assertEquals( array( 'edit_others_posts', 'edit_published_posts' ), map_meta_cap( 'edit_post', $editor, $post_id ) );
		$this->assertEquals( array( 'delete_others_posts', 'delete_published_posts' ), map_meta_cap( 'delete_post', $editor, $post_id ) );

	}
}
