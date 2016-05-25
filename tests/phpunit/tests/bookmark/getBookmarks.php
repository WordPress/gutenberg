<?php

/**
 * @group bookmark
 */
class Tests_Bookmark_GetBookmarks extends WP_UnitTestCase {
	public function test_should_hit_cache() {
		global $wpdb;

		$bookmarks = self::factory()->bookmark->create_many( 2 );

		$found1 = get_bookmarks( array(
			'orderby' => 'link_id',
		) );

		$num_queries = $wpdb->num_queries;

		$found2 = get_bookmarks( array(
			'orderby' => 'link_id',
		) );

		$this->assertEqualSets( $found1, $found2 );
		$this->assertSame( $num_queries, $wpdb->num_queries );
	}

	public function test_adding_bookmark_should_bust_get_bookmarks_cache() {
		global $wpdb;

		$bookmarks = self::factory()->bookmark->create_many( 2 );

		// Prime cache.
		$found1 = get_bookmarks( array(
			'orderby' => 'link_id',
		) );

		$num_queries = $wpdb->num_queries;

		$bookmarks[] = wp_insert_link( array(
			'link_name' => 'foo',
			'link_url' => 'http://example.com',
		) );

		$found2 = get_bookmarks( array(
			'orderby' => 'link_id',
		) );

		$this->assertEqualSets( $bookmarks, wp_list_pluck( $found2, 'link_id' ) );
		$this->assertTrue( $num_queries < $wpdb->num_queries );
	}
}
