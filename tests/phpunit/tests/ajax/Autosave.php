<?php

/**
 * Admin ajax functions to be tested
 */
require_once( ABSPATH . 'wp-admin/includes/ajax-actions.php' );

/**
 * Testing ajax save draft functionality
 *
 * @package    WordPress
 * @subpackage UnitTests
 * @since      3.4.0
 * @group      ajax
 * @runTestsInSeparateProcesses
 */
class Tests_Ajax_Autosave extends WP_Ajax_UnitTestCase {

	/**
	 * Post
	 * @var mixed
	 */
	protected $_post = null;

	/**
	 * user_id
	 * @var int
	 */
	protected $user_id = 0;

	/**
	 * Set up the test fixture
	 */
	public function setUp() {
		parent::setUp();
		// Set a user so the $post has 'post_author'
		$this->user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->user_id );

		$post_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$this->_post = get_post( $post_id );
	}

	/**
	 * Tear down the test fixture.
	 * Reset the current user
	 */
	public function tearDown() {
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Test autosaving a post
	 * @return void
	 */
	public function test_autosave_post() {
		// The original post_author
		wp_set_current_user( $this->user_id );

		// Set up the $_POST request
		$md5 = md5( uniqid() );
		$_POST = array(
			'action' =>	'heartbeat',
			'_nonce' => wp_create_nonce( 'heartbeat-nonce' ),
			'data' => array(
				'wp_autosave' => array(
				    'post_id'       => $this->_post->ID,
				    '_wpnonce'      => wp_create_nonce( 'update-post_' . $this->_post->ID ),
				    'post_content'  => $this->_post->post_content . PHP_EOL . $md5,
					'post_type'     => 'post',
				),
			),
		);

		// Make the request
		try {
			$this->_handleAjax( 'heartbeat' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response, it is in heartbeat's response
		$response = json_decode( $this->_last_response, true );

		// Ensure everything is correct
		$this->assertNotEmpty( $response['wp_autosave'] );
		$this->assertTrue( $response['wp_autosave']['success'] );

		// Check that the edit happened
		$post = get_post( $this->_post->ID );
		$this->assertGreaterThanOrEqual( 0, strpos( $post->post_content, $md5 ) );
	}

	/**
	 * Test autosaving a locked post
	 * @return void
	 */
	public function test_autosave_locked_post() {
		// Lock the post to another user
		$another_user_id = $this->factory->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $another_user_id );
		wp_set_post_lock( $this->_post->ID );

		wp_set_current_user( $this->user_id );

		// Ensure post is locked
		$this->assertEquals( $another_user_id, wp_check_post_lock( $this->_post->ID ) );

		// Set up the $_POST request
		$md5 = md5( uniqid() );
		$_POST = array(
			'action' =>	'heartbeat',
			'_nonce' => wp_create_nonce( 'heartbeat-nonce' ),
			'data' => array(
				'wp_autosave' => array(
				    'post_id'       => $this->_post->ID,
				    '_wpnonce'      => wp_create_nonce( 'update-post_' . $this->_post->ID ),
				    'post_content'  => $this->_post->post_content . PHP_EOL . $md5,
					'post_type'     => 'post',
				),
			),
		);

		// Make the request
		try {
			$this->_handleAjax( 'heartbeat' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		$response = json_decode( $this->_last_response, true );

		// Ensure everything is correct
		$this->assertNotEmpty( $response['wp_autosave'] );
		$this->assertTrue( $response['wp_autosave']['success'] );

		// Check that the original post was NOT edited
		$post = get_post( $this->_post->ID );
		$this->assertFalse( strpos( $post->post_content, $md5 ) );

		// Check if the autosave post was created
		$autosave = wp_get_post_autosave( $this->_post->ID, get_current_user_id() );
		$this->assertNotEmpty( $autosave );
		$this->assertGreaterThanOrEqual( 0, strpos( $autosave->post_content, $md5 ) );
	}

	/**
	 * Test with an invalid nonce
	 * @return void
	 */
	public function test_with_invalid_nonce( ) {

		wp_set_current_user( $this->user_id );

		// Set up the $_POST request
		$_POST = array(
			'action' =>	'heartbeat',
			'_nonce' => wp_create_nonce( 'heartbeat-nonce' ),
			'data' => array(
				'wp_autosave' => array(
				    'post_id'  => $this->_post->ID,
				    '_wpnonce' => substr( md5( uniqid() ), 0, 10 ),
				),
			),
		);

		// Make the request
		try {
			$this->_handleAjax( 'heartbeat' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		$response = json_decode( $this->_last_response, true );

		$this->assertNotEmpty( $response['wp_autosave'] );
		$this->assertFalse( $response['wp_autosave']['success'] );
	}
}
