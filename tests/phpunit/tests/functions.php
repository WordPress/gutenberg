<?php

/**
 * @group functions.php
 */
class Tests_Functions extends WP_UnitTestCase {
	function test_wp_parse_args_object() {
		$x = new MockClass;
		$x->_baba = 5;
		$x->yZ = "baba";
		$x->a = array(5, 111, 'x');
		$this->assertEquals(array('_baba' => 5, 'yZ' => 'baba', 'a' => array(5, 111, 'x')), wp_parse_args($x));
		$y = new MockClass;
		$this->assertEquals(array(), wp_parse_args($y));
	}

	function test_wp_parse_args_array()  {
		// arrays
		$a = array();
		$this->assertEquals(array(), wp_parse_args($a));
		$b = array('_baba' => 5, 'yZ' => 'baba', 'a' => array(5, 111, 'x'));
		$this->assertEquals(array('_baba' => 5, 'yZ' => 'baba', 'a' => array(5, 111, 'x')), wp_parse_args($b));
	}

	function test_wp_parse_args_defaults() {
		$x = new MockClass;
		$x->_baba = 5;
		$x->yZ = "baba";
		$x->a = array(5, 111, 'x');
		$d = array('pu' => 'bu');
		$this->assertEquals(array('pu' => 'bu', '_baba' => 5, 'yZ' => 'baba', 'a' => array(5, 111, 'x')), wp_parse_args($x, $d));
		$e = array('_baba' => 6);
		$this->assertEquals(array('_baba' => 5, 'yZ' => 'baba', 'a' => array(5, 111, 'x')), wp_parse_args($x, $e));
	}

	function test_wp_parse_args_other() {
		$b = true;
		wp_parse_str($b, $s);
		$this->assertEquals($s, wp_parse_args($b));
		$q = 'x=5&_baba=dudu&';
		wp_parse_str($q, $ss);
		$this->assertEquals($ss, wp_parse_args($q));
	}

	/**
	 * @ticket 30753
	 */
	function test_wp_parse_args_boolean_strings() {
		$args = wp_parse_args( 'foo=false&bar=true' );
		$this->assertInternalType( 'string', $args['foo'] );
		$this->assertInternalType( 'string', $args['bar'] );
	}

	function test_size_format() {
		$b  = 1;
		$kb = 1024;
		$mb = $kb*1024;
		$gb = $mb*1024;
		$tb = $gb*1024;
		// test if boundaries are correct
		$this->assertEquals('1 GB', size_format($gb, 0));
		$this->assertEquals('1 MB', size_format($mb, 0));
		$this->assertEquals('1 kB', size_format($kb, 0));
		$this->assertEquals('1 B',  size_format($b, 0));
		// now some values around
		// add some bytes to make sure the result isn't 1.4999999
		$this->assertEquals('1.5 TB', size_format($tb + $tb/2 + $mb, 1));
		$this->assertEquals('1,023.999 GB', size_format($tb-$mb-$kb, 3));
		// edge
		$this->assertFalse(size_format(-1));
		$this->assertFalse(size_format(0));
		$this->assertFalse(size_format('baba'));
		$this->assertFalse(size_format(array()));
	}

	function test_path_is_absolute() {
		if ( !is_callable('path_is_absolute') )
			$this->markTestSkipped();

		$absolute_paths = array(
			'/',
			'/foo/',
			'/foo',
			'/FOO/bar',
			'/foo/bar/',
			'/foo/../bar/',
			'\\WINDOWS',
			'C:\\',
			'C:\\WINDOWS',
			'\\\\sambashare\\foo',
			);
		foreach ($absolute_paths as $path)
			$this->assertTrue( path_is_absolute($path), "path_is_absolute('$path') should return true" );
	}

	function test_path_is_not_absolute() {
		if ( !is_callable('path_is_absolute') )
			$this->markTestSkipped();

		$relative_paths = array(
			'',
			'.',
			'..',
			'../foo',
			'../',
			'../foo.bar',
			'foo/bar',
			'foo',
			'FOO',
			'..\\WINDOWS',
			);
		foreach ($relative_paths as $path)
			$this->assertFalse( path_is_absolute($path), "path_is_absolute('$path') should return false" );
	}

