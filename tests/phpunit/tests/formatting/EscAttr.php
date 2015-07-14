<?php

/**
 * @group formatting
 */
class Tests_Formatting_EscAttr extends WP_UnitTestCase {
	function test_esc_attr_quotes() {
		$attr = '"double quotes"';
		$this->assertEquals( '&quot;double quotes&quot;', esc_attr( $attr ) );

		$attr = "'single quotes'";
		$this->assertEquals( '&#039;single quotes&#039;', esc_attr( $attr ) );

		$attr = "'mixed' " . '"quotes"';
		$this->assertEquals( '&#039;mixed&#039; &quot;quotes&quot;', esc_attr( $attr ) );

		// Handles double encoding?
		$attr = '"double quotes"';
		$this->assertEquals( '&quot;double quotes&quot;', esc_attr( esc_attr( $attr ) ) );

		$attr = "'single quotes'";
		$this->assertEquals( '&#039;single quotes&#039;', esc_attr( esc_attr( $attr ) ) );

		$attr = "'mixed' " . '"quotes"';
		$this->assertEquals( '&#039;mixed&#039; &quot;quotes&quot;', esc_attr( esc_attr( $attr ) ) );
	}

	function test_esc_attr_amp() {
		$out = esc_attr( 'foo & bar &baz; &nbsp;' );
		$this->assertEquals( "foo &amp; bar &amp;baz; &nbsp;", $out );
	}
}
