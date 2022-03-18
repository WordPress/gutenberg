<?php
/**
 * Test `gutenberg_override_script`.
 *
 * @package Gutenberg
 */

class Override_Script_Test extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();

		wp_register_script(
			'gutenberg-dummy-script',
			'https://example.com/original',
			array( 'original-dependency' ),
			'original-version',
			false
		);
	}

	function tearDown() {
		parent::tearDown();

		wp_deregister_script( 'gutenberg-dummy-script' );
	}

	/**
	 * Tests that script is localized.
	 */
	function test_localizes_script() {
		global $wp_scripts;

		gutenberg_override_script(
			$wp_scripts,
			'gutenberg-dummy-script',
			'https://example.com/',
			array( 'dependency' ),
			'version',
			false
		);

		$script = $wp_scripts->query( 'gutenberg-dummy-script', 'registered' );
		$this->assertEquals( array( 'dependency', 'wp-i18n' ), $script->deps );
	}

	/**
	 * Tests that script properties are overridden.
	 */
	function test_replaces_registered_properties() {
		global $wp_scripts;

		gutenberg_override_script(
			$wp_scripts,
			'gutenberg-dummy-script',
			'https://example.com/updated',
			array( 'updated-dependency' ),
			'updated-version',
			true
		);

		$script = $wp_scripts->query( 'gutenberg-dummy-script', 'registered' );
		$this->assertEquals( 'https://example.com/updated', $script->src );
		$this->assertEquals( array( 'updated-dependency', 'wp-i18n' ), $script->deps );
		$this->assertEquals( 'updated-version', $script->ver );
		$this->assertSame( 1, $script->args );
	}

	/**
	 * Tests that new script registers normally if no handle by the name.
	 */
	function test_registers_new_script() {
		global $wp_scripts;

		gutenberg_override_script(
			$wp_scripts,
			'gutenberg-second-dummy-script',
			'https://example.com/',
			array( 'dependency' ),
			'version',
			true
		);

		$script = $wp_scripts->query( 'gutenberg-second-dummy-script', 'registered' );
		$this->assertEquals( 'https://example.com/', $script->src );
		$this->assertEquals( array( 'dependency', 'wp-i18n' ), $script->deps );
		$this->assertEquals( 'version', $script->ver );
		$this->assertSame( 1, $script->args );
	}
}
