<?php

/**
 * @group link
 * @group comment
 * @covers ::get_next_comments_link
 */
class Tests_Link_GetNextCommentsLink extends WP_UnitTestCase {

	public function test_page_should_respect_value_of_cpage_query_var() {
		$p = self::factory()->post->create();
		$this->go_to( get_permalink( $p ) );

		$cpage = get_query_var( 'cpage' );
		set_query_var( 'cpage', 3 );

		$link = get_next_comments_link( 'Next', 5 );

		$this->assertContains( 'cpage=4', $link );

		set_query_var( 'cpage', $cpage );
	}

	/**
	 * @ticket 20319
	 */
	public function test_page_should_default_to_1_when_no_cpage_query_var_is_found() {
		$p = self::factory()->post->create();
		$this->go_to( get_permalink( $p ) );

		$cpage = get_query_var( 'cpage' );
		set_query_var( 'cpage', '' );

		$link = get_next_comments_link( 'Next', 5 );

		$this->assertContains( 'cpage=2', $link );

		set_query_var( 'cpage', $cpage );
	}

}
