<?php

require_once dirname( __FILE__ ) . '/base.php';

/**
 * @group import
 */
class Tests_Import_Postmeta extends WP_Import_UnitTestCase {
	function setUp() {
		parent::setUp();

		if ( ! defined( 'WP_IMPORTING' ) )
			define( 'WP_IMPORTING', true );

		if ( ! defined( 'WP_LOAD_IMPORTERS' ) )
			define( 'WP_LOAD_IMPORTERS', true );

		if ( ! file_exists( DIR_TESTDATA . '/plugins/wordpress-importer/wordpress-importer.php' ) ) {
			$this->markTestSkipped( 'WordPress Importer plugin is not installed.' );
		}

		require_once DIR_TESTDATA . '/plugins/wordpress-importer/wordpress-importer.php';
	}

	function test_serialized_postmeta_no_cdata() {
		$this->_import_wp( DIR_TESTDATA . '/export/test-serialized-postmeta-no-cdata.xml', array( 'johncoswell' => 'john' ) );
		$expected['special_post_title'] = 'A special title';
		$expected['is_calendar'] = '';
		$this->assertEquals( $expected, get_post_meta( 122, 'post-options', true ) );
	}

	function test_utw_postmeta() {
		$this->_import_wp( DIR_TESTDATA . '/export/test-utw-post-meta-import.xml', array( 'johncoswell' => 'john' ) );

		$classy = new StdClass();
		$classy->tag =  "album";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "apple";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "art";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "artwork";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "dead-tracks";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "ipod";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "itunes";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "javascript";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "lyrics";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "script";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "tracks";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "windows-scripting-host";
		$expected[] = $classy;
		$classy = new StdClass();
		$classy->tag =  "wscript";
		$expected[] = $classy;

		$this->assertEquals( $expected, get_post_meta( 150, 'test', true ) );
	}

	/**
	 * @ticket 9633
	 */
	function test_serialized_postmeta_with_cdata() {
		$this->_import_wp( DIR_TESTDATA . '/export/test-serialized-postmeta-with-cdata.xml', array( 'johncoswell' => 'johncoswell' ) );

		//HTML in the CDATA should work with old WordPress version
		$this->assertEquals( '<pre>some html</pre>', get_post_meta( 10, 'contains-html', true ) );
		//Serialised will only work with 3.0 onwards.
		$expected["special_post_title"] = "A special title";
		$expected["is_calendar"] = "";
		$this->assertEquals( $expected, get_post_meta( 10, 'post-options', true ) );
	}

	/**
	 * @ticket 11574
	 */
	function test_serialized_postmeta_with_evil_stuff_in_cdata() {
		$this->_import_wp( DIR_TESTDATA . '/export/test-serialized-postmeta-with-cdata.xml', array( 'johncoswell' => 'johncoswell' ) );
		// evil content in the CDATA
		$this->assertEquals( '<wp:meta_value>evil</wp:meta_value>', get_post_meta( 10, 'evil', true ) );
	}
}
