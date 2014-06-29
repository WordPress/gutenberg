<?php

/**
 * Test is_https_url().
 *
 * @group functions.php
 * @ticket 28487
 */
class Tests_Functions_IsHttpsUrl extends WP_UnitTestCase {

	function test_is_https_url() {

		$this->assertTrue( is_https_url( 'https://example.com/' ) );
		$this->assertTrue( is_https_url( 'https://localhost/' ) );

		$this->assertFalse( is_https_url( 'http://example.com' ) );
		$this->assertFalse( is_https_url( 'Hello World!' ) );
		$this->assertFalse( is_https_url( 'httpsinvalid' ) );

	}

}
