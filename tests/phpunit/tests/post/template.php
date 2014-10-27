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

		$separator = " 1{$page2}2</a>{$page3}3</a>";
		$output = wp_link_pages( array( 'echo' => 0, 'before' => '', 'after' => '', 'separator' => '' ) );

		$this->assertEquals( $separator, $output );

		$link = " <em>1</em>{$page2}<em>2</em></a>{$page3}<em>3</em></a>";
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
		$separator = "<p>Pages: 1 | {$page2}2</a> | {$page3}3</a></p>";
		$output = wp_link_pages( array( 'echo' => 0, 'separator' => ' | ' ) );

		$this->assertEquals( $separator, $output );

		$pagelink = " Page 1 | {$page2}Page 2</a> | {$page3}Page 3</a>";
		$output = wp_link_pages( array( 'echo' => 0, 'separator' => ' | ', 'before' => '', 'after' => '',
			'pagelink' => 'Page %'
		) );

		$this->assertEquals( $pagelink, $output );
	}

	function test_wp_dropdown_pages() {
		$none = wp_dropdown_pages( array( 'echo' => 0 ) );
		$this->assertEmpty( $none );

		$bump = '&nbsp;&nbsp;&nbsp;';
		$page_id = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$child_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_parent' => $page_id ) );
		$grandchild_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_parent' => $child_id ) );

		$lineage =<<<LINEAGE
<select name='page_id' id='page_id'>
	<option class="level-0" value="$page_id">Post title 1</option>
	<option class="level-1" value="$child_id">{$bump}Post title 2</option>
	<option class="level-2" value="$grandchild_id">{$bump}{$bump}Post title 3</option>
</select>

LINEAGE;

		$output = wp_dropdown_pages( array( 'echo' => 0 ) );
		$this->assertEquals( $lineage, $output );

		$depth =<<<DEPTH
<select name='page_id' id='page_id'>
	<option class="level-0" value="$page_id">Post title 1</option>
</select>

DEPTH;

		$output = wp_dropdown_pages( array( 'echo' => 0, 'depth' => 1 ) );
		$this->assertEquals( $depth, $output );

		$option_none =<<<NONE
<select name='page_id' id='page_id'>
	<option value="Woo">Hoo</option>
	<option class="level-0" value="$page_id">Post title 1</option>
</select>

NONE;

		$output = wp_dropdown_pages( array( 'echo' => 0, 'depth' => 1,
			'show_option_none' => 'Hoo', 'option_none_value' => 'Woo'
		) );
		$this->assertEquals( $option_none, $output );

		$option_no_change =<<<NO
<select name='page_id' id='page_id'>
	<option value="-1">Burrito</option>
	<option value="Woo">Hoo</option>
	<option class="level-0" value="$page_id">Post title 1</option>
</select>

NO;
		$output = wp_dropdown_pages( array( 'echo' => 0, 'depth' => 1,
			'show_option_none' => 'Hoo', 'option_none_value' => 'Woo',
			'show_option_no_change' => 'Burrito'
		) );
		$this->assertEquals( $option_no_change, $output );
	}
}