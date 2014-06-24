<?php

/**
 * @group comment
 */
class Tests_Comment_Walker extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();

		$this->post_id = $this->factory->post->create();
	}

	/**
	 * @ticket 14041
	 */
	function test_has_children() {
		$comment_parent = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id ) );
		$comment_child  = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_parent' => $comment_parent ) );
		$comment_parent = get_comment( $comment_parent );
		$comment_child  = get_comment( $comment_child  );

		$comment_walker   = new Walker_Comment();
		$comment_callback = new Comment_Callback_Test( $this, $comment_walker );

		wp_list_comments( array( 'callback' => array( $comment_callback, 'comment' ), 'walker' => $comment_walker, 'echo' => false ), array( $comment_parent, $comment_child ) );
		wp_list_comments( array( 'callback' => array( $comment_callback, 'comment' ), 'walker' => $comment_walker, 'echo' => false ), array( $comment_child, $comment_parent ) );
	}
}

class Comment_Callback_Test {
	public function __construct( Tests_Comment_Walker $test_walker, Walker_Comment $walker ) {
		$this->test_walker = $test_walker;
		$this->walker      = $walker;
	}

	public function comment( $comment, $args, $depth ) {
		if ( 1 == $depth ) {
			$this->test_walker->assertTrue( $this->walker->has_children );
			$this->test_walker->assertTrue( $args['has_children']       ); // Back compat
		}

		else if ( 2 == $depth ) {
			$this->test_walker->assertFalse( $this->walker->has_children );
			$this->test_walker->assertFalse( $args['has_children']       ); // Back compat
		}
	}
}
