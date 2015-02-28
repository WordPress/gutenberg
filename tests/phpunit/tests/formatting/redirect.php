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
		$this->assertEquals('http://example.com/watchtheutf8convert%F0%9D%8C%86', wp_sanitize_redirect("http://example.com/watchtheutf8convert\xf0\x9d\x8c\x86"));
		//Nesting checks
		$this->assertEquals('http://example.com/watchthecarriagereturngo', wp_sanitize_redirect('http://example.com/watchthecarriagereturn%0%0ddgo'));
		$this->assertEquals('http://example.com/watchthecarriagereturngo', wp_sanitize_redirect('http://example.com/watchthecarriagereturn%0%0DDgo'));
		$this->assertEquals('http://example.com/whyisthisintheurl/?param[1]=foo', wp_sanitize_redirect('http://example.com/whyisthisintheurl/?param[1]=foo'));
		$this->assertEquals('http://[2606:2800:220:6d:26bf:1447:aa7]/', wp_sanitize_redirect('http://[2606:2800:220:6d:26bf:1447:aa7]/'));
		$this->assertEquals('http://example.com/search.php?search=(amistillhere)', wp_sanitize_redirect('http://example.com/search.php?search=(amistillhere)'));
	}
}
