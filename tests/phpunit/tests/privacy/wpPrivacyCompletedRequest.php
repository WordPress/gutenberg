<?php
/**
 * Test the `_wp_privacy_completed_request()` function.
 *
 * @package WordPress
 * @subpackage UnitTests
 * @since 4.9.6
 */

/**
 * Tests_WpPrivacyCompletedRequest class.
 *
 * @group privacy
 * @covers _wp_privacy_completed_request
 *
 * @since 4.9.6
 */
class Tests_WpPrivacyCompletedRequest extends WP_UnitTestCase {
	/**
	 * Request ID
	 *
	 * @since 4.9.6
	 *
	 * @var int $request_id
	 */
	protected static $request_id;

	/**
	 * Create fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$request_id = wp_create_user_request( 'requester@example.com', 'export_personal_data' );
	}

	/**
	 * The function should return error for invalid request ID.
	 *
	 * @ticket 43913
	 */
	public function test_wp_privacy_completed_request_should_return_error_for_invalid_request_id() {
		$actual = _wp_privacy_completed_request( 0 );
		$this->assertWPError( $actual );
		$this->assertSame( 'privacy_request_error', $actual->get_error_code() );

		$actual = _wp_privacy_completed_request( PHP_INT_MAX );
		$this->assertWPError( $actual );
		$this->assertSame( 'privacy_request_error', $actual->get_error_code() );
	}

	/**
	 * The function should mark a request as completed.
	 *
	 * @ticket 43913
	 */
	public function test_wp_privacy_completed_request_should_mark_request_completed() {
		$this->assertSame( 'request-pending', get_post_status( self::$request_id ) );
		$this->assertSame( self::$request_id, _wp_privacy_completed_request( self::$request_id ) );
		$this->assertSame( 'request-completed', get_post_status( self::$request_id ) );
	}

	/**
	 * The function should log the request timestamp.
	 *
	 * @ticket 43913
	 */
	public function test_wp_privacy_completed_request_should_log_request_timestamp() {
		$this->assertEmpty( get_post_meta( self::$request_id, '_wp_user_request_completed_timestamp', true ) );
		$this->assertSame( self::$request_id, _wp_privacy_completed_request( self::$request_id ) );
		$this->assertNotEmpty( get_post_meta( self::$request_id, '_wp_user_request_completed_timestamp', true ) );
	}
}
