<?php

/**
 * Test WPDB methods
 *
 * @group wpdb
 */
class Tests_DB extends WP_UnitTestCase {

	/**
	 * Query log
	 * @var array
	 */
	protected $_queries = array();

	/**
	 * Set up the test fixture
	 */
	public function setUp() {
		parent::setUp();
		$this->_queries = array();
		add_filter( 'query', array( $this, 'query_filter' ) );
	}

	/**
	 * Tear down the test fixture
	 */
	public function tearDown() {
		parent::tearDown();
		remove_filter( 'query', array( $this, 'query_filter' ) );
	}

	/**
	 * Log each query
	 * @param string $sql
	 * @return string
	 */
	public function query_filter( $sql ) {
		$this->_queries[] = $sql;
		return $sql;
	}

	/**
	 * Test that WPDB will reconnect when the DB link dies
	 * @ticket 5932
	 */
	public function test_db_reconnect() {
		global $wpdb;

		$var = $wpdb->get_var( "SELECT ID FROM $wpdb->users LIMIT 1" );
		$this->assertGreaterThan( 0, $var );

		if ( $wpdb->use_mysqli ) {
			mysqli_close( $wpdb->dbh );
		} else {
			mysql_close( $wpdb->dbh );
		}
		unset( $wpdb->dbh );

		$var = $wpdb->get_var( "SELECT ID FROM $wpdb->users LIMIT 1" );
		$this->assertGreaterThan( 0, $var );
	}

	/**
	 * Test that floats formatted as "0,700" get sanitized properly by wpdb
	 * @global mixed $wpdb
	 *
	 * @ticket 19861
	 */
	public function test_locale_floats() {
		global $wpdb;

		// Save the current locale settings
		$current_locales = explode( ';', setlocale( LC_ALL, 0 ) );

		// Switch to Russian
		$flag = setlocale( LC_ALL, 'ru_RU.utf8', 'rus', 'fr_FR.utf8', 'fr_FR', 'de_DE.utf8', 'de_DE', 'es_ES.utf8', 'es_ES' );
		if ( false === $flag )
			$this->markTestSkipped( 'No European languages available for testing' );

		// Try an update query
		$wpdb->suppress_errors( true );
		$wpdb->update(
			'test_table',
			array( 'float_column' => 0.7 ),
			array( 'meta_id' => 5 ),
			array( '%f' ),
			array( '%d' )
		);
		$wpdb->suppress_errors( false );

		// Ensure the float isn't 0,700
		$this->assertContains( '0.700', array_pop( $this->_queries ) );

		// Try a prepare
		$sql = $wpdb->prepare( "UPDATE test_table SET float_column = %f AND meta_id = %d", 0.7, 5 );
		$this->assertContains( '0.700', $sql );

		// Restore locale settings
		foreach ( $current_locales as $locale_setting ) {
			if ( false !== strpos( $locale_setting, '=' ) ) {
				list( $category, $locale ) = explode( '=', $locale_setting );
				if ( defined( $category ) )
					setlocale( constant( $category ), $locale );
			} else {
				setlocale( LC_ALL, $locale_setting );
			}
		}
	}

	/**
	 * @ticket 10041
	 */
	function test_esc_like() {
		global $wpdb;

		$inputs = array(
			'howdy%', //Single Percent
			'howdy_', //Single Underscore
			'howdy\\', //Single slash
			'howdy\\howdy%howdy_', //The works
			'howdy\'"[[]*#[^howdy]!+)(*&$#@!~|}{=--`/.,<>?', //Plain text
		);
		$expected = array(
			'howdy\\%',
			'howdy\\_',
			'howdy\\\\',
			'howdy\\\\howdy\\%howdy\\_',
			'howdy\'"[[]*#[^howdy]!+)(*&$#@!~|}{=--`/.,<>?',
		);

		foreach ($inputs as $key => $input) {
			$this->assertEquals($expected[$key], $wpdb->esc_like($input));
		}
	}

