<?php
/**
 * Plugin Name: Gutenberg Test Script Module Translations
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Adds a Tools page with two lines, each one written by a script module:
 *
 * 1. A script module that the page enqueues.
 * 2. A script module that only a classic script imports. The classic script
 *    declares it in its `module_dependencies`.
 *
 * The plugin ships English translation files for both script modules, named
 * after their IDs, so a translated line ends with "(translated)", even on a
 * site in English.
 *
 * @package gutenberg-test-script-module-translations
 */

add_action(
	'admin_menu',
	static function () {
		add_management_page(
			'Script Module Translations',
			'Script Module Translations',
			'manage_options',
			'gutenberg-test-script-module-translations',
			static function () {
				?>
				<div class="wrap">
					<h1>Script Module Translations</h1>
					<p>Enqueued script module: <span id="gutenberg-test-script-module-translations-enqueued"></span></p>
					<p>Script module imported by a classic script: <span id="gutenberg-test-script-module-translations-imported"></span></p>
				</div>
				<?php
			}
		);
	}
);

add_action(
	'admin_enqueue_scripts',
	static function ( $hook_suffix ) {
		if ( 'tools_page_gutenberg-test-script-module-translations' !== $hook_suffix ) {
			return;
		}

		$domain = 'gutenberg-test-script-module-translations';
		$path   = __DIR__ . '/script-module-translations/languages';

		wp_register_script_module(
			'gutenberg-test-script-module-translations-enqueued',
			plugins_url( 'script-module-translations/enqueued.mjs', __FILE__ )
		);
		wp_set_script_module_translations( 'gutenberg-test-script-module-translations-enqueued', $domain, $path );
		wp_enqueue_script_module( 'gutenberg-test-script-module-translations-enqueued' );

		wp_register_script_module(
			'gutenberg-test-script-module-translations-imported',
			plugins_url( 'script-module-translations/imported.mjs', __FILE__ )
		);
		wp_set_script_module_translations( 'gutenberg-test-script-module-translations-imported', $domain, $path );

		wp_enqueue_script(
			'gutenberg-test-script-module-translations-classic',
			plugins_url( 'script-module-translations/classic.js', __FILE__ ),
			array( 'wp-i18n' ),
			false,
			array(
				'in_footer'           => true,
				'module_dependencies' => array( 'gutenberg-test-script-module-translations-imported' ),
			)
		);
	}
);
