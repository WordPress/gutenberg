<?php
/**
 * @group comment
 */
class Tests_Comment_Template extends WP_UnitTestCase {

	function test_get_comments_number() {
		$post_id = $this->factory->post->create();

		$this->assertEquals( 0, get_comments_number( 0 ) );
		$this->assertEquals( 0, get_comments_number( $post_id ) );
		$this->assertEquals( 0, get_comments_number( get_post( $post_id ) ) );

		$this->factory->comment->create_post_comments( $post_id, 12 );

		$this->assertEquals( 12, get_comments_number( $post_id ) );
		$this->assertEquals( 12, get_comments_number( get_post( $post_id ) ) );
	}

	function test_get_comments_number_without_arg() {
		$post_id = $this->factory->post->create();
		$permalink = get_permalink( $post_id );
		$this->go_to( $permalink );

		$this->assertEquals( 0, get_comments_number() );

		$this->factory->comment->create_post_comments( $post_id, 12 );
		$this->go_to( $permalink );

		$this->assertEquals( 12, get_comments_number() );
	}

}