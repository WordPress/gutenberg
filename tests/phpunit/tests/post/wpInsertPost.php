<?php

/**
 * @group post
 */
class Tests_WPInsertPost extends WP_UnitTestCase {

	/**
	 * @ticket 11863
	 */
	function test_trashing_a_post_should_add_trashed_suffix_to_post_name() {
		$trashed_about_page_id = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_title' => 'About',
			'post_status' => 'publish'
		) );
		wp_trash_post( $trashed_about_page_id );
		$this->assertEquals( 'about__trashed', get_post( $trashed_about_page_id )->post_name );
	}

	/**
	 * @ticket 11863
	 */
	public function test_trashed_suffix_should_be_added_to_post_with__trashed_in_slug() {
		$trashed_about_page_id = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_title' => 'About',
			'post_status' => 'publish',
			'post_name' => 'foo__trashed__foo',
		) );
		wp_trash_post( $trashed_about_page_id );
		$this->assertEquals( 'foo__trashed__foo__trashed', get_post( $trashed_about_page_id )->post_name );
	}

	/**
	 * @ticket 11863
	 */
	function test_trashed_posts_original_post_name_should_be_reassigned_after_untrashing() {
		$about_page_id = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_title' => 'About',
			'post_status' => 'publish'
		) );
		wp_trash_post( $about_page_id );

		wp_untrash_post( $about_page_id );
		$this->assertEquals( 'about', get_post( $about_page_id )->post_name );
	}

	/**
	 * @ticket 11863
	 */
	function test_creating_a_new_post_should_add_trashed_suffix_to_post_name_of_trashed_posts_with_the_desired_slug() {
		$trashed_about_page_id = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_title' => 'About',
			'post_status' => 'trash'
		) );

		$about_page_id = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_title' => 'About',
			'post_status' => 'publish'
		) );

		$this->assertEquals( 'about__trashed', get_post( $trashed_about_page_id )->post_name );
		$this->assertEquals( 'about', get_post( $about_page_id )->post_name );
	}

	/**
	* @ticket 11863
	*/
	function test_untrashing_a_post_with_a_stored_desired_post_name_should_get_its_post_name_suffixed_if_another_post_has_taken_the_desired_post_name() {
		$about_page_id = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_title' => 'About',
			'post_status' => 'publish'
		) );
		wp_trash_post( $about_page_id );

		$another_about_page_id = self::factory()->post->create( array(
			'post_type' => 'page',
			'post_title' => 'About',
			'post_status' => 'publish'
		) );

		wp_untrash_post( $about_page_id );

		$this->assertEquals( 'about', get_post( $another_about_page_id )->post_name );
		$this->assertEquals( 'about-2', get_post( $about_page_id )->post_name );
	}
}
