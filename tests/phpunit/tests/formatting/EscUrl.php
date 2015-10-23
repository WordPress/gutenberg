<?php

/**
 * @group formatting
 */
class Tests_Formatting_EscUrl extends WP_UnitTestCase {

	/**
	 * @ticket 23605
	 */
	function test_spaces() {
		$this->assertEquals( 'http://example.com/Mr%20WordPress',    esc_url( 'http://example.com/Mr WordPress' ) );
		$this->assertEquals( 'http://example.com/Mr%20WordPress',    esc_url( 'http://example.com/Mr%20WordPress' ) );
		$this->assertEquals( 'http://example.com/Mr%20%20WordPress', esc_url( 'http://example.com/Mr%20%20WordPress' ) );
		$this->assertEquals( 'http://example.com/Mr+WordPress',      esc_url( 'http://example.com/Mr+WordPress' ) );

		$this->assertEquals( 'http://example.com/?foo=one%20two%20three&#038;bar=four', esc_url( 'http://example.com/?foo=one two three&bar=four' ) );
		$this->assertEquals( 'http://example.com/?foo=one%20two%20three&#038;bar=four', esc_url( 'http://example.com/?foo=one%20two%20three&bar=four' ) );
	}

	function test_bad_characters() {
		$this->assertEquals('http://example.com/watchthelinefeedgo', esc_url('http://example.com/watchthelinefeed%0Ago'));
		$this->assertEquals('http://example.com/watchthelinefeedgo', esc_url('http://example.com/watchthelinefeed%0ago'));
		$this->assertEquals('http://example.com/watchthecarriagereturngo', esc_url('http://example.com/watchthecarriagereturn%0Dgo'));
		$this->assertEquals('http://example.com/watchthecarriagereturngo', esc_url('http://example.com/watchthecarriagereturn%0dgo'));
		//Nesting Checks
		$this->assertEquals('http://example.com/watchthecarriagereturngo', esc_url('http://example.com/watchthecarriagereturn%0%0ddgo'));
		$this->assertEquals('http://example.com/watchthecarriagereturngo', esc_url('http://example.com/watchthecarriagereturn%0%0DDgo'));
		$this->assertEquals('http://example.com/', esc_url('http://example.com/%0%0%0DAD'));
		$this->assertEquals('http://example.com/', esc_url('http://example.com/%0%0%0ADA'));
		$this->assertEquals('http://example.com/', esc_url('http://example.com/%0%0%0DAd'));
		$this->assertEquals('http://example.com/', esc_url('http://example.com/%0%0%0ADa'));
	}

	function test_relative() {
		$this->assertEquals('/example.php', esc_url('/example.php'));
		$this->assertEquals('example.php', esc_url('example.php'));
		$this->assertEquals('#fragment', esc_url('#fragment'));
		$this->assertEquals('?foo=bar', esc_url('?foo=bar'));
	}

	function test_all_url_parts() {
		$url = 'https://user:pass@host.example.com:1234/path;p=1?query=2&r[]=3#fragment';

		$this->assertEquals( array(
			'scheme'   => 'https',
			'host'     => 'host.example.com',
			'port'     => 1234,
			'user'     => 'user',
			'pass'     => 'pass',
			'path'     => '/path;p=1',
			'query'    => 'query=2&r[]=3',
			'fragment' => 'fragment',
		), parse_url( $url ) );
		$this->assertEquals( 'https://user:pass@host.example.com:1234/path;p=1?query=2&r%5B%5D=3#fragment', esc_url_raw( $url ) );
		$this->assertEquals( 'https://user:pass@host.example.com:1234/path;p=1?query=2&#038;r%5B%5D=3#fragment', esc_url( $url ) );
	}

	function test_bare() {
		$this->assertEquals( 'http://example.com?foo', esc_url( 'example.com?foo' ) );
		$this->assertEquals( 'http://example.com', esc_url( 'example.com' ) );
		$this->assertEquals( 'http://localhost', esc_url( 'localhost' ) );
		$this->assertEquals( 'http://example.com/foo', esc_url( 'example.com/foo' ) );
		$this->assertEquals( 'http://баба.org/баба', esc_url( 'баба.org/баба' ) );
	}

