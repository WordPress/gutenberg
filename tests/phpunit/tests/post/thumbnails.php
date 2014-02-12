<?php
/**
 * @group post
 * @group thumbnails
 */
class Tests_Post_Thumbnails extends WP_UnitTestCase {
	/**
	 * @ticket 26321
	 */
	function test_update_post_thumbnail_cache() {
		update_post_thumbnail_cache();

		$this->assertFalse( $GLOBALS['wp_query']->thumbnails_cached );

		$this->factory->post->create_many( 3 );
		$GLOBALS['wp_query'] = new WP_Query( array( 'post_type' => 'post' ) );

		update_post_thumbnail_cache();

		$this->assertTrue( $GLOBALS['wp_query']->thumbnails_cached );

		$q = new WP_Query();
		update_post_thumbnail_cache( $q );
		$this->assertFalse( $q->thumbnails_cached );

		$p = new WP_Query( array( 'post_type' => 'post' ) );
		update_post_thumbnail_cache( $p );
		$this->assertTrue( $p->thumbnails_cached );
	}
}