	function test_wp_unique_filename() {

		$testdir = DIR_TESTDATA . '/images/';

		// sanity check
		$this->assertEquals( 'abcdefg.png', wp_unique_filename( $testdir, 'abcdefg.png' ), 'Sanitiy check failed' );

		// check number is appended for file already exists
		$this->assertFileExists( $testdir . 'test-image.png', 'Test image does not exist' );
		$this->assertEquals( 'test-image1.png', wp_unique_filename( $testdir, 'test-image.png' ), 'Number not appended correctly' );
		$this->assertFileNotExists( $testdir . 'test-image1.png' );

		// check special chars
		$this->assertEquals( 'testtést-imagé.png', wp_unique_filename( $testdir, 'testtést-imagé.png' ), 'Filename with special chars failed' );

		// check special chars with potential conflicting name
		$this->assertEquals( 'tést-imagé.png', wp_unique_filename( $testdir, 'tést-imagé.png' ), 'Filename with special chars failed' );

		// check with single quotes in name (somehow)
		$this->assertEquals( "abcdefgh.png", wp_unique_filename( $testdir, "abcdefg'h.png" ), 'File with quote failed' );

		// check with single quotes in name (somehow)
		$this->assertEquals( "abcdefgh.png", wp_unique_filename( $testdir, 'abcdefg"h.png' ), 'File with quote failed' );

		// test crazy name (useful for regression tests)
		$this->assertEquals( '12%af34567890@..%^_-qwerty-fghjkl-zx.png', wp_unique_filename( $testdir, '12%af34567890#~!@#$..%^&*()|_+qwerty  fgh`jkl zx<>?:"{}[]="\'/?.png' ), 'Failed crazy file name' );

		// test slashes in names
		$this->assertEquals( 'abcdefg.png', wp_unique_filename( $testdir, 'abcde\fg.png' ), 'Slash not removed' );
		$this->assertEquals( 'abcdefg.png', wp_unique_filename( $testdir, 'abcde\\fg.png' ), 'Double slashed not removed' );
		$this->assertEquals( 'abcdefg.png', wp_unique_filename( $testdir, 'abcde\\\fg.png' ), 'Tripple slashed not removed' );
	}

	function test_is_serialized() {
		$cases = array(
			serialize(null),
			serialize(true),
			serialize(false),
			serialize(-25),
			serialize(25),
			serialize(1.1),
			serialize('this string will be serialized'),
			serialize("a\nb"),
			serialize(array()),
			serialize(array(1,1,2,3,5,8,13)),
			serialize( (object)array('test' => true, '3', 4) )
		);
		foreach ( $cases as $case )
			$this->assertTrue( is_serialized($case), "Serialized data: $case" );

		$not_serialized = array(
			'a string',
			'garbage:a:0:garbage;',
			's:4:test;'
		);
		foreach ( $not_serialized as $case )
			$this->assertFalse( is_serialized($case), "Test data: $case" );
	}

	/**
	 * @ticket 17375
	 */
	function test_no_new_serializable_types() {
		$this->assertFalse( is_serialized( 'C:16:"Serialized_Class":6:{a:0:{}}' ) );
	}

