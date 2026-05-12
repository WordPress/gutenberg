<?php
/**
 * Plugin Name: Gutenberg Test Early Module Script Bare Import
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Description: Stronger reproduction fixture for
 * https://github.com/WordPress/gutenberg/issues/78041. Emits an inline
 * `<script type="module">` on `admin_print_scripts` priority 10 that issues a
 * dynamic `import('@wordpress/boot')` call and writes the resolution state to
 * `window.__importMapResolvedBareSpecifier`. The Firefox e2e regression test
 * polls that global to assert the WP import map remained effective despite
 * the early module load that would otherwise lock the import map in Firefox
 * 150 default config.
 *
 * @package gutenberg-test-early-module-script-bare-import
 */

add_action(
	'admin_print_scripts',
	static function () {
		echo <<<HTML
<script type="module">/* fixture-78041-bare */
window.__importMapResolvedBareSpecifier = null;
import( '@wordpress/boot' ).then(
	function () { window.__importMapResolvedBareSpecifier = true; },
	function () { window.__importMapResolvedBareSpecifier = false; }
);
</script>

HTML;
	},
	10
);
