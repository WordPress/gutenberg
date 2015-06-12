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

	/**
	 * @ticket 12494
	 */
	public function test_wp_dropdown_pages_value_field_should_default_to_ID() {
		$p = $this->factory->post->create( array(
			'post_type' => 'page',
		) );

		$found = wp_dropdown_pages( array(
			'echo' => 0,
		) );

		// Should contain page ID by default.
		$this->assertContains( 'value="' . $p . '"', $found );
	}

	/**
	 * @ticket 12494
	 */
	public function test_wp_dropdown_pages_value_field_ID() {
		$p = $this->factory->post->create( array(
			'post_type' => 'page',
		) );

		$found = wp_dropdown_pages( array(
			'echo' => 0,
			'value_field' => 'ID',
		) );

		$this->assertContains( 'value="' . $p . '"', $found );
	}

	/**
	 * @ticket 12494
	 */
	public function test_wp_dropdown_pages_value_field_post_name() {
		$p = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_name' => 'foo',
		) );

		$found = wp_dropdown_pages( array(
			'echo' => 0,
			'value_field' => 'post_name',
		) );

		$this->assertContains( 'value="foo"', $found );
	}

	/**
	 * @ticket 12494
	 */
	public function test_wp_dropdown_pages_value_field_should_fall_back_on_ID_when_an_invalid_value_is_provided() {
		$p = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_name' => 'foo',
		) );

		$found = wp_dropdown_pages( array(
			'echo' => 0,
			'value_field' => 'foo',
		) );

		$this->assertContains( 'value="' . $p . '"', $found );
	}

	/**
	 * @ticket 30082
	 */
	public function test_wp_dropdown_pages_should_not_contain_class_attribute_when_no_class_is_passed() {
		$p = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_name' => 'foo',
		) );

		$found = wp_dropdown_pages( array(
			'echo' => 0,
		) );

		$this->assertNotRegExp( '/<select[^>]+class=\'/', $found );
	}

	/**
	 * @ticket 30082
	 */
	public function test_wp_dropdown_pages_should_obey_class_parameter() {
		$p = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_name' => 'foo',
		) );

		$found = wp_dropdown_pages( array(
			'echo' => 0,
			'class' => 'bar',
		) );

		$this->assertRegExp( '/<select[^>]+class=\'bar\'/', $found );
	}

	/**
	 * @ticket 31389
	 */
	public function test_get_page_template_slug_by_id() {
		$page_id = $this->factory->post->create( array(
			'post_type' => 'page',
		) );

		$this->assertEquals( '', get_page_template_slug( $page_id ) );

		update_post_meta( $page_id, '_wp_page_template', 'default' );
		$this->assertEquals( '', get_page_template_slug( $page_id ) );

		update_post_meta( $page_id, '_wp_page_template', 'example.php' );
		$this->assertEquals( 'example.php', get_page_template_slug( $page_id ) );
	}

	/**
	 * @ticket 31389
	 */
	public function test_get_page_template_slug_from_loop() {
		$page_id = $this->factory->post->create( array(
			'post_type' => 'page',
		) );

		update_post_meta( $page_id, '_wp_page_template', 'example.php' );
		$this->go_to( get_permalink( $page_id ) );

		$this->assertEquals( 'example.php', get_page_template_slug() );
	}

	/**
	 * @ticket 31389
	 */
	public function test_get_page_template_slug_non_page() {
		$post_id = $this->factory->post->create( array(
			'post_type' => 'post',
		) );

		$this->assertFalse( get_page_template_slug( $post_id ) );

		$this->go_to( get_permalink( $post_id ) );
		$this->assertFalse( get_page_template_slug() );
	}
}
