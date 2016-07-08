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

	/**
	 * @ticket 35972
	 */
	function test_bool_from_yn() {
		$this->assertTrue( bool_from_yn( 'Y' ) );
		$this->assertTrue( bool_from_yn( 'y' ) );
		$this->assertFalse( bool_from_yn( 'n' ) );
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

	/**
	 * @ticket 33265
	 * @ticket 35996
	 *
	 * @dataProvider data_wp_normalize_path
	 */
	function test_wp_normalize_path( $path, $expected ) {
		$this->assertEquals( $expected, wp_normalize_path( $path ) );
	}
	function data_wp_normalize_path() {
		return array(
			// Windows paths
			array( 'C:\\www\\path\\', 'C:/www/path/' ),
			array( 'C:\\www\\\\path\\', 'C:/www/path/' ),
			array( 'c:/www/path', 'C:/www/path' ),
			array( 'c:\\www\\path\\', 'C:/www/path/' ), // uppercase drive letter
			array( 'c:\\\\www\\path\\', 'C:/www/path/' ),
			array( '\\\\Domain\\DFSRoots\\share\\path\\', '//Domain/DFSRoots/share/path/' ),
			array( '\\\\Server\\share\\path', '//Server/share/path' ),
			array( '\\\\Server\\share', '//Server/share' ),

			// Linux paths
			array( '/www/path/', '/www/path/' ),
			array( '/www/path/////', '/www/path/' ),
			array( '/www/path', '/www/path' ),
		);
	}

	function test_wp_unique_filename() {

		$testdir = DIR_TESTDATA . '/images/';

		// sanity check
		$this->assertEquals( 'abcdefg.png', wp_unique_filename( $testdir, 'abcdefg.png' ), 'Sanitiy check failed' );

		// check number is appended for file already exists
		$this->assertFileExists( $testdir . 'test-image.png', 'Test image does not exist' );
		$this->assertEquals( 'test-image-1.png', wp_unique_filename( $testdir, 'test-image.png' ), 'Number not appended correctly' );
		$this->assertFileNotExists( $testdir . 'test-image-1.png' );

		// check special chars
		$this->assertEquals( 'testtést-imagé.png', wp_unique_filename( $testdir, 'testtést-imagé.png' ), 'Filename with special chars failed' );

		// check special chars with potential conflicting name
		$this->assertEquals( 'tést-imagé.png', wp_unique_filename( $testdir, 'tést-imagé.png' ), 'Filename with special chars failed' );

		// check with single quotes in name (somehow)
		$this->assertEquals( "abcdefgh.png", wp_unique_filename( $testdir, "abcdefg'h.png" ), 'File with quote failed' );

		// check with single quotes in name (somehow)
		$this->assertEquals( "abcdefgh.png", wp_unique_filename( $testdir, 'abcdefg"h.png' ), 'File with quote failed' );

		// test crazy name (useful for regression tests)
		$this->assertEquals( '12af34567890@..^_qwerty-fghjkl-zx.png', wp_unique_filename( $testdir, '12%af34567890#~!@#$..%^&*()|_+qwerty  fgh`jkl zx<>?:"{}[]="\'/?.png' ), 'Failed crazy file name' );

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
	 * @dataProvider data_is_serialized_string
	 */
	public function test_is_serialized_string( $value, $result ) {
		$this->assertSame( is_serialized_string( $value ), $result );
	}

	public function data_is_serialized_string() {
		return array(
			// Not a string.
			array( 0, false ),

			// Too short when trimmed.
			array( 's:3   ', false ),

			// Too short.
			array( 's:3', false ),

			// No colon in second position.
			array( 's!3:"foo";', false ),

			// No trailing semicolon.
			array( 's:3:"foo"', false ),

			// Wrong type.
			array( 'a:3:"foo";', false ),

			// No closing quote.
			array( 'a:3:"foo;', false ),

			// Wrong number of characters is close enough for is_serialized_string().
			array( 's:12:"foo";', true ),

			// Okay.
			array( 's:3:"foo";', true ),

		);
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
	 * @dataProvider data_device_can_upload
	 */
	function test_device_can_upload( $user_agent, $expected ) {
		$_SERVER['HTTP_USER_AGENT'] = $user_agent;
		$actual = _device_can_upload();
		unset( $_SERVER['HTTP_USER_AGENT'] );
		$this->assertEquals( $expected, $actual );
	}

	function data_device_can_upload() {
		return array(
			// iPhone iOS 5.0.1, Safari 5.1
			array(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Mobile/9A406)',
				false,
			),
			// iPad iOS 3.2, Safari 4.0.4
			array(
				'Mozilla/5.0 (iPad; U; CPU OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B334b Safari/531.21.10',
				false,
			),
			// iPod iOS 4.3.3, Safari 5.0.2
			array(
				'Mozilla/5.0 (iPod; U; CPU iPhone OS 4_3_3 like Mac OS X; ja-jp) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5',
				false,
			),
			// iPhone iOS 6.0.0, Safari 6.0
			array(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25',
				true,
			),
			// iPad iOS 6.0.0, Safari 6.0
			array(
				'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25',
				true,
			),
			// Android 2.2, Android Webkit Browser
			array(
				'Mozilla/5.0 (Android 2.2; Windows; U; Windows NT 6.1; en-US) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4',
				true,
			),
			// BlackBerry 9900, BlackBerry browser
			array(
				'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.1.0.346 Mobile Safari/534.11+',
				true,
			),
			// Windows Phone 8.0, Internet Explorer 10.0;
			array(
				'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)',
				true,
			),
			// Ubuntu desktop, Firefox 41.0
			array(
				'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:41.0) Gecko/20100101 Firefox/41.0',
				true,
			),
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
		if ( ! function_exists( 'mb_detect_order' ) ) {
			$this->markTestSkipped( 'mbstring extension not available.' );
		}

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
		if ( ! function_exists( 'mb_detect_order' ) ) {
			$this->markTestSkipped( 'mbstring extension not available.' );
		}

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

	/**
	 * @ticket 33750
	 */
	function test_the_date() {
		ob_start();
		the_date();
		$actual = ob_get_clean();
		$this->assertEquals( '', $actual );

		$GLOBALS['post']        = self::factory()->post->create_and_get( array(
			'post_date' => '2015-09-16 08:00:00'
		) );

		ob_start();
		$GLOBALS['currentday']  = '18.09.15';
		$GLOBALS['previousday'] = '17.09.15';
		the_date();
		$this->assertEquals( 'September 16, 2015', ob_get_clean() );

		ob_start();
		$GLOBALS['currentday']  = '18.09.15';
		$GLOBALS['previousday'] = '17.09.15';
		the_date( 'Y' );
		$this->assertEquals( '2015', ob_get_clean() );

		ob_start();
		$GLOBALS['currentday']  = '18.09.15';
		$GLOBALS['previousday'] = '17.09.15';
		the_date( 'Y', 'before ', ' after' );
		$this->assertEquals( 'before 2015 after', ob_get_clean() );

		ob_start();
		$GLOBALS['currentday']  = '18.09.15';
		$GLOBALS['previousday'] = '17.09.15';
		the_date( 'Y', 'before ', ' after', false );
		$this->assertEquals( '', ob_get_clean() );
	}

	/**
	 * @ticket 36054
	 * @dataProvider datetime_provider
	 */
	function test_mysql_to_rfc3339( $expected, $actual ) {
		$date_return = mysql_to_rfc3339( $actual );

		$this->assertTrue( is_string( $date_return ), 'The date return must be a string' );
		$this->assertNotEmpty( $date_return, 'The date return could not be an empty string' );
		$this->assertEquals( $expected, $date_return, 'The date does not match' );
		$this->assertEquals( new DateTime( $expected ), new DateTime( $date_return ), 'The date is not the same after the call method' );
	}

	function datetime_provider() {
		return array(
			array( '2016-03-15T18:54:46', '15-03-2016 18:54:46' ),
			array( '2016-03-02T19:13:25', '2016-03-02 19:13:25' ),
			array( '2016-03-02T19:13:00', '2016-03-02 19:13' ),
			array( '2016-03-02T19:13:00', '16-03-02 19:13' ),
			array( '2016-03-02T19:13:00', '16-03-02 19:13' )
		);
	}

	/**
	 * @ticket 35987
	 */
	public function test_wp_get_ext_types() {
		$extensions = wp_get_ext_types();

		$this->assertInternalType( 'array', $extensions );
		$this->assertNotEmpty( $extensions );

		add_filter( 'ext2type', '__return_empty_array' );
		$extensions = wp_get_ext_types();
		$this->assertSame( array(), $extensions );

		remove_filter( 'ext2type', '__return_empty_array' );
		$extensions = wp_get_ext_types();
		$this->assertInternalType( 'array', $extensions );
		$this->assertNotEmpty( $extensions );
	}

	/**
	 * @ticket 35987
	 */
	public function test_wp_ext2type() {
		$extensions = wp_get_ext_types();

		foreach ( $extensions as $type => $extensionList ) {
			foreach ( $extensionList as $extension ) {
				$this->assertEquals( $type, wp_ext2type( $extension ) );
				$this->assertEquals( $type, wp_ext2type( strtoupper( $extension ) ) );
			}
		}

		$this->assertNull( wp_ext2type( 'unknown_format' ) );
	}

	/**
	 * Tests raising the memory limit.
	 *
	 * Unfortunately as the default for 'WP_MAX_MEMORY_LIMIT' in the
	 * test suite is -1, we can not test the memory limit negotiations.
	 *
	 * @ticket 32075
	 */
	function test_wp_raise_memory_limit() {
		ini_set( 'memory_limit', '40M' );
		$this->assertSame( -1, wp_raise_memory_limit() );
		$this->assertEquals( '-1', ini_get( 'memory_limit' ) );
	}
}
