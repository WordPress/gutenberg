<?php
/**
 * Some simple test cases for KSES post content filtering
 *
 * @group formatting
 * @group kses
 */
class Tests_Kses extends WP_UnitTestCase {

	/**
	 * @ticket 20210
	 */
	function test_wp_filter_post_kses_address() {
		global $allowedposttags;

		$attributes = array(
			'class' => 'classname',
			'id' => 'id',
			'style' => 'color: red;',
			'style' => 'color: red',
			'style' => 'color: red; text-align:center',
			'style' => 'color: red; text-align:center;',
			'title' => 'title',
		);

		foreach ( $attributes as $name => $value ) {
			$string = "<address $name='$value'>1 WordPress Avenue, The Internet.</address>";
			$expect_string = "<address $name='" . str_replace( '; ', ';', trim( $value, ';' ) ) . "'>1 WordPress Avenue, The Internet.</address>";
			$this->assertEquals( $expect_string, wp_kses( $string, $allowedposttags ) );
		}
	}

	/**
	 * @ticket 20210
	 */
	function test_wp_filter_post_kses_a() {
		global $allowedposttags;

		$attributes = array(
			'class' => 'classname',
			'id' => 'id',
			'style' => 'color: red;',
			'title' => 'title',
			'href' => 'http://example.com',
			'rel' => 'related',
			'rev' => 'revision',
			'name' => 'name',
			'target' => '_blank',
		);

		foreach ( $attributes as $name => $value ) {
			$string = "<a $name='$value'>I link this</a>";
			$expect_string = "<a $name='" . trim( $value, ';' ) . "'>I link this</a>";
			$this->assertEquals( $expect_string, wp_kses( $string, $allowedposttags ) );
		}
	}

	/**
	 * @ticket 20210
	 */
	function test_wp_filter_post_kses_abbr() {
		global $allowedposttags;

		$attributes = array(
			'class' => 'classname',
			'id' => 'id',
			'style' => 'color: red;',
			'title' => 'title',
		);

		foreach ( $attributes as $name => $value ) {
			$string = "<abbr $name='$value'>WP</abbr>";
			$expect_string = "<abbr $name='" . trim( $value, ';' ) . "'>WP</abbr>";
			$this->assertEquals( $expect_string, wp_kses( $string, $allowedposttags ) );
		}
	}

	function test_feed_links() {
		global $allowedposttags;

		$content = <<<EOF
<a href="feed:javascript:alert(1)">CLICK ME</a>
<a href="feed:javascript:feed:alert(1)">CLICK ME</a>
<a href="feed:feed:javascript:alert(1)">CLICK ME</a>
<a href="javascript:feed:alert(1)">CLICK ME</a>
<a href="javascript:feed:javascript:alert(1)">CLICK ME</a>
<a href="feed:feed:feed:javascript:alert(1)">CLICK ME</a>
<a href="feed:feed:feed:feed:javascript:alert(1)">CLICK ME</a>
<a href="feed:feed:feed:feed:feed:javascript:alert(1)">CLICK ME</a>
<a href="feed:javascript:feed:javascript:feed:javascript:alert(1)">CLICK ME</a>
<a href="feed:javascript:feed:javascript:feed:javascript:feed:javascript:feed:javascript:alert(1)">CLICK ME</a>
<a href="feed:feed:feed:http:alert(1)">CLICK ME</a>
EOF;

		$expected = <<<EOF
<a href="feed:alert(1)">CLICK ME</a>
<a href="feed:feed:alert(1)">CLICK ME</a>
<a href="feed:feed:alert(1)">CLICK ME</a>
<a href="feed:alert(1)">CLICK ME</a>
<a href="feed:alert(1)">CLICK ME</a>
<a href="">CLICK ME</a>
<a href="">CLICK ME</a>
<a href="">CLICK ME</a>
<a href="">CLICK ME</a>
<a href="">CLICK ME</a>
<a href="">CLICK ME</a>
EOF;

		$this->assertEquals( $expected, wp_kses( $content, $allowedposttags ) );
	}

