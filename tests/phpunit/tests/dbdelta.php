<?php

/**
 * Test dbDelta()
 *
 * @group upgrade
 * @group dbdelta
 */
class Tests_dbDelta extends WP_UnitTestCase {

	function test_create_new_table() {
		include_once( ABSPATH . 'wp-admin/includes/upgrade.php');
		$table_name = 'test_new_table';

		$create = "CREATE TABLE $table_name (\n a varchar(255)\n)";
		$expected = array( $table_name => "Created table $table_name" );

		$actual = dbDelta( $create, false );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * @ticket 31869
	 */
	function test_truncated_index() {
		global $wpdb;

		if ( ! $wpdb->has_cap( 'utf8mb4' ) ) {
			$this->markTestSkipped( 'This test requires utf8mb4 support in MySQL.' );
		}

		include_once( ABSPATH . 'wp-admin/includes/upgrade.php');
		$table_name = 'test_truncated_index';

		$create = "CREATE TABLE $table_name (\n a varchar(255) COLLATE utf8mb4_unicode_ci,\n KEY a (a)\n)";
		$wpdb->query( $create );

		$actual = dbDelta( $create, false );

		$this->assertSame( array(), $actual );
	}
}
