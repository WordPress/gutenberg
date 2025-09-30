<?php
/**
 * REST API test for block_comment permissions.
 *
 * Test that permissions are adjusted successfully for block comments.
 * The block comments feature should be available for any user who can edit the post.
 *
 * @package Gutenberg
 * @group block-comments
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
	public function set_up() {
		parent::set_up();

		$roles = array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' );
		foreach ( $roles as $role ) {
			$user_id                 = $this->factory->user->create( array( 'role' => $role ) );
			self::$user_ids[ $role ] = $user_id;
		}

		// Set the current user to the admin role to create posts and comments.
		wp_set_current_user( self::$user_ids['contributor'] );

		// Add some comments and block comments to a post.
		self::$post_id = $this->factory->post->create();
		for ( $i = 0; $i < self::$num_comments; $i++ ) {
			$this->factory->comment->create(
				array(
					'comment_post_ID' => self::$post_id,
					'comment_type'    => '',
				)
			);
			$this->factory->comment->create(
				array(
					'comment_post_ID' => self::$post_id,
					'comment_type'    => 'block_comment',
				)
			);
		}
	}

	public function tear_down() {
		// Clean up: delete the test post and comments.
		wp_delete_post( self::$post_id, true );
		foreach ( self::$user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		parent::tear_down();
	}

	/**
	 * Test that for each user role, the permissions are correct when accessing comments.
	 *
	 * @param string $role The user role to test.
	 * @param string $comment type The type of comment to test.
	 * @param bool $expected_permission The expected permission result.
	 *
	 * @dataProvider data_comment_read_permissions_data_provider
	 */
	public function test_comment_read_permissions( $role, $comment_type, $expected_permission ) {

		// Set the current user.
		wp_set_current_user( self::$user_ids[ $role ] );

		// Use the REST API to read all comments of type $comment_type for the test post.
		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', $comment_type );
		$request->set_param( 'per_page', 100 );
		$response = rest_do_request( $request );

		if ( $expected_permission ) {
			$this->assertEquals( 200, $response->get_status() );
			$comments = $response->get_data();
			$this->assertEquals( self::$num_comments, count( $comments ) );
		} else {
			$this->assertEquals( 403, $response->get_status() );
		}
	}

	/**
	 * Data provider for comment permissions tests.
	 * Each entry is an array of ( role, comment_type, expected_permission ).
	 * @return array[]
	 */
	public function data_comment_read_permissions_data_provider() {
		return array(

			'Administrator can see standard comments' => array( 'administrator', 'comment', true ),
			'Administrator can see Block comments'    => array( 'administrator', 'block_comment', true ),

			'Editor can see standard comments'        => array( 'editor', 'comment', true ),
			'Editor can see Block comments'           => array( 'editor', 'block_comment', true ),

			'Author can see standard comments'        => array( 'author', 'comment', true ),
			'Author can see Block comments'           => array( 'author', 'block_comment', true ),

			'Contributor can see standard comments'   => array( 'contributor', 'comment', true ),
			'Contributor can see Block comments'      => array( 'contributor', 'block_comment', true ),

			'subscriber can see standard comments'    => array( 'subscriber', 'comment', true ),
			'subscriber can see Block comments'       => array( 'subscriber', 'block_comment', false ),
		);
	}

}
