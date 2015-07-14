<?php

require_once dirname( __FILE__ ) . '/base.php';

/**
 * @group import
 */
class Tests_Import_Parser extends WP_Import_UnitTestCase {
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

	function test_malformed_wxr() {
		$file = DIR_TESTDATA . '/export/malformed.xml';

		// regex based parser cannot detect malformed XML
		foreach ( array( 'WXR_Parser_SimpleXML', 'WXR_Parser_XML' ) as $p ) {
			$parser = new $p;
			$result = $parser->parse($file);
			$this->assertTrue( is_wp_error( $result ) );
			$this->assertEquals( 'There was an error when reading this WXR file', $result->get_error_message() );
		}
	}

	function test_invalid_wxr() {
		$f1 = DIR_TESTDATA . '/export/missing-version-tag.xml';
		$f2 = DIR_TESTDATA . '/export/invalid-version-tag.xml';

		foreach ( array( 'WXR_Parser_SimpleXML', 'WXR_Parser_XML', 'WXR_Parser_Regex' ) as $p ) {
			foreach ( array( $f1, $f2 ) as $file ) {
				$parser = new $p;
				$result = $parser->parse( $file );
				$this->assertTrue( is_wp_error( $result ) );
				$this->assertEquals( 'This does not appear to be a WXR file, missing/invalid WXR version number', $result->get_error_message() );
			}
		}
	}

	function test_wxr_version_1_1() {
		$file = DIR_TESTDATA . '/export/valid-wxr-1.1.xml';

		foreach ( array( 'WXR_Parser_SimpleXML', 'WXR_Parser_XML', 'WXR_Parser_Regex' ) as $p ) {
			$message = $p . ' failed';
			$parser = new $p;
			$result = $parser->parse( $file );

			$this->assertTrue( is_array( $result ), $message );
			$this->assertEquals( 'http://localhost/', $result['base_url'], $message );
			$this->assertEquals( array(
				'author_id' => 2,
				'author_login' => 'john',
				'author_email' => 'johndoe@example.org',
				'author_display_name' => 'John Doe',
				'author_first_name' => 'John',
				'author_last_name' => 'Doe'
			), $result['authors']['john'], $message );
			$this->assertEquals( array(
				'term_id' => 3,
				'category_nicename' => 'alpha',
				'category_parent' => '',
				'cat_name' => 'alpha',
				'category_description' => 'The alpha category'
			), $result['categories'][0], $message );
			$this->assertEquals( array(
				'term_id' => 22,
				'tag_slug' => 'clippable',
				'tag_name' => 'Clippable',
				'tag_description' => 'The Clippable post_tag'
			), $result['tags'][0], $message );
			$this->assertEquals( array(
				'term_id' => 40,
				'term_taxonomy' => 'post_tax',
				'slug' => 'bieup',
				'term_parent' => '',
				'term_name' => 'bieup',
				'term_description' => 'The bieup post_tax'
			), $result['terms'][0], $message );

			$this->assertEquals( 2, count($result['posts']), $message );
			$this->assertEquals( 19, count($result['posts'][0]), $message );
			$this->assertEquals( 18, count($result['posts'][1]), $message );
			$this->assertEquals( array(
				array( 'name' => 'alpha', 'slug' => 'alpha', 'domain' => 'category' ),
				array( 'name' => 'Clippable', 'slug' => 'clippable', 'domain' => 'post_tag' ),
				array( 'name' => 'bieup', 'slug' => 'bieup', 'domain' => 'post_tax' )
			), $result['posts'][0]['terms'], $message );
			$this->assertEquals( array(
				array( 'key' => '_wp_page_template', 'value' => 'default' )
			), $result['posts'][1]['postmeta'], $message );
		}
	}

