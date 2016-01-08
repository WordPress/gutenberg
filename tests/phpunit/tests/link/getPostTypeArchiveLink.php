<?php
/**
 * @group link
 */
class Tests_Link_GetPostTypeArchiveLink extends WP_UnitTestCase {

	/**
	 * @ticket 19902
	 */
	public function test_get_post_archive_link_with_post_archive_on_front_page() {
		update_option( 'show_on_front', 'posts' );
		$actual = get_post_type_archive_link( 'post' );
		$expected = get_home_url();
		$this->assertSame( $expected, $actual );
	}

	/**
	 * @ticket 19902
	 */
	public function test_get_post_archive_link_with_post_archive_on_a_blog_page() {
		$page_for_posts = $this->factory->post->create( array( 'post_title' => 'blog-page', 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_for_posts', $page_for_posts );
		$actual = get_post_type_archive_link( 'post' );
		$expected = get_permalink( $page_for_posts );
		$this->assertSame( $expected, $actual );
	}
}
