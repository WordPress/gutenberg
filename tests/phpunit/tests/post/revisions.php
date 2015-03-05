<?php

/**
 * @group post
 * @group revision
 */
class Tests_Post_Revisions extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();
		$this->post_type = rand_str( 20 );
	}

	function tearDown() {
		unset( $GLOBALS['wp_post_types'][ $this->post_type ] );
		parent::tearDown();
	}

	/**
	 * Note: Test needs reviewing when #16215 is fixed because I'm not sure the test current tests the "correct" behavior
	 * @ticket 20982
	 * @ticket 16215
	 */
	function test_revision_restore_updates_edit_last_post_meta() {
		$admin_user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$editor_user_id = $this->factory->user->create( array( 'role' => 'editor' ) );
		$author_user_id = $this->factory->user->create( array( 'role' => 'author' ) );

		//create a post as Author
		wp_set_current_user( $author_user_id );
		$post = get_default_post_to_edit( 'post', true );
		$post_id = $post->ID;

		wp_update_post( array( 'post_status' => 'draft', 'post_content' => 'I cant spel werds.', 'ID' => $post_id ) );

		//update post as Editor
		wp_set_current_user( $editor_user_id );
		wp_update_post( array( 'post_content' => 'The Editor was in fixing your typos.', 'ID' => $post_id ) );

		//restore back as Admin
		wp_set_current_user( $admin_user_id );
		$revisions = wp_get_post_revisions( $post->ID );
		$this->assertCount( 2, $revisions );

		$lastrevision = end( $revisions );
		$this->assertEquals( 'I cant spel werds.', $lastrevision->post_content );
		// #16215
		$this->assertEquals( $author_user_id , $lastrevision->post_author);

		wp_restore_post_revision( $lastrevision->ID );

		//is post_meta correctly set to revision author
		$this->assertEquals( $admin_user_id, get_post_meta( $post_id, '_edit_last', true ) ); //after restoring user

		wp_set_current_user( 0 );
	}

	/**
	* @ticket 7392
	* @ticket 9843
	*/
	function test_revision_dont_save_revision_if_unchanged() {
		$post = get_default_post_to_edit( 'post', true );
		$post_id = $post->ID;

		$this->assertCount( 0, wp_get_post_revisions( $post_id ) ); // No revisions on auto-draft creation.

		wp_update_post( array( 'post_status' => 'draft', 'post_title' => 'some-post', 'post_content' => 'some_content', 'ID' => $post_id ) );

		$this->assertCount( 1, wp_get_post_revisions( $post_id ) ); // Just the initial revision

		// First update
		wp_update_post( array( 'post_content'	=> 'some updated content', 'ID' => $post_id ) );

		$this->assertCount( 2, wp_get_post_revisions( $post_id ) ); // should be 2 revisions so far

		//update the post
		wp_update_post( array( 'post_content'	=> 'new update for some updated content', 'ID' => $post_id ) );	//2nd revision
		$this->assertCount( 3, wp_get_post_revisions( $post_id ) ); // should be 3 revision so far

		//next try to save another identical update, tests for patch that prevents storing duplicates
		wp_update_post( array( 'post_content'	=> 'new update for some updated content', 'ID' => $post_id ) );	//content unchanged, shouldn't save
		$this->assertCount( 3, wp_get_post_revisions( $post_id ) ); //should still be 3 revision

		//next try to save another update, same content, but new ttile, should save revision
		wp_update_post( array( 'post_title' => 'some-post-changed', 'post_content'	=> 'new update for some updated content', 'ID' => $post_id ) );
		$this->assertCount( 4, wp_get_post_revisions( $post_id ) ); //should  be 4 revision

		//next try to save another identical update
		wp_update_post( array( 'post_title' => 'some-post-changed', 'post_content'	=> 'new update for some updated content', 'ID' => $post_id ) );	//content unchanged, shouldn't save
		$this->assertCount( 4, wp_get_post_revisions( $post_id ) ); //should still be 4 revision
	}

	/**
	* @ticket 7392
	* @ticket 9843
	*/
	function test_revision_force_save_revision_even_if_unchanged() {
		add_filter( 'wp_save_post_revision_check_for_changes', '__return_false' );

		$post = get_default_post_to_edit( 'post', true );
		$post_id = $post->ID;

		$this->assertCount( 0, wp_get_post_revisions( $post_id ) ); // No revisions on auto-draft creation.

		wp_update_post( array( 'post_status' => 'draft', 'post_title' => 'some-post', 'post_type' => 'post', 'post_content' => 'some_content', 'ID' => $post_id ) );

		$this->assertCount( 1, wp_get_post_revisions( $post_id ) );

		wp_update_post( array( 'post_content'	=> 'some updated content', 'ID' => $post_id ) );	//1st revision
		$this->assertCount( 2, wp_get_post_revisions( $post_id ) );

		//update the post
		wp_update_post( array( 'post_content'	=> 'new update for some updated content', 'ID' => $post_id ) );	//2nd revision
		$this->assertCount( 3, wp_get_post_revisions( $post_id ) );

		//next try to save another identical update, tests for patch that prevents storing duplicates
		wp_update_post( array( 'post_content'	=> 'new update for some updated content', 'ID' => $post_id ) );	//content unchanged, shouldn't save
		$this->assertCount( 4, wp_get_post_revisions( $post_id ) );

		//next try to save another update, same content, but new ttile, should save revision
		wp_update_post( array( 'post_title' => 'some-post-changed', 'post_content'	=> 'new update for some updated content', 'ID' => $post_id ) );
		$this->assertCount( 5, wp_get_post_revisions( $post_id ) );

		//next try to save another identical update
		wp_update_post( array( 'post_title' => 'some-post-changed', 'post_content'	=> 'new update for some updated content', 'ID' => $post_id ) );	//content unchanged, shouldn't save
		$this->assertCount( 6, wp_get_post_revisions( $post_id ) );

		remove_filter( 'wp_save_post_revision_check_for_changes', '__return_false' );
	}

	/**
	 * Tests the Caps used in the action=view case of wp-admin/revision.php
	 * @ticket 16847
	 */
	function test_revision_view_caps_post() {
		$author_user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$editor_user_id = $this->factory->user->create( array( 'role' => 'editor' ) );

		$post_id = $this->factory->post->create( array( 'post_type' => 'post', 'post_author' => $editor_user_id ) );
		wp_update_post( array( 'post_content' => 'This content is much better', 'ID' => $post_id ) );

		$revisions = wp_get_post_revisions( $post_id );
		$this->assertCount( 1, $revisions );
		$this->assertTrue( user_can( $editor_user_id, 'read_post', $post_id ) );

		foreach ( $revisions as $revision ) {
			$this->assertTrue( user_can( $editor_user_id, 'read_post', $revision->ID ) );
		}

		// Author should be able to view the revisions fine
		foreach ( $revisions as $revision ) {
			$this->assertTrue( user_can( $author_user_id, 'read_post', $revision->ID ) );
		}
	}

	/**
	 * Tests the Caps used in the action=restore case of wp-admin/revision.php
	 * @ticket 16847
	 */
	function test_revision_restore_caps_post() {
		$author_user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$editor_user_id = $this->factory->user->create( array( 'role' => 'editor' ) );

		$post_id = $this->factory->post->create( array( 'post_type' => 'post', 'post_author' => $editor_user_id ) );
		wp_update_post( array( 'post_content' => 'This content is much better', 'ID' => $post_id ) );

		$revisions = wp_get_post_revisions( $post_id );
		$this->assertCount( 1, $revisions );
		foreach ( $revisions as $revision ) {
			 $this->assertTrue( user_can( $editor_user_id, 'edit_post', $revision->post_parent ) );
		}

		// Author shouldn't be able to restore the revisions
		foreach ( $revisions as $revision ) {
			 $this->assertFalse( user_can( $author_user_id, 'edit_post', $revision->post_parent ) );
		}
	}

	/**
	 * Tests the Caps used in the action=diff case of wp-admin/revision.php
	 * @ticket 16847
	 */
	function test_revision_diff_caps_post() {
		$author_user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$editor_user_id = $this->factory->user->create( array( 'role' => 'editor' ) );

		$post_id = $this->factory->post->create( array( 'post_type' => 'post', 'post_author' => $editor_user_id ) );
		wp_update_post( array( 'post_content' => 'This content is much better', 'ID' => $post_id ) );
		wp_update_post( array( 'post_content' => 'This content is even better', 'ID' => $post_id ) );

		// Diff checks if you can read both left and right revisions
		$revisions = wp_get_post_revisions( $post_id );
		$this->assertCount( 2, $revisions );
		foreach ( $revisions as $revision ) {
			$this->assertTrue( user_can( $editor_user_id, 'read_post', $revision->ID ) );
		}

		// Author should be able to diff the revisions fine
		foreach ( $revisions as $revision ) {
			$this->assertTrue( user_can( $author_user_id, 'read_post', $revision->ID ) );
		}
	}

	/**
	 * Tests the Caps used in the action=view case of wp-admin/revision.php with a CPT with Custom Capabilities
	 * @ticket 16847
	 */
	function test_revision_view_caps_cpt() {
		register_post_type( $this->post_type, array(
			'capability_type' => 'event',
			'map_meta_cap' => true,
			'supports' => array( 'revisions' ),
		) );

		$author_user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$editor_user_id = $this->factory->user->create( array( 'role' => 'editor' ) );

		$post_id = $this->factory->post->create( array( 'post_type' => $this->post_type, 'post_author' => $editor_user_id ) );
		wp_update_post( array( 'post_content' => 'This content is much better', 'ID' => $post_id ) );

		$revisions = wp_get_post_revisions( $post_id );
		$this->assertCount( 1, $revisions );
		$this->assertTrue( user_can( $editor_user_id, 'read_post', $post_id ) );

		foreach ( $revisions as $revision ) {
			 $this->assertTrue( user_can( $editor_user_id, 'read_post', $revision->ID ) );
		}

		// Author should be able to view the revisions fine
		foreach ( $revisions as $revision ) {
			 $this->assertTrue( user_can( $author_user_id, 'read_post', $revision->ID ) );
		}
	}

	/**
	 * Tests the Caps used in the action=restore case of wp-admin/revision.php
	 * @ticket 16847
	 */
	function test_revision_restore_caps_cpt() {
		register_post_type( $this->post_type, array(
			'capability_type' => 'event',
			'map_meta_cap' => true,
			'supports' => array( 'revisions' ),
		) );

		$author_user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$editor_user_id = $this->factory->user->create( array( 'role' => 'editor' ) );

		// The minimum extra caps needed for this test normally you would give the role all the relevant caps.
		$editor_user = new WP_User( $editor_user_id );
		$editor_user->add_cap( 'edit_published_events' );

		//create a post as Editor
		$post_id = $this->factory->post->create( array( 'post_type' => $this->post_type, 'post_author' => $editor_user_id ) );
		wp_update_post( array( 'post_content' => 'This content is much better', 'ID' => $post_id ) );

		$revisions = wp_get_post_revisions( $post_id );
		$this->assertCount( 1, $revisions );
		foreach ( $revisions as $revision ) {
			$this->assertTrue( user_can( $editor_user_id, 'edit_post', $revision->post_parent ) );
		}

		// Author shouldn't be able to restore the revisions
		wp_set_current_user( $author_user_id );
		foreach ( $revisions as $revision ) {
			$this->assertFalse( user_can( $author_user_id, 'edit_post', $revision->post_parent ) );
		}
	}

	/**
	 * Tests the Caps used in the action=restore case of wp-admin/revision.php
	 * @ticket 16847
	 */
	function test_revision_restore_caps_before_publish() {
		register_post_type( $this->post_type, array(
			'capability_type' => 'post',
			'capabilities' => array(
				// No one can edit this post type once published.
				// So, revisions cannot be restored, either.
				'edit_published_posts' => 'do_not_allow',
			),
			'map_meta_cap' => true,
			'supports' => array( 'revisions' ),
		) );

		$old_id = get_current_user_id();
		wp_set_current_user( $this->factory->user->create( array( 'role' => 'editor' ) ) );

		$post_id = $this->factory->post->create( array( 'post_type' => $this->post_type, 'post_status' => 'draft' ) );
		wp_update_post( array( 'post_content' => 'This content is much better', 'ID' => $post_id ) );

		$revisions = wp_get_post_revisions( $post_id );
		$this->assertCount( 1, $revisions );
		foreach ( $revisions as $revision ) {
			$this->assertTrue( current_user_can( 'edit_post', $revision->post_parent ) );
			$this->assertTrue( current_user_can( 'edit_post', $revision->ID ) );
		}

		wp_update_post( array( 'post_status' => 'publish', 'ID' => $post_id, 'post_content' => rand_str() ) );

		$revisions = wp_get_post_revisions( $post_id );
		$this->assertCount( 2, $revisions );
		foreach ( $revisions as $revision ) {
			$this->assertFalse( current_user_can( 'edit_post', $revision->post_parent ) );
			$this->assertFalse( current_user_can( 'edit_post', $revision->ID ) );
		}
		wp_set_current_user( $old_id );
	}

	/**
	 * Tests the Caps used in the action=diff case of wp-admin/revision.php
	 * @ticket 16847
	 */
	function test_revision_diff_caps_cpt() {
		register_post_type( $this->post_type, array(
			'capability_type' => 'event',
			'map_meta_cap' => true,
			'supports' => array( 'revisions' ),
		) );

		$author_user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$editor_user_id = $this->factory->user->create( array( 'role' => 'editor' ) );

		$post_id = $this->factory->post->create( array( 'post_type' => $this->post_type, 'post_author' => $editor_user_id ) );
		wp_update_post( array( 'post_content' => 'This content is much better', 'ID' => $post_id ) );
		wp_update_post( array( 'post_content' => 'This content is even better', 'ID' => $post_id ) );

		// Diff checks if you can read both left and right revisions
		$revisions = wp_get_post_revisions( $post_id );
		$this->assertCount( 2, $revisions );
		foreach ( $revisions as $revision ) {
			$this->assertTrue( user_can( $editor_user_id, 'read_post', $revision->ID ) );
		}

		// Author should be able to diff the revisions fine
		foreach ( $revisions as $revision ) {
			$this->assertTrue( user_can( $author_user_id, 'read_post', $revision->ID ) );
		}
	}

	/**
	 * @ticket 26042
	 */
	function test_wp_get_post_revisions_should_order_by_post_date() {
		global $wpdb;

		$post = $this->factory->post->create_and_get( array( 'post_title' => 'some-post', 'post_type' => 'post', 'post_content' => 'some_content' ) );

		$post = (array) $post;
		$post_revision_fields = _wp_post_revision_fields( $post );
		$post_revision_fields = wp_slash( $post_revision_fields );

		$revision_ids = array();
		$now = time();
		for ( $j = 1; $j < 3; $j++ ) {
			// Manually modify dates to ensure they're different.
			$date = date( 'Y-m-d H:i:s', $now - ( $j * 10 ) );
			$post_revision_fields['post_date'] = $date;
			$post_revision_fields['post_date_gmt'] = $date;

			$revision_id = wp_insert_post( $post_revision_fields );

			$revision_ids[] = $revision_id;
		}

		$revisions = wp_get_post_revisions( $post['ID'] );

		$this->assertEquals( $revision_ids, array_values( wp_list_pluck( $revisions, 'ID' ) ) );
	}

	/**
	 * @ticket 26042
	 */
	function test_wp_get_post_revisions_should_order_by_ID_when_post_date_matches() {
		global $wpdb;

		$post = $this->factory->post->create_and_get( array( 'post_title' => 'some-post', 'post_type' => 'post', 'post_content' => 'some_content' ) );

		$post = (array) $post;
		$post_revision_fields = _wp_post_revision_fields( $post );
		$post_revision_fields = wp_slash( $post_revision_fields );

		$revision_ids = array();
		$date = date( 'Y-m-d H:i:s', time() - 10 );
		for ( $j = 1; $j < 3; $j++ ) {
			// Manually modify dates to ensure they're the same.
			$post_revision_fields['post_date'] = $date;
			$post_revision_fields['post_date_gmt'] = $date;

			$revision_id = wp_insert_post( $post_revision_fields );

			$revision_ids[] = $revision_id;
		}

		rsort( $revision_ids );

		$revisions = wp_get_post_revisions( $post['ID'] );

		$this->assertEquals( $revision_ids, array_values( wp_list_pluck( $revisions, 'ID' ) ) );
	}
}