	function test_wp_kses_bad_protocol() {
		$bad = array(
			'dummy:alert(1)',
			'javascript:alert(1)',
			'JaVaScRiPt:alert(1)',
			'javascript:alert(1);',
			'javascript&#58;alert(1);',
			'javascript&#0058;alert(1);',
			'javascript&#0000058alert(1);',
			'javascript&#x3A;alert(1);',
			'javascript&#X3A;alert(1);',
			'javascript&#X3a;alert(1);',
			'javascript&#x3a;alert(1);',
			'javascript&#x003a;alert(1);',
			'&#x6A&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A&#x61&#x6C&#x65&#x72&#x74&#x28&#x27&#x58&#x53&#x53&#x27&#x29',
			'jav	ascript:alert(1);',
			'jav&#x09;ascript:alert(1);',
			'jav&#x0A;ascript:alert(1);',
			'jav&#x0D;ascript:alert(1);',
			' &#14;  javascript:alert(1);',
			'javascript:javascript:alert(1);',
			'javascript&#58;javascript:alert(1);',
			'javascript&#0000058javascript:alert(1);',
			'javascript:javascript&#58;alert(1);',
			'javascript:javascript&#0000058alert(1);',
			'javascript&#0000058alert(1)//?:',
			'feed:javascript:alert(1)',
			'feed:javascript:feed:javascript:feed:javascript:alert(1)',
		);
		foreach ( $bad as $k => $x ) {
			$result = wp_kses_bad_protocol( wp_kses_normalize_entities( $x ), wp_allowed_protocols() );
			if ( ! empty( $result ) && $result != 'alert(1);' && $result != 'alert(1)' ) {
				switch ( $k ) {
					case 6: $this->assertEquals( 'javascript&amp;#0000058alert(1);', $result ); break;
					case 12:
						$this->assertEquals( str_replace( '&', '&amp;', $x ), $result );
						break;
					case 22: $this->assertEquals( 'javascript&amp;#0000058alert(1);', $result ); break;
					case 23: $this->assertEquals( 'javascript&amp;#0000058alert(1)//?:', $result ); break;
					case 24: $this->assertEquals( 'feed:alert(1)', $result ); break;
					default: $this->fail( "wp_kses_bad_protocol failed on $x. Result: $result" );
				}
			}
		}

		$safe = array(
			'dummy:alert(1)',
			'HTTP://example.org/',
			'http://example.org/',
			'http&#58;//example.org/',
			'http&#x3A;//example.org/',
			'https://example.org',
			'http://example.org/wp-admin/post.php?post=2&amp;action=edit',
			'http://example.org/index.php?test=&#039;blah&#039;',
		);
		foreach ( $safe as $x ) {
			$result = wp_kses_bad_protocol( wp_kses_normalize_entities( $x ), array( 'http', 'https', 'dummy' ) );
			if ( $result != $x && $result != 'http://example.org/' )
				$this->fail( "wp_kses_bad_protocol incorrectly blocked $x" );
		}
	}