	/**
	 * @group add_query_arg
	 */
	function test_add_query_arg() {
		$old_req_uri = $_SERVER['REQUEST_URI'];

		$urls = array(
			'/',
			'/2012/07/30/',
			'edit.php',
			admin_url( 'edit.php' ),
			admin_url( 'edit.php', 'https' ),
		);

		$frag_urls = array(
			'/#frag',
			'/2012/07/30/#frag',
			'edit.php#frag',
			admin_url( 'edit.php#frag' ),
			admin_url( 'edit.php#frag', 'https' ),
		);

		foreach ( $urls as $url ) {
			$_SERVER['REQUEST_URI'] = 'nothing';

			$this->assertEquals( "$url?foo=1", add_query_arg( 'foo', '1', $url ) );
			$this->assertEquals( "$url?foo=1", add_query_arg( array( 'foo' => '1' ), $url ) );
			$this->assertEquals( "$url?foo=2", add_query_arg( array( 'foo' => '1', 'foo' => '2' ), $url ) );
			$this->assertEquals( "$url?foo=1&bar=2", add_query_arg( array( 'foo' => '1', 'bar' => '2' ), $url ) );

			$_SERVER['REQUEST_URI'] = $url;

			$this->assertEquals( "$url?foo=1", add_query_arg( 'foo', '1' ) );
			$this->assertEquals( "$url?foo=1", add_query_arg( array( 'foo' => '1' ) ) );
			$this->assertEquals( "$url?foo=2", add_query_arg( array( 'foo' => '1', 'foo' => '2' ) ) );
			$this->assertEquals( "$url?foo=1&bar=2", add_query_arg( array( 'foo' => '1', 'bar' => '2' ) ) );
		}

		foreach ( $frag_urls as $frag_url ) {
			$_SERVER['REQUEST_URI'] = 'nothing';
			$url = str_replace( '#frag', '', $frag_url );

			$this->assertEquals( "$url?foo=1#frag", add_query_arg( 'foo', '1', $frag_url ) );
			$this->assertEquals( "$url?foo=1#frag", add_query_arg( array( 'foo' => '1' ), $frag_url ) );
			$this->assertEquals( "$url?foo=2#frag", add_query_arg( array( 'foo' => '1', 'foo' => '2' ), $frag_url ) );
			$this->assertEquals( "$url?foo=1&bar=2#frag", add_query_arg( array( 'foo' => '1', 'bar' => '2' ), $frag_url ) );

			$_SERVER['REQUEST_URI'] = $frag_url;

			$this->assertEquals( "$url?foo=1#frag", add_query_arg( 'foo', '1' ) );
			$this->assertEquals( "$url?foo=1#frag", add_query_arg( array( 'foo' => '1' ) ) );
			$this->assertEquals( "$url?foo=2#frag", add_query_arg( array( 'foo' => '1', 'foo' => '2' ) ) );
			$this->assertEquals( "$url?foo=1&bar=2#frag", add_query_arg( array( 'foo' => '1', 'bar' => '2' ) ) );
		}

		$qs_urls = array(
			'baz=1', // #WP4903
			'/?baz',
			'/2012/07/30/?baz',
			'edit.php?baz',
			admin_url( 'edit.php?baz' ),
			admin_url( 'edit.php?baz', 'https' ),
			admin_url( 'edit.php?baz&za=1' ),
			admin_url( 'edit.php?baz=1&za=1' ),
			admin_url( 'edit.php?baz=0&za=0' ),
		);

		foreach ( $qs_urls as $url ) {
			$_SERVER['REQUEST_URI'] = 'nothing';

			$this->assertEquals( "$url&foo=1", add_query_arg( 'foo', '1', $url ) );
			$this->assertEquals( "$url&foo=1", add_query_arg( array( 'foo' => '1' ), $url ) );
			$this->assertEquals( "$url&foo=2", add_query_arg( array( 'foo' => '1', 'foo' => '2' ), $url ) );
			$this->assertEquals( "$url&foo=1&bar=2", add_query_arg( array( 'foo' => '1', 'bar' => '2' ), $url ) );

			$_SERVER['REQUEST_URI'] = $url;

			$this->assertEquals( "$url&foo=1", add_query_arg( 'foo', '1' ) );
			$this->assertEquals( "$url&foo=1", add_query_arg( array( 'foo' => '1' ) ) );
			$this->assertEquals( "$url&foo=2", add_query_arg( array( 'foo' => '1', 'foo' => '2' ) ) );
			$this->assertEquals( "$url&foo=1&bar=2", add_query_arg( array( 'foo' => '1', 'bar' => '2' ) ) );
		}

		$_SERVER['REQUEST_URI'] = $old_req_uri;
	}

