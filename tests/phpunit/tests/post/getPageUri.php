<?php

/**
 * @group post
 */
class Tests_Post_getPageUri extends WP_UnitTestCase {

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
