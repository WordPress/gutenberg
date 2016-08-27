<?php

/**
 * @group comment
 */
class Tests_Comment_GetCommentAuthorUrlLink extends WP_UnitTestCase {
	protected static $comments = array();

	public static function wpSetUpBeforeClass( $factory ) {
		unset( $GLOBALS['comment'] );

		$comment_ids = $factory->comment->create_post_comments( 0, 1 );
		self::$comments = array_map( 'get_comment', $comment_ids );
	}

	protected function parseCommentAuthorUrl( $comment, $linktext = '' ) {
		if ( empty( $linktext ) ) {
			$linktext = rtrim( preg_replace( '#http://(www\.)?#', '', $comment->comment_author_url ), '/' );
		}
		return sprintf(
			'<a href=\'%s\' rel=\'external\'>%s</a>',
			$comment->comment_author_url,
			$linktext
		);
	}

	public function test_no_comment() {
		$url_link = get_comment_author_url_link();

		$this->assertEquals( "<a href='' rel='external'></a>", $url_link );
	}

	public function test_global_comment() {
		$GLOBALS['comment'] = $comment = reset( self::$comments );

		$url_link = get_comment_author_url_link();
		$link = $this->parseCommentAuthorUrl( $comment );
		$this->assertEquals( $link, $url_link );
	}

	public function test_comment_arg() {
		$comment = reset( self::$comments );

		$url_link = get_comment_author_url_link( '', '', '', $comment );
		$link = $this->parseCommentAuthorUrl( $comment );
		$this->assertEquals( $link, $url_link );
	}

	public function test_linktext() {
		$comment = reset( self::$comments );

		$url_link = get_comment_author_url_link( 'Burrito', '', '', $comment );
		$link = $this->parseCommentAuthorUrl( $comment, 'Burrito' );
		$this->assertEquals( $link, $url_link );
	}

	public function test_before() {
		$comment = reset( self::$comments );

		$url_link = get_comment_author_url_link( 'Burrito', 'I would love a ', '', $comment );
		$link = 'I would love a ' . $this->parseCommentAuthorUrl( $comment, 'Burrito' );
		$this->assertEquals( $link, $url_link );
	}

	public function test_after() {
		$comment = reset( self::$comments );

		$url_link = get_comment_author_url_link( 'Burrito', '', ' is my favorite word.', $comment );
		$link = $this->parseCommentAuthorUrl( $comment, 'Burrito' ) . ' is my favorite word.';
		$this->assertEquals( $link, $url_link );
	}

	public function test_before_after() {
		$comment = reset( self::$comments );

		$url_link = get_comment_author_url_link( 'Burrito', 'I would love a ', ' right now.', $comment );
		$link = 'I would love a ' . $this->parseCommentAuthorUrl( $comment, 'Burrito' ) . ' right now.';
		$this->assertEquals( $link, $url_link );
	}
}
