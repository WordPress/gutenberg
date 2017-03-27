<?php

/**
 * Test dbDelta()
 *
 * @group upgrade
 * @group dbdelta
 */
class Tests_dbDelta extends WP_UnitTestCase {

	/**
	 * The maximum size of an index with utf8mb4 collation and charset with a standard
	 * byte limit of 767. floor(767/4) = 191 characters.
	 */
	protected $max_index_length = 191;

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

		// Forcing MyISAM, because InnoDB only started supporting FULLTEXT indexes in MySQL 5.7.
		$wpdb->query(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
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
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length))
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
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length))
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
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length))
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
		$this->assertTableHasPrimaryKey( 'id' , $wpdb->prefix . 'dbdelta_test' );
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
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length))
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
				KEY key_1 (column_1({$this->max_index_length})),
				KEY compound_key (id,column_1($this->max_index_length))
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

	/**
	 * Test that FULLTEXT indexes are detected.
	 * @ticket 14445
	 */
	public function test_fulltext_index() {
		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				PRIMARY KEY  (id),
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1)
			)
			", false
		);

		$this->assertEmpty( $updates );
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
	 * Assert that a table has a primary key.
	 *
	 * Checks for single-column primary keys. May not work for multi-column primary keys.
	 *
	 * @param string $column The column for the primary key.
	 * @param string $table  The database table name.
	 */
	protected function assertTableHasPrimaryKey( $column , $table ) {
		global $wpdb;

		$table_indices = $wpdb->get_results( "SHOW INDEX FROM {$table}" );

		$this->assertCount( 1, wp_list_filter( $table_indices, array( 'Key_name' => 'PRIMARY' , 'Column_name' => $column ) , 'AND' ) );
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

	/**
	 * @ticket 36748
	 */
	function test_dont_downsize_text_fields() {
		global $wpdb;

		$result = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 tinytext,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1({$this->max_index_length})),
				KEY compound_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			", false );

		$this->assertSame( array(), $result );
	}

	/**
	 * @ticket 36748
	 */
	function test_dont_downsize_blob_fields() {
		global $wpdb;

		$result = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 tinyblob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1({$this->max_index_length})),
				KEY compound_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			", false );

		$this->assertSame( array(), $result );
	}

	/**
	 * @ticket 36748
	 */
	function test_upsize_text_fields() {
		global $wpdb;

		$result = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 bigtext,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1({$this->max_index_length})),
				KEY compound_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			", false );

		$this->assertSame(
			array(
				"{$wpdb->prefix}dbdelta_test.column_2"
					=> "Changed type of {$wpdb->prefix}dbdelta_test.column_2 from text to bigtext"
			), $result );
	}

	/**
	 * @ticket 36748
	 */
	function test_upsize_blob_fields() {
		global $wpdb;

		$result = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 mediumblob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1({$this->max_index_length})),
				KEY compound_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			", false );

		$this->assertSame(
			array(
				"{$wpdb->prefix}dbdelta_test.column_3"
					=> "Changed type of {$wpdb->prefix}dbdelta_test.column_3 from blob to mediumblob"
			), $result );
	}

	/**
	 * @ticket 20263
	 */
	function test_query_with_backticks_does_not_throw_an_undefined_index_warning() {
		global $wpdb;

		$schema = "
			CREATE TABLE {$wpdb->prefix}dbdelta_test2 (
				`id` bigint(20) NOT NULL AUTO_INCREMENT,
				`column_1` varchar(255) NOT NULL,
				PRIMARY KEY  (id),
				KEY compound_key (id,column_1($this->max_index_length))
			)
		";

		$wpdb->query( $schema );

		$updates = dbDelta( $schema, false );

		$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}dbdelta_test2" );

		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 36948
	 */
	function test_spatial_indices() {
		global $wpdb;

		if ( version_compare( $wpdb->db_version(), '5.4', '<' ) ) {
			$this->markTestSkipped( 'Spatial indices require MySQL 5.4 and above.' );
		}

		$schema =
			"
			CREATE TABLE {$wpdb->prefix}spatial_index_test (
				non_spatial bigint(20) unsigned NOT NULL,
				spatial_value geometrycollection NOT NULL,
				KEY non_spatial (non_spatial),
				SPATIAL KEY spatial_key (spatial_value)
			) ENGINE=MyISAM;
			";

		$wpdb->query( $schema );

		$updates = dbDelta( $schema, false );

		$this->assertEmpty( $updates );

		$schema =
			"
			CREATE TABLE {$wpdb->prefix}spatial_index_test (
				non_spatial bigint(20) unsigned NOT NULL,
				spatial_value geometrycollection NOT NULL,
				spatial_value2 geometrycollection NOT NULL,
				KEY non_spatial (non_spatial),
				SPATIAL KEY spatial_key (spatial_value)
				SPATIAL KEY spatial_key2 (spatial_value2)
			) ENGINE=MyISAM;
			";

		$updates = dbDelta( $schema, false );

		$this->assertSame( array(
			"{$wpdb->prefix}spatial_index_test.spatial_value2" => "Added column {$wpdb->prefix}spatial_index_test.spatial_value2",
			"Added index {$wpdb->prefix}spatial_index_test SPATIAL KEY `spatial_key2` (`spatial_value2`)"
			), $updates );

		$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}spatial_index_test" );
	}

	/**
	 * @ticket 20263
	 */
	function test_query_with_backticks_does_not_cause_a_query_to_alter_all_columns_and_indices_to_run_even_if_none_have_changed() {
		global $wpdb;

		$schema = "
			CREATE TABLE {$wpdb->prefix}dbdelta_test2 (
				`id` bigint(20) NOT NULL AUTO_INCREMENT,
				`references` varchar(255) NOT NULL,
				PRIMARY KEY  (`id`),
				KEY `compound_key` (`id`,`references`($this->max_index_length))
			)
		";

		$wpdb->query( $schema );

		$updates = dbDelta( $schema );

		$table_indices = $wpdb->get_results( "SHOW INDEX FROM {$wpdb->prefix}dbdelta_test2" );
		$compound_key_index = wp_list_filter( $table_indices, array( 'Key_name' => 'compound_key' ) );

		$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}dbdelta_test2" );

		$this->assertCount( 2, $compound_key_index );
		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 20263
	 */
	function test_index_with_a_reserved_keyword_can_be_created() {
		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				`references` varchar(255) NOT NULL,
				PRIMARY KEY  (id),
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id , column_1($this->max_index_length)),
				KEY compound_key2 (id,`references`($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			"
		);

		$table_indices = $wpdb->get_results( "SHOW INDEX FROM {$wpdb->prefix}dbdelta_test" );

		$this->assertCount( 2, wp_list_filter( $table_indices, array( 'Key_name' => 'compound_key2' ) , 'AND' ) );

		$this->assertSame(
			array(
				"{$wpdb->prefix}dbdelta_test.references" => "Added column {$wpdb->prefix}dbdelta_test.references",
				0 => "Added index {$wpdb->prefix}dbdelta_test KEY `compound_key2` (`id`,`references`($this->max_index_length))",
			),
			$updates
		);
	}

	/**
	 * @ticket 20263
	 */
	function test_wp_get_db_schema_does_no_alter_queries_on_existing_install() {
		$updates = dbDelta( wp_get_db_schema() );

		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 20263
	 */
	function test_key_and_index_and_fulltext_key_and_fulltext_index_and_unique_key_and_unique_index_indicies() {
		global $wpdb;

		$schema = "
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1),
				INDEX key_2 (column_1($this->max_index_length)),
				UNIQUE KEY key_3 (column_1($this->max_index_length)),
				UNIQUE INDEX key_4 (column_1($this->max_index_length)),
				FULLTEXT INDEX key_5 (column_1),
			) ENGINE=MyISAM
		";

		$creates = dbDelta( $schema );
		$this->assertSame(
			array(
				0 => "Added index {$wpdb->prefix}dbdelta_test KEY `key_2` (`column_1`($this->max_index_length))",
				1 => "Added index {$wpdb->prefix}dbdelta_test UNIQUE KEY `key_3` (`column_1`($this->max_index_length))",
				2 => "Added index {$wpdb->prefix}dbdelta_test UNIQUE KEY `key_4` (`column_1`($this->max_index_length))",
				3 => "Added index {$wpdb->prefix}dbdelta_test FULLTEXT KEY `key_5` (`column_1`)",
			),
			$creates
		);

		$updates = dbDelta( $schema );
		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 20263
	 */
	function test_index_and_key_are_synonyms_and_do_not_recreate_indices() {
		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				INDEX key_1 (column_1($this->max_index_length)),
				INDEX compound_key (id,column_1($this->max_index_length)),
				FULLTEXT INDEX fulltext_key (column_1)
			) ENGINE=MyISAM
			"
		);

		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 20263
	 */
	function test_indices_with_prefix_limits_are_created_and_do_not_recreate_indices() {
		global $wpdb;

		$schema = "
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1),
				KEY key_2 (column_1(10)),
				KEY key_3 (column_2(100),column_1(10)),
			) ENGINE=MyISAM
		";

		$creates = dbDelta( $schema );
		$this->assertSame(
			array(
				0 => "Added index {$wpdb->prefix}dbdelta_test KEY `key_2` (`column_1`(10))",
				1 => "Added index {$wpdb->prefix}dbdelta_test KEY `key_3` (`column_2`(100),`column_1`(10))",
			),
			$creates
		);

		$updates = dbDelta( $schema );
		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 34959
	 */
	function test_index_col_names_with_order_do_not_recreate_indices() {
		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1($this->max_index_length) DESC),
				KEY compound_key (id,column_1($this->max_index_length) ASC),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			"
		);

		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 34873
	 */
	function test_primary_key_with_single_space_does_not_recreate_index() {
		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY (id),
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			"
		);

		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 34869
	 */
	function test_index_definitions_with_spaces_do_not_recreate_indices() {
		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1        (         column_1($this->max_index_length)),
				KEY compound_key (id,      column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			"
		);

		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 34871
	 */
	function test_index_types_are_not_case_sensitive_and_do_not_recreate_indices() {
		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				key key_1 (column_1($this->max_index_length)),
				key compound_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			"
		);

		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 34874
	 */
	function test_key_names_are_not_case_sensitive_and_do_not_recreate_indices() {
		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY KEY_1 (column_1($this->max_index_length)),
				KEY compOUND_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY FULLtext_kEY (column_1)
			) ENGINE=MyISAM
			", false );

		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 34870
	 */
	function test_unchanged_key_lengths_do_not_recreate_index() {
		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1({$this->max_index_length})),
				KEY compound_key (id,column_1($this->max_index_length)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			", false );

		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 34870
	 */
	function test_changed_key_lengths_do_not_recreate_index() {
		global $wpdb;

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length)),
				KEY changing_key_length (column_1(20)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			" );

		$this->assertSame( array(
			"Added index {$wpdb->prefix}dbdelta_test KEY `changing_key_length` (`column_1`(20))"
		), $updates );

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length)),
				KEY changing_key_length (column_1(50)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			" );

		$this->assertEmpty( $updates );

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1($this->max_index_length)),
				KEY compound_key (id,column_1($this->max_index_length)),
				KEY changing_key_length (column_1(1)),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			" );

		$this->assertEmpty( $updates );

		$updates = dbDelta(
			"
			CREATE TABLE {$wpdb->prefix}dbdelta_test (
				id bigint(20) NOT NULL AUTO_INCREMENT,
				column_1 varchar(255) NOT NULL,
				column_2 text,
				column_3 blob,
				PRIMARY KEY  (id),
				KEY key_1 (column_1),
				KEY compound_key (id,column_1),
				KEY changing_key_length (column_1),
				FULLTEXT KEY fulltext_key (column_1)
			) ENGINE=MyISAM
			" );

		$this->assertEmpty( $updates );
	}

	/**
	 * @ticket 31679
	 */
	function test_column_type_change_with_hyphens_in_name() {
		global $wpdb;

		$schema = "
			CREATE TABLE {$wpdb->prefix}dbdelta_test2 (
				`foo-bar` varchar(255) DEFAULT NULL
			)
		";

		$wpdb->query( $schema );

		$schema_update = "
			CREATE TABLE {$wpdb->prefix}dbdelta_test2 (
				`foo-bar` text DEFAULT NULL
			)
		";

		$updates = dbDelta( $schema_update );

		$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}dbdelta_test2" );

		$this->assertSame(
			array(
				"{$wpdb->prefix}dbdelta_test2.foo-bar" => "Changed type of {$wpdb->prefix}dbdelta_test2.foo-bar from varchar(255) to text",
			),
			$updates
		);
	}
}
