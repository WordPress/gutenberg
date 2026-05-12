<?php
/**
 * Plugin Name: Gutenberg Test Early Module Script Bare Import
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Description: Stronger reproduction fixture for
 * https://github.com/WordPress/gutenberg/issues/78041. Emits an inline
 * `<script type="module">` on `admin_print_scripts` priority 10 that
 * introspects the page's import map and dynamically imports the first bare
 * specifier registered in it. The resolution state is written to
 * `window.__importMapResolvedBareSpecifier`. The Firefox e2e regression test
 * polls that global to assert the WP import map remained effective despite
 * the early module load that would otherwise lock the import map in Firefox
 * 150 default config.
 *
 * Introspecting the import map (rather than hard-coding a specifier) keeps
 * the fixture useful on every Gutenberg-enhanced admin page regardless of
 * which subset of `@wordpress/*` modules each page enqueues. `lib/client-assets.php`
 * registers `@wordpress/core-abilities` globally on `admin_enqueue_scripts`,
 * so every page covered by the regression test has at least one bare
 * specifier to import from. If the import map is missing or empty (the bug
 * we are guarding against), the global settles to `false` and the test fails.
 *
 * @package gutenberg-test-early-module-script-bare-import
 */

add_action(
	'admin_print_scripts',
	static function () {
		echo <<<HTML
<script type="module">/* fixture-78041-bare */
window.__importMapResolvedBareSpecifier = null;
( async () => {
	try {
		const mapEl = document.querySelector( 'script[type="importmap"]' );
		if ( ! mapEl || ! mapEl.textContent ) {
			window.__importMapResolvedBareSpecifier = false;
			return;
		}
		const parsed = JSON.parse( mapEl.textContent );
		const imports = parsed && parsed.imports ? parsed.imports : {};
		const specifier = Object.keys( imports )[ 0 ];
		if ( ! specifier ) {
			window.__importMapResolvedBareSpecifier = false;
			return;
		}
		await import( specifier );
		window.__importMapResolvedBareSpecifier = true;
	} catch ( err ) {
		window.__importMapResolvedBareSpecifier = false;
	}
} )();
</script>
HTML;
	},
	10
);
