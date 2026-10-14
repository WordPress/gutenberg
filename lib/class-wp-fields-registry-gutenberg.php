<?php
/**
 * Fields registry of the plugin.
 *
 * @package gutenberg
 */

class WP_Fields_Registry_Gutenberg extends WP_Fields_Registry {

	/**
	 * Returns the shared registry instance.
	 *
	 * This class intentionally does not redeclare the static `$instance`
	 * property, so that it can be shared between `WP_Fields_Registry` and
	 * `WP_Fields_Registry_Gutenberg`.
	 *
	 * In other words, consumers can (and should) continue to call
	 * `WP_Fields_Registry::get_instance()` to access the registry, but they
	 * will receive an instance of `WP_Fields_Registry_Gutenberg`.
	 *
	 * @return WP_Fields_Registry_Gutenberg The registry.
	 */
	public static function get_instance() {
		if ( ! self::$instance instanceof self ) {
			$core_registry = self::$instance;
			$registry      = new self();

			/*
			 * Note that the base registry enforces lazy registration of
			 * fields, such that fields are only registered well after the
			 * 'init' hook has fired.
			 *
			 * This means that, in practice, it's likely impossible that we
			 * find ourselves in a situation where there is data in the
			 * properties of the instance of `WP_Fields_Registry` that needs to
			 * be copied to the instance of `WP_Fields_Registry_Gutenberg`.
			 *
			 * THUS, THE ASSIGNMENTS BELOW REFLECT AN ABUNDANCE OF CAUTION AND
			 * NOT AN ACTUAL NEED.
			 *
			 * @see WP_Fields_Registry::initialize()
			 * @see WP_Fields_Registry::doing_fields_api_init()
			 */
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
