<?php

/**
 * @group admin
 */
class Tests_Admin_includesPost extends WP_UnitTestCase {

	function test__wp_translate_postdata_cap_checks_contributor() {
		$contributor_id = $this->factory->user->create( array( 'role' => 'contributor' ) );
		$editor_id = $this->factory->user->create( array( 'role' => 'editor' ) );

		wp_set_current_user( $contributor_id );

		// Create New Draft Post
		$_post_data = array();
		$_post_data['post_author'] = $contributor_id;
		$_post_data['post_type'] = 'post';
		$_post_data['saveasdraft'] = true;

		$_results = _wp_translate_postdata( false, $_post_data );
		$this->assertNotInstanceOf( 'WP_Error', $_results );
		$this->assertEquals( $_post_data['post_author'], $_results['post_author'] );
		$this->assertEquals( 'draft', $_results['post_status'] );

		// Submit Post for Approval
		$_post_data = array();
		$_post_data['post_author'] = $contributor_id;
		$_post_data['post_type'] = 'post';
		$_post_data['publish'] = true;

		$_results = _wp_translate_postdata( false, $_post_data );
		$this->assertNotInstanceOf( 'WP_Error', $_results );
		$this->assertEquals( $_post_data['post_author'], $_results['post_author'] );
		$this->assertEquals( 'pending', $_results['post_status'] );

		// Create New Draft Post for another user
		$_post_data = array();
		$_post_data['post_author'] = $editor_id;
		$_post_data['post_type'] = 'post';
		$_post_data['saveasdraft'] = true;

		$_results = _wp_translate_postdata( false, $_post_data );
		$this->assertInstanceOf( 'WP_Error', $_results );
		$this->assertEquals( 'edit_others_posts', $_results->get_error_code() );
		$this->assertEquals( 'You are not allowed to create posts as this user.', $_results->get_error_message() );

		// Edit Draft Post for another user
		$_post_data = array();
		$_post_data['post_ID'] = $this->factory->post->create( array( 'post_author' => $editor_id ) );
		$_post_data['post_author'] = $editor_id;
		$_post_data['post_type'] = 'post';
		$_post_data['post_status'] = 'draft';
		$_post_data['saveasdraft'] = true;

		$_results = _wp_translate_postdata( true, $_post_data );
		$this->assertInstanceOf( 'WP_Error', $_results );
		$this->assertEquals( 'edit_others_posts', $_results->get_error_code() );
		$this->assertEquals( 'You are not allowed to edit posts as this user.', $_results->get_error_message() );

		wp_set_current_user( 0 );
	}

	function test__wp_translate_postdata_cap_checks_editor() {
		$contributor_id = $this->factory->user->create( array( 'role' => 'contributor' ) );
		$editor_id = $this->factory->user->create( array( 'role' => 'editor' ) );

		wp_set_current_user( $editor_id );

		// Create New Draft Post
		$_post_data = array();
		$_post_data['post_author'] = $editor_id;
		$_post_data['post_type'] = 'post';
		$_post_data['saveasdraft'] = true;

		$_results = _wp_translate_postdata( false, $_post_data );
		$this->assertNotInstanceOf( 'WP_Error', $_results );
		$this->assertEquals( $_post_data['post_author'], $_results['post_author'] );
		$this->assertEquals( 'draft', $_results['post_status'] );

		// Publish Post
		$_post_data = array();
		$_post_data['post_author'] = $editor_id;
		$_post_data['post_type'] = 'post';
		$_post_data['publish'] = true;

		$_results = _wp_translate_postdata( false, $_post_data );
		$this->assertNotInstanceOf( 'WP_Error', $_results );
		$this->assertEquals( $_post_data['post_author'], $_results['post_author'] );
		$this->assertEquals( 'publish', $_results['post_status'] );

		// Create New Draft Post for another user
		$_post_data = array();
		$_post_data['post_author'] = $contributor_id;
		$_post_data['post_type'] = 'post';
		$_post_data['saveasdraft'] = true;

		$_results = _wp_translate_postdata( false, $_post_data );
		$this->assertNotInstanceOf( 'WP_Error', $_results );
		$this->assertEquals( $_post_data['post_author'], $_results['post_author'] );
		$this->assertEquals( 'draft', $_results['post_status'] );

		// Edit Draft Post for another user
		$_post_data = array();
		$_post_data['post_ID'] = $this->factory->post->create( array( 'post_author' => $contributor_id ) );
		$_post_data['post_author'] = $contributor_id;
		$_post_data['post_type'] = 'post';
		$_post_data['post_status'] = 'draft';
		$_post_data['saveasdraft'] = true;

		$_results = _wp_translate_postdata( true, $_post_data );
		$this->assertNotInstanceOf( 'WP_Error', $_results );
		$this->assertEquals( $_post_data['post_author'], $_results['post_author'] );
		$this->assertEquals( 'draft', $_results['post_status'] );

		wp_set_current_user( 0 );
	}
}