<?php
/**
 * REST API test for block_comment permissions.
 *
 * Test that permissions are adjusted successfully for block comments.
 * The block comments feature should be available for any user who can edit the post.
 *
 * @package Gutenberg
 */
class WP_Test_REST_Block_Comment_Permissions extends WP_UnitTestCase {

	/**
	 * @var int The number of comments to create for testing.
	 */
	protected static $num_comments = 10;

	/**
	 * User IDs for various roles.
	 *
	 * @var array<string, int> Associative array mapping role names to user IDs.
	 */
	protected static $user_ids = array();

	/**
	 * Test post to add comments to.
	 *
	 * @var int The post ID.
	 */
	protected static $post_id;

	/**
	 * Setup helper, create test users of admin, editor, author, contributor, and subscriber roles.
	 */
	public function setUp() {
		parent::setUp();

		$roles = array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' );
		foreach ( $roles as $role ) {
			$user_id = $this->factory->user->create( array( 'role' => $role ) );
			self::$user_ids[ $role ] = $user_id;
		}

		// Set the current user to the admin role to create posts and comments.
		wp_set_current_user( self::$user_ids['administrator'] );

		// Add some comments and block comments to a post.
		self::$post_id = $this->factory->post->create();
		for( $i = 0; $i < self::$num_comments; $i++ ) {
			$this->factory->comment->create( array( 'comment_post_ID' => self::$post_id, 'comment_type' => '' ) );
			$this->factory->comment->create( array( 'comment_post_ID' => self::$post_id, 'comment_type' => 'block_comment' ) );
		}
	}

	public function tearDown() {
		// Clean up: delete the test post and comments.
		wp_delete_post( self::$post_id, true );
		foreach ( self::$user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		parent::tearDown();
	}

	/**
	 * Test that for each user role, the permissions are correct when accessing comments.
	 *
	 * @param string $role The user role to test.
	 * @param string $comment type The type of comment to test.
	 * @param bool $expected_permission The expected permission result.
	 *
	 * @dataProvider comment_read_permissions_data_provider
	 */
	public function test_comment_read_permissions( $role, $comment_type, $expected_permission ) {

		// Set the current user.
		wp_set_current_user( self::$user_ids[ $role ] );

		// Use the REST API to read all comments of type $comment_type for the test post.
		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', $comment_type );
		$response = rest_do_request( $request );

		if ( $expected_permission ) {
			$this->assertEquals( 200, $response->get_status() );
			$comments = $response->get_data();
			$this->assertCount( self::$num_comments, $comments );
		} else {
			$this->assertEquals( 403, $response->get_status() );
		}
	}

	/**
	 * Data provider for comment permissions tests.
	 * Each entry is an array of ( role, comment_type, expected_permission ).
	 * @return array[]
	 */
	public function comment_read_permissions_data_provider() {
		return array(
			// Administrator can see all comments.
			array( 'administrator', 'comment', true ),
			array( 'administrator', 'block_comment', true ),

			// Editor can see all comments.
			array( 'editor', 'comment', true ),
			array( 'editor', 'block_comment', true ),

			// Author can see all comments.
			array( 'author', 'comment', true ),
			array( 'author', 'block_comment', true ),

			// Contributor can see all comments.
			array( 'contributor', 'comment', true ),
			array( 'contributor', 'block_comment', true ),

			// Subscriber can see standard comments but not block comments.
			array( 'subscriber', 'comment', true ),
			array( 'subscriber', 'block_comment', false ),
		);
	}


	/**
	 * Test that for each user role, the permissions are correct when creating comments.
	 *
	 * @param string $role The user role to test.
	 * @param string $comment type The type of comment to test.
	 * @param bool $expected_permission The expected permission result.
	 *
	 * @dataProvider comment_write_permissions_data_provider
	 */
	public function test_comment_write_permissions( $role, $comment_type, $expected_permission ) {

		// Set the current user.
		wp_set_current_user( self::$user_ids[ $role ] );

		// Create a new comment of type $comment_type for the test post.
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'content', 'Test comment content' );
		$request->set_param( 'type', $comment_type );
		$response = rest_do_request( $request );

		if ( $expected_permission ) {
			// Expect a 201 Created response.
			$this->assertEquals( 201, $response->get_status() );
			$comment = $response->get_data();
			$this->assertEquals( $comment_type, $comment['type'] );
		} else {
			$this->assertEquals( 403, $response->get_status() );
		}
	}

	/**
	 * Data provider for comment write permissions tests.
	 * Each entry is an array of ( role, comment_type, expected_permission ).
	 * @return array[]
	 */
	public function comment_write_permissions_data_provider() {
		return array(
			// Administrator can create all comments.
			array( 'administrator', 'comment', true ),
			array( 'administrator', 'block_comment', true ),

			// Editor can create all comments.
			array( 'editor', 'comment', true ),
			array( 'editor', 'block_comment', true ),

			// Author can create block comments.
			array( 'author', 'comment', true ),
			array( 'author', 'block_comment', true ),

			// Contributor can create block comments.
			array( 'contributor', 'comment', true ),
			array( 'contributor', 'block_comment', true ),

			// Subscriber can create standard comments but not block comments.
			array( 'subscriber', 'comment', true ),
			array( 'subscriber', 'block_comment', false ),
		);
	}

	/**
	 * Test that for each user role, permissions are set correctly when moderating comments.
	 *
	 * @param string $role The user role to test.
	 * @param string $comment_type The type of comment to test.
	 * @param bool $expected_permission The expected permission result.
	 *
	 * @dataProvider comment_moderation_permissions_data_provider
	 */
	public function test_comment_moderation_permissions( $role, $comment_type, $expected_permission ) {

		// Set the current user.
		wp_set_current_user( self::$user_ids[ $role ] );

		// Get an existing comment of type $comment_type for the test post.
		$comments = get_comments( array(
			'post_id' => self::$post_id,
			'type'    => $comment_type,
			'number'  => 1,
		) );
		$this->assertNotEmpty( $comments, "No comments found of type $comment_type" );
		$comment_id = $comments[0]->comment_ID;

		// Moderate the comment by changing its approved status.
		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $comment_id );
		$request->set_param( 'content', 'Updated comment content' );
		$request->set_param( 'status', 'approve' );
		$response = rest_do_request( $request );

		if ( $expected_permission ) {
			// Expect a 200 OK response.
			$this->assertEquals( 200, $response->get_status() );
			$comment = $response->get_data();
			$this->assertEquals( 'approve', $comment['status'] );
		} else {
			$this->assertEquals( 403, $response->get_status() );
		}
	}

	/**
	 * Data provider for comment moderation permissions tests.
	 * Each entry is an array of ( role, comment_type, expected_permission ).
	 * @return array[]
	 */
	public function comment_moderation_permissions_data_provider() {
		return array(
			// Administrator can moderate all comments.
			array( 'administrator', 'comment', true ),
			array( 'administrator', 'block_comment', true ),

			// Editor can moderate all comments.
			array( 'editor', 'comment', true ),
			array( 'editor', 'block_comment', true ),

			// Author can only moderate block comments.
			array( 'author', 'comment', false ),
			array( 'author', 'block_comment', true ),

			// Contributor can only moderate block comments.
			array( 'contributor', 'comment', false ),
			array( 'contributor', 'block_comment', true ),

			// Subscriber cannot moderate any comments.
			array( 'subscriber', 'comment', false ),
			array( 'subscriber', 'block_comment', false ),
		);
	}
}