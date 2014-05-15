<?php

class Tests_Post_Template extends WP_UnitTestCase {

	function test_wp_link_pages() {
		$contents = array( 'One', 'Two', 'Three' );
		$content = join( '<!--nextpage-->', $contents );
		$post_id = $this->factory->post->create( array( 'post_content' => $content ) );

		$this->go_to( '?p=' . $post_id );

		setup_postdata( get_post( $post_id ) );

		$permalink = sprintf( '<a href="%s">', get_permalink() );
		$page2 = _wp_link_page( 2 );
		$page3 = _wp_link_page( 3 );

		$expected = "<p>Pages: 1 {$page2}2</a> {$page3}3</a></p>";
		$output = wp_link_pages( array( 'echo' => 0 ) );

		$this->assertEquals( $expected, $output );

		$before_after = " 1 {$page2}2</a> {$page3}3</a>";
		$output = wp_link_pages( array( 'echo' => 0, 'before' => '', 'after' => '' ) );

		$this->assertEquals( $before_after, $output );

		$separator = "1{$page2}2</a>{$page3}3</a>";
		$output = wp_link_pages( array( 'echo' => 0, 'before' => '', 'after' => '', 'separator' => '' ) );

		$this->assertEquals( $separator, $output );

		$link = "<em>1</em>{$page2}<em>2</em></a>{$page3}<em>3</em></a>";
		$output = wp_link_pages( array( 'echo' => 0, 'before' => '', 'after' => '', 'separator' => '',
			'link_before' => '<em>', 'link_after' => '</em>'
		) );

		$this->assertEquals( $link, $output );

		$next = "{$page2}<em>Next page</em></a>";
		$output = wp_link_pages( array( 'echo' => 0, 'before' => '', 'after' => '', 'separator' => '',
			'link_before' => '<em>', 'link_after' => '</em>', 'next_or_number' => 'next'
		) );

		$this->assertEquals( $next, $output );

		$GLOBALS['page'] = 2;
		$next_prev = "{$permalink}<em>Previous page</em></a>{$page3}<em>Next page</em></a>";
		$output = wp_link_pages( array( 'echo' => 0, 'before' => '', 'after' => '', 'separator' => '',
			'link_before' => '<em>', 'link_after' => '</em>', 'next_or_number' => 'next'
		) );

		$this->assertEquals( $next_prev, $output );

		$next_prev_link = "{$permalink}Woo page</a>{$page3}Hoo page</a>";
		$output = wp_link_pages( array( 'echo' => 0, 'before' => '', 'after' => '', 'separator' => '',
			'next_or_number' => 'next', 'nextpagelink' => 'Hoo page', 'previouspagelink' => 'Woo page'
		) );

		$this->assertEquals( $next_prev_link, $output );

		$GLOBALS['page'] = 1;
		$separator = "<p>Pages: | 1 | {$page2}2</a> | {$page3}3</a></p>";
		$output = wp_link_pages( array( 'echo' => 0, 'separator' => ' | ' ) );

		$this->assertEquals( $separator, $output );

		$pagelink = " | Page 1 | {$page2}Page 2</a> | {$page3}Page 3</a>";
		$output = wp_link_pages( array( 'echo' => 0, 'separator' => ' | ', 'before' => '', 'after' => '',
			'pagelink' => 'Page %'
		) );

		$this->assertEquals( $pagelink, $output );
	}
}