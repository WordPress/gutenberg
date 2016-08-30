<?php
/**
 * Unit Tests: Basic_Object cloass
 *
 * @package WordPress
 * @subpackage UnitTests
 * @since 4.7.0
 */

/**
 * Class used to test accessing methods and properties
 *
 * @since 4.0.0
 */
class Basic_Object {
	private $foo = 'bar';

	public function __get( $name ) {
		return $this->$name;
	}

	public function __set( $name, $value ) {
		return $this->$name = $value;
	}

	public function __isset( $name ) {
		return isset( $this->$name );
	}

	public function __unset( $name ) {
		unset( $this->$name );
	}

	public function __call( $name, $arguments ) {
		return call_user_func_array( array( $this, $name ), $arguments );
	}

	private function callMe() {
		return 'maybe';
	}
}
