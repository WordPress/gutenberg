<?php

/**
 * @group post
 */
class Tests_Post_getPageUri extends WP_UnitTestCase {

	/**
	 * @ticket 22883
	 */
	function test_get_page_uri_with_stdclass_post_object() {
		$post_id    = self::factory()->post->create( array( 'post_name' => 'get-page-uri-post-name' ) );

		// Mimick an old stdClass post object, missing the ancestors field.
		$post_array = (object) get_post( $post_id, ARRAY_A );
		unset( $post_array->ancestors );

		// Dummy assertion. If this test fails, it will actually error out on an E_WARNING.
		$this->assertEquals( 'get-page-uri-post-name', get_page_uri( $post_array ) );
	}

	/**
	 * @ticket 24491
	 */
	function test_get_page_uri_with_nonexistent_post() {
		global $wpdb;
		$post_id = $wpdb->get_var( "SELECT MAX(ID) FROM $wpdb->posts" ) + 1;
		$this->assertFalse( get_page_uri( $post_id ) );
	}

	/**
	 * @ticket 15963
	 */
	function test_get_post_uri_check_orphan() {
		$parent_id = self::factory()->post->create( array( 'post_name' => 'parent' ) );
		$child_id = self::factory()->post->create( array( 'post_name' => 'child', 'post_parent' => $parent_id ) );

		// check the parent for good measure
		$this->assertEquals( 'parent', get_page_uri( $parent_id ) );

		// try the child normally
		$this->assertEquals( 'parent/child', get_page_uri( $child_id ) );

		// now delete the parent from the database and check
		wp_delete_post( $parent_id, true );
		$this->assertEquals( 'child', get_page_uri( $child_id ) );
	}

	function test_get_page_uri_without_argument() {
		$post_id = self::factory()->post->create(array(
			'post_title' => 'Blood Orange announces summer tour dates',
			'post_name' => 'blood-orange-announces-summer-tour-dates',
		));
		$post = get_post( $post_id );
		$this->go_to( get_permalink( $post_id ) );
		$this->assertEquals( 'blood-orange-announces-summer-tour-dates', get_page_uri() );
	}
}
