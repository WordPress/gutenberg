<?php
/**
 * @group link
 */
class Tests_Link_GetPostCommentsFeedLink extends WP_UnitTestCase {
	private static $rewrite;
	private static $permalink_structure;

	static function setUpBeforeClass() {
		global $wp_rewrite;

		parent::setUpBeforeClass();

		self::$rewrite = $wp_rewrite;
		self::$permalink_structure = get_option( 'permalink_structure' );
	}

	public static function tearDownAfterClass() {
		parent::tearDownAfterClass();

		self::$rewrite->init();
		self::$rewrite->set_permalink_structure( self::$permalink_structure );
		self::$rewrite->flush_rules();
	}

	public function setUp() {
		parent::setUp();
		self::$rewrite->init();
	}

	private function set_permalink_structure( $structure ) {
		self::$rewrite->set_permalink_structure( $structure );
		self::$rewrite->flush_rules();
	}

	public function test_post_link() {
		$this->set_permalink_structure( '' );

		$post_id = $this->factory->post->create();

		$link = get_post_comments_feed_link( $post_id );
		$expected = add_query_arg( array(
			'feed' => get_default_feed(),
			'p' => $post_id
		), home_url( '/' ) );

		$this->assertEquals( $expected, $link );
	}

	public function test_post_pretty_link() {
		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		$post_id = $this->factory->post->create();

		$link = get_post_comments_feed_link( $post_id );
		$expected = get_permalink( $post_id ) . 'feed/';

		$this->assertEquals( $expected, $link );
	}

	public function test_attachment_link() {
		$this->set_permalink_structure( '' );

		$post_id = $this->factory->post->create();
		$attachment_id = $this->factory->attachment->create_object( 'image.jpg', $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );

		$link = get_post_comments_feed_link( $attachment_id );
		$expected = add_query_arg( array(
			'feed' => get_default_feed(),
			'p' => $attachment_id
		), home_url( '/' ) );

		$this->assertEquals( $expected, $link );
	}

	public function test_attachment_pretty_link() {
		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		$post_id = $this->factory->post->create( array(
			'post_status' => 'publish'
		) );
		$attachment_id = $this->factory->attachment->create_object( 'image.jpg', $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment',
			'post_title' => 'Burrito'
		) );

		$p = get_post( $post_id );

		$link = get_post_comments_feed_link( $attachment_id );
		$expected = get_permalink( $post_id ) . 'burrito/feed/';

		$this->assertEquals( $expected, $link );
	}

	public function test_attachment_no_name_pretty_link() {
		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		$post_id = $this->factory->post->create();
		$attachment_id = $this->factory->attachment->create_object( 'image.jpg', $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );

		$link = get_post_comments_feed_link( $attachment_id );
		$expected = get_permalink( $post_id ) . 'attachment/' . $attachment_id . '/feed/';

		$this->assertEquals( $expected, $link );
	}

	public function test_unattached_link() {
		$this->set_permalink_structure( '' );

		$attachment_id = $this->factory->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );

		$link = get_post_comments_feed_link( $attachment_id );
		$expected = add_query_arg( array(
			'feed' => get_default_feed(),
			'attachment_id' => $attachment_id
		), home_url( '/' ) );

		$this->assertEquals( $expected, $link );
	}

	public function test_unattached_pretty_link() {
		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		$attachment_id = $this->factory->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );

		$link = get_post_comments_feed_link( $attachment_id );
		$expected = add_query_arg( 'attachment_id', $attachment_id, home_url( '/feed/' ) );

		$this->assertEquals( $expected, $link );
	}
}