	/**
	 * Test LIKE Queries
	 *
	 * Make sure $wpdb is fully compatible with esc_like() by testing the identity of various strings.
	 * When escaped properly, a string literal is always LIKE itself (1)
	 * and never LIKE any other string literal (0) no matter how crazy the SQL looks.
	 *
	 * @ticket 10041
	 * @dataProvider data_like_query
	 * @param $data string The haystack, raw.
	 * @param $like string The like phrase, raw.
         * @param $result string The expected comparison result; '1' = true, '0' = false
	 */
	function test_like_query( $data, $like, $result ) {
		global $wpdb;
		return $this->assertEquals( $result, $wpdb->get_var( $wpdb->prepare( "SELECT %s LIKE %s", $data, $wpdb->esc_like( $like ) ) ) );
	}

	function data_like_query() {
		return array(
			array(
				'aaa',
				'aaa',
				'1',
			),
			array(
				'a\\aa', // SELECT 'a\\aa'  # This represents a\aa in both languages.
				'a\\aa', // LIKE 'a\\\\aa'
				'1',
			),
			array(
				'a%aa',
				'a%aa',
				'1',
			),
			array(
				'aaaa',
				'a%aa',
				'0',
			),
			array(
				'a\\%aa', // SELECT 'a\\%aa'
				'a\\%aa', // LIKE 'a\\\\\\%aa' # The PHP literal would be "LIKE 'a\\\\\\\\\\\\%aa'".  This is why we need reliable escape functions!
				'1',
			),
			array(
				'a%aa',
				'a\\%aa',
				'0',
			),
			array(
				'a\\%aa',
				'a%aa',
				'0',
			),
			array(
				'a_aa',
				'a_aa',
				'1',
			),
			array(
				'aaaa',
				'a_aa',
				'0',
			),
			array(
				'howdy\'"[[]*#[^howdy]!+)(*&$#@!~|}{=--`/.,<>?',
				'howdy\'"[[]*#[^howdy]!+)(*&$#@!~|}{=--`/.,<>?',
				'1',
			),
		);
	}

	/**
	 * @ticket 18510
	 */
	function test_wpdb_supposedly_protected_properties() {
		global $wpdb;

		$this->assertNotEmpty( $wpdb->dbh );
		$dbh = $wpdb->dbh;
		$this->assertNotEmpty( $dbh );
		$this->assertTrue( isset( $wpdb->dbh ) ); // Test __isset()
		unset( $wpdb->dbh );
		$this->assertTrue( empty( $wpdb->dbh ) );
		$wpdb->dbh = $dbh;
		$this->assertNotEmpty( $wpdb->dbh );
	}

	/**
	 * @ticket 18510
	 */
	function test_wpdb_nonexistent_properties() {
		global $wpdb;

		$this->assertTrue( empty( $wpdb->nonexistent_property ) );
		$wpdb->nonexistent_property = true;
		$this->assertTrue( $wpdb->nonexistent_property );
		$this->assertTrue( isset( $wpdb->nonexistent_property ) );
		unset( $wpdb->nonexistent_property );
		$this->assertTrue( empty( $wpdb->nonexistent_property ) );
	}

	/**
	 * Test that an escaped %%f is not altered
	 * @ticket 19861
	 */
	public function test_double_escaped_placeholders() {
		global $wpdb;
		$sql = $wpdb->prepare( "UPDATE test_table SET string_column = '%%f is a float, %%d is an int %d, %%s is a string', field = %s", 3, '4' );
		$this->assertEquals( "UPDATE test_table SET string_column = '%f is a float, %d is an int 3, %s is a string', field = '4'", $sql );
	}

	/**
	 * Test that SQL modes are set correctly
	 * @ticket 26847
	 */
	public function test_set_sql_mode() {
		global $wpdb;

		$current_modes = $wpdb->get_var( 'SELECT @@SESSION.sql_mode;' );

		$new_modes = array( 'IGNORE_SPACE', 'NO_AUTO_CREATE_USER' );
		$wpdb->set_sql_mode( $new_modes );
		$check_new_modes = $wpdb->get_var( 'SELECT @@SESSION.sql_mode;' );
		$this->assertEquals( implode( ',', $new_modes ), $check_new_modes );

		$wpdb->set_sql_mode( explode( ',', $current_modes ) );
	}

