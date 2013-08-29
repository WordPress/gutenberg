<?php

/**
 * @group compat
 */
class Tests_Compat extends WP_UnitTestCase {
	function test_mb_substr() {
		$this->assertEquals('баб', _mb_substr('баба', 0, 3));
		$this->assertEquals('баб', _mb_substr('баба', 0, -1));
		$this->assertEquals('баб', _mb_substr('баба', 0, -1));
		$this->assertEquals('I am your б', _mb_substr('I am your баба', 0, 11));
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
