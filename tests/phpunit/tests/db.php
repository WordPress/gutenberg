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
}
