<?php

/**
 * @group formatting
 */
class Tests_Formatting_EscUrl extends WP_UnitTestCase {
	function test_spaces() {
		$this->assertEquals('http://example.com/MrWordPress', esc_url('http://example.com/Mr WordPress'));
		$this->assertEquals('http://example.com/Mr%20WordPress', esc_url('http://example.com/Mr%20WordPress'));
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

	function test_protocol() {
		$this->assertEquals('http://example.com', esc_url('http://example.com'));
		$this->assertEquals('', esc_url('nasty://example.com/'));
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

}
