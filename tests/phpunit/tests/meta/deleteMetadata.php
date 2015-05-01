<?php

/**
 * @group meta
 */
class Tests_Meta_DeleteMetadata extends WP_UnitTestCase {
	public function test_all_metas_for_key_should_be_deleted_when_no_meta_value_is_provided() {
		$vals = array( '0', '1', '2' );
		foreach ( $vals as $val ) {
			add_metadata( 'post', 12345, 'foo', $val );
		}
		$m = get_metadata( 'post', 12345, 'foo', false );
		$this->assertEqualSets( $vals, $m );

		delete_metadata( 'post', 12345, 'foo' );
		$m = get_metadata( 'post', 12345, 'foo', false );
		$this->assertEqualSets( array(), $m );
	}

	public function test_with_meta_value() {
		$vals = array( '0', '1', '2' );
		foreach ( $vals as $val ) {
			add_metadata( 'post', 12345, 'foo', $val );
		}
		$m = get_metadata( 'post', 12345, 'foo', false );
		$this->assertEqualSets( $vals, $m );

		delete_metadata( 'post', 12345, 'foo', '1' );
		$m = get_metadata( 'post', 12345, 'foo', false );
		$expected = array_diff( $vals, array( '1' ) );;
		$this->assertEqualSets( $expected, $m );
	}

	/**
	 * @ticket 32224
	 */
	public function test_with_falsey_meta_value_should_not_delete_all_meta() {
		$vals = array( '0', '1', '2' );
		foreach ( $vals as $val ) {
			add_metadata( 'post', 12345, 'foo', $val );
		}
		$m = get_metadata( 'post', 12345, 'foo', false );
		$this->assertEqualSets( $vals, $m );

		delete_metadata( 'post', 12345, 'foo', '0' );
		$m = get_metadata( 'post', 12345, 'foo', false );
		$expected = array_diff( $vals, array( '0' ) );;
		$this->assertEqualSets( $expected, $m );
	}

	/**
	 * @ticket 32224
	 *
	 * This is a backwards compatiblity quirk.
	 */
	public function test_meta_value_should_be_ignored_when_empty_string() {
		$vals = array( '0', '1', '2', '' );
		foreach ( $vals as $val ) {
			add_metadata( 'post', 12345, 'foo', $val );
		}
		$m = get_metadata( 'post', 12345, 'foo', false );
		$this->assertEqualSets( $vals, $m );

		delete_metadata( 'post', 12345, 'foo', '' );
		$m = get_metadata( 'post', 12345, 'foo', false );
		$this->assertEqualSets( array(), $m );
	}

	/**
	 * @ticket 32224
	 */
	public function test_meta_value_should_be_ignored_when_null() {
		$vals = array( '0', '1', '2', '' );
		foreach ( $vals as $val ) {
			add_metadata( 'post', 12345, 'foo', $val );
		}
		$m = get_metadata( 'post', 12345, 'foo', false );
		$this->assertEqualSets( $vals, $m );

		delete_metadata( 'post', 12345, 'foo', null );
		$m = get_metadata( 'post', 12345, 'foo', false );
		$this->assertEqualSets( array(), $m );
	}

	/**
	 * @ticket 32224
	 */
	public function test_meta_value_should_be_ignored_when_false() {
		$vals = array( '0', '1', '2', '' );
		foreach ( $vals as $val ) {
			add_metadata( 'post', 12345, 'foo', $val );
		}
		$m = get_metadata( 'post', 12345, 'foo', false );
		$this->assertEqualSets( $vals, $m );

		delete_metadata( 'post', 12345, 'foo', false );
		$m = get_metadata( 'post', 12345, 'foo', false );
		$this->assertEqualSets( array(), $m );
	}
}
