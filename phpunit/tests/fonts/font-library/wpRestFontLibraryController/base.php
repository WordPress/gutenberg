<?php
/**
 * Test Case for WP_REST_Font_Library_Controller tests.
 *
 * @package WordPress
 * @subpackage Font Library
 */
abstract class WP_REST_Font_Library_Controller_UnitTestCase extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();

		// Create a user with administrator role.
		$admin_id = $this->factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );
	}

	/**
	 * Tear down each test method.
	 */
	public function tear_down() {
		parent::tear_down();

		// Reset $collections static property of WP_Font_Library class.
		$reflection = new ReflectionClass( 'WP_Font_Library' );
		$property   = $reflection->getProperty( 'collections' );
		$property->setAccessible( true );
		$property->setValue( array() );
	}
}
