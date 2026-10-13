<?php
/**
 * Test `gutenberg_override_script`.
 *
 * @package gutenberg
 */

class Override_Script_Test extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();

		wp_register_script(
			'gutenberg-dummy-script',
			'https://example.com/original',
			array( 'original-dependency' ),
			'original-version',
			false
		);
	}

	public function tear_down() {
		parent::tear_down();

		wp_deregister_script( 'gutenberg-dummy-script' );
	}

	/**
	 * Tests that attached localized data survives script override.
	 */
	public function test_localizes_script() {
		global $wp_scripts;

		wp_localize_script(
			'gutenberg-dummy-script',
			'dummyData',
			array( 'key' => 'value' )
		);

		gutenberg_override_script(
			$wp_scripts,
			'gutenberg-dummy-script',
			'https://example.com/',
			array( 'dependency' ),
			'version',
			false
		);

		$script = $wp_scripts->query( 'gutenberg-dummy-script', 'registered' );
		$this->assertSame( array( 'dependency' ), $script->deps );
		$this->assertSame(
			'var dummyData = {"key":"value"};',
			$script->extra['data']
		);
	}

	/**
	 * Tests that translations are set when the script depends on wp-i18n.
	 */
	public function test_sets_translations_when_depending_on_wp_i18n() {
		global $wp_scripts;

		gutenberg_override_script(
			$wp_scripts,
			'gutenberg-dummy-script',
			'https://example.com/',
			array( 'wp-i18n' ),
			'version',
			false
		);

		$script = $wp_scripts->query( 'gutenberg-dummy-script', 'registered' );
		$this->assertSame( 'default', $script->textdomain );
	}

	/**
	 * Tests that translations are not set when the script does not depend on wp-i18n.
	 */
	public function test_does_not_set_translations_without_wp_i18n() {
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
		$this->assertNull( $script->textdomain );
		$this->assertSame( array( 'dependency' ), $script->deps );
	}

	/**
	 * Tests that script properties are overridden.
	 */
	public function test_replaces_registered_properties() {
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
		$this->assertSame( 'https://example.com/updated', $script->src );
		$this->assertSame( array( 'updated-dependency' ), $script->deps );
		$this->assertSame( 'updated-version', $script->ver );
		$this->assertSame( 1, $script->args );
	}

	/**
	 * Tests that new script registers normally if no handle by the name.
	 */
	public function test_registers_new_script() {
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
		$this->assertSame( 'https://example.com/', $script->src );
		$this->assertSame( array( 'dependency' ), $script->deps );
		$this->assertSame( 'version', $script->ver );
		$this->assertSame( 1, $script->args );
	}
}
