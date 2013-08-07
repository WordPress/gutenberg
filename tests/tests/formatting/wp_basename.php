<?php

/**
 * @group formatting
 */
class Tests_Formatting_WP_Basename extends WP_UnitTestCase {

	function test_wp_basename_unix() {
		$this->assertEquals('file',
			wp_basename('/home/test/file'));
	}

	function test_wp_basename_unix_utf8_support() {
		$this->assertEquals('žluťoučký kůň.txt',
			wp_basename('/test/žluťoučký kůň.txt'));
	}

	/**
	 * @ticket 22138
	 */
	function test_wp_basename_windows() {
		$this->assertEquals('file.txt',
			wp_basename('C:\Documents and Settings\User\file.txt'));
	}

	/**
	 * @ticket 22138
	 */
	function test_wp_basename_windows_utf8_support() {
		$this->assertEquals('щипцы.txt',
			wp_basename('C:\test\щипцы.txt'));
	}

}
