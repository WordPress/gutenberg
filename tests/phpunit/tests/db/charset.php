<?php

require_once dirname( dirname( __FILE__ ) ) . '/db.php';

/**
 * Test WPDB methods
 *
 * @group wpdb
 */
class Tests_DB_Charset extends WP_UnitTestCase {

	/**
	 * Our special WPDB
	 * @var resource
	 */
	protected static $_wpdb;

	public static function setUpBeforeClass() {
		self::$_wpdb = new wpdb_exposed_methods_for_testing();
	}

	/**
	 * @ticket 21212
	 */
	function data_strip_invalid_text() {
		$fields = array(
			'latin1' => array(
				// latin1. latin1 never changes.
				'charset'  => 'latin1',
				'value'    => "\xf0\x9f\x8e\xb7",
				'expected' => "\xf0\x9f\x8e\xb7"
			),
			'ascii' => array(
				// ascii gets special treatment, make sure it's covered
				'charset'  => 'ascii',
				'value'    => 'Hello World',
				'expected' => 'Hello World'
			),
			'utf8' => array(
				// utf8 only allows <= 3-byte chars
				'charset'  => 'utf8',
				'value'    => "H€llo\xf0\x9f\x98\x88World¢",
				'expected' => 'H€lloWorld¢'
			),
			'utf8mb3' => array(
				// utf8mb3 should behave the same an utf8
				'charset'  => 'utf8mb3',
				'value'    => "H€llo\xf0\x9f\x98\x88World¢",
				'expected' => 'H€lloWorld¢'
			),
			'utf8mb4' => array(
				// utf8mb4 allows 4-byte characters, too
				'charset'  => 'utf8mb4',
				'value'    => "H€llo\xf0\x9f\x98\x88World¢",
				'expected' => "H€llo\xf0\x9f\x98\x88World¢"
			),
			'koi8r' => array(
				// koi8r is a character set that needs to be checked in MySQL
				'charset'  => 'koi8r',
				'value'    => "\xfdord\xf2ress",
				'expected' => "\xfdord\xf2ress",
				'db'       => true
			),
			'hebrew' => array(
				// hebrew needs to be checked in MySQL, too
				'charset'  => 'hebrew',
				'value'    => "\xf9ord\xf7ress",
				'expected' => "\xf9ord\xf7ress",
				'db'       => true
			),
			'false' => array(
				// false is a column with no character set (ie, a number column)
				'charset'  => false,
				'value'    => 100,
				'expected' => 100
			),
		);

		if ( function_exists( 'mb_convert_encoding' ) ) {
			// big5 is a non-Unicode multibyte charset
			$utf8 = "a\xe5\x85\xb1b"; // UTF-8 Character 20849
			$big5 = mb_convert_encoding( $utf8, 'BIG-5', 'UTF-8' );
			$conv_utf8 = mb_convert_encoding( $big5, 'UTF-8', 'BIG-5' );
			// Make sure PHP's multibyte conversions are working correctly
			$this->assertNotEquals( $utf8, $big5 );
			$this->assertEquals( $utf8, $conv_utf8 );

			$fields['big5'] = array(
				'charset'  => 'big5',
				'value'    => $big5,
				'expected' => $big5
			);
		}

		// The data above is easy to edit. Now, prepare it for the data provider.
		$data_provider = $multiple = $multiple_expected = array();
		foreach ( $fields as $test_case => $field ) {
			$expected = $field;
			$expected['value'] = $expected['expected'];
			unset( $expected['expected'], $field['expected'] );

			// We're keeping track of these for our multiple-field test.
			$multiple[] = $field;
			$multiple_expected[] = $expected;

			// strip_invalid_text() expects an array of fields. We're testing one field at a time.
			$data = array( $field );
			$expected = array( $expected );

			// First argument is field data. Second is expected. Third is the message.
			$data_provider[] = array( $data, $expected, $test_case );
		}

		// Time for our test of multiple fields at once.
		$data_provider[] = array( $multiple, $multiple_expected, 'multiple fields/charsets' );

		return $data_provider;
	}

	/**
	 * @dataProvider data_strip_invalid_text
	 * @ticket 21212
	 */
	function test_strip_invalid_text( $data, $expected, $message ) {
		$actual = self::$_wpdb->strip_invalid_text( $data );
		$this->assertSame( $expected, $actual, $message );
	}