	public function test_hackers_attacks() {
		$xss = simplexml_load_file( DIR_TESTDATA . '/formatting/xssAttacks.xml' );
		foreach ( $xss->attack as $attack ) {
			if ( in_array( $attack->name, array( 'IMG Embedded commands 2', 'US-ASCII encoding', 'OBJECT w/Flash 2', 'Character Encoding Example' ) ) )
				continue;

			$code = (string) $attack->code;

			if ( $code == 'See Below' )
				continue;

			if ( substr( $code, 0, 4 ) == 'perl' ) {
				$pos = strpos( $code, '"' ) + 1;
				$code = substr( $code, $pos, strrpos($code, '"') - $pos );
				$code = str_replace( '\0', "\0", $code );
			}

			$result = trim( wp_kses_data( $code ) );

			if ( $result == '' || $result == 'XSS' || $result == 'alert("XSS");' || $result == "alert('XSS');" )
				continue;

			switch ( $attack->name ) {
				case 'XSS Locator':
					$this->assertEquals('\';alert(String.fromCharCode(88,83,83))//\\\';alert(String.fromCharCode(88,83,83))//";alert(String.fromCharCode(88,83,83))//\\";alert(String.fromCharCode(88,83,83))//--&gt;"&gt;\'&gt;alert(String.fromCharCode(88,83,83))=', $result);
					break;
				case 'XSS Quick Test':
					$this->assertEquals('\'\';!--"=', $result);
					break;
				case 'SCRIPT w/Alert()':
					$this->assertEquals( "alert('XSS')", $result );
					break;
				case 'SCRIPT w/Char Code':
					$this->assertEquals('alert(String.fromCharCode(88,83,83))', $result);
					break;
				case 'IMG STYLE w/expression':
					$this->assertEquals('exp/*', $result);
					break;
				case 'List-style-image':
					$this->assertEquals('li {list-style-image: url("javascript:alert(\'XSS\')");}XSS', $result);
					break;
				case 'STYLE':
					$this->assertEquals( "alert('XSS');", $result);
					break;
				case 'STYLE w/background-image':
					$this->assertEquals('.XSS{background-image:url("javascript:alert(\'XSS\')");}<A></A>', $result);
					break;
				case 'STYLE w/background':
					$this->assertEquals('BODY{background:url("javascript:alert(\'XSS\')")}', $result);
					break;
				case 'Remote Stylesheet 2':
					$this->assertEquals( "@import'http://ha.ckers.org/xss.css';", $result );
					break;
				case 'Remote Stylesheet 3':
					$this->assertEquals( '&lt;META HTTP-EQUIV=&quot;Link&quot; Content=&quot;; REL=stylesheet"&gt;', $result );
					break;
				case 'Remote Stylesheet 4':
					$this->assertEquals('BODY{-moz-binding:url("http://ha.ckers.org/xssmoz.xml#xss")}', $result);
					break;
				case 'XML data island w/CDATA':
					$this->assertEquals( "&lt;![CDATA[]]&gt;", $result );
					break;
				case 'XML data island w/comment':
					$this->assertEquals( "<I><B>&lt;IMG SRC=&quot;javas<!-- -->cript:alert('XSS')\"&gt;</B></I>", $result );
					break;
				case 'XML HTML+TIME':
					$this->assertEquals( '&lt;t:set attributeName=&quot;innerHTML&quot; to=&quot;XSSalert(\'XSS\')"&gt;', $result );
					break;
				case 'Commented-out Block':
					$this->assertEquals( "<!--[if gte IE 4]&gt;-->\nalert('XSS');", $result );
					break;
				case 'Cookie Manipulation':
					$this->assertEquals( '&lt;META HTTP-EQUIV=&quot;Set-Cookie&quot; Content=&quot;USERID=alert(\'XSS\')"&gt;', $result );
					break;
				case 'SSI':
					$this->assertEquals( '&lt;!--#exec cmd=&quot;/bin/echo &#039;<!--#exec cmd="/bin/echo \'=http://ha.ckers.org/xss.js&gt;\'"-->', $result );
					break;
				case 'PHP':
					$this->assertEquals( '&lt;? echo(&#039;alert("XSS")\'); ?&gt;', $result );
					break;
				case 'UTF-7 Encoding':
					$this->assertEquals( '+ADw-SCRIPT+AD4-alert(\'XSS\');+ADw-/SCRIPT+AD4-', $result );
					break;
				case 'Escaping JavaScript escapes':
					$this->assertEquals('\";alert(\'XSS\');//', $result);
					break;
				case 'STYLE w/broken up JavaScript':
					$this->assertEquals( '@im\port\'\ja\vasc\ript:alert("XSS")\';', $result );
					break;
				case 'Null Chars 2':
					$this->assertEquals( '&amp;alert("XSS")', $result );
					break;
				case 'No Closing Script Tag':
					$this->assertEquals( '&lt;SCRIPT SRC=http://ha.ckers.org/xss.js', $result );
					break;
				case 'Half-Open HTML/JavaScript':
					$this->assertEquals( '&lt;IMG SRC=&quot;javascript:alert(&#039;XSS&#039;)&quot;', $result );
					break;
				case 'Double open angle brackets':
					$this->assertEquals( '&lt;IFRAME SRC=http://ha.ckers.org/scriptlet.html &lt;', $result );
					break;
				case 'Extraneous Open Brackets':
					$this->assertEquals( '&lt;alert("XSS");//&lt;', $result );
					break;
				case 'Malformed IMG Tags':
					$this->assertEquals('alert("XSS")"&gt;', $result);
					break;
				case 'No Quotes/Semicolons':
					$this->assertEquals( "a=/XSS/\nalert(a.source)", $result );
					break;
				case 'Evade Regex Filter 1':
					$this->assertEquals( '" SRC="http://ha.ckers.org/xss.js"&gt;', $result );
					break;
				case 'Evade Regex Filter 4':
					$this->assertEquals( '\'" SRC="http://ha.ckers.org/xss.js"&gt;', $result );
					break;
				case 'Evade Regex Filter 5':
					$this->assertEquals( '` SRC="http://ha.ckers.org/xss.js"&gt;', $result );
					break;
				case 'Filter Evasion 1':
					$this->assertEquals( 'document.write("&lt;SCRI&quot;);PT SRC="http://ha.ckers.org/xss.js"&gt;', $result );
					break;
				case 'Filter Evasion 2':
					$this->assertEquals( '\'&gt;" SRC="http://ha.ckers.org/xss.js"&gt;', $result );
					break;
				default:
					$this->fail( 'KSES failed on ' . $attack->name . ': ' . $result );
			}
		}
	}

