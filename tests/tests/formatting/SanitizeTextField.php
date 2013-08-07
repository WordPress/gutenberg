<?php

/**
 * @group formatting
 */
class Tests_Formatting_SanitizeTextField extends WP_UnitTestCase {
	// #11528
	function test_sanitize_text_field() {
		$inputs = array(
			'оРангутанг', //Ensure UTF8 text is safe the Р is D0 A0 and A0 is the non-breaking space.
			'САПР', //Ensure UTF8 text is safe the Р is D0 A0 and A0 is the non-breaking space.
			'one is < two',
			'tags <span>are</span> <em>not allowed</em> here',
			' we should trim leading and trailing whitespace ',
			'we  also  trim  extra  internal  whitespace',
			'tabs 	get removed too',
			'newlines are not welcome
			here',
			'We also %AB remove %ab octets',
			'We don\'t need to wory about %A
			B removing %a
			b octets even when %a	B they are obscured by whitespace',
			'%AB%BC%DE', //Just octets
			'Invalid octects remain %II',
			'Nested octects %%%ABABAB %A%A%ABBB',
		);
		$expected = array(
			'оРангутанг',
			'САПР',
			'one is &lt; two',
			'tags are not allowed here',
			'we should trim leading and trailing whitespace',
			'we also trim extra internal whitespace',
			'tabs get removed too',
			'newlines are not welcome here',
			'We also remove octets',
			'We don\'t need to wory about %A B removing %a b octets even when %a B they are obscured by whitespace',
			'', //Emtpy as we strip all the octets out
			'Invalid octects remain %II',
			'Nested octects',
		);

		foreach ($inputs as $key => $input) {
			$this->assertEquals($expected[$key], sanitize_text_field($input));
		}
	}
}