	/**
	 * @ticket 21212
	 */
	function test_process_fields_failure() {
		global $wpdb;

		$charset = $wpdb->get_col_charset( $wpdb->posts, 'post_content' );
		if ( 'utf8' !== $charset && 'utf8mb4' !== $charset ) {
			$this->markTestSkipped( 'This test requires a utf8 character set' );
		}

		// \xf0\xff\xff\xff is invalid in utf8 and utf8mb4.
		$data = array( 'post_content' => "H€llo\xf0\xff\xff\xffWorld¢" );
		$this->assertFalse( self::$_wpdb->process_fields( $wpdb->posts, $data, null ) );
	}

	/**
	 * @ticket 21212
	 */
	function data_process_field_charsets() {
		if ( $GLOBALS['wpdb']->charset ) {
			$charset = $GLOBALS['wpdb']->charset;
		} else {
			$charset = $GLOBALS['wpdb']->get_col_charset( $GLOBALS['wpdb']->posts, 'post_content' );
		}

		// 'value' and 'format' are $data, 'charset' ends up as part of $expected

		$no_string_fields = array(
			'post_parent' => array( 'value' => 10, 'format' => '%d', 'charset' => false ),
			'comment_count' => array( 'value' => 0, 'format' => '%d', 'charset' => false ),
		);

		$all_ascii_fields = array(
			'post_content' => array( 'value' => 'foo foo foo!', 'format' => '%s', 'charset' => false ),
			'post_excerpt' => array( 'value' => 'bar bar bar!', 'format' => '%s', 'charset' => false ),
		);

		// This is the same data used in process_field_charsets_for_nonexistent_table()
		$non_ascii_string_fields = array(
			'post_content' => array( 'value' => '¡foo foo foo!', 'format' => '%s', 'charset' => $charset, 'ascii' => false ),
			'post_excerpt' => array( 'value' => '¡bar bar bar!', 'format' => '%s', 'charset' => $charset, 'ascii' => false ),
		);

		$vars = get_defined_vars();
		unset( $vars['charset'] );
		foreach ( $vars as $var_name => $var ) {
			$data = $expected = $var;
			foreach ( $data as &$datum ) {
				// 'charset' and 'ascii' are part of the expected return only.
				unset( $datum['charset'], $datum['ascii'] );
			}

			$vars[ $var_name ] = array( $data, $expected, $var_name );
		}

		return array_values( $vars );
	}

	/**
	 * @dataProvider data_process_field_charsets
	 * @ticket 21212
	 */
	function test_process_field_charsets( $data, $expected, $message ) {
		$actual = self::$_wpdb->process_field_charsets( $data, $GLOBALS['wpdb']->posts );
		$this->assertSame( $expected, $actual, $message );
	}

	/**
	 * The test this test depends on first verifies that this
	 * would normally work against the posts table.
	 *
	 * @ticket 21212
	 * @depends test_process_field_charsets
	 */
	function test_process_field_charsets_on_nonexistent_table() {
		$data = array( 'post_content' => array( 'value' => '¡foo foo foo!', 'format' => '%s' ) );
		self::$_wpdb->suppress_errors( true );
		$this->assertFalse( self::$_wpdb->process_field_charsets( $data, 'nonexistent_table' ) );
		self::$_wpdb->suppress_errors( false );
	}

	/**
	 * @ticket 21212
	 */
	function test_check_ascii() {
		$ascii = "\0\t\n\r '" . '!"#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
		$this->assertTrue( self::$_wpdb->check_ascii( $ascii ) );
	}

	/**
	 * @ticket 21212
	 */
	function test_check_ascii_false() {
		$this->assertFalse( self::$_wpdb->check_ascii( 'ABCDEFGHIJKLMNOPQRSTUVWXYZ¡©«' ) );
	}