	/**
	 * @ticket 31306
	 */
	function test_add_query_arg_numeric_keys() {
		$url = add_query_arg( array( 'foo' => 'bar' ), '1=1' );
		$this->assertEquals('1=1&foo=bar', $url);

		$url = add_query_arg( array( 'foo' => 'bar', '1' => '2' ), '1=1' );
		$this->assertEquals('1=2&foo=bar', $url);

		$url = add_query_arg( array( '1' => '2' ), 'foo=bar' );
		$this->assertEquals('foo=bar&1=2', $url);
	}

	/**
	 * @ticket 21594
	 */
	function test_get_allowed_mime_types() {
		$mimes = get_allowed_mime_types();

		$this->assertInternalType( 'array', $mimes );
		$this->assertNotEmpty( $mimes );

		add_filter( 'upload_mimes', '__return_empty_array' );
		$mimes = get_allowed_mime_types();
		$this->assertInternalType( 'array', $mimes );
		$this->assertEmpty( $mimes );

		remove_filter( 'upload_mimes', '__return_empty_array' );
		$mimes = get_allowed_mime_types();
		$this->assertInternalType( 'array', $mimes );
		$this->assertNotEmpty( $mimes );
	}

	/**
	 * @ticket 21594
	 */
	function test_wp_get_mime_types() {
		$mimes = wp_get_mime_types();

		$this->assertInternalType( 'array', $mimes );
		$this->assertNotEmpty( $mimes );

		add_filter( 'mime_types', '__return_empty_array' );
		$mimes = wp_get_mime_types();
		$this->assertInternalType( 'array', $mimes );
		$this->assertEmpty( $mimes );

		remove_filter( 'mime_types', '__return_empty_array' );
		$mimes = wp_get_mime_types();
		$this->assertInternalType( 'array', $mimes );
		$this->assertNotEmpty( $mimes );

		// upload_mimes shouldn't affect wp_get_mime_types()
		add_filter( 'upload_mimes', '__return_empty_array' );
		$mimes = wp_get_mime_types();
		$this->assertInternalType( 'array', $mimes );
		$this->assertNotEmpty( $mimes );

		remove_filter( 'upload_mimes', '__return_empty_array' );
		$mimes2 = wp_get_mime_types();
		$this->assertInternalType( 'array', $mimes2 );
		$this->assertNotEmpty( $mimes2 );
		$this->assertEquals( $mimes2, $mimes );
	}

	/**
	 * @ticket 23688
	 */
	function test_canonical_charset() {
		$orig_blog_charset = get_option( 'blog_charset' );

		update_option( 'blog_charset', 'utf8' );
		$this->assertEquals( 'UTF-8', get_option( 'blog_charset') );

		update_option( 'blog_charset', 'utf-8' );
		$this->assertEquals( 'UTF-8', get_option( 'blog_charset') );

		update_option( 'blog_charset', 'UTF8' );
		$this->assertEquals( 'UTF-8', get_option( 'blog_charset') );

		update_option( 'blog_charset', 'UTF-8' );
		$this->assertEquals( 'UTF-8', get_option( 'blog_charset') );

		update_option( 'blog_charset', 'ISO-8859-1' );
		$this->assertEquals( 'ISO-8859-1', get_option( 'blog_charset') );

		update_option( 'blog_charset', 'ISO8859-1' );
		$this->assertEquals( 'ISO-8859-1', get_option( 'blog_charset') );

		update_option( 'blog_charset', 'iso8859-1' );
		$this->assertEquals( 'ISO-8859-1', get_option( 'blog_charset') );

		update_option( 'blog_charset', 'iso-8859-1' );
		$this->assertEquals( 'ISO-8859-1', get_option( 'blog_charset') );

		// Arbitrary strings are passed through.
		update_option( 'blog_charset', 'foobarbaz' );
		$this->assertEquals( 'foobarbaz', get_option( 'blog_charset') );

		update_option( 'blog_charset', $orig_blog_charset );
	}

	/**
	 * @dataProvider data_wp_parse_id_list
	 */
	function test_wp_parse_id_list( $expected, $actual ) {
		$this->assertSame( $expected, array_values( wp_parse_id_list( $actual ) ) );
	}

