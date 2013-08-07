<?php

/**
 * @group formatting
 */
class Tests_Formatting_ConvertChars extends WP_UnitTestCase {
	function test_replaces_windows1252_entities_with_unicode_ones() {
		$input = "&#130;&#131;&#132;&#133;&#134;&#135;&#136;&#137;&#138;&#139;&#140;&#145;&#146;&#147;&#148;&#149;&#150;&#151;&#152;&#153;&#154;&#155;&#156;&#159;";
		$output = "&#8218;&#402;&#8222;&#8230;&#8224;&#8225;&#710;&#8240;&#352;&#8249;&#338;&#8216;&#8217;&#8220;&#8221;&#8226;&#8211;&#8212;&#732;&#8482;&#353;&#8250;&#339;&#376;";
		$this->assertEquals($output, convert_chars($input));
	}

	/**
	 * @ticket 20503
	 */
	function test_replaces_latin_letter_z_with_caron() {
		$input = "&#142;&#158;";
		$output = "&#381;&#382;";
		$this->assertEquals( $output, convert_chars( $input ) );
	}

	function test_converts_html_br_and_hr_to_the_xhtml_self_closing_variety() {
		$inputs = array(
			"abc <br> lol <br />" => "abc <br /> lol <br />",
			"<br> ho ho <hr>"     => "<br /> ho ho <hr />",
			"<hr><br>"            => "<hr /><br />"
			);
		foreach ($inputs as $input => $expected) {
			$this->assertEquals($expected, convert_chars($input));
		}
	}

	function test_escapes_lone_ampersands() {
		$this->assertEquals("at&#038;t", convert_chars("at&t"));
	}

	function test_removes_category_and_title_metadata_tags() {
		$this->assertEquals("", convert_chars("<title><div class='lol'>abc</div></title><category>a</category>"));
	}
}