	function test_wxr_version_1_0() {
		$file = DIR_TESTDATA . '/export/valid-wxr-1.0.xml';

		foreach ( array( 'WXR_Parser_SimpleXML', 'WXR_Parser_XML', 'WXR_Parser_Regex' ) as $p ) {
			$message = $p . ' failed';
			$parser = new $p;
			$result = $parser->parse( $file );

			$this->assertTrue( is_array( $result ), $message );
			$this->assertEquals( 'http://localhost/', $result['base_url'], $message );
			$this->assertEquals( $result['categories'][0]['category_nicename'], 'alpha', $message );
			$this->assertEquals( $result['categories'][0]['cat_name'], 'alpha', $message );
			$this->assertEquals( $result['categories'][0]['category_parent'], '', $message );
			$this->assertEquals( $result['categories'][0]['category_description'], 'The alpha category', $message );
			$this->assertEquals( $result['tags'][0]['tag_slug'], 'chicken', $message );
			$this->assertEquals( $result['tags'][0]['tag_name'], 'chicken', $message );

			$this->assertEquals( 6, count($result['posts']), $message );
			$this->assertEquals( 19, count($result['posts'][0]), $message );
			$this->assertEquals( 18, count($result['posts'][1]), $message );

			$this->assertEquals( array(
				array( 'name' => 'Uncategorized', 'slug' => 'uncategorized', 'domain' => 'category' )
			), $result['posts'][0]['terms'], $message );
			$this->assertEquals( array(
				array( 'name' => 'alpha', 'slug' => 'alpha', 'domain' => 'category' ),
				array( 'name' => 'news', 'slug' => 'news', 'domain' => 'tag' ),
				array( 'name' => 'roar', 'slug' => 'roar', 'domain' => 'tag' )
			), $result['posts'][2]['terms'], $message );
			$this->assertEquals( array(
				array( 'name' => 'chicken', 'slug' => 'chicken', 'domain' => 'tag' ),
				array( 'name' => 'child', 'slug' => 'child', 'domain' => 'category' ),
				array( 'name' => 'face', 'slug' => 'face', 'domain' => 'tag' )
			), $result['posts'][3]['terms'], $message );

			$this->assertEquals( array(
				array( 'key' => '_wp_page_template', 'value' => 'default' )
			), $result['posts'][1]['postmeta'], $message );
		}
	}

	/**
	 * Test the WXR parser's ability to correctly retrieve content from CDATA
	 * sections that contain escaped closing tags ("]]>" -> "]]]]><![CDATA[>").
	 *
	 * @link https://core.trac.wordpress.org/ticket/15203
	 */
	function test_escaped_cdata_closing_sequence() {
		$file = DIR_TESTDATA . '/export/crazy-cdata-escaped.xml';

		foreach( array( 'WXR_Parser_SimpleXML', 'WXR_Parser_XML', 'WXR_Parser_Regex' ) as $p ) {
			$message = 'Parser ' . $p;
			$parser = new $p;
			$result = $parser->parse( $file );

			$post = $result['posts'][0];
			$this->assertEquals( 'Content with nested <![CDATA[ tags ]]> :)', $post['post_content'], $message );
			foreach ( $post['postmeta'] as $meta ) {
				switch ( $meta['key'] ) {
					case 'Plain string': $value = 'Foo'; break;
					case 'Closing CDATA': $value = ']]>'; break;
					case 'Alot of CDATA': $value = 'This has <![CDATA[ opening and ]]> closing <![CDATA[ tags like this: ]]>'; break;
					default: $this->fail( 'Unknown postmeta (' . $meta['key'] . ') was parsed out by' . $p );
				}
				$this->assertEquals( $value, $meta['value'], $message );
			}
		}
	}

	/**
	 * Ensure that the regex parser can still parse invalid CDATA blocks (i.e. those
	 * with "]]>" unescaped within a CDATA section).
	 */
	function test_unescaped_cdata_closing_sequence() {
		$file = DIR_TESTDATA . '/export/crazy-cdata.xml';

		$parser = new WXR_Parser_Regex;
		$result = $parser->parse( $file );

		$post = $result['posts'][0];
		$this->assertEquals( 'Content with nested <![CDATA[ tags ]]> :)', $post['post_content'] );
		foreach ( $post['postmeta'] as $meta ) {
			switch ( $meta['key'] ) {
				case 'Plain string': $value = 'Foo'; break;
				case 'Closing CDATA': $value = ']]>'; break;
				case 'Alot of CDATA': $value = 'This has <![CDATA[ opening and ]]> closing <![CDATA[ tags like this: ]]>'; break;
				default: $this->fail( 'Unknown postmeta (' . $meta['key'] . ') was parsed out by' . $p );
			}
			$this->assertEquals( $value, $meta['value'] );
		}
	}

	// tags in CDATA #11574
}
