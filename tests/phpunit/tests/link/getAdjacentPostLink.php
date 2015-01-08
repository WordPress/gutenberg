<?php

/**
 * @group link
 */
class Tests_Link_GetAdjacentPostLink extends WP_UnitTestCase {

	protected $post_ids;
	protected $cat_id;

	public function setUp(){
		parent::setUp();
		$this->cat_id = $this->factory->category->create( array( 'name' => 'other' ) );
		$this->post_ids = array();
		$this->post_ids[] = $this->factory->post->create( array( 'post_type' => 'post', 'post_date' => '2014-10-26 05:32:29', 'category_id' => 1 ) );
		$this->post_ids[] = $this->factory->post->create( array( 'post_type' => 'post', 'post_date' => '2014-10-26 04:32:29', 'category_id' => $this->cat_id ) );
		$this->post_ids[] = $this->factory->post->create( array( 'post_type' => 'post', 'post_date' => '2014-10-26 03:32:29', 'category_id' => 1 ) );
		$this->post_ids[] = $this->factory->post->create( array( 'post_type' => 'post', 'post_date' => '2014-10-26 02:32:29', 'category_id' => $this->cat_id ) );
		$this->post_ids[] = $this->factory->post->create( array( 'post_type' => 'post', 'post_date' => '2014-10-26 01:32:29', 'category_id' => 1 ) );

		//set current post (has 2 on each end)
		global $GLOBALS;
		$GLOBALS['post'] = get_post( $this->post_ids[2] );
	}

	public function test_get_next_post_link_default() {
		$actual = get_next_post_link();
		$expected = '<a href="' . home_url( '?p=' . $this->post_ids[1] ) . '" rel="next">Post title 2</a> &raquo;';
		$this->assertSame( $expected, $actual );
	}

	public function test_get_previous_post_link_default() {
		$actual = get_previous_post_link();
		$expected = '&laquo; <a href="' . home_url( '?p=' . $this->post_ids[3] ) . '" rel="prev">Post title 4</a>';
		$this->assertSame( $expected, $actual );
	}

	public function test_get_next_post_link_same_category() {
		$actual = get_next_post_link( '%link &raquo;', '%title', true );
		$expected = '<a href="' . home_url( '?p=' . $this->post_ids[1] ) . '" rel="next">Post title 2</a> &raquo;';
		$this->assertSame( $expected, $actual );
	}

	public function test_get_previous_post_link_same_category() {
		$actual = get_previous_post_link( '&laquo; %link', '%title', true );
		$expected = '&laquo; <a href="' . home_url( '?p=' . $this->post_ids[3] ) . '" rel="prev">Post title 4</a>';
		$this->assertSame( $expected, $actual );
	}

	public function test_get_next_post_link_exclude_category() {
		$actual = get_next_post_link( '%link &raquo;', '%title', false, $this->cat_id );
		$expected = '<a href="' . home_url( '?p=' . $this->post_ids[1] ) . '" rel="next">Post title 2</a> &raquo;';
		$this->assertSame( $expected, $actual );
	}

	public function test_get_previous_post_link_exclude_category() {
		$actual = get_previous_post_link( '&laquo; %link', '%title', false, $this->cat_id );
		$expected = '&laquo; <a href="' . home_url( '?p=' . $this->post_ids[3] ) . '" rel="prev">Post title 4</a>';
		$this->assertSame( $expected, $actual );
	}
}
