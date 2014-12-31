<?php

// Test the output of Comment Querying functions

/**
 * @group comment
 */
class Tests_Comment_Query extends WP_UnitTestCase {
	protected $post_id;
	protected $comment_id;

	function setUp() {
		parent::setUp();

		$this->post_id = $this->factory->post->create();
	}

	public function test_query() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3, $c4, $c5 ), $found );
	}

	public function test_query_post_id_0() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'post_id' => 0,
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_query_type_empty_string() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => '',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3, $c4, $c5 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_query_type_comment() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => 'comment',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1 ), $found );
	}

	public function test_query_type_pingback() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => 'pingback',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c2, $c3 ), $found );

	}

	public function test_query_type_trackback() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => 'trackback',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c2, $c3 ), $found );

	}

	/**
	 * 'pings' is an alias for 'trackback' + 'pingback'.
	 */
	public function test_query_type_pings() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => 'pings',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c2, $c3 ), $found );
	}

	/**
	 * Comments and custom
	 * @ticket 12668
	 */
	public function test_type_array_comments_and_custom() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );
		$c6 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => array( 'comments', 'mario' ),
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c4, $c6 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type_not__in_array_custom() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );
		$c6 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type__not_in' => array( 'luigi' ),
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3, $c4, $c6 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type__in_array_and_not_type_array_custom() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );
		$c6 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type__in' => array( 'comments' ),
			'type__not_in' => array( 'luigi' ),
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type_array_and_type__not_in_array_custom() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );
		$c6 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => array( 'pings' ),
			'type__not_in' => array( 'mario' ),
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c2, $c3 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type__not_in_custom() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );
		$c6 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type__not_in' => 'luigi',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3, $c4, $c6 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type_array_comments_and_pings() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => array( 'comments', 'pings' ),
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type_array_comment_pings() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => array( 'comment', 'pings' ),
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type_array_pingback() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => array( 'pingback' ),
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $c2 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type_array_custom_pingpack() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => array( 'peach', 'pingback' ),
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $c2 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type_array_pings() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => array( 'pings' ),
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c2, $c3 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type_status_approved_array_comment_pings() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '0', 'comment_type' => 'pingback' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'status' => 'approve',
			'type' => array( 'pings' ),
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c3, $c2 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type_array_trackback() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => array( 'trackback' ),
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $c2 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type_array_custom_trackback() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'type' => array( 'toad', 'trackback' ),
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $c2 ), $found );
	}

	/**
	 * @ticket 12668
	 */
	public function test_type_array_pings_approved() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '0', 'comment_type' => 'trackback' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'status' => 'approve',
			'type' => array( 'pings' ),
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c3, $c2 ), $found );
	}

	/**
	 * @ticket 29612
	 */
	public function test_status_empty_string() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '0' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => 'spam' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'status' => '',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c2 ), $found );
	}

	/**
	 * @ticket 21101
	 */
	public function test_status_hold() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '0' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'status' => 'hold',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $c2 ), $found );
	}

	/**
	 * @ticket 21101
	 */
	public function test_status_approve() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '0' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'status' => 'approve',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $c1 ), $found );
	}

	public function test_status_custom() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => 'foo' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => 'foo1' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'status' => 'foo',
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $c2 ), $found );
	}

	public function test_status_all() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => 'foo' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '0' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'status' => 'all',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c3 ), $found );
	}

	public function test_status_default_to_all() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => 'foo' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '0' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c3 ), $found );
	}

	/**
	 * @ticket 29612
	 */
	public function test_status_comma_any() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => 'foo' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '0' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'status' => 'any',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3 ), $found );
	}

	/**
	 * @ticket 29612
	 */
	public function test_status_comma_separated() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => 'foo' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '0' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'status' => 'approve,foo,bar',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c2 ), $found );
	}

	/**
	 * @ticket 29612
	 */
	public function test_status_array() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => 'foo' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'comment_approved' => '0' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'status' => array( 'approve', 'foo', 'bar', ),
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c2 ), $found );
	}

	function test_get_comments_for_post() {
		$post_id = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $post_id, 10 );
		$comments = get_comments( array( 'post_id' => $post_id ) );
		$this->assertEquals( 10, count( $comments ) );
		foreach ( $comments as $comment ) {
			$this->assertEquals( $post_id, $comment->comment_post_ID );
		}

		$post_id2 = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $post_id2, 10 );
		$comments = get_comments( array( 'post_id' => $post_id2 ) );
		$this->assertEquals( 10, count( $comments ) );
		foreach ( $comments as $comment ) {
			$this->assertEquals( $post_id2, $comment->comment_post_ID );
		}

		$post_id3 = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $post_id3, 10, array( 'comment_approved' => '0' ) );
		$comments = get_comments( array( 'post_id' => $post_id3 ) );
		$this->assertEquals( 10, count( $comments ) );
		foreach ( $comments as $comment ) {
			$this->assertEquals( $post_id3, $comment->comment_post_ID );
		}

		$comments = get_comments( array( 'post_id' => $post_id3, 'status' => 'hold' ) );
		$this->assertEquals( 10, count( $comments ) );
		foreach ( $comments as $comment ) {
			$this->assertEquals( $post_id3, $comment->comment_post_ID );
		}

		$comments = get_comments( array( 'post_id' => $post_id3, 'status' => 'approve' ) );
		$this->assertEquals( 0, count( $comments ) );

		$this->factory->comment->create_post_comments( $post_id3, 10, array( 'comment_approved' => '1' ) );
		$comments = get_comments( array( 'post_id' => $post_id3 ) );
		$this->assertEquals( 20, count( $comments ) );
		foreach ( $comments as $comment ) {
			$this->assertEquals( $post_id3, $comment->comment_post_ID );
		}
	}

	/**
	 * @ticket 21003
	 */
	function test_orderby_meta() {
		$comment_id = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id ) );
		$comment_id2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id ) );
		$comment_id3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id ) );

		add_comment_meta( $comment_id, 'key', 'value1', true );
		add_comment_meta( $comment_id, 'key1', 'value1', true );
		add_comment_meta( $comment_id, 'key3', 'value3', true );
		add_comment_meta( $comment_id2, 'key', 'value2', true );
		add_comment_meta( $comment_id2, 'key2', 'value2', true );
		add_comment_meta( $comment_id3, 'key3', 'value3', true );

		$comments = get_comments( array( 'meta_key' => 'key', 'orderby' => array( 'key' ) ) );
		$this->assertEquals( 2, count( $comments ) );
		$this->assertEquals( $comment_id2, $comments[0]->comment_ID );
		$this->assertEquals( $comment_id, $comments[1]->comment_ID );

		$comments = get_comments( array( 'meta_key' => 'key', 'orderby' => array( 'meta_value' ) ) );
		$this->assertEquals( 2, count( $comments ) );
		$this->assertEquals( $comment_id2, $comments[0]->comment_ID );
		$this->assertEquals( $comment_id, $comments[1]->comment_ID );

		$comments = get_comments( array( 'meta_key' => 'key', 'orderby' => array( 'key' ), 'order' => 'ASC' ) );
		$this->assertEquals( 2, count( $comments ) );
		$this->assertEquals( $comment_id, $comments[0]->comment_ID );
		$this->assertEquals( $comment_id2, $comments[1]->comment_ID );

		$comments = get_comments( array( 'meta_key' => 'key', 'orderby' => array( 'meta_value' ), 'order' => 'ASC' ) );
		$this->assertEquals( 2, count( $comments ) );
		$this->assertEquals( $comment_id, $comments[0]->comment_ID );
		$this->assertEquals( $comment_id2, $comments[1]->comment_ID );

		$comments = get_comments( array( 'meta_value' => 'value3', 'orderby' => array( 'key' ) ) );
		$this->assertEquals( 2, count( $comments ) );
		$this->assertEquals( $comment_id, $comments[0]->comment_ID );
		$this->assertEquals( $comment_id3, $comments[1]->comment_ID );

		$comments = get_comments( array( 'meta_value' => 'value3', 'orderby' => array( 'meta_value' ) ) );
		$this->assertEquals( 2, count( $comments ) );
		$this->assertEquals( $comment_id, $comments[0]->comment_ID );
		$this->assertEquals( $comment_id3, $comments[1]->comment_ID );

		// value1 is present on two different keys for $comment_id yet we should get only one instance
		// of that comment in the results
		$comments = get_comments( array( 'meta_value' => 'value1', 'orderby' => array( 'key' ) ) );
		$this->assertEquals( 1, count( $comments ) );

		$comments = get_comments( array( 'meta_value' => 'value1', 'orderby' => array( 'meta_value' ) ) );
		$this->assertEquals( 1, count( $comments ) );
	}

	/**
	 * @ticket 27064
	 */
	function test_get_comments_by_user() {
		$users = $this->factory->user->create_many( 2 );
		$this->factory->comment->create( array( 'user_id' => $users[0], 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$this->factory->comment->create( array( 'user_id' => $users[0], 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );
		$this->factory->comment->create( array( 'user_id' => $users[1], 'comment_post_ID' => $this->post_id, 'comment_approved' => '1' ) );

		$comments = get_comments( array(
			'user_id' => $users[0],
			'orderby' => 'comment_ID',
			'order' => 'ASC',
		) );

		$this->assertCount( 2, $comments );
		$this->assertEquals( $users[0], $comments[0]->user_id );
		$this->assertEquals( $users[0], $comments[1]->user_id );

		$comments = get_comments( array(
			'user_id' => $users,
			'orderby' => 'comment_ID',
			'order' => 'ASC',
		) );

		$this->assertCount( 3, $comments );
		$this->assertEquals( $users[0], $comments[0]->user_id );
		$this->assertEquals( $users[0], $comments[1]->user_id );
		$this->assertEquals( $users[1], $comments[2]->user_id );

	}

	/**
	 * @ticket 28434
	 */
	function test_fields_ids_query() {
		$comment_1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7, 'comment_approved' => '1' ) );
		$comment_2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '1' ) );
		$comment_3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '1' ) );

		// Ensure we are dealing with integers, and not objects.
		$this->assertInternalType( 'integer', $comment_1 );
		$this->assertInternalType( 'integer', $comment_2 );
		$this->assertInternalType( 'integer', $comment_3 );

		$comment_ids = get_comments( array( 'fields' => 'ids' ) );
		$this->assertCount( 3, $comment_ids );
		$this->assertEqualSets( array( $comment_1, $comment_2, $comment_3 ), $comment_ids );
	}

	/**
	 * @ticket 29189
	 */
	function test_fields_comment__in() {
		$comment_1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7, 'comment_approved' => '1' ) );
		$comment_2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '1' ) );
		$comment_3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '1' ) );

		$comment_ids = get_comments( array(
			'fields' => 'ids',
			'comment__in' => array( $comment_1, $comment_3 ),
		) );

		$this->assertEqualSets( array( $comment_1, $comment_3 ), $comment_ids );
	}

	/**
	 * @ticket 29189
	 */
	function test_fields_comment__not_in() {
		$comment_1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7, 'comment_approved' => '1' ) );
		$comment_2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '1' ) );
		$comment_3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '1' ) );

		$comment_ids = get_comments( array(
			'fields' => 'ids',
			'comment__not_in' => array( $comment_2, $comment_3 ),
		) );

		$this->assertEqualSets( array( $comment_1 ), $comment_ids );
	}

	/**
	 * @ticket 29189
	 */
	function test_fields_post__in() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $p1, 'user_id' => 7, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $p2, 'user_id' => 1, 'comment_approved' => '1' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $p3, 'user_id' => 1, 'comment_approved' => '1' ) );

		$comment_ids = get_comments( array(
			'fields' => 'ids',
			'post__in' => array( $p1, $p2 ),
		) );

		$this->assertEqualSets( array( $c1, $c2 ), $comment_ids );
	}

	/**
	 * @ticket 29189
	 */
	function test_fields_post__not_in() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $p1, 'user_id' => 7, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $p2, 'user_id' => 1, 'comment_approved' => '1' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $p3, 'user_id' => 1, 'comment_approved' => '1' ) );

		$comment_ids = get_comments( array(
			'fields' => 'ids',
			'post__not_in' => array( $p1, $p2 ),
		) );

		$this->assertEqualSets( array( $c3 ), $comment_ids );
	}

	/**
	 * @ticket 29885
	 */
	function test_fields_post_author__in() {
		$author_id1 = 105;
		$author_id2 = 106;

		$p1 = $this->factory->post->create( array( 'post_author' => $author_id1	) );
		$p2 = $this->factory->post->create( array( 'post_author' => $author_id1	) );
		$p3 = $this->factory->post->create( array( 'post_author' => $author_id2	) );

		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $p1, 'user_id' => 1, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $p2, 'user_id' => 1, 'comment_approved' => '1' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $p3, 'user_id' => 1, 'comment_approved' => '1' ) );

		$comment_ids = get_comments( array(
			'fields' => 'ids',
			'post_author__in' => array( $author_id1 ),
		) );

		$this->assertEqualSets( array( $c1, $c2 ), $comment_ids );
	}

	/**
	 * @ticket 29885
	 */
	function test_fields_post_author__not_in() {
		$author_id1 = 111;
		$author_id2 = 112;

		$p1 = $this->factory->post->create( array( 'post_author' => $author_id1	) );
		$p2 = $this->factory->post->create( array( 'post_author' => $author_id1	) );
		$p3 = $this->factory->post->create( array( 'post_author' => $author_id2	) );

		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $p1, 'user_id' => 1, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $p2, 'user_id' => 1, 'comment_approved' => '1' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $p3, 'user_id' => 1, 'comment_approved' => '1' ) );

		$comment_ids = get_comments( array(
			'fields' => 'ids',
			'post_author__not_in' => array( $author_id1 ),
		) );

		$this->assertEqualSets( array( $c3 ), $comment_ids );
	}

        /**
         * @ticket 29885
         */
	function test_fields_author__in() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();
		$p4 = $this->factory->post->create();

		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $p1, 'user_id' => 1, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $p1, 'user_id' => 2, 'comment_approved' => '1' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $p2, 'user_id' => 3, 'comment_approved' => '1' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $p4, 'user_id' => 4, 'comment_approved' => '1' ) );

		$comment_ids = get_comments( array(
			'fields' => 'ids',
			'author__in' => array( 1, 3 ),
		) );

		$this->assertEqualSets( array( $c1, $c3 ), $comment_ids );
	}

        /**
         * @ticket 29885
         */
	function test_fields_author__not_in() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();
		$p4 = $this->factory->post->create();

		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $p1, 'user_id' => 1, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $p1, 'user_id' => 2, 'comment_approved' => '1' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $p2, 'user_id' => 3, 'comment_approved' => '1' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $p4, 'user_id' => 4, 'comment_approved' => '1' ) );

		$comment_ids = get_comments( array(
			'fields' => 'ids',
			'author__not_in' => array( 1, 2 ),
		) );

		$this->assertEqualSets( array( $c3, $c4 ), $comment_ids );
	}

	/**
	 * @ticket 19623
	 */
	public function test_get_comments_with_status_all() {
		$comment_1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7, 'comment_approved' => '1' ) );
		$comment_2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '1' ) );
		$comment_3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '0' ) );
		$comments_approved_1 = get_comments( array( 'status' => 'all' ) );

		$comment_ids = get_comments( array( 'fields' => 'ids' ) );
		$this->assertEqualSets( array( $comment_1, $comment_2, $comment_3 ), $comment_ids );
	}

	/**
	 * @ticket 19623
	 */
	public function test_get_comments_with_include_unapproved_user_id() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '1' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '0' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 6, 'comment_approved' => '0' ) );

		$found = get_comments( array(
			'fields' => 'ids',
			'include_unapproved' => 1,
			'status' => 'approve',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3 ), $found );
	}

	/**
	 * @ticket 19623
	 */
	public function test_get_comments_with_include_unapproved_user_id_array() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '1' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '0' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 6, 'comment_approved' => '0' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 8, 'comment_approved' => '0' ) );

		$found = get_comments( array(
			'fields' => 'ids',
			'include_unapproved' => array( 1, 8 ),
			'status' => 'approve',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3, $c5 ), $found );
	}

	/**
	 * @ticket 19623
	 */
	public function test_get_comments_with_include_unapproved_user_id_comma_separated() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '1' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 1, 'comment_approved' => '0' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 6, 'comment_approved' => '0' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 8, 'comment_approved' => '0' ) );

		$found = get_comments( array(
			'fields' => 'ids',
			'include_unapproved' => '1,8',
			'status' => 'approve',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3, $c5 ), $found );
	}

	/**
	 * @ticket 19623
	 */
	public function test_get_comments_with_include_unapproved_author_email() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 0, 'comment_approved' => '1', 'comment_author' => 'foo', 'comment_author_email' => 'foo@example.com' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 0, 'comment_approved' => '0', 'comment_author' => 'foo', 'comment_author_email' => 'foo@example.com' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 0, 'comment_approved' => '0', 'comment_author' => 'foo', 'comment_author_email' => 'bar@example.com' ) );

		$found = get_comments( array(
			'fields' => 'ids',
			'include_unapproved' => 'foo@example.com',
			'status' => 'approve',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3 ), $found );
	}

	/**
	 * @ticket 19623
	 */
	public function test_get_comments_with_include_unapproved_mixed_array() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 0, 'comment_approved' => '1', 'comment_author' => 'foo', 'comment_author_email' => 'foo@example.com' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 0, 'comment_approved' => '0', 'comment_author' => 'foo', 'comment_author_email' => 'foo@example.com' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 0, 'comment_approved' => '0', 'comment_author' => 'foo', 'comment_author_email' => 'bar@example.com' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 4, 'comment_approved' => '0', 'comment_author' => 'foo', 'comment_author_email' => 'bar@example.com' ) );

		$found = get_comments( array(
			'fields' => 'ids',
			'include_unapproved' => array( 'foo@example.com', 4 ),
			'status' => 'approve',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3, $c5 ), $found );
	}

	/**
	 * @ticket 19623
	 */
	public function test_get_comments_with_include_unapproved_mixed_comma_separated() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7, 'comment_approved' => '1' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 0, 'comment_approved' => '1', 'comment_author' => 'foo', 'comment_author_email' => 'foo@example.com' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 0, 'comment_approved' => '0', 'comment_author' => 'foo', 'comment_author_email' => 'foo@example.com' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 0, 'comment_approved' => '0', 'comment_author' => 'foo', 'comment_author_email' => 'bar@example.com' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 4, 'comment_approved' => '0', 'comment_author' => 'foo', 'comment_author_email' => 'bar@example.com' ) );

		$found = get_comments( array(
			'fields' => 'ids',
			'include_unapproved' => 'foo@example.com, 4',
			'status' => 'approve',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3, $c5 ), $found );
	}

	public function test_search() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 4, 'comment_approved' => '0', 'comment_author' => 'foo', 'comment_author_email' => 'bar@example.com' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 4, 'comment_approved' => '0', 'comment_author' => 'bar', 'comment_author_email' => 'foo@example.com' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 4, 'comment_approved' => '0', 'comment_author' => 'bar', 'comment_author_email' => 'bar@example.com', 'comment_author_url' => 'http://foo.bar' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 4, 'comment_approved' => '0', 'comment_author' => 'bar', 'comment_author_email' => 'bar@example.com', 'comment_author_url' => 'http://example.com', 'comment_author_IP' => 'foo.bar' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 4, 'comment_approved' => '0', 'comment_author' => 'bar', 'comment_author_email' => 'bar@example.com', 'comment_author_url' => 'http://example.com', 'comment_content' => 'Nice foo comment' ) );
		$c6 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 4, 'comment_approved' => '0', 'comment_author' => 'bar', 'comment_author_email' => 'bar@example.com', 'comment_author_url' => 'http://example.com' ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'search' => 'foo',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3, $c4, $c5 ), $found );
	}

	public function test_orderby_default() {
		$q = new WP_Comment_Query();
		$q->query( array() );

		$this->assertContains( 'ORDER BY comment_date_gmt', $q->request );
	}

	public function test_orderby_single() {
		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => 'comment_agent',
		) );

		$this->assertContains( 'ORDER BY comment_agent', $q->request );
	}

	public function test_orderby_single_invalid() {
		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => 'foo',
		) );

		$this->assertContains( 'ORDER BY comment_date_gmt', $q->request );
	}

	public function test_orderby_comma_separated() {
		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => 'comment_agent, comment_approved',
		) );

		$this->assertContains( 'ORDER BY comment_agent, comment_approved', $q->request );
	}

	public function test_orderby_array() {
		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => array( 'comment_agent', 'comment_approved' ),
		) );

		$this->assertContains( 'ORDER BY comment_agent, comment_approved', $q->request );
	}

	public function test_orderby_array_contains_invalid_item() {
		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => array( 'comment_agent', 'foo', 'comment_approved' ),
		) );

		$this->assertContains( 'ORDER BY comment_agent, comment_approved', $q->request );
	}

	public function test_orderby_array_contains_all_invalid_items() {
		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => array( 'foo', 'bar', 'baz' ),
		) );

		$this->assertContains( 'ORDER BY comment_date_gmt', $q->request );
	}

	/**
	 * @ticket 29902
	 */
	public function test_orderby_none() {
		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => 'none',
		) );

		$this->assertNotContains( 'ORDER BY', $q->request );
	}

	/**
	 * @ticket 29902
	 */
	public function test_orderby_empty_array() {
		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => array(),
		) );

		$this->assertNotContains( 'ORDER BY', $q->request );
	}

	/**
	 * @ticket 29902
	 */
	public function test_orderby_false() {
		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => false,
		) );

		$this->assertNotContains( 'ORDER BY', $q->request );
	}

	public function test_count() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7 ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7 ) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'count' => true,
		) );

		$this->assertEquals( 2, $found );
	}

	/**
	 * @ticket 23369
	 */
	public function test_count_with_meta_query() {
		$c1 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7 ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7 ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $this->post_id, 'user_id' => 7 ) );
		add_comment_meta( $c1, 'foo', 'bar' );
		add_comment_meta( $c3, 'foo', 'bar' );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'count' => true,
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
			),
		) );

		$this->assertEquals( 2, $found );
	}

	public function test_post_type_single_value() {
		register_post_type( 'post-type-1' );
		register_post_type( 'post-type-2' );

		$p1 = $this->factory->post->create( array( 'post_type' => 'post-type-1' ) );
		$p2 = $this->factory->post->create( array( 'post_type' => 'post-type-2' ) );

		$c1 = $this->factory->comment->create_post_comments( $p1, 1 );
		$c2 = $this->factory->comment->create_post_comments( $p2, 1 );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'post_type' => 'post-type-2',
		) );

		$this->assertEqualSets( $c2, $found );

		_unregister_post_type( 'post-type-1' );
		_unregister_post_type( 'post-type-2' );
	}

	/**
	 * @ticket 20006
	 */
	public function test_post_type_singleton_array() {
		register_post_type( 'post-type-1' );
		register_post_type( 'post-type-2' );

		$p1 = $this->factory->post->create( array( 'post_type' => 'post-type-1' ) );
		$p2 = $this->factory->post->create( array( 'post_type' => 'post-type-2' ) );

		$c1 = $this->factory->comment->create_post_comments( $p1, 1 );
		$c2 = $this->factory->comment->create_post_comments( $p2, 1 );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'post_type' => array( 'post-type-2' ),
		) );

		$this->assertEqualSets( $c2, $found );

		_unregister_post_type( 'post-type-1' );
		_unregister_post_type( 'post-type-2' );
	}

	/**
	 * @ticket 20006
	 */
	public function test_post_type_array() {
		register_post_type( 'post-type-1' );
		register_post_type( 'post-type-2' );

		$p1 = $this->factory->post->create( array( 'post_type' => 'post-type-1' ) );
		$p2 = $this->factory->post->create( array( 'post_type' => 'post-type-2' ) );
		$p3 = $this->factory->post->create( array( 'post_type' => 'post-type-3' ) );

		$c1 = $this->factory->comment->create_post_comments( $p1, 1 );
		$c2 = $this->factory->comment->create_post_comments( $p2, 1 );
		$c3 = $this->factory->comment->create_post_comments( $p3, 1 );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'post_type' => array( 'post-type-1', 'post-type-3' ),
		) );

		$this->assertEqualSets( array_merge( $c1, $c3 ), $found );

		_unregister_post_type( 'post-type-1' );
		_unregister_post_type( 'post-type-2' );
	}

	public function test_post_name_single_value() {
		$p1 = $this->factory->post->create( array( 'post_name' => 'foo' ) );
		$p2 = $this->factory->post->create( array( 'post_name' => 'bar' ) );

		$c1 = $this->factory->comment->create_post_comments( $p1, 1 );
		$c2 = $this->factory->comment->create_post_comments( $p2, 1 );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'post_name' => 'bar',
		) );

		$this->assertEqualSets( $c2, $found );
	}

	/**
	 * @ticket 20006
	 */
	public function test_post_name_singleton_array() {
		$p1 = $this->factory->post->create( array( 'post_name' => 'foo' ) );
		$p2 = $this->factory->post->create( array( 'post_name' => 'bar' ) );

		$c1 = $this->factory->comment->create_post_comments( $p1, 1 );
		$c2 = $this->factory->comment->create_post_comments( $p2, 1 );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'post_name' => array( 'bar' ),
		) );

		$this->assertEqualSets( $c2, $found );
	}

	/**
	 * @ticket 20006
	 */
	public function test_post_name_array() {
		$p1 = $this->factory->post->create( array( 'post_name' => 'foo' ) );
		$p2 = $this->factory->post->create( array( 'post_name' => 'bar' ) );
		$p3 = $this->factory->post->create( array( 'post_name' => 'baz' ) );

		$c1 = $this->factory->comment->create_post_comments( $p1, 1 );
		$c2 = $this->factory->comment->create_post_comments( $p2, 1 );
		$c3 = $this->factory->comment->create_post_comments( $p3, 1 );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'post_name' => array( 'foo', 'baz' ),
		) );

		$this->assertEqualSets( array_merge( $c1, $c3 ), $found );
	}

	public function test_post_status_single_value() {
		$p1 = $this->factory->post->create( array( 'post_status' => 'publish' ) );
		$p2 = $this->factory->post->create( array( 'post_status' => 'draft' ) );

		$c1 = $this->factory->comment->create_post_comments( $p1, 1 );
		$c2 = $this->factory->comment->create_post_comments( $p2, 1 );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'post_status' => 'draft',
		) );

		$this->assertEqualSets( $c2, $found );
	}

	/**
	 * @ticket 20006
	 */
	public function test_post_status_singleton_array() {
		$p1 = $this->factory->post->create( array( 'post_status' => 'publish' ) );
		$p2 = $this->factory->post->create( array( 'post_status' => 'draft' ) );

		$c1 = $this->factory->comment->create_post_comments( $p1, 1 );
		$c2 = $this->factory->comment->create_post_comments( $p2, 1 );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'post_status' => array( 'draft' ),
		) );

		$this->assertEqualSets( $c2, $found );
	}

	/**
	 * @ticket 20006
	 */
	public function test_post_status_array() {
		$p1 = $this->factory->post->create( array( 'post_status' => 'publish' ) );
		$p2 = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$p3 = $this->factory->post->create( array( 'post_status' => 'future' ) );

		$c1 = $this->factory->comment->create_post_comments( $p1, 1 );
		$c2 = $this->factory->comment->create_post_comments( $p2, 1 );
		$c3 = $this->factory->comment->create_post_comments( $p3, 1 );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'post_status' => array( 'publish', 'future' ),
		) );

		$this->assertEqualSets( array_merge( $c1, $c3 ), $found );
	}
}
