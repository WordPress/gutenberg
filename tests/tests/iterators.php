<?php

/**
 * @ticket 22435
 */
class Test_WP_Post_IDs_Iterator extends WP_UnitTestCase {
	function test_create() {
		new WP_Post_IDs_Iterator( array( 1, 2, 3 ) );
	}

	function test_no_posts() {
		$this->assertIteratorReturnsSamePostIDs( array() );
	}

	function test_less_ids_than_limit() {
		$post_id_0 = $this->factory->post->create();
		$post_id_1 = $this->factory->post->create();
		$this->assertIteratorReturnsSamePostIDs( array( $post_id_0, $post_id_1 ), 10 );
	}

	function test_ids_exactly_as_limit() {
		$post_id_0 = $this->factory->post->create();
		$post_id_1 = $this->factory->post->create();
		$this->assertIteratorReturnsSamePostIDs( array( $post_id_0, $post_id_1 ), 2 );
	}

	function test_more_ids_than_limit() {
		$post_id_0 = $this->factory->post->create();
		$post_id_1 = $this->factory->post->create();
		$post_id_2 = $this->factory->post->create();
		$this->assertIteratorReturnsSamePostIDs( array( $post_id_0, $post_id_1, $post_id_2 ), 2 );
	}

	function test_ids_exactly_twice_more_than_limit() {
		$post_id_0 = $this->factory->post->create();
		$post_id_1 = $this->factory->post->create();
		$post_id_2 = $this->factory->post->create();
		$post_id_3 = $this->factory->post->create();
		$this->assertIteratorReturnsSamePostIDs( array( $post_id_0, $post_id_1, $post_id_2, $post_id_3 ), 2 );
	}

	private function assertIteratorReturnsSamePostIDs( $post_ids, $limit = 2 ) {
		$this->assertEquals( $post_ids, wp_list_pluck( iterator_to_array( new WP_Post_IDs_Iterator( $post_ids, $limit ) ), 'ID' ) );
	}
}