	/**
	 * Test that incompatible SQL modes are blocked
	 * @ticket 26847
	 */
	public function test_set_incompatible_sql_mode() {
		global $wpdb;

		$current_modes = $wpdb->get_var( 'SELECT @@SESSION.sql_mode;' );

		$new_modes = array( 'IGNORE_SPACE', 'NO_ZERO_DATE', 'NO_AUTO_CREATE_USER' );
		$wpdb->set_sql_mode( $new_modes );
		$check_new_modes = $wpdb->get_var( 'SELECT @@SESSION.sql_mode;' );
		$this->assertFalse( in_array( 'NO_ZERO_DATE', explode( ',', $check_new_modes ) ) );

		$wpdb->set_sql_mode( explode( ',', $current_modes ) );
	}

	/**
	 * Test that incompatible SQL modes can be changed
	 * @ticket 26847
	 */
	public function test_set_allowed_incompatible_sql_mode() {
		global $wpdb;

		$current_modes = $wpdb->get_var( 'SELECT @@SESSION.sql_mode;' );

		$new_modes = array( 'IGNORE_SPACE', 'NO_ZERO_DATE', 'NO_AUTO_CREATE_USER' );

		add_filter( 'incompatible_sql_modes', array( $this, 'filter_allowed_incompatible_sql_mode' ), 1, 1 );
		$wpdb->set_sql_mode( $new_modes );
		remove_filter( 'incompatible_sql_modes', array( $this, 'filter_allowed_incompatible_sql_mode' ), 1 );

		$check_new_modes = $wpdb->get_var( 'SELECT @@SESSION.sql_mode;' );
		$this->assertTrue( in_array( 'NO_ZERO_DATE', explode( ',', $check_new_modes ) ) );

		$wpdb->set_sql_mode( explode( ',', $current_modes ) );
	}

	public function filter_allowed_incompatible_sql_mode( $modes ) {
		$pos = array_search( 'NO_ZERO_DATE', $modes );
		$this->assertGreaterThanOrEqual( 0, $pos );

		if ( FALSE === $pos ) {
			return $modes;
		}

		unset( $modes[ $pos ] );
		return $modes;
	}

	/**
	 * @ticket 25604
	 * @expectedIncorrectUsage wpdb::prepare
	 */
	function test_prepare_without_arguments() {
		global $wpdb;
		$id = 0;
		// This, obviously, is an incorrect prepare.
		$prepared = $wpdb->prepare( "SELECT * FROM $wpdb->users WHERE id = $id", $id );
		$this->assertEquals( "SELECT * FROM $wpdb->users WHERE id = 0", $prepared );
	}

	function test_db_version() {
		global $wpdb;

		$this->assertTrue( version_compare( $wpdb->db_version(), '5.0', '>=' ) );
	}

	function test_get_caller() {
		global $wpdb;
		$str = $wpdb->get_caller();
		$calls = explode( ', ', $str );
		$called = join( '->', array( __CLASS__, __FUNCTION__ ) );
		$this->assertEquals( $called, end( $calls ) );
	}

	function test_has_cap() {
		global $wpdb;
		$this->assertTrue( $wpdb->has_cap( 'collation' ) );
		$this->assertTrue( $wpdb->has_cap( 'group_concat' ) );
		$this->assertTrue( $wpdb->has_cap( 'subqueries' ) );
		$this->assertTrue( $wpdb->has_cap( 'COLLATION' ) );
		$this->assertTrue( $wpdb->has_cap( 'GROUP_CONCAT' ) );
		$this->assertTrue( $wpdb->has_cap( 'SUBQUERIES' ) );
		$this->assertEquals(
			version_compare( $wpdb->db_version(), '5.0.7', '>=' ),
			$wpdb->has_cap( 'set_charset' )
		);
		$this->assertEquals(
			version_compare( $wpdb->db_version(), '5.0.7', '>=' ),
			$wpdb->has_cap( 'SET_CHARSET' )
		);
	}