	function data_wp_parse_id_list() {
		return array(
			array( array( 1, 2, 3, 4 ), '1,2,3,4' ),
			array( array( 1, 2, 3, 4 ), '1, 2,,3,4' ),
			array( array( 1, 2, 3, 4 ), '1,2,2,3,4' ),
			array( array( 1, 2, 3, 4 ), array( '1', '2', '3', '4', '3' ) ),
			array( array( 1, 2, 3, 4 ), array( 1, '2', 3, '4' ) ),
			array( array( 1, 2, 3, 4 ), '-1,2,-3,4' ),
			array( array( 1, 2, 3, 4 ), array( -1, 2, '-3', '4' ) ),
		);
	}

	/**
	 * @ticket 19354
	 */
	function test_data_is_not_an_allowed_protocol() {
		$this->assertNotContains( 'data', wp_allowed_protocols() );
	}

	/**
	 * @ticket 9064
	 */
	function test_wp_extract_urls() {
		$original_urls = array(
			'http://woo.com/1,2,3,4,5,6/-1-2-3-4-/woo.html',
			'http://this.com',
			'http://127.0.0.1',
			'http://www111.urwyeoweytwutreyytqytwetowteuiiu.com/?346236346326&2134362574863.437',
			'http://wordpress-core/1,2,3,4,5,6/-1-2-3-4-/woo.html',
			'http://wordpress-core.com:8080/',
			'http://www.website.com:5000',
			'http://wordpress-core/?346236346326&2134362574863.437',
			'http://افغانستا.icom.museum',
			'http://الجزائر.icom.museum',
			'http://österreich.icom.museum',
			'http://বাংলাদেশ.icom.museum',
			'http://беларусь.icom.museum',
			'http://belgië.icom.museum',
			'http://българия.icom.museum',
			'http://تشادر.icom.museum',
			'http://中国.icom.museum',
			#'http://القمر.icom.museum', // Comoros	http://القمر.icom.museum
			#'http://κυπρος.icom.museum', Cyprus 	http://κυπρος.icom.museum
			'http://českárepublika.icom.museum',
			#'http://مصر.icom.museum', // Egypt	http://مصر.icom.museum
			'http://ελλάδα.icom.museum',
			'http://magyarország.icom.museum',
			'http://ísland.icom.museum',
			'http://भारत.icom.museum',
			'http://ايران.icom.museum',
			'http://éire.icom.museum',
			'http://איקו״ם.ישראל.museum',
			'http://日本.icom.museum',
			'http://الأردن.icom.museum',
			'http://қазақстан.icom.museum',
			'http://한국.icom.museum',
			'http://кыргызстан.icom.museum',
			'http://ລາວ.icom.museum',
			'http://لبنان.icom.museum',
			'http://македонија.icom.museum',
			#'http://موريتانيا.icom.museum', // Mauritania	http://موريتانيا.icom.museum
			'http://méxico.icom.museum',
			'http://монголулс.icom.museum',
			#'http://المغرب.icom.museum', // Morocco	http://المغرب.icom.museum
			'http://नेपाल.icom.museum',
			#'http://عمان.icom.museum', // Oman	http://عمان.icom.museum
			'http://قطر.icom.museum',
			'http://românia.icom.museum',
			'http://россия.иком.museum',
			'http://србијаицрнагора.иком.museum',
			'http://இலங்கை.icom.museum',
			'http://españa.icom.museum',
			'http://ไทย.icom.museum',
			'http://تونس.icom.museum',
			'http://türkiye.icom.museum',
			'http://украина.icom.museum',
			'http://việtnam.icom.museum',
			'ftp://127.0.0.1/',
			'http://www.woo.com/video?v=exvUH2qKLTU',
			'http://taco.com?burrito=enchilada#guac'
		);

		$blob ="
			http://woo.com/1,2,3,4,5,6/-1-2-3-4-/woo.html

			http://this.com

			http://127.0.0.1

			http://www111.urwyeoweytwutreyytqytwetowteuiiu.com/?346236346326&amp;2134362574863.437

			http://wordpress-core/1,2,3,4,5,6/-1-2-3-4-/woo.html

			http://wordpress-core.com:8080/

			http://www.website.com:5000

			http://wordpress-core/?346236346326&amp;2134362574863.437

			http://افغانستا.icom.museum
			http://الجزائر.icom.museum
			http://österreich.icom.museum
			http://বাংলাদেশ.icom.museum
			http://беларусь.icom.museum
			http://belgië.icom.museum
			http://българия.icom.museum
			http://تشادر.icom.museum
			http://中国.icom.museum
			http://českárepublika.icom.museum
			http://ελλάδα.icom.museum
			http://magyarország.icom.museum
			http://ísland.icom.museum
			http://भारत.icom.museum
			http://ايران.icom.museum
			http://éire.icom.museum
			http://איקו״ם.ישראל.museum
			http://日本.icom.museum
			http://الأردن.icom.museum
			http://қазақстан.icom.museum
			http://한국.icom.museum
			http://кыргызстан.icom.museum
			http://ລາວ.icom.museum
			http://لبنان.icom.museum
			http://македонија.icom.museum
			http://méxico.icom.museum
			http://монголулс.icom.museum
			http://नेपाल.icom.museum
			http://قطر.icom.museum
			http://românia.icom.museum
			http://россия.иком.museum
			http://србијаицрнагора.иком.museum
			http://இலங்கை.icom.museum
			http://españa.icom.museum
			http://ไทย.icom.museum
			http://تونس.icom.museum
			http://türkiye.icom.museum
			http://украина.icom.museum
			http://việtnam.icom.museum
			ftp://127.0.0.1/
			http://www.woo.com/video?v=exvUH2qKLTU

			http://taco.com?burrito=enchilada#guac
		";

		$urls = wp_extract_urls( $blob );
		$this->assertNotEmpty( $urls );
		$this->assertInternalType( 'array', $urls );
		$this->assertCount( count( $original_urls ), $urls );
		$this->assertEquals( $original_urls, $urls );

		$exploded = array_values( array_filter( array_map( 'trim', explode( "\n", $blob ) ) ) );
		// wp_extract_urls calls html_entity_decode
		$decoded = array_map( 'html_entity_decode', $exploded );

		$this->assertEquals( $decoded, $urls );
		$this->assertEquals( $original_urls, $decoded );

		$blob ="Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
			incididunt ut labore http://woo.com/1,2,3,4,5,6/-1-2-3-4-/woo.html et dolore magna aliqua.
			Ut http://this.com enim ad minim veniam, quis nostrud exercitation 16.06. to 18.06.2014 ullamco http://127.0.0.1
			laboris nisi ut aliquip ex http://www111.urwyeoweytwutreyytqytwetowteuiiu.com/?346236346326&amp;2134362574863.437 ea
			commodo consequat. http://wordpress-core/1,2,3,4,5,6/-1-2-3-4-/woo.html Duis aute irure dolor in reprehenderit in voluptate
			velit esse http://wordpress-core.com:8080/ cillum dolore eu fugiat nulla <A href=\"http://www.website.com:5000\">http://www.website.com:5000</B> pariatur. Excepteur sint occaecat cupidatat non proident,
			sunt in culpa qui officia deserunt mollit http://wordpress-core/?346236346326&amp;2134362574863.437 anim id est laborum.";

		$urls = wp_extract_urls( $blob );
		$this->assertNotEmpty( $urls );
		$this->assertInternalType( 'array', $urls );
		$this->assertCount( 8, $urls );
		$this->assertEquals( array_slice( $original_urls, 0, 8 ), $urls );

		$blob = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
			incididunt ut labore <a href="http://woo.com/1,2,3,4,5,6/-1-2-3-4-/woo.html">343462^</a> et dolore magna aliqua.
			Ut <a href="http://this.com">&amp;3640i6p1yi499</a> enim ad minim veniam, quis nostrud exercitation 16.06. to 18.06.2014 ullamco <a href="http://127.0.0.1">localhost</a>
			laboris nisi ut aliquip ex <a href="http://www111.urwyeoweytwutreyytqytwetowteuiiu.com/?346236346326&amp;2134362574863.437">343462^</a> ea
			commodo consequat. <a href="http://wordpress-core/1,2,3,4,5,6/-1-2-3-4-/woo.html">343462^</a> Duis aute irure dolor in reprehenderit in voluptate
			velit esse <a href="http://wordpress-core.com:8080/">-3-4--321-64-4@#!$^$!@^@^</a> cillum dolore eu <A href="http://www.website.com:5000">http://www.website.com:5000</B> fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
			sunt in culpa qui officia deserunt mollit <a href="http://wordpress-core/?346236346326&amp;2134362574863.437">)(*&^%$</a> anim id est laborum.';

		$urls = wp_extract_urls( $blob );
		$this->assertNotEmpty( $urls );
		$this->assertInternalType( 'array', $urls );
		$this->assertCount( 8, $urls );
		$this->assertEquals( array_slice( $original_urls, 0, 8 ), $urls );
	}

