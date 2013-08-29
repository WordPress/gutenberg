<?php

/**
 * @group formatting
 */
class Test_WP_ISO_Descrambler extends WP_UnitTestCase {
	/*
	 * Decodes text in RFC2047 "Q"-encoding, e.g.
	 * =?iso-8859-1?q?this=20is=20some=20text?=
	*/
    function test_decodes_iso_8859_1_rfc2047_q_encoding() {
        $this->assertEquals("this is some text", wp_iso_descrambler("=?iso-8859-1?q?this=20is=20some=20text?="));
    }
}