	function test_encoding() {
		$this->assertEquals( 'http://example.com?foo=1&bar=2',      esc_url_raw( 'http://example.com?foo=1&bar=2' ) );
		$this->assertEquals( 'http://example.com?foo=1&amp;bar=2',  esc_url_raw( 'http://example.com?foo=1&amp;bar=2' ) );
		$this->assertEquals( 'http://example.com?foo=1&#038;bar=2', esc_url_raw( 'http://example.com?foo=1&#038;bar=2' ) );

		$this->assertEquals( 'http://example.com?foo=1&#038;bar=2', esc_url( 'http://example.com?foo=1&bar=2' ) );
		$this->assertEquals( 'http://example.com?foo=1&#038;bar=2', esc_url( 'http://example.com?foo=1&amp;bar=2' ) );
		$this->assertEquals( 'http://example.com?foo=1&#038;bar=2', esc_url( 'http://example.com?foo=1&#038;bar=2' ) );

		$param = urlencode( 'http://example.com/?one=1&two=2' );
		$this->assertEquals( "http://example.com?url={$param}", esc_url( "http://example.com?url={$param}" ) );
	}

	function test_protocol() {
		$this->assertEquals('http://example.com', esc_url('http://example.com'));
		$this->assertEquals('', esc_url('nasty://example.com/'));
		$this->assertEquals( '', esc_url( 'example.com', array(
			'https',
		) ) );
		$this->assertEquals( '', esc_url( 'http://example.com', array(
			'https',
		) ) );
		$this->assertEquals( 'https://example.com', esc_url( 'https://example.com', array(
			'http', 'https',
		) ) );

		foreach ( wp_allowed_protocols() as $scheme ) {
			$this->assertEquals( "{$scheme}://example.com", esc_url( "{$scheme}://example.com" ), $scheme );
			$this->assertEquals( "{$scheme}://example.com", esc_url( "{$scheme}://example.com", array(
				$scheme,
			) ), $scheme );
		}

		$this->assertTrue( ! in_array( 'data', wp_allowed_protocols(), true ) );
		$this->assertEquals( '', esc_url( 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D' ) );

		$this->assertTrue( ! in_array( 'foo', wp_allowed_protocols(), true ) );
		$this->assertEquals( 'foo://example.com', esc_url( 'foo://example.com', array(
			'foo',
		) ) );

	}

	/**
	 * @ticket 23187
	 */
	function test_protocol_case() {
		$this->assertEquals('http://example.com', esc_url('HTTP://example.com'));
		$this->assertEquals('http://example.com', esc_url('Http://example.com'));
	}

	function test_display_extras() {
		$this->assertEquals('http://example.com/&#039;quoted&#039;', esc_url('http://example.com/\'quoted\''));
		$this->assertEquals('http://example.com/\'quoted\'', esc_url('http://example.com/\'quoted\'',null,'notdisplay'));
	}

	function test_non_ascii() {
		$this->assertEquals( 'http://example.org/баба', esc_url( 'http://example.org/баба' ) );
		$this->assertEquals( 'http://баба.org/баба', esc_url( 'http://баба.org/баба' ) );
		$this->assertEquals( 'http://müller.com/', esc_url( 'http://müller.com/' ) );
	}

	function test_feed() {
		$this->assertEquals( '', esc_url( 'feed:javascript:alert(1)' ) );
		$this->assertEquals( '', esc_url( 'feed:javascript:feed:alert(1)' ) );
		$this->assertEquals( '', esc_url( 'feed:feed:javascript:alert(1)' ) );
		$this->assertEquals( 'feed:feed:alert(1)', esc_url( 'feed:feed:alert(1)' ) );
		$this->assertEquals( 'feed:http://wordpress.org/feed/', esc_url( 'feed:http://wordpress.org/feed/' ) );
	}

	/**
	 * @ticket 16859
	 */
	function test_square_brackets() {
		$this->assertEquals( '/example.php?one%5B%5D=two', esc_url( '/example.php?one[]=two' ) );
		$this->assertEquals( '?foo%5Bbar%5D=baz', esc_url( '?foo[bar]=baz' ) );
		$this->assertEquals( '//example.com/?foo%5Bbar%5D=baz', esc_url( '//example.com/?foo[bar]=baz' ) );
		$this->assertEquals( 'http://example.com/?foo%5Bbar%5D=baz', esc_url( 'example.com/?foo[bar]=baz' ) );
		$this->assertEquals( 'http://localhost?foo%5Bbar%5D=baz', esc_url( 'localhost?foo[bar]=baz' ) );
		$this->assertEquals( 'http://example.com/?foo%5Bbar%5D=baz', esc_url( 'http://example.com/?foo[bar]=baz' ) );
		$this->assertEquals( 'http://example.com/?foo%5Bbar%5D=baz', esc_url( 'http://example.com/?foo%5Bbar%5D=baz' ) );
		$this->assertEquals( 'http://example.com/?baz=bar&#038;foo%5Bbar%5D=baz', esc_url( 'http://example.com/?baz=bar&foo[bar]=baz' ) );
		$this->assertEquals( 'http://example.com/?baz=bar&#038;foo%5Bbar%5D=baz', esc_url( 'http://example.com/?baz=bar&#038;foo%5Bbar%5D=baz' ) );
	}

	/**
	 * Courtesy of http://blog.lunatech.com/2009/02/03/what-every-web-developer-must-know-about-url-encoding
	 */
	function test_reserved_characters() {
		$url = "http://example.com/:@-._~!$&'()*+,=;:@-._~!$&'()*+,=:@-._~!$&'()*+,==?/?:@-._~!$%27()*+,;=/?:@-._~!$%27()*+,;==#/?:@-._~!$&'()*+,;=";
		$this->assertEquals( $url, esc_url_raw( $url ) );
	}

	/**
	 * @ticket 21974
	 */
	function test_protocol_relative_with_colon() {
		$this->assertEquals( '//example.com/foo?foo=abc:def', esc_url( '//example.com/foo?foo=abc:def' ) );
	}

	/**
	 * @ticket 31632
	 */
	function test_mailto_with_newline() {
		$body = <<<EOT
Hi there,

I thought you might want to sign up for this newsletter
EOT;
		$email_link = 'mailto:?body=' . rawurlencode( $body );
		$email_link = esc_url( $email_link );
		$this->assertEquals( 'mailto:?body=Hi%20there%2C%0A%0AI%20thought%20you%20might%20want%20to%20sign%20up%20for%20this%20newsletter', $email_link );
	}

	/**
	 * @ticket 31632
	 */
	function test_mailto_in_http_url_with_newline() {
		$body = <<<EOT
Hi there,

I thought you might want to sign up for this newsletter
EOT;
		$email_link = 'http://example.com/mailto:?body=' . rawurlencode( $body );
		$email_link = esc_url( $email_link );
		$this->assertEquals( 'http://example.com/mailto:?body=Hi%20there%2CI%20thought%20you%20might%20want%20to%20sign%20up%20for%20this%20newsletter', $email_link );
	}

	/**
	 * @ticket 23605
	 */
	function test_mailto_with_spaces() {
		$body = 'Hi there, I thought you might want to sign up for this newsletter';

		$email_link = 'mailto:?body=' . $body;
		$email_link = esc_url( $email_link );
		$this->assertEquals( 'mailto:?body=Hi%20there,%20I%20thought%20you%20might%20want%20to%20sign%20up%20for%20this%20newsletter', $email_link );
	}

	/**
	 * @ticket 28015
	 */
	function test_invalid_charaters() {
		$this->assertEmpty( esc_url_raw('"^<>{}`') );
	}

	/** 
	 * @ticket 34202
	 */
	function test_ipv6_hosts() {
		$this->assertEquals( '//[::127.0.0.1]', esc_url( '//[::127.0.0.1]' ) );
		$this->assertEquals( 'http://[::FFFF::127.0.0.1]', esc_url( 'http://[::FFFF::127.0.0.1]' ) );
		$this->assertEquals( 'http://[::127.0.0.1]', esc_url( 'http://[::127.0.0.1]' ) );
		$this->assertEquals( 'http://[::DEAD:BEEF:DEAD:BEEF:DEAD:BEEF:DEAD:BEEF]', esc_url( 'http://[::DEAD:BEEF:DEAD:BEEF:DEAD:BEEF:DEAD:BEEF]' ) );

		// IPv6 with square brackets in the query? Why not.
		$this->assertEquals( '//[::FFFF::127.0.0.1]/?foo%5Bbar%5D=baz', esc_url( '//[::FFFF::127.0.0.1]/?foo[bar]=baz' ) );
		$this->assertEquals( 'http://[::FFFF::127.0.0.1]/?foo%5Bbar%5D=baz', esc_url( 'http://[::FFFF::127.0.0.1]/?foo[bar]=baz' ) );
	}

}
