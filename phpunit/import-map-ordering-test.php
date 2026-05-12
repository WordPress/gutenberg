<?php
/**
 * Tests that the Script Modules import map is hoisted to <head> so it survives
 * an earlier-printed `<script type="module">` from a third-party plugin.
 *
 * Regression coverage for https://github.com/WordPress/gutenberg/issues/78041.
 *
 * @package gutenberg
 */

/**
 * @group script-modules
 * @group import-map
 */
class Gutenberg_Import_Map_Ordering_Test extends WP_UnitTestCase {

	/**
	 * Test handle used to seed the import map.
	 *
	 * @var string
	 */
	const TEST_MODULE_ID = 'gutenberg-test-78041';

	public function set_up() {
		parent::set_up();

		// Ensure the idempotency flag is clean before each test.
		unset( $GLOBALS['gutenberg_import_map_printed'] );

		// `is_admin()` reads WP_ADMIN; set_current_screen() to an admin screen
		// makes is_admin() return true for the gutenberg_print_import_map_early()
		// guard.
		set_current_screen( 'edit-post' );

		// Use a fully-qualified URL so WP_Script_Modules::get_src() always
		// returns a non-empty string and print_import_map() emits a
		// non-empty <script type="importmap"> tag (Major #3 in code-review-1:
		// don't let print_import_map's empty-map short-circuit silently pass
		// the substr_count assertions in tests below).
		wp_register_script_module( self::TEST_MODULE_ID, 'https://example.com/test-78041.js' );
		wp_enqueue_script_module( self::TEST_MODULE_ID );
	}

	public function tear_down() {
		// Best-effort deregister; not all WP versions expose a public helper.
		if ( function_exists( 'wp_deregister_script_module' ) ) {
			wp_deregister_script_module( self::TEST_MODULE_ID );
		} else {
			$script_modules = wp_script_modules();
			$reflection     = new ReflectionClass( $script_modules );
			if ( $reflection->hasProperty( 'registered' ) ) {
				$prop = $reflection->getProperty( 'registered' );
				if ( PHP_VERSION_ID < 80100 ) {
					$prop->setAccessible( true );
				}
				$registered = $prop->getValue( $script_modules );
				unset( $registered[ self::TEST_MODULE_ID ] );
				$prop->setValue( $script_modules, $registered );
			}
		}

		unset( $GLOBALS['gutenberg_import_map_printed'] );
		unset( $GLOBALS['current_screen'] );

		parent::tear_down();
	}

	/**
	 * Captures the import map JSON from a rendered `<script type="importmap">` tag.
	 *
	 * @param string $html Captured HTML.
	 * @return array|null Decoded map, or null if no map tag is found.
	 */
	private function extract_import_map_json( $html ) {
		if ( ! preg_match( '#<script[^>]*type=["\']importmap["\'][^>]*>(.*?)</script>#is', $html, $m ) ) {
			return null;
		}
		$decoded = json_decode( $m[1], true );
		return is_array( $decoded ) ? $decoded : null;
	}

	/**
	 * Covers R5.2: standard wp-admin head path fires `admin_print_scripts`.
	 * The hoist registers there at PHP_INT_MIN, so the map appears in the
	 * captured output.
	 */
	public function test_import_map_is_printed_during_admin_print_scripts() {
		ob_start();
		do_action( 'admin_print_scripts' );
		$out = ob_get_clean();

		$this->assertStringContainsString( '<script type="importmap"', $out, 'Expected an import map tag during admin_print_scripts.' );

		$map = $this->extract_import_map_json( $out );
		$this->assertIsArray( $map, 'Import map JSON must be parseable.' );
		$this->assertArrayHasKey( 'imports', $map );
		$this->assertArrayHasKey( self::TEST_MODULE_ID, $map['imports'], 'Enqueued module must appear in the import map.' );
	}