	/**
	 * @ticket 28786
	 */
	function test_wp_json_encode() {
		$this->assertEquals( wp_json_encode( 'a' ), '"a"' );
	}

	/**
	 * @ticket 28786
	 */
	function test_wp_json_encode_utf8() {
		$this->assertEquals( wp_json_encode( '这' ), '"\u8fd9"' );
	}

	/**
	 * @ticket 28786
	 */
	function test_wp_json_encode_non_utf8() {
		$old_charsets = $charsets = mb_detect_order();
		if ( ! in_array( 'EUC-JP', $charsets ) ) {
			$charsets[] = 'EUC-JP';
			mb_detect_order( $charsets );
		}

		$eucjp = mb_convert_encoding( 'aあb', 'EUC-JP', 'UTF-8' );
		$utf8 = mb_convert_encoding( $eucjp, 'UTF-8', 'EUC-JP' );

		$this->assertEquals( 'aあb', $utf8 );

		$this->assertEquals( '"a\u3042b"', wp_json_encode( $eucjp ) );

		mb_detect_order( $old_charsets );
	}

	/**
	 * @ticket 28786
	 */
	function test_wp_json_encode_non_utf8_in_array() {
		$old_charsets = $charsets = mb_detect_order();
		if ( ! in_array( 'EUC-JP', $charsets ) ) {
			$charsets[] = 'EUC-JP';
			mb_detect_order( $charsets );
		}

		$eucjp = mb_convert_encoding( 'aあb', 'EUC-JP', 'UTF-8' );
		$utf8 = mb_convert_encoding( $eucjp, 'UTF-8', 'EUC-JP' );

		$this->assertEquals( 'aあb', $utf8 );

		$this->assertEquals( '["c","a\u3042b"]', wp_json_encode( array( 'c', $eucjp ) ) );

		mb_detect_order( $old_charsets );
	}

	/**
	 * @ticket 28786
	 */
	function test_wp_json_encode_array() {
		$this->assertEquals( wp_json_encode( array( 'a' ) ), '["a"]' );
	}

	/**
	 * @ticket 28786
	 */
	function test_wp_json_encode_object() {
		$object = new stdClass;
		$object->a = 'b';
		$this->assertEquals( wp_json_encode( $object ), '{"a":"b"}' );
	}

	/**
	 * @ticket 28786
	 */
	function test_wp_json_encode_depth() {
		if ( version_compare( PHP_VERSION, '5.5', '<' ) ) {
			$this->markTestSkipped( 'json_encode() supports the $depth parameter in PHP 5.5+' );
		};

		$data = array( array( array( 1, 2, 3 ) ) );
		$json = wp_json_encode( $data, 0, 1 );
		$this->assertFalse( $json );

		$data = array( 'あ', array( array( 1, 2, 3 ) ) );
		$json = wp_json_encode( $data, 0, 1 );
		$this->assertFalse( $json );
	}
}
