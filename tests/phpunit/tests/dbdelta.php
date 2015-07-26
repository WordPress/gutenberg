<?php

/**
 * Test dbDelta()
 *
 * @group upgrade
 * @group dbdelta
 */
class Tests_dbDelta extends WP_UnitTestCase {

	/**
	 * Make sure the upgrade code is loaded before the tests are run.
	 */
	public static function setUpBeforeClass() {

		parent::setUpBeforeClass();

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
	}

	/**
	 * Create a custom table to be used in each test.
	 */
	public function setUp() {

		global $wpdb;

		$wpdb->query(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				PRIMARY KEY  (id),
				KEY key_1 (column_1),
				KEY compoud_key (id,column_1)
			)
			"
		);

		parent::setUp();
	}

	/**
	 * Delete the custom table on teardown.
	 */
	public function tearDown() {

		global $wpdb;

		parent::tearDown();

		$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}dbdelta_test" );
	}

	/**
	 * Test table creation.
	 */
	public function test_creating_a_table() {

		remove_filter( 'query', array( $this, '_create_temporary_tables' ) );
		remove_filter( 'query', array( $this, '_drop_temporary_tables' ) );

		global $wpdb;

		$updates = dbDelta(
			"CREATE TABLE {$wpdb->prefix}dbdelta_create_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				PRIMARY KEY  (id)
			);"
		);

		$expected = array(
			"{$wpdb->prefix}dbdelta_create_test" => "Created table {$wpdb->prefix}dbdelta_create_test"
		);

		$this->assertEquals( $expected, $updates );

		$this->assertEquals(
			"{$wpdb->prefix}dbdelta_create_test"
			, $wpdb->get_var(
				$wpdb->prepare(
					'SHOW TABLES LIKE %s'
					, $wpdb->esc_like( "{$wpdb->prefix}dbdelta_create_test" )
				)
			)
		);

		$wpdb->query( "DROP TABLE {$wpdb->prefix}dbdelta_create_test" );
	}

	/**
	 * Test that it does nothing for an existing table.
	 */
	public function test_existing_table() {

		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				PRIMARY KEY  (id),
				KEY key_1 (column_1),
				KEY compoud_key (id,column_1)
			)
			"
		);

		$this->assertEquals( array(), $updates );
	}

	/**
	 * Test the column type is updated.
	 */
	public function test_column_type_change() {

		global $wpdb;

		// id: bigint(20) => int(11)
		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id int(11) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				PRIMARY KEY  (id),
				KEY key_1 (column_1),
				KEY compoud_key (id,column_1)
			)
			"
		);

		$this->assertEquals(
			array(
				"{$wpdb->prefix}dbdelta_test.id"
					=> "Changed type of {$wpdb->prefix}dbdelta_test.id from bigint(20) to int(11)"
			)
			, $updates
		);
	}

	/**
	 * Test new column added.
	 */
	public function test_column_added() {

		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				extra_col longtext,
				PRIMARY KEY  (id),
				KEY key_1 (column_1),
				KEY compoud_key (id,column_1)
			)
			"
		);

		$this->assertEquals(
			array(
				"{$wpdb->prefix}dbdelta_test.extra_col"
					=> "Added column {$wpdb->prefix}dbdelta_test.extra_col"
			)
			, $updates
		);

		$this->assertTableHasColumn( 'column_1', $wpdb->prefix . 'dbdelta_test' );
	}

	/**
	 * Test that it does nothing when a column is removed.
	 *
	 * @ticket 26801
	 */
	public function test_columns_arent_removed() {

		global $wpdb;

		// No column column_1
		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				PRIMARY KEY  (id),
				KEY key_1 (column_1),
				KEY compoud_key (id,column_1)
			)
			"
		);

		$this->assertEquals( array(), $updates );

		$this->assertTableHasColumn( 'column_1', $wpdb->prefix . 'dbdelta_test' );
	}

	/**
	 * Test that nothing happens with $execute is false.
	 */
	public function test_no_execution() {

		global $wpdb;

		// Added column extra_col
		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				extra_col longtext,
				PRIMARY KEY  (id),
				KEY key_1 (column_1),
				KEY compoud_key (id,column_1)
			)
			"
			, false // Don't execute.
		);

		$this->assertEquals(
			array(
				"{$wpdb->prefix}dbdelta_test.extra_col"
					=> "Added column {$wpdb->prefix}dbdelta_test.extra_col"
			)
			, $updates
		);

		$this->assertTableHasNotColumn( 'extra_col', $wpdb->prefix . 'dbdelta_test' );
	}

	/**
	 * Test inserting into the database
	 */
	public function test_insert_into_table(){
		global $wpdb;

		$insert = dbDelta(
			"INSERT INTO {$wpdb->prefix}dbdelta_test (column_1) VALUES ('wcphilly2015')"
		);

		$this->assertEquals(
			array( )
			, $insert
		);

		$this->assertTableRowHasValue( 'column_1', 'wcphilly2015',  $wpdb->prefix . 'dbdelta_test' );

	}
	
	//
	// Assertions.
	//

	/**
	 * Assert that a table has a row with a value in a field.
	 *
	 * @param string $column The field name.
	 * @param string $value  The field value.
	 * @param string $table  The database table name.
	 */
	protected function assertTableRowHasValue( $column, $value, $table ) {

		global $wpdb;

		$table_row = $wpdb->get_row( "select $column from {$table} where $column = '$value'" );

		$expected = (object) array(
		    $column => $value
		);

		$this->assertEquals( $expected, $table_row );
	}

	/**
	 * Assert that a table has a column.
	 *
	 * @param string $column The field name.
	 * @param string $table  The database table name.
	 */
	protected function assertTableHasColumn( $column, $table ) {

		global $wpdb;

		$table_fields = $wpdb->get_results( "DESCRIBE {$table}" );

		$this->assertCount( 1, wp_list_filter( $table_fields, array( 'Field' => $column ) ) );
	}

	/**
	 * Assert that a table doesn't have a column.
	 *
	 * @param string $column The field name.
	 * @param string $table  The database table name.
	 */
	protected function assertTableHasNotColumn( $column, $table ) {

		global $wpdb;

		$table_fields = $wpdb->get_results( "DESCRIBE {$table}" );

		$this->assertCount( 0, wp_list_filter( $table_fields, array( 'Field' => $column ) ) );
	}

	/**
	 * @ticket 31869
	 */
	function test_truncated_index() {
		global $wpdb;

		if ( ! $wpdb->has_cap( 'utf8mb4' ) ) {
			$this->markTestSkipped( 'This test requires utf8mb4 support in MySQL.' );
		}

		$table_name = 'test_truncated_index';

		$create = "CREATE TABLE $table_name (\n a varchar(255) COLLATE utf8mb4_unicode_ci,\n KEY a (a)\n)";
		$wpdb->query( $create );

		$actual = dbDelta( $create, false );

		$this->assertSame( array(), $actual );
	}
}