	function _wp_kses_allowed_html_filter( $html, $context ) {
		if ( 'post' == $context )
			return array( 'a' => array( 'href' => true ) );
		else
			return array( 'a' => array( 'href' => false ) );
	}

	/**
	 * @ticket 20210
	 */
	public function test_wp_kses_allowed_html() {
		global $allowedposttags, $allowedtags, $allowedentitynames;

		$this->assertEquals( $allowedposttags, wp_kses_allowed_html( 'post' ) );

		$tags = wp_kses_allowed_html( 'post' ) ;

		foreach ( $tags as $tag ) {
			$this->assertTrue( $tag['class'] );
			$this->assertTrue( $tag['id'] );
			$this->assertTrue( $tag['style'] );
			$this->assertTrue( $tag['title'] );
		}

		$this->assertEquals( $allowedtags, wp_kses_allowed_html( 'data' ) );
		$this->assertEquals( $allowedtags, wp_kses_allowed_html( '' ) );
		$this->assertEquals( $allowedtags, wp_kses_allowed_html() );

		$tags = wp_kses_allowed_html( 'user_description' );
		$this->assertTrue( $tags['a']['rel'] );

		$tags = wp_kses_allowed_html();
		$this->assertFalse( isset( $tags['a']['rel'] ) );

		$this->assertEquals( array(), wp_kses_allowed_html( 'strip' ) );

		$custom_tags = array(
			'a' => array(
				'href' => true,
				'rel' => true,
				'rev' => true,
				'name' => true,
				'target' => true,
			),
		);

		$this->assertEquals( $custom_tags, wp_kses_allowed_html( $custom_tags ) );

		add_filter( 'wp_kses_allowed_html', array( $this, '_wp_kses_allowed_html_filter' ), 10, 2 );

		$this->assertEquals( array( 'a' => array( 'href' => true ) ), wp_kses_allowed_html( 'post' ) );
		$this->assertEquals( array( 'a' => array( 'href' => false ) ), wp_kses_allowed_html( 'data' ) );

		remove_filter( 'wp_kses_allowed_html', array( $this, '_wp_kses_allowed_html_filter' ) );
		$this->assertEquals( $allowedposttags, wp_kses_allowed_html( 'post' ) );
		$this->assertEquals( $allowedtags, wp_kses_allowed_html( 'data' ) );
	}