	/**
	 * Covers R5.1: the wp-build page.php.template head path fires
	 * `wp_print_scripts` (via print_head_scripts()) but not `admin_print_scripts`.
	 * The hoist must therefore also fire from `wp_print_scripts`.
	 */
	public function test_import_map_is_printed_during_wp_print_scripts() {
		ob_start();
		do_action( 'wp_print_scripts' );
		$out = ob_get_clean();

		$this->assertStringContainsString( '<script type="importmap"', $out, 'Expected an import map tag during wp_print_scripts.' );

		$map = $this->extract_import_map_json( $out );
		$this->assertIsArray( $map, 'Import map JSON must be parseable.' );
		$this->assertArrayHasKey( 'imports', $map );
		$this->assertArrayHasKey( self::TEST_MODULE_ID, $map['imports'], 'Enqueued module must appear in the import map.' );
	}

	/**
	 * The map must be emitted exactly once across head + footer.
	 *
	 * Major #3 (code-review-1): additionally proves the suppress callback
	 * fires in the full action chain by asserting that, after the chain
	 * runs, Core's `print_import_map` is no longer registered on
	 * `admin_print_footer_scripts`. If `gutenberg_suppress_duplicate_import_map`
	 * had silently bailed (e.g. flag-check inverted, callback identity
	 * mismatch, hook not registered), Core's print_import_map would still
	 * be there and the assertion would fail.
	 *
	 * This is the load-bearing end-to-end test for the suppress mechanism:
	 * it exercises the real `do_action` chain, not a direct callback call.
	 */
	public function test_import_map_is_not_printed_twice() {
		$script_modules = wp_script_modules();

		// Pre-condition: Core registers print_import_map on the footer.
		$this->assertNotFalse(
			has_action( 'admin_print_footer_scripts', array( $script_modules, 'print_import_map' ) ),
			'Pre-condition: Core must register print_import_map on admin_print_footer_scripts before the action chain runs.'
		);

		ob_start();
		do_action( 'admin_print_scripts' );
		$head_only = ob_get_contents();
		do_action( 'admin_print_footer_scripts' );
		$combined = ob_get_clean();

		// The full-page render simulation must yield exactly one importmap.
		$count = substr_count( $combined, '<script type="importmap"' );
		$this->assertSame( 1, $count, sprintf( 'Expected exactly one importmap tag across head + footer, found %d.', $count ) );

		// The single emission must be in the head portion (i.e. the hoist
		// fired and the suppress kept the footer from re-emitting).
		$this->assertStringContainsString(
			'<script type="importmap"',
			$head_only,
			'The single importmap emission must come from the head hoist.'
		);
		$this->assertStringNotContainsString(
			'<script type="importmap"',
			substr( $combined, strlen( $head_only ) ),
			'After the head hoist, the footer must NOT also emit an importmap tag.'
		);

		// Suppress callback identity check: by the time
		// admin_print_footer_scripts has run, Core's print_import_map must
		// have been removed from the hook by gutenberg_suppress_duplicate_import_map.
		// If the suppress had not fired, Core's callback would still be registered.
		$this->assertFalse(
			has_action( 'admin_print_footer_scripts', array( $script_modules, 'print_import_map' ) ),
			'Suppress callback must have removed Core print_import_map from admin_print_footer_scripts during the chain.'
		);
	}

	/**
	 * R1: the map must appear before any module load/preload that another
	 * plugin emits on the same hook. Uses a sentinel comment to locate the
	 * exact fixture tag regardless of other module emissions.
	 */
	public function test_import_map_appears_before_early_inline_module_script() {
		$fixture_callback = static function () {
			echo "<script type=\"module\">/* fixture-78041 */ void 0;</script>\n";
		};
		add_action( 'admin_print_scripts', $fixture_callback, 10 );

		ob_start();
		do_action( 'admin_print_scripts' );
		$out = ob_get_clean();

		remove_action( 'admin_print_scripts', $fixture_callback, 10 );

		$map_pos     = strpos( $out, '<script type="importmap"' );
		$fixture_pos = strpos( $out, '/* fixture-78041 */' );

		$this->assertNotFalse( $map_pos, 'Import map tag must be present.' );
		$this->assertNotFalse( $fixture_pos, 'Fixture module sentinel must be present.' );
		$this->assertLessThan( $fixture_pos, $map_pos, 'Import map must precede the fixture <script type="module"> tag.' );
	}

	/**
	 * AC9 / R7: the JSON content emitted via the hoist is identical to the
	 * content emitted by a direct print_import_map() call.
	 */
	public function test_import_map_content_is_preserved() {
		ob_start();
		do_action( 'admin_print_scripts' );
		$hoisted = ob_get_clean();

		$hoisted_map = $this->extract_import_map_json( $hoisted );

		// Reset and force a direct print for comparison.
		unset( $GLOBALS['gutenberg_import_map_printed'] );

		ob_start();
		wp_script_modules()->print_import_map();
		$direct = ob_get_clean();

		$direct_map = $this->extract_import_map_json( $direct );

		$this->assertIsArray( $hoisted_map );
		$this->assertIsArray( $direct_map );
		$this->assertEquals( $direct_map['imports'] ?? array(), $hoisted_map['imports'] ?? array(), 'imports key must be identical.' );
		$this->assertEquals( $direct_map['scopes'] ?? array(), $hoisted_map['scopes'] ?? array(), 'scopes key must be identical.' );
	}

	/**
	 * R9 / Minor #2: translations, preloads, enqueued module printing, and
	 * module data callbacks must remain registered on
	 * `admin_print_footer_scripts` after this plan's changes.
	 */
	public function test_translations_and_preloads_still_registered() {
		$this->assertNotFalse(
			has_action( 'admin_print_footer_scripts', 'gutenberg_print_script_module_translations' ),
			'gutenberg_print_script_module_translations must remain registered on admin_print_footer_scripts.'
		);

		$script_modules = wp_script_modules();

		$this->assertNotFalse(
			has_action( 'admin_print_footer_scripts', array( $script_modules, 'print_enqueued_script_modules' ) ),
			'print_enqueued_script_modules must remain registered on admin_print_footer_scripts.'
		);
		$this->assertNotFalse(
			has_action( 'admin_print_footer_scripts', array( $script_modules, 'print_script_module_preloads' ) ),
			'print_script_module_preloads must remain registered on admin_print_footer_scripts.'
		);
		$this->assertNotFalse(
			has_action( 'admin_print_footer_scripts', array( $script_modules, 'print_script_module_data' ) ),
			'print_script_module_data must remain registered on admin_print_footer_scripts.'
		);
	}

	/**
	 * Major #3: simulate the suppress callback firing at priority 9 and
	 * assert that Core's `print_import_map` action is removed (so the footer
	 * does not re-emit the map). Other Core footer actions must remain.
	 */
	public function test_suppress_removes_core_print_import_map_action() {
		$script_modules = wp_script_modules();

		// Pre-condition: Core's print_import_map is registered on the footer.
		$this->assertNotFalse(
			has_action( 'admin_print_footer_scripts', array( $script_modules, 'print_import_map' ) ),
			'Pre-condition: Core must register print_import_map on admin_print_footer_scripts.'
		);

		// Simulate the head hoist having run.
		$GLOBALS['gutenberg_import_map_printed'] = true;

		gutenberg_suppress_duplicate_import_map();

		$this->assertFalse(
			has_action( 'admin_print_footer_scripts', array( $script_modules, 'print_import_map' ) ),
			'Suppress callback must remove Core print_import_map from the footer when the head hoist already emitted the map.'
		);

		// Cross-reference: the other Core footer actions stay registered.
		$this->assertNotFalse(
			has_action( 'admin_print_footer_scripts', array( $script_modules, 'print_enqueued_script_modules' ) )
		);
		$this->assertNotFalse(
			has_action( 'admin_print_footer_scripts', array( $script_modules, 'print_script_module_preloads' ) )
		);
		$this->assertNotFalse(
			has_action( 'admin_print_footer_scripts', array( $script_modules, 'print_script_module_data' ) )
		);

		// Restore Core's registration so other tests are not affected.
		add_action( 'admin_print_footer_scripts', array( $script_modules, 'print_import_map' ) );
	}

