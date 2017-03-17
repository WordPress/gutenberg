<?php

if ( is_multisite() ) :
/**
 * Saving network settings without altering starter content ( first page, post, and comment ) shouldn't affect
 * the way it is added to new sites.
 *
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_Install_Defaults extends WP_UnitTestCase {
	/**
	 * @ticket 40036
	 */
	public function test_option_should_not_be_empty_by_default() {
		$blog_id = $this->factory->blog->create();

		switch_to_blog( $blog_id );

		$first_page = get_page_by_path( '/sample-page' );
		$first_comment = get_comments();

		restore_current_blog();
		wpmu_delete_blog( $blog_id, true );

		$this->assertNotEmpty( $first_page->post_content );
		$this->assertNotEmpty( $first_comment[0]->comment_content );
	}

	/**
	 * @ticket 40036
	 */
	public function test_empty_option_should_fall_back_to_default() {
		/*
		 * Update first_page / first_comment options,
		 * just like what happens when the network settings page is saved
		 */
		update_site_option( 'first_page', '' );
		update_site_option( 'first_comment', '' );

		$blog_id = $this->factory->blog->create();

		switch_to_blog( $blog_id );

		$first_page = get_page_by_path( '/sample-page' );
		$first_comment = get_comments();

		restore_current_blog();
		wpmu_delete_blog( $blog_id, true );

		$this->assertNotEmpty( $first_page->post_content );
		$this->assertNotEmpty( $first_comment[0]->comment_content );
	}

	/**
	 * @ticket 40036
	 */
	public function test_non_default_option_values() {
		/*
		 * Update first_page / first_comment options,
		 * just like what happens when the network settings page is saved
		 */
		update_site_option( 'first_page', 'Some page content' );
		update_site_option( 'first_comment', 'Some comment content' );

		$blog_id = $this->factory->blog->create();

		switch_to_blog( $blog_id );

		$first_page = get_page_by_path( '/sample-page' );
		$first_comment = get_comments();

		restore_current_blog();
		wpmu_delete_blog( $blog_id, true );

		$this->assertEquals( 'Some page content', $first_page->post_content );
		$this->assertEquals( 'Some comment content', $first_comment[0]->comment_content );
	}
}

endif;