	/**
	 * @ticket 21212
	 */
	function test_strip_invalid_text_for_column() {
		global $wpdb;

		$charset = $wpdb->get_col_charset( $wpdb->posts, 'post_content' );
		if ( 'utf8' !== $charset && 'utf8mb4' !== $charset ) {
			$this->markTestSkipped( 'This test requires a utf8 character set' );
		}

		// Invalid 3-byte and 4-byte sequences
		$value = "H€llo\xe0\x80\x80World\xf0\xff\xff\xff¢";
		$expected = "H€lloWorld¢";
		$actual = $wpdb->strip_invalid_text_for_column( $wpdb->posts, 'post_content', $value );
		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Set of table definitions for testing wpdb::get_table_charset and wpdb::get_column_charset
	 * @var array
	 */
	protected $table_and_column_defs = array(
		array(
			'definition'      => '( a INT, b FLOAT )',
			'table_expected'  => false,
			'column_expected' => array( 'a' => false, 'b' => false )
		),
		array(
			'definition'      => '( a VARCHAR(50) CHARACTER SET big5, b TEXT CHARACTER SET big5 )',
			'table_expected'  => 'big5',
			'column_expected' => array( 'a' => 'big5', 'b' => 'big5' )
		),
		array(
			'definition'      => '( a VARCHAR(50) CHARACTER SET big5, b BINARY )',
			'table_expected'  => 'binary',
			'column_expected' => array( 'a' => 'big5', 'b' => false )
		),
		array(
			'definition'      => '( a VARCHAR(50) CHARACTER SET latin1, b BLOB )',
			'table_expected'  => 'binary',
			'column_expected' => array( 'a' => 'latin1', 'b' => false )
		),
		array(
			'definition'      => '( a VARCHAR(50) CHARACTER SET latin1, b TEXT CHARACTER SET koi8r )',
			'table_expected'  => 'koi8r',
			'column_expected' => array( 'a' => 'latin1', 'b' => 'koi8r' )
		),
		array(
			'definition'      => '( a VARCHAR(50) CHARACTER SET utf8mb3, b TEXT CHARACTER SET utf8mb3 )',
			'table_expected'  => 'utf8',
			'column_expected' => array( 'a' => 'utf8', 'b' => 'utf8' )
		),
		array(
			'definition'      => '( a VARCHAR(50) CHARACTER SET utf8, b TEXT CHARACTER SET utf8mb4 )',
			'table_expected'  => 'utf8',
			'column_expected' => array( 'a' => 'utf8', 'b' => 'utf8mb4' )
		),
		array(
			'definition'      => '( a VARCHAR(50) CHARACTER SET big5, b TEXT CHARACTER SET koi8r )',
			'table_expected'  => 'ascii',
			'column_expected' => array( 'a' => 'big5', 'b' => 'koi8r' )
		),
	);

	/**
	 * @ticket 21212
	 */
	function data_test_get_table_charset() {
		$table_name = 'test_get_table_charset';

		$vars = array();
		foreach( $this->table_and_column_defs as $value ) {
			$this_table_name = $table_name . '_' . rand_str( 5 );
			$drop = "DROP TABLE IF EXISTS $this_table_name";
			$create = "CREATE TABLE $this_table_name {$value['definition']}";
			$vars[] = array( $drop, $create, $this_table_name, $value['table_expected'] );
		}

		return $vars;
	}

	/**
	 * @dataProvider data_test_get_table_charset
	 * @ticket 21212
	 */
	function test_get_table_charset( $drop, $create, $table, $expected_charset ) {
		self::$_wpdb->query( $drop );

		if ( ! self::$_wpdb->has_cap( 'utf8mb4' ) && preg_match( '/utf8mb[34]/i', $create ) ) {
			$this->markTestSkipped( "This version of MySQL doesn't support utf8mb4." );
			return;
		}

		self::$_wpdb->query( $create );

		$charset = self::$_wpdb->get_table_charset( $table );
		$this->assertEquals( $charset, $expected_charset );

		$charset = self::$_wpdb->get_table_charset( strtoupper( $table ) );
		$this->assertEquals( $charset, $expected_charset );

		self::$_wpdb->query( $drop );
	}

	/**
	 * @ticket 21212
	 */
	function data_test_get_column_charset() {
		$table_name = 'test_get_column_charset';

		$vars = array();
		foreach( $this->table_and_column_defs as $value ) {
			$this_table_name = $table_name . '_' . rand_str( 5 );
			$drop = "DROP TABLE IF EXISTS $this_table_name";
			$create = "CREATE TABLE $this_table_name {$value['definition']}";
			$vars[] = array( $drop, $create, $this_table_name, $value['column_expected'] );
		}

		return $vars;
	}

	/**
	 * @dataProvider data_test_get_column_charset
	 * @ticket 21212
	 */
	function test_get_column_charset( $drop, $create, $table, $expected_charset ) {
		self::$_wpdb->query( $drop );

		if ( ! self::$_wpdb->has_cap( 'utf8mb4' ) && preg_match( '/utf8mb[34]/i', $create ) ) {
			$this->markTestSkipped( "This version of MySQL doesn't support utf8mb4." );
			return;
		}

		self::$_wpdb->query( $create );

		foreach ( $expected_charset as $column => $charset ) {
			$this->assertEquals( $charset, self::$_wpdb->get_col_charset( $table, $column ) );
			$this->assertEquals( $charset, self::$_wpdb->get_col_charset( strtoupper( $table ), strtoupper( $column ) ) );
		}

		self::$_wpdb->query( $drop );
	}

	/**
	 * @dataProvider data_test_get_column_charset
	 * @ticket 21212
	 */
	function test_get_column_charset_non_mysql( $drop, $create, $table, $columns ) {
		self::$_wpdb->query( $drop );

		if ( ! self::$_wpdb->has_cap( 'utf8mb4' ) && preg_match( '/utf8mb[34]/i', $create ) ) {
			$this->markTestSkipped( "This version of MySQL doesn't support utf8mb4." );
			return;
		}

		self::$_wpdb->is_mysql = false;

		self::$_wpdb->query( $create );

		$columns = array_keys( $columns );
		foreach ( $columns as $column => $charset ) {
			$this->assertEquals( false, self::$_wpdb->get_col_charset( $table, $column ) );
		}

		self::$_wpdb->query( $drop );

		self::$_wpdb->is_mysql = true;
	}

	/**
	 * @ticket 21212
	 */
	function data_strip_invalid_text_from_query() {
		$table_name = 'strip_invalid_text_from_query_table';
		$data = array(
			array(
				// binary tables don't get stripped
				"( a VARCHAR(50) CHARACTER SET utf8, b BINARY )", // create
				"('foo\xf0\x9f\x98\x88bar', 'foo')",              // query
				"('foo\xf0\x9f\x98\x88bar', 'foo')"               // expected result
			),
			array(
				// utf8/utf8mb4 tables default to utf8
				"( a VARCHAR(50) CHARACTER SET utf8, b VARCHAR(50) CHARACTER SET utf8mb4 )",
				"('foo\xf0\x9f\x98\x88bar', 'foo')",
				"('foobar', 'foo')"
			),
		);

		foreach( $data as &$value ) {
			$this_table_name = $table_name . '_' . rand_str( 5 );

			$value[0] = "CREATE TABLE $this_table_name {$value[0]}";
			$value[1] = "INSERT INTO $this_table_name VALUES {$value[1]}";
			$value[2] = "INSERT INTO $this_table_name VALUES {$value[2]}";
			$value[3] = "DROP TABLE IF EXISTS $this_table_name";
		}
		unset( $value );

		return $data;
	}

	/**
	 * @dataProvider data_strip_invalid_text_from_query
	 * @ticket 21212
	 */
	function test_strip_invalid_text_from_query( $create, $query, $expected, $drop ) {
		self::$_wpdb->query( $drop );

		if ( ! self::$_wpdb->has_cap( 'utf8mb4' ) && preg_match( '/utf8mb[34]/i', $create ) ) {
			$this->markTestSkipped( "This version of MySQL doesn't support utf8mb4." );
			return;
		}

		self::$_wpdb->query( $create );

		$return = self::$_wpdb->strip_invalid_text_from_query( $query );
		$this->assertEquals( $expected, $return );

		self::$_wpdb->query( $drop );
	}

	/**
	 * @ticket 21212
	 */
	function test_invalid_characters_in_query() {
		global $wpdb;

		$charset = $wpdb->get_col_charset( $wpdb->posts, 'post_content' );
		if ( 'utf8' !== $charset && 'utf8mb4' !== $charset ) {
			$this->markTestSkipped( 'This test requires a utf8 character set' );
		}

		$this->assertFalse( $wpdb->query( "INSERT INTO {$wpdb->posts} (post_content) VALUES ('foo\xf0\xff\xff\xffbar')" ) );
	}
}
