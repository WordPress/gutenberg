<?php

/**
 * @group compat
 * @group security-153
 */
class Tests_Compat extends WP_UnitTestCase {
	function utf8_string_lengths() {
		return array(
			//                     string, character_length, byte_length
			array(                 'баба',                4,           8 ),
			array(                  'баб',                3,           6 ),
			array(          'I am your б',               11,          12 ),
			array(           '1111111111',               10,          10 ),
			array(           '²²²²²²²²²²',               10,          20 ),
			array( '３３３３３３３３３３',               10,          30 ),
			array(           '𝟜𝟜𝟜𝟜𝟜𝟜𝟜𝟜𝟜𝟜',               10,          40 ),
			array(      '1²３𝟜1²３𝟜1²３𝟜',               12,          30 ),
		);
	}

	function utf8_substrings() {
		return array(
			//               string, start, length, character_substring,   byte_substring
			array(           'баба',     0,      3,               'баб',          "б\xD0" ),
			array(           'баба',     0,     -1,               'баб',        "баб\xD0" ),
			array(           'баба',     1,   null,               'аба',        "\xB1аба" ),
			array(           'баба',    -3,   null,               'аба',          "\xB1а" ),
			array(           'баба',    -3,      2,                'аб',       "\xB1\xD0" ),
			array(           'баба',    -1,      2,                 'а',           "\xB0" ),
			array( 'I am your баба',     0,     11,       'I am your б', "I am your \xD0" ),
		);
	}

	/**
	 * @dataProvider utf8_string_lengths
	 */
	function test_mb_strlen( $string, $expected_character_length ) {
		$this->assertEquals( $expected_character_length, _mb_strlen( $string, 'UTF-8' ) );
	}

	/**
	 * @dataProvider utf8_string_lengths
	 */
	function test_mb_strlen_via_regex( $string, $expected_character_length ) {
		_wp_can_use_pcre_u( false );
		$this->assertEquals( $expected_character_length, _mb_strlen( $string, 'UTF-8' ) );
		_wp_can_use_pcre_u( 'reset' );
	}

	/**
	 * @dataProvider utf8_string_lengths
	 */
	function test_8bit_mb_strlen( $string, $expected_character_length, $expected_byte_length ) {
		$this->assertEquals( $expected_byte_length, _mb_strlen( $string, '8bit' ) );
	}

	/**
	 * @dataProvider utf8_substrings
	 */
	function test_mb_substr( $string, $start, $length, $expected_character_substring ) {
		$this->assertEquals( $expected_character_substring, _mb_substr( $string, $start, $length, 'UTF-8' ) );
	}

	/**
	 * @dataProvider utf8_substrings
	 */
	function test_mb_substr_via_regex( $string, $start, $length, $expected_character_substring ) {
		_wp_can_use_pcre_u( false );
		$this->assertEquals( $expected_character_substring, _mb_substr( $string, $start, $length, 'UTF-8' ) );
		_wp_can_use_pcre_u( 'reset' );
	}

	/**
	 * @dataProvider utf8_substrings
	 */
	function test_8bit_mb_substr( $string, $start, $length, $expected_character_substring, $expected_byte_substring ) {
		$this->assertEquals( $expected_byte_substring, _mb_substr( $string, $start, $length, '8bit' ) );
	}

	function test_mb_substr_phpcore(){
		/* https://github.com/php/php-src/blob/php-5.6.8/ext/mbstring/tests/mb_substr_basic.phpt */
		$string_ascii = 'ABCDEF';
		$string_mb = base64_decode('5pel5pys6Kqe44OG44Kt44K544OI44Gn44GZ44CCMDEyMzTvvJXvvJbvvJfvvJjvvJnjgII=');

		$this->assertEquals( 'DEF', _mb_substr($string_ascii, 3) );
		$this->assertEquals( 'DEF', _mb_substr($string_ascii, 3, 5, 'ISO-8859-1') );

		// specific latin-1 as that is the default the core php test opporates under	
		$this->assertEquals( 'peacrOiqng==' , base64_encode( _mb_substr($string_mb, 2, 7, 'latin-1' ) ) );
		$this->assertEquals( '6Kqe44OG44Kt44K544OI44Gn44GZ', base64_encode( _mb_substr($string_mb, 2, 7, 'utf-8') ) );

		/* https://github.com/php/php-src/blob/php-5.6.8/ext/mbstring/tests/mb_substr_variation1.phpt */
		$start = 0;
		$length = 5;
		$unset_var = 10;
		unset ($unset_var);
		$heredoc = <<<EOT
hello world
EOT;
		$inputs = array( 
		/*1*/  0,
			   1,
			   12345,
			   -2345,
			   // float data
		/*5*/  10.5,
			   -10.5,
			   12.3456789000e10,
			   12.3456789000E-10,
			   .5,
			   // null data
		/*10*/ NULL,
			   null,
			   // boolean data
		/*12*/ true,
			   false,
			   TRUE,
			   FALSE,
			   // empty data
		/*16*/ "",
			   '',
			   // string data
		/*18*/ "string",
			   'string',
			   $heredoc,
			   // object data
		/*21*/ new classA(),
			   // undefined data
		/*22*/ @$undefined_var,
			   // unset data
		/*23*/ @$unset_var,
		);
		$outputs = array(
			"0",
			"1",
			"12345",
			"-2345",
			"10.5",
			"-10.5",
			"12345",
			"1.234",
			"0.5",
			"",
			"",
			"1",
			"",
			"1",
			"",
			"",
			"",
			"strin",
			"strin",
			"hello",
			"Class",
			"",
			"",
		);
		$iterator = 0;
		foreach($inputs as $input) {
			$this->assertEquals( $outputs[$iterator] ,  _mb_substr($input, $start, $length) );
			$iterator++;
		}

	}

	function test_hash_hmac_simple() {
		$this->assertEquals('140d1cb79fa12e2a31f32d35ad0a2723', _hash_hmac('md5', 'simple', 'key'));
		$this->assertEquals('993003b95758e0ac2eba451a4c5877eb1bb7b92a', _hash_hmac('sha1', 'simple', 'key'));
	}

	function test_hash_hmac_padding() {
		$this->assertEquals('3c1399103807cf12ec38228614416a8c', _hash_hmac('md5', 'simple', '65 character key 65 character key 65 character key 65 character k'));
		$this->assertEquals('4428826d20003e309d6c2a6515891370daf184ea', _hash_hmac('sha1', 'simple', '65 character key 65 character key 65 character key 65 character k'));
	}

	function test_hash_hmac_output() {
		$this->assertEquals(array( 1 => '140d1cb79fa12e2a31f32d35ad0a2723'), unpack('H32', _hash_hmac('md5', 'simple', 'key', true)));
		$this->assertEquals(array( 1 => '993003b95758e0ac2eba451a4c5877eb1bb7b92a'), unpack('H40', _hash_hmac('sha1', 'simple', 'key', true)));
	}

	function test_json_encode_decode() {
		require_once( ABSPATH . WPINC . '/class-json.php' );
		$json = new Services_JSON();
		// Super basic test to verify Services_JSON is intact and working.
		$this->assertEquals( '["foo"]', $json->encodeUnsafe( array( 'foo' ) ) );
		$this->assertEquals( array( 'foo' ), $json->decode( '["foo"]' ) );
	}
}

/* used in test_mb_substr_phpcore */ 
class classA {
	public function __toString() {
		return "Class A object";
	}
}