	/**
	 * @expectedDeprecated supports_collation
	 */
	function test_supports_collation() {
		global $wpdb;
		$this->assertTrue( $wpdb->supports_collation() );
	}

	function test_check_database_version() {
		global $wpdb;
		$this->assertEmpty( $wpdb->check_database_version() );
	}

	/**
	 * @expectedException WPDieException
	 */
	function test_bail() {
		global $wpdb;
		$wpdb->bail( 'Database is dead.' );
	}

	function test_timers() {
		global $wpdb;

		$wpdb->timer_start();
		usleep( 5 );
		$stop = $wpdb->timer_stop();

		$this->assertNotEquals( $wpdb->time_start, $stop );
		$this->assertGreaterThan( $stop, $wpdb->time_start );
	}

	function test_get_col_info() {
		global $wpdb;

		$wpdb->get_results( "SELECT ID FROM $wpdb->users" );

		$this->assertEquals( array( 'ID' ), $wpdb->get_col_info() );
		$this->assertEquals( array( $wpdb->users ), $wpdb->get_col_info( 'table' ) );
		$this->assertEquals( $wpdb->users, $wpdb->get_col_info( 'table', 0 ) );
	}

	function test_query_and_delete() {
		global $wpdb;
		$rows = $wpdb->query( "INSERT INTO $wpdb->users (display_name) VALUES ('Walter Sobchak')" );
		$this->assertEquals( 1, $rows );
		$this->assertNotEmpty( $wpdb->insert_id );
		$d_rows = $wpdb->delete( $wpdb->users, array( 'ID' => $wpdb->insert_id ) );
		$this->assertEquals( 1, $d_rows );
	}

	function test_get_row() {
		global $wpdb;
		$rows = $wpdb->query( "INSERT INTO $wpdb->users (display_name) VALUES ('Walter Sobchak')" );
		$this->assertEquals( 1, $rows );
		$this->assertNotEmpty( $wpdb->insert_id );

		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $wpdb->users WHERE ID = %d", $wpdb->insert_id ) );
		$this->assertInternalType( 'object', $row );
		$this->assertEquals( 'Walter Sobchak', $row->display_name );
	}

	function test_replace() {
		global $wpdb;
		$rows1 = $wpdb->insert( $wpdb->users, array( 'display_name' => 'Walter Sobchak' ) );
		$this->assertEquals( 1, $rows1 );
		$this->assertNotEmpty( $wpdb->insert_id );
		$last = $wpdb->insert_id;

		$rows2 = $wpdb->replace( $wpdb->users, array( 'ID' => $last, 'display_name' => 'Walter Replace Sobchak' ) );
		$this->assertEquals( 2, $rows2 );
		$this->assertNotEmpty( $wpdb->insert_id );

		$this->assertEquals( $last, $wpdb->insert_id );

		$row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $wpdb->users WHERE ID = %d", $last ) );
		$this->assertEquals( 'Walter Replace Sobchak', $row->display_name );
	}

	/**
	 * wpdb::update() requires a WHERE condition.
	 *
	 * @ticket 26106
	 */
	function test_empty_where_on_update() {
		global $wpdb;
		$suppress = $wpdb->suppress_errors( true );
		$wpdb->update( $wpdb->posts, array( 'post_name' => 'burrito' ), array() );

		$expected1 = "UPDATE `{$wpdb->posts}` SET `post_name` = 'burrito' WHERE ";
		$this->assertNotEmpty( $wpdb->last_error );
		$this->assertEquals( $expected1, $wpdb->last_query );

		$wpdb->update( $wpdb->posts, array( 'post_name' => 'burrito' ), array( 'post_status' => 'taco' ) );

		$expected2 = "UPDATE `{$wpdb->posts}` SET `post_name` = 'burrito' WHERE `post_status` = 'taco'";
		$this->assertEmpty( $wpdb->last_error );
		$this->assertEquals( $expected2, $wpdb->last_query );
		$wpdb->suppress_errors( $suppress );
	}
}
