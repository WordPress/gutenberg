<?php

class Tests_Query extends WP_UnitTestCase {

	/**
	 * @ticket 16746
	 */
	function test_nextpage_at_start_of_content() {
		$post = $this->factory->post->create_and_get( array( 'post_content' => '<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3' ) );
		setup_postdata( $post );

		$this->assertEquals( 1, $GLOBALS['multipage'] );
		$this->assertCount(  3, $GLOBALS['pages']     );
		$this->assertEquals( 3, $GLOBALS['numpages']  );
		$this->assertEquals( array( 'Page 1', 'Page 2', 'Page 3' ), $GLOBALS['pages'] );
	}

	function test_setup_postdata_single_page() {
		$post = $this->factory->post->create_and_get( array( 'post_content' => 'Page 0' ) );
		setup_postdata( $post );

		$this->assertEquals( 0, $GLOBALS['multipage'] );
		$this->assertCount(  1, $GLOBALS['pages']     );
		$this->assertEquals( 1, $GLOBALS['numpages']  );
		$this->assertEquals( array( 'Page 0' ), $GLOBALS['pages'] );
	}

	function test_setup_postdata_multi_page() {
		$post = $this->factory->post->create_and_get( array( 'post_content' => 'Page 0<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3' ) );
		setup_postdata( $post );

		$this->assertEquals( 1, $GLOBALS['multipage'] );
		$this->assertCount(  4, $GLOBALS['pages']     );
		$this->assertEquals( 4, $GLOBALS['numpages']  );
		$this->assertEquals( array( 'Page 0', 'Page 1', 'Page 2', 'Page 3' ), $GLOBALS['pages'] );
	}

	/**
	 * @ticket 24330
	 *
	 * setup_postdata( $a_post ) followed by the_content() in a loop that does not update
	 * global $post should use the content of $a_post rather then the global post.
	 */
	function test_setup_postdata_loop() {
		$post_id = $this->factory->post->create( array( 'post_content' => 'global post' ) );
		$GLOBALS['wp_query']->post = $GLOBALS['post'] = get_post( $post_id );

		$ids = $this->factory->post->create_many(5);
		foreach ( $ids as $id ) {
			$page = get_post( $id );
			if ( $page ) {
				setup_postdata( $page );
				$content = get_echo( 'the_content', array() );
				$this->assertEquals( $post_id, $GLOBALS['post']->ID );
				$this->assertNotEquals( '<p>global post</p>', strip_ws( $content ) );
				wp_reset_postdata();
			}
		}
	}
}