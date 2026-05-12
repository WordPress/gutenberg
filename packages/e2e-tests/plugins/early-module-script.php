<?php
/**
 * Plugin Name: Gutenberg Test Early Module Script
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Description: Emits an inline `<script type="module">` on
 * `admin_print_scripts` at the default priority (10) to simulate the failure
 * mode reported in https://github.com/WordPress/gutenberg/issues/78041 — i.e.
 * a third-party plugin (e.g. PWA via wp_print_service_workers()) emitting an
 * early module script in <head> that, in Firefox 150 default config, locks
 * the import map so the later WP map is silently rejected.
 *
 * The sentinel comment `/* fixture-78041 *\/` lets PHPUnit position
 * assertions locate this exact tag without false matches.
 *
 * @package gutenberg-test-early-module-script
 */

add_action(
	'admin_print_scripts',
	static function () {
		echo "<script type=\"module\">/* fixture-78041 */ void 0;</script>\n";
	},
	10
);