	/**
	 * @ticket 26290
	 */
	public function test_wp_kses_normalize_entities() {
		$this->assertEquals( '&spades;', wp_kses_normalize_entities( '&spades;' ) );

		$this->assertEquals( '&sup1;', wp_kses_normalize_entities( '&sup1;' ) );
		$this->assertEquals( '&sup2;', wp_kses_normalize_entities( '&sup2;' ) );
		$this->assertEquals( '&sup3;', wp_kses_normalize_entities( '&sup3;' ) );
		$this->assertEquals( '&frac14;', wp_kses_normalize_entities( '&frac14;' ) );
		$this->assertEquals( '&frac12;', wp_kses_normalize_entities( '&frac12;' ) );
		$this->assertEquals( '&frac34;', wp_kses_normalize_entities( '&frac34;' ) );
		$this->assertEquals( '&there4;', wp_kses_normalize_entities( '&there4;' ) );
	}
	
	/**
	 * Test removal of invalid binary data for HTML.
	 *
	 * @ticket 28506
	 * @dataProvider data_ctrl_removal
	 */
	function test_ctrl_removal( $input, $output ) {
		global $allowedposttags;

		return $this->assertEquals( $output, wp_kses( $input, $allowedposttags ) );
	}

	function data_ctrl_removal() {
		return array(
			array(
				"\x00\x01\x02\x03\x04\x05\x06\x07\x08\x0B\x0C\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\X1C\x1D\x1E\x1F",
				'',
			),
			array(
				"\x00h\x01e\x02l\x03l\x04o\x05 \x06w\x07o\x08r\x0Bl\x0Cd\x0E.\x0F \x10W\x11O\x12R\x13D\x14P\x15R\x16E\x17S\x18S\x19 \x1AK\x1BS\X1CE\x1DS\x1E.\x1F/",
				'hello world. WORDPRESS KSES./',
			),
			array(
				"\x1F\x1E\x1D\x1C\x1B\x1A\x19\x18\x17\x16\x15\x14\x13\x12\x11\x10\x0F\x0E\x0C\x0B\x08\x07\x06\x05\x04\X03\x02\x01\x00",
				'',
			),
			array(
				"\x1Fh\x1Ee\x1Dl\x1Cl\x1Bo\x1A \x19w\x18o\x17r\x16l\x15d\x14.\x13 \x12W\x11O\x10R\x0FD\x0EP\x0CR\x0BE\x08S\x07S\x06 \x05K\x04S\X03E\x02S\x01.\x00/",
				'hello world. WORDPRESS KSES./',
			),
			array(
				"\t\r\n word \n\r\t",
				"\t\r\n word \n\r\t",
			),
		);
	}
	
	/**
	 * Test removal of '\0' strings.
	 *
	 * @ticket 28699
	 * @dataProvider data_slash_zero_removal
	 */
	function test_slash_zero_removal( $input, $output ) {
		global $allowedposttags;

		return $this->assertEquals( $output, wp_kses( $input, $allowedposttags ) );
	}
	
	function data_slash_zero_removal() {
		return array(
			array(
				'This \\0 should be no big deal.',
				'This \\0 should be no big deal.',
			),
			array(
				'<div>This \\0 should be no big deal.</div>',
				'<div>This \\0 should be no big deal.</div>',
			),
			array(
				'<div align="\\0left">This should be no big deal.</div>',
				'<div align="\\0left">This should be no big deal.</div>',
			),
			array(
				'This <div style="float:\\0left"> is more of a concern.',
				'This <div style="float:left"> is more of a concern.',
			),
			array(
				'This <div style="float:\\0\\0left"> is more of a concern.',
				'This <div style="float:left"> is more of a concern.',
			),
			array(
				'This <div style="float:\\\\00left"> is more of a concern.',
				'This <div style="float:left"> is more of a concern.',
			),
			array(
				'This <div style="float:\\\\\\\\0000left"> is more of a concern.',
				'This <div style="float:left"> is more of a concern.',
			),
			array(
				'This <div style="float:\\0000left"> is more of a concern.',
				'This <div style="float:left"> is more of a concern.',
			),
			array(
				'<style type="text/css">div {background-image:\\0}</style>',
				'div {background-image:\\0}',
			),
		);
	}

