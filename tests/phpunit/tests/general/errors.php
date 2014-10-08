<?php
/**
 * Tests for error handling and the WP_Error class.
 *
 * @group general
 */
class Tests_General_Errors extends WP_UnitTestCase {

	function test_create_error() {
		$error = new WP_Error( 'foo', 'message', 'data' );

		$this->assertTrue( is_wp_error( $error ) );
		$this->assertEquals( 'foo', $error->get_error_code() );
		$this->assertEquals( 'message', $error->get_error_message() );
		$this->assertEquals( 'data', $error->get_error_data() );
	}

	function test_add_error() {
		$error = new WP_Error();
		$error->add( 'foo', 'message', 'data' );

		$this->assertTrue( is_wp_error( $error ) );
		$this->assertEquals( 'foo', $error->get_error_code() );
		$this->assertEquals( 'message', $error->get_error_message() );
		$this->assertEquals( 'data', $error->get_error_data() );
	}

	function test_multiple_errors() {
		$error = new WP_Error();
		$error->add( 'foo', 'foo message', 'foo data' );
		$error->add( 'bar', 'bar message', 'bar data' );

		$this->assertTrue( is_wp_error( $error ) );
		$this->assertEquals( 'foo', $error->get_error_code() );
		$this->assertEquals( 'foo message', $error->get_error_message() );
		$this->assertEquals( 'foo data', $error->get_error_data() );

		$this->assertEquals( array( 'foo', 'bar' ), $error->get_error_codes() );
		$this->assertEquals( array( 'foo message', 'bar message' ), $error->get_error_messages() );
		$this->assertEquals( 'foo data', $error->get_error_data( 'foo' ) );
		$this->assertEquals( 'bar data', $error->get_error_data( 'bar' ) );
	}

	/**
	 * @ticket 28092
	 */
	function test_remove_error() {
		$error = new WP_Error();
		$error->add( 'foo', 'This is the first error message', 'some error data' );
		$error->add( 'foo', 'This is the second error message' );
		$error->add( 'bar', 'This is another error' );

		$error->remove( 'foo' );

		// Check the error has been removed.
		$this->assertEmpty( $error->get_error_data( 'foo' ) );
		$this->assertEmpty( $error->get_error_messages( 'foo' ) );
		
		// The 'bar' error should now be the 'first' error retrieved.
		$this->assertEquals( 'bar', $error->get_error_code() );
		$this->assertEmpty( $error->get_error_data() );
	}
}
