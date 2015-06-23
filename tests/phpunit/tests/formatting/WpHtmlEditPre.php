<?php

/**
 * @group formatting
 * @expectedDeprecated wp_htmledit_pre
 */
class Tests_Formatting_WpHtmlEditPre extends WP_UnitTestCase {

	function _charset_iso_8859_1() {
		return 'iso-8859-1';
	}

	/*
	 * Only fails in PHP 5.4 onwards
	 * @ticket 23688
	 */
	function test_wp_htmledit_pre_charset_iso_8859_1() {
		add_filter( 'pre_option_blog_charset', array( $this, '_charset_iso_8859_1' ) );
		$iso8859_1 = 'Fran' .chr(135) .'ais';
		$this->assertEquals( $iso8859_1, wp_htmledit_pre( $iso8859_1 ) );
		remove_filter( 'pre_option_blog_charset', array( $this, '_charset_iso_8859_1' ) );
	}

	function _charset_utf_8() {
		return 'UTF-8';
	}

	/*
	 * @ticket 23688
	 */
	function test_wp_htmledit_pre_charset_utf_8() {
		add_filter( 'pre_option_blog_charset', array( $this, '_charset_utf_8' ) );
		$utf8 = 'Fran' .chr(195) . chr(167) .'ais';
		$this->assertEquals( $utf8, wp_htmledit_pre( $utf8 ) );
		remove_filter( 'pre_option_blog_charset', array( $this, '_charset_utf_8' ) );
	}
}