	/**
	 * Test new function wp_kses_hair_parse().
	 *
	 * @dataProvider data_hair_parse
	 */
	function test_hair_parse( $input, $output ) {
		return $this->assertEquals( $output, wp_kses_hair_parse( $input ) );
	}

	function data_hair_parse() {
		return array(
			array(
				'title="hello" href="#" id="my_id" ',
				array( 'title="hello" ', 'href="#" ', 'id="my_id" ' ),
			),
			array(
				'[shortcode attr="value"] href="http://www.google.com/"title="moo"disabled',
				array( '[shortcode attr="value"] ', 'href="http://www.google.com/"', 'title="moo"', 'disabled' ),
			),
			array(
				'',
				array(),
			),
			array(
				'a',
				array( 'a' ),
			),
			array(
				'title="hello"disabled href=# id=\'my_id\'',
				array( 'title="hello"', 'disabled ', 'href=# ', "id='my_id'" ),
			),
			array(
				'     ', // Calling function is expected to strip leading whitespace.
				false,
			),
			array(
				'abcd=abcd"abcd"',
				false,
			),
			array(
				"array[1]='z'z'z'z",
				false,
			),
		);
	}

	/**
	 * Test new function wp_kses_attr_parse().
	 *
	 * @dataProvider data_attr_parse
	 */
	function test_attr_parse( $input, $output ) {
		return $this->assertEquals( $output, wp_kses_attr_parse( $input ) );
	}

	function data_attr_parse() {
		return array(
			array(
				'<a title="hello" href="#" id="my_id" >',
				array( '<a ', 'title="hello" ', 'href="#" ', 'id="my_id" ', '>' ),
			),
			array(
				'<a [shortcode attr="value"] href="http://www.google.com/"title="moo"disabled>',
				array( '<a ', '[shortcode attr="value"] ', 'href="http://www.google.com/"', 'title="moo"', 'disabled', '>' ),
			),
			array(
				'',
				false,
			),
			array(
				'a',
				false,
			),
			array(
				'<a>',
				array( '<a', '>' ),
			),
			array(
				'<a%%&&**>',
				false,
			),
			array(
				'<a title="hello"disabled href=# id=\'my_id\'>',
				array( '<a ', 'title="hello"', 'disabled ', 'href=# ', "id='my_id'", ">" ),
			),
			array(
				'<a     >',
				array( '<a     ', '>' ),
			),
			array(
				'<a abcd=abcd"abcd">',
				false,
			),
			array(
				"<a array[1]='z'z'z'z>",
				false,
			),
			array(
				'<img title="hello" src="#" id="my_id" />',
				array( '<img ', 'title="hello" ', 'src="#" ', 'id="my_id"', ' />' ),
			),
		);
	}

	/**
	 * Test new function wp_kses_one_attr().
	 *
	 * @dataProvider data_one_attr
	 */
	function test_one_attr( $element, $input, $output ) {
		return $this->assertEquals( $output, wp_kses_one_attr( $input, $element ) );
	}

	function data_one_attr() {
		return array(
			array(
				'a',
				' title="hello" ',
				' title="hello" ',
			),
			array(
				'a',
				'title  =  "hello"',
				'title="hello"',
			),
			array(
				'a',
				"title='hello'",
				"title='hello'",
			),
			array(
				'a',
				'title=hello',
				'title="hello"',
			),
			array(
				'a',
				'href="javascript:alert(1)"',
				'href="alert(1)"',
			),
			array(
				'a',
				'style ="style "',
				'style="style"',
			),
			array(
				'a',
				'style="style "',
				'style="style"',
			),
			array(
				'a',
				'style ="style ="',
				'',
			),
			array(
				'img',
				'src="mypic.jpg"',
				'src="mypic.jpg"',
			),
			array(
				'img',
				'onerror=alert(1)',
				'',
			),
			array(
				'img',
				'title=>',
				'title="&gt;"',
			),
			array(
				'img',
				'title="&garbage";"',
				'title="&amp;garbage&quot;;"',
			),
		);
	}
}
