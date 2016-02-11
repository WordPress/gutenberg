<?php

/**
 * @group meta
 * @covers ::update_metadata
 */
class Tests_Meta_UpdateMetadata extends WP_UnitTestCase {
	/**
	 * @ticket 35795
	 */
	public function test_slashed_key_for_new_metadata() {
		update_metadata( 'post', 123, wp_slash( 'foo\foo' ), 'bar' );

		$found = get_metadata( 'post', 123, 'foo\foo', true );
		$this->assertSame( 'bar', $found );
	}

	/**
	 * @ticket 35795
	 */
	public function test_slashed_key_for_existing_metadata() {
		global $wpdb;

		add_metadata( 'post', 123, wp_slash( 'foo\foo' ), 'bar' );
		update_metadata( 'post', 123, wp_slash( 'foo\foo' ), 'baz' );

		$found = get_metadata( 'post', 123, 'foo\foo', true );
		$this->assertSame( 'baz', $found );
	}
}
