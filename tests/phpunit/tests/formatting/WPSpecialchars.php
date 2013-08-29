<?php

/**
 * @group formatting
 */
class Tests_Formatting_WPSpecialchars extends WP_UnitTestCase {
	function test_wp_specialchars_basics() {
		$html =  "&amp;&lt;hello world&gt;";
		$this->assertEquals( $html, _wp_specialchars( $html ) );

		$double = "&amp;amp;&amp;lt;hello world&amp;gt;";
		$this->assertEquals( $double, _wp_specialchars( $html, ENT_NOQUOTES, false, true ) );
	}

	function test_allowed_entity_names() {
		global $allowedentitynames;

		// Allowed entities should be unchanged
		foreach ( $allowedentitynames as $ent ) {
			$ent = '&' . $ent . ';';
			$this->assertEquals( $ent, _wp_specialchars( $ent ) );
		}
	}

	function test_not_allowed_entity_names() {
		$ents = array( 'iacut', 'aposs', 'pos', 'apo', 'apo?', 'apo.*', '.*apo.*', 'apos ', ' apos', ' apos ' );

		foreach ( $ents as $ent ) {
			$escaped = '&amp;' . $ent . ';';
			$ent = '&' . $ent . ';';
			$this->assertEquals( $escaped, _wp_specialchars( $ent ) );
		}
	}

	function test_optionally_escapes_quotes() {
		$source = "\"'hello!'\"";
		$this->assertEquals( '"&#039;hello!&#039;"', _wp_specialchars($source, 'single') );
		$this->assertEquals( "&quot;'hello!'&quot;", _wp_specialchars($source, 'double') );
		$this->assertEquals( '&quot;&#039;hello!&#039;&quot;', _wp_specialchars($source, true) );
		$this->assertEquals( $source, _wp_specialchars($source) );
	}
}