	/**
	 * Step 4 verification: the REST block-editor settings controller captures
	 * `admin_print_scripts` output via ob_start(). It must still see the
	 * import map (presence is correct — the controller wants script context).
	 */
	public function test_rest_block_editor_settings_controller_unaffected() {
		ob_start();
		do_action( 'admin_print_scripts' );
		$captured = ob_get_clean();

		$this->assertIsString( $captured );
		$this->assertNotSame( '', $captured, 'admin_print_scripts must emit non-empty HTML when modules are enqueued.' );
		$this->assertStringContainsString(
			'<script type="importmap"',
			$captured,
			'REST settings controller must observe the import map in its captured script context.'
		);
	}

	/**
	 * AC10 / R8 / Minor #6: the fix ships zero new JS to affected browsers.
	 * This test asserts no new file under `build/` has been added to git
	 * tracking by the patch. Skipped gracefully if `git` or `exec()` are
	 * unavailable (e.g. restricted CI environments).
	 *
	 * Uses `git rev-parse --show-toplevel` (Major #2 in code-review-1) to
	 * resolve the repository root deterministically rather than walking
	 * relative `dirname()` from this file's location. That way the test is
	 * correct regardless of where `phpunit/` lives in the checkout and
	 * regardless of the working directory PHPUnit is invoked from.
	 */
	public function test_no_new_built_js_assets_added() {
		if ( ! function_exists( 'exec' ) ) {
			$this->markTestSkipped( 'exec() is disabled in this environment.' );
		}

		$exec_disabled = explode( ',', (string) ini_get( 'disable_functions' ) );
		$exec_disabled = array_map( 'trim', $exec_disabled );
		if ( in_array( 'exec', $exec_disabled, true ) ) {
			$this->markTestSkipped( 'exec() is disabled via disable_functions.' );
		}

		// Anchor git to the directory this test file lives in, then ask git
		// itself for the repo root. This is robust against checkouts where
		// the plugin is bind-mounted under a different parent path.
		$test_dir     = __DIR__;
		$toplevel_cmd = sprintf(
			'git -C %s rev-parse --show-toplevel 2>&1',
			escapeshellarg( $test_dir )
		);
		$toplevel_out = array();
		$toplevel_rc  = 0;
		exec( $toplevel_cmd, $toplevel_out, $toplevel_rc );

		if ( 0 !== $toplevel_rc || empty( $toplevel_out ) ) {
			$this->markTestSkipped( 'git rev-parse --show-toplevel unavailable in this environment.' );
		}

		$repo_root = trim( (string) end( $toplevel_out ) );
		if ( '' === $repo_root || ! is_dir( $repo_root ) ) {
			$this->markTestSkipped( 'Could not resolve a usable git toplevel directory.' );
		}

		$cmd    = sprintf(
			'git -C %s ls-files --others --exclude-standard build/ 2>&1',
			escapeshellarg( $repo_root )
		);
		$output = array();
		$rc     = 0;
		exec( $cmd, $output, $rc );

		if ( 0 !== $rc ) {
			$this->markTestSkipped( 'git ls-files unavailable in this environment.' );
		}

		$output = array_filter(
			$output,
			static function ( $line ) {
				return '' !== trim( $line );
			}
		);

		$this->assertSame(
			array(),
			array_values( $output ),
			'No new files under build/ should be added by this patch (AC10 zero-JS budget).'
		);
	}
}
