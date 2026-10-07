<?php
/**
 * Fields registry of the plugin.
 *
 * @package gutenberg
 */

/**
 * The fields registry the plugin puts in place of the core one.
 *
 * Replacing the singleton on `init` makes every reader of the core registry,
 * `WP_Fields_Registry::get_instance()` and the functions wrapping it, read
 * the plugin one, so the plugin can change the registry ahead of core by
 * overriding its methods here.
 */
class WP_Fields_Registry_Gutenberg extends WP_Fields_Registry {

	/**
	 * Returns the shared registry instance, replacing the core one.
	 *
	 * The base `$instance` slot is not redefined, so
	 * `WP_Fields_Registry::get_instance()` and this method share one
	 * instance. A core registry in place hands over what it holds: its
	 * fields, their script modules, and whether `wp_fields_api_init` has
	 * fired, so the action does not fire again for the new instance. The
	 * state is copied rather than registered again, since register() only
	 * runs on the action.
	 *
	 * @return WP_Fields_Registry_Gutenberg The registry.
	 */
	public static function get_instance() {
		if ( ! self::$instance instanceof self ) {
			$core_registry = self::$instance;
			$registry      = new self();

			if ( null !== $core_registry ) {
				$registry->fields        = $core_registry->fields;
				$registry->field_modules = $core_registry->field_modules;
				$registry->initialized   = $core_registry->initialized;
			}

			self::$instance = $registry;
		}

		return self::$instance;
	}
}

/**
 * Replaces the core fields registry with the plugin one, so that all code
 * using `WP_Fields_Registry::get_instance()` receives it.
 */
function gutenberg_override_wp_fields_registry() {
	WP_Fields_Registry_Gutenberg::get_instance();
}
add_action( 'init', 'gutenberg_override_wp_fields_registry', 1 );
