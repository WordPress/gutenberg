<?php
/**
 * Tests that internal comment types stay out of comment feeds.
 *
 * @package gutenberg
 */
class Tests_Note_Reactions_Feed extends WP_UnitTestCase {

	/**
	 * Published post the comments are attached to.
	 */
	private static int $post_id;

	/**
	 * A regular approved comment.
	 */
	private static int $comment_id;

	/**
	 * A reaction on a note.
	 */
	private static int $reaction_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post_id     = $factory->post->create( array( 'post_status' => 'publish' ) );
		self::$comment_id  = $factory->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_approved' => '1',
			)
		);
		$note_id           = $factory->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_type'     => 'note',
				'comment_approved' => '1',
			)
		);
		self::$reaction_id = $factory->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_parent'   => $note_id,
				'comment_type'     => 'reaction',
				'comment_content'  => '2764',
				'comment_approved' => '1',
			)
		);
	}

	/**
	 * Returns the comment IDs in the current feed query.
	 *
	 * @return int[]
	 */
	private function get_feed_comment_ids() {
		global $wp_query;
		return array_map( 'intval', wp_list_pluck( $wp_query->comments, 'comment_ID' ) );
	}

	public function test_site_comment_feed_excludes_reactions() {
		$this->go_to( '/?feed=comments-rss2' );

		$ids = $this->get_feed_comment_ids();
		$this->assertContains( self::$comment_id, $ids );
		$this->assertNotContains( self::$reaction_id, $ids );
	}

	public function test_post_comment_feed_excludes_reactions() {
		$this->go_to( '/?feed=rss2&p=' . self::$post_id );

		$ids = $this->get_feed_comment_ids();
		$this->assertContains( self::$comment_id, $ids );
		$this->assertNotContains( self::$reaction_id, $ids );
	}

	public function test_feed_query_survives_empty_internal_types_filter() {
		add_filter( 'gutenberg_internal_comment_types', '__return_empty_array' );
		$this->go_to( '/?feed=comments-rss2' );

		$ids = $this->get_feed_comment_ids();
		$this->assertContains( self::$comment_id, $ids );
		$this->assertNotContains( self::$reaction_id, $ids );
	}
}
