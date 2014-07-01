<?php

/**
 * @group pluggable
 * @group formatting
 */
class Tests_Formatting_Redirect extends WP_UnitTestCase {
	function test_wp_sanitize_redirect() {
		$this->assertEquals('http://example.com/watchthelinefeedgo', wp_sanitize_redirect('http://example.com/watchthelinefeed%0Ago'));
		$this->assertEquals('http://example.com/watchthelinefeedgo', wp_sanitize_redirect('http://example.com/watchthelinefeed%0ago'));
		$this->assertEquals('http://example.com/watchthecarriagereturngo', wp_sanitize_redirect('http://example.com/watchthecarriagereturn%0Dgo'));
		$this->assertEquals('http://example.com/watchthecarriagereturngo', wp_sanitize_redirect('http://example.com/watchthecarriagereturn%0dgo'));
		$this->assertEquals('http://example.com/watchtheallowedcharacters-~+_.?#=&;,/:%!*stay', wp_sanitize_redirect('http://example.com/watchtheallowedcharacters-~+_.?#=&;,/:%!*stay'));
		//Nesting checks
		$this->assertEquals('http://example.com/watchthecarriagereturngo', wp_sanitize_redirect('http://example.com/watchthecarriagereturn%0%0ddgo'));
		$this->assertEquals('http://example.com/watchthecarriagereturngo', wp_sanitize_redirect('http://example.com/watchthecarriagereturn%0%0DDgo'));
	}
}
