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
		$this->assertEquals( array( $comment_id3, $comment_id ), wp_list_pluck( $comments, 'comment_ID' ) );

		$comments = get_comments( array( 'meta_value' => 'value3', 'orderby' => array( 'meta_value' ) ) );
		$this->assertEquals( array( $comment_id3, $comment_id ), wp_list_pluck( $comments, 'comment_ID' ) );

		// value1 is present on two different keys for $comment_id yet we should get only one instance
		// of that comment in the results
		$comments = get_comments( array( 'meta_value' => 'value1', 'orderby' => array( 'key' ) ) );
		$this->assertEquals( 1, count( $comments ) );

		$comments = get_comments( array( 'meta_value' => 'value1', 'orderby' => array( 'meta_value' ) ) );
		$this->assertEquals( 1, count( $comments ) );
	}

	/**
	 * @ticket 30478
	 */
	public function test_orderby_clause_key() {
		$comments = $this->factory->comment->create_many( 3 );
		add_comment_meta( $comments[0], 'foo', 'aaa' );
		add_comment_meta( $comments[1], 'foo', 'zzz' );
		add_comment_meta( $comments[2], 'foo', 'jjj' );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'meta_query' => array(
				'foo_key' => array(
					'key' => 'foo',
					'compare' => 'EXISTS',
				),
			),
			'orderby' => 'foo_key',
			'order' => 'DESC',
		) );

		$this->assertEquals( array( $comments[1], $comments[2], $comments[0] ), $found );
	}

	/**
	 * @ticket 30478
	 */
	public function test_orderby_clause_key_as_secondary_sort() {
		$c1 = $this->factory->comment->create( array(
			'comment_date' => '2015-01-28 03:00:00',
		) );
		$c2 = $this->factory->comment->create( array(
			'comment_date' => '2015-01-28 05:00:00',
		) );
		$c3 = $this->factory->comment->create( array(
			'comment_date' => '2015-01-28 03:00:00',
		) );

		add_comment_meta( $c1, 'foo', 'jjj' );
		add_comment_meta( $c2, 'foo', 'zzz' );
		add_comment_meta( $c3, 'foo', 'aaa' );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'meta_query' => array(
				'foo_key' => array(
					'key' => 'foo',
					'compare' => 'EXISTS',
				),
			),
			'orderby' => array(
				'comment_date' => 'asc',
				'foo_key' => 'asc',
			),
		) );

		$this->assertEquals( array( $c3, $c1, $c2 ), $found );
	}

	/**
	 * @ticket 30478
	 */
	public function test_orderby_more_than_one_clause_key() {
		$comments = $this->factory->comment->create_many( 3 );

		add_comment_meta( $comments[0], 'foo', 'jjj' );
		add_comment_meta( $comments[1], 'foo', 'zzz' );
		add_comment_meta( $comments[2], 'foo', 'jjj' );
		add_comment_meta( $comments[0], 'bar', 'aaa' );
		add_comment_meta( $comments[1], 'bar', 'ccc' );
		add_comment_meta( $comments[2], 'bar', 'bbb' );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'meta_query' => array(
				'foo_key' => array(
					'key' => 'foo',
					'compare' => 'EXISTS',
				),
				'bar_key' => array(
					'key' => 'bar',
					'compare' => 'EXISTS',
				),
			),
			'orderby' => array(
				'foo_key' => 'asc',
				'bar_key' => 'desc',
			),
		) );

		$this->assertEquals( array( $comments[2], $comments[0], $comments[1] ), $found );
	}

	/**
	 * @group 32081
	 */
	public function test_meta_query_should_work_with_comment__in() {
		$comments = $this->factory->comment->create_many( 3 );

		add_comment_meta( $comments[0], 'foo', 'jjj' );
		add_comment_meta( $comments[1], 'foo', 'zzz' );
		add_comment_meta( $comments[2], 'foo', 'jjj' );

		$q = new WP_Comment_Query( array(
			'comment__in' => array( $comments[1], $comments[2] ),
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'jjj',
				),
			),
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $comments[2] ), $q->get_comments() );
	}

	/**
	 * @group 32081
	 */
	public function test_meta_query_should_work_with_comment__not_in() {
		$comments = $this->factory->comment->create_many( 3 );

		add_comment_meta( $comments[0], 'foo', 'jjj' );
		add_comment_meta( $comments[1], 'foo', 'zzz' );
		add_comment_meta( $comments[2], 'foo', 'jjj' );

		$q = new WP_Comment_Query( array(
			'comment__not_in' => array( $comments[1], $comments[2] ),
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'jjj',
				),
			),
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $comments[0] ), $q->get_comments() );
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
		global $wpdb;

		$q = new WP_Comment_Query();
		$q->query( array() );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_date_gmt", $q->request );
	}

	public function test_orderby_single() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => 'comment_agent',
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_agent", $q->request );
	}

	public function test_orderby_single_invalid() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => 'foo',
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_date_gmt", $q->request );
	}

	public function test_orderby_space_separated() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => 'comment_agent comment_approved',
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_agent DESC, $wpdb->comments.comment_approved DESC", $q->request );
	}

	public function test_orderby_comma_separated() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => 'comment_agent, comment_approved',
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_agent DESC, $wpdb->comments.comment_approved DESC", $q->request );
	}

	public function test_orderby_flat_array() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => array( 'comment_agent', 'comment_approved' ),
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_agent DESC, $wpdb->comments.comment_approved DESC", $q->request );
	}

	public function test_orderby_array_contains_invalid_item() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => array( 'comment_agent', 'foo', 'comment_approved' ),
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_agent DESC, $wpdb->comments.comment_approved DESC", $q->request );
	}

	public function test_orderby_array_contains_all_invalid_items() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$q->query( array(
			'orderby' => array( 'foo', 'bar', 'baz' ),
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_date_gmt", $q->request );
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

	/**
	 * @ticket 30478
	 */
	public function test_orderby_array() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'orderby' => array(
				'comment_agent' => 'DESC',
				'comment_date_gmt' => 'ASC',
				'comment_ID' => 'DESC',
			),
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_agent DESC, $wpdb->comments.comment_date_gmt ASC, $wpdb->comments.comment_ID DESC", $q->request );
	}

	/**
	 * @ticket 30478
	 */
	public function test_orderby_array_should_discard_invalid_columns() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'orderby' => array(
				'comment_agent' => 'DESC',
				'foo' => 'ASC',
				'comment_ID' => 'DESC',
			),
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_agent DESC, $wpdb->comments.comment_ID DESC", $q->request );
	}

	/**
	 * @ticket 30478
	 */
	public function test_orderby_array_should_convert_invalid_order_to_DESC() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'orderby' => array(
				'comment_agent' => 'DESC',
				'comment_date_gmt' => 'foo',
				'comment_ID' => 'DESC',
			),
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_agent DESC, $wpdb->comments.comment_date_gmt DESC, $wpdb->comments.comment_ID DESC", $q->request );
	}

	/**
	 * @ticket 30478
	 */
	public function test_orderby_array_should_sort_by_comment_ID_as_fallback_and_should_inherit_order_from_comment_date_gmt() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'orderby' => array(
				'comment_agent' => 'DESC',
				'comment_date_gmt' => 'ASC',
			),
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_agent DESC, $wpdb->comments.comment_date_gmt ASC, $wpdb->comments.comment_ID ASC", $q->request );
	}

	/**
	 * @ticket 30478
	 */
	public function test_orderby_array_should_sort_by_comment_ID_as_fallback_and_should_inherit_order_from_comment_date() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'orderby' => array(
				'comment_agent' => 'DESC',
				'comment_date' => 'ASC',
			),
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_agent DESC, $wpdb->comments.comment_date ASC, $wpdb->comments.comment_ID ASC", $q->request );
	}

	/**
	 * @ticket 30478
	 */
	public function test_orderby_array_should_sort_by_comment_ID_DESC_as_fallback_when_not_sorted_by_date() {
		global $wpdb;

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'orderby' => array(
				'comment_agent' => 'ASC',
			),
		) );

		$this->assertContains( "ORDER BY $wpdb->comments.comment_agent ASC, $wpdb->comments.comment_ID DESC", $q->request );
	}

	/**
	 * @ticket 30478
	 */
	public function test_orderby_date_modified_gmt_should_order_by_comment_ID_in_case_of_tie_ASC() {
		$now = current_time( 'mysql', 1 );
		$comments = $this->factory->comment->create_many( 5, array(
			'comment_post_ID' => $this->post_id,
			'comment_date_gmt' => $now,
		) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'orderby' => 'comment_date_gmt',
			'order' => 'ASC',
		) );

		// $comments is ASC by default.
		$this->assertEquals( $comments, wp_list_pluck( $found, 'comment_ID' ) );
	}

	/**
	 * @ticket 30478
	 */
	public function test_orderby_date_modified_gmt_should_order_by_comment_ID_in_case_of_tie_DESC() {
		$now = current_time( 'mysql', 1 );
		$comments = $this->factory->comment->create_many( 5, array(
			'comment_post_ID' => $this->post_id,
			'comment_date_gmt' => $now,
		) );

		$q = new WP_Comment_Query();
		$found = $q->query( array(
			'orderby' => 'comment_date_gmt',
			'order' => 'DESC',
		) );

		// $comments is ASC by default.
		rsort( $comments );

		$this->assertEquals( $comments, wp_list_pluck( $found, 'comment_ID' ) );
	}

	public function test_meta_vars_should_be_converted_to_meta_query() {
		$q = new WP_Comment_Query();
		$q->query( array(
			'meta_key' => 'foo',
			'meta_value' => '5',
			'meta_compare' => '>',
			'meta_type' => 'SIGNED',
		) );

		$this->assertSame( 'foo', $q->meta_query->queries[0]['key'] );
		$this->assertSame( '5', $q->meta_query->queries[0]['value'] );
		$this->assertSame( '>', $q->meta_query->queries[0]['compare'] );
		$this->assertSame( 'SIGNED', $q->meta_query->queries[0]['type'] );
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

	/**
	 * @ticket 24826
	 */
	public function test_comment_query_object() {
		$comment_id = $this->factory->comment->create();

		$query1 = new WP_Comment_Query();
		$this->assertNull( $query1->query_vars );
		$this->assertEmpty( $query1->comments );
		$comments = $query1->query( array( 'status' => 'all' ) );
		$this->assertInternalType( 'array', $query1->query_vars );
		$this->assertNotEmpty( $query1->comments );
		$this->assertInternalType( 'array', $query1->comments );

		$query2 = new WP_Comment_Query( array( 'status' => 'all' ) );
		$this->assertNotEmpty( $query2->query_vars );
		$this->assertNotEmpty( $query2->comments );
		$this->assertEquals( $query2->comments, $query1->get_comments() );
	}

	/**
	 * @ticket 22400
	 */
	public function test_comment_cache_key_should_ignore_custom_params() {
		global $wpdb;

		$p = $this->factory->post->create();
		$c = $this->factory->comment->create( array( 'comment_post_ID' => $p ) );

		$q1 = new WP_Comment_Query();
		$q1->query( array(
			'post_id' => $p,
		) );

		$num_queries = $wpdb->num_queries;

		$q2 = new WP_Comment_Query();
		$q2->query( array(
			'post_id' => $p,
			'foo' => 'bar',
		) );

		$this->assertSame( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 32762
	 */
	public function test_it_should_be_possible_to_modify_meta_query_using_pre_get_comments_action() {
		$comments = $this->factory->comment->create_many( 2, array(
			'comment_post_ID' => $this->post_id,
		) );

		add_comment_meta( $comments[1], 'foo', 'bar' );

		add_action( 'pre_get_comments', array( $this, 'modify_meta_query' ) );

		$q = new WP_Comment_Query( array(
			'comment_post_ID' => $this->post_id,
			'fields' => 'ids',
		) );

		remove_action( 'pre_get_comments', array( $this, 'modify_meta_query' ) );

		$this->assertEqualSets( array( $comments[1] ), $q->comments );
	}

	public function modify_meta_query( $q ) {
		$q->meta_query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
		) );
	}

	/**
	 * @ticket 32762
	 */
	public function test_it_should_be_possible_to_modify_meta_params_using_pre_get_comments_action() {
		$comments = $this->factory->comment->create_many( 2, array(
			'comment_post_ID' => $this->post_id,
		) );

		add_comment_meta( $comments[1], 'foo', 'bar' );

		add_action( 'pre_get_comments', array( $this, 'modify_meta_params' ) );

		$q = new WP_Comment_Query( array(
			'comment_post_ID' => $this->post_id,
			'fields' => 'ids',
		) );

		remove_action( 'pre_get_comments', array( $this, 'modify_meta_params' ) );

		$this->assertEqualSets( array( $comments[1] ), $q->comments );
	}

	public function modify_meta_params( $q ) {
		$q->query_vars['meta_key'] = 'foo';
		$q->query_vars['meta_value'] = 'bar';
	}
}
