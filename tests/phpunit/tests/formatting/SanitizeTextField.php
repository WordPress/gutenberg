<?php

/**
 * @group formatting
 */
class Tests_Formatting_SanitizeTextField extends WP_UnitTestCase {
	function data_sanitize_text_field() {
		return array(
			array(
				'оРангутанг', //Ensure UTF8 text is safe the Р is D0 A0 and A0 is the non-breaking space.
				'оРангутанг',
			),
			array(
				'САПР', //Ensure UTF8 text is safe the Р is D0 A0 and A0 is the non-breaking space.
				'САПР',
			),
			array(
				'one is < two',
				'one is &lt; two',
			),
			array(
				"one is <\n two",
				array(
					'oneline' => 'one is &lt; two',
					'multiline' => "one is &lt;\n two",
				),
			),
			array(
				"foo <div\n> bar",
				array(
					'oneline' => 'foo bar',
					'multiline' => "foo  bar",
				),
			),
			array(
				"foo <\ndiv\n> bar",
				array(
					'oneline' => 'foo &lt; div > bar',
					'multiline' => "foo &lt;\ndiv\n> bar",
				),
			),
			array(
				'tags <span>are</span> <em>not allowed</em> here',
				'tags are not allowed here',
			),
			array(
				' we should trim leading and trailing whitespace ',
				'we should trim leading and trailing whitespace',
			),
			array(
				'we  trim  extra  internal  whitespace  only  in  single  line  texts',
				array(
					'oneline' => 'we trim extra internal whitespace only in single line texts',
					'multiline' => 'we  trim  extra  internal  whitespace  only  in  single  line  texts',
				),
			),
			array(
				"tabs \tget removed in single line texts",
				array(
					'oneline' => 'tabs get removed in single line texts',
					'multiline' => "tabs \tget removed in single line texts",
				),
			),
			array(
				"newlines are allowed only\n in multiline texts",
				array(
					'oneline' => 'newlines are allowed only in multiline texts',
					'multiline' => "newlines are allowed only\n in multiline texts",
				),
			),
			array(
				'We also %AB remove %ab octets',
				'We also remove octets',
			),
			array(
				'We don\'t need to wory about %A
				B removing %a
				b octets even when %a	B they are obscured by whitespace',
				array (
					'oneline' => 'We don\'t need to wory about %A B removing %a b octets even when %a B they are obscured by whitespace',
					'multiline' => "We don't need to wory about %A\n				B removing %a\n				b octets even when %a	B they are obscured by whitespace",
				),
			),
			array(
				'%AB%BC%DE', //Just octets
				'', //Emtpy as we strip all the octets out
			),
			array(
				'Invalid octects remain %II',
				'Invalid octects remain %II',
			),
			array(
				'Nested octects %%%ABABAB %A%A%ABBB',
				'Nested octects',
			),
		);
	}

	/**
	 * @ticket 32257
	 * @dataProvider data_sanitize_text_field
	 */
	function test_sanitize_text_field( $string, $expected ) {
		if ( is_array( $expected ) ) {
			$expected_oneline = $expected['oneline'];
			$expected_multiline = $expected['multiline'];
		} else {
			$expected_oneline = $expected_multiline = $expected;
		}
		$this->assertEquals( $expected_oneline, sanitize_text_field( $string ) );
		$this->assertEquals( $expected_multiline, sanitize_textarea_field( $string ) );

	}
}
