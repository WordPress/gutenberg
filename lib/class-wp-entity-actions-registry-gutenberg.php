<?php
/**
 * Actions registry of the plugin.
 *
 * @package gutenberg
 */

class WP_Entity_Actions_Registry_Gutenberg extends WP_Entity_Actions_Registry {

	/**
	 * Returns the shared registry instance.
	 *
	 * This class intentionally does not redeclare the static `$instance`
	 * property, so that it can be shared between `WP_Entity_Actions_Registry` and
	 * `WP_Entity_Actions_Registry_Gutenberg`.
	 *
	 * In other words, consumers can (and should) continue to call
	 * `WP_Entity_Actions_Registry::get_instance()` to access the registry, but they
	 * will receive an instance of `WP_Entity_Actions_Registry_Gutenberg`.
	 *
	 * @return WP_Entity_Actions_Registry_Gutenberg The registry.
	 */
	public static function get_instance() {
		if ( ! self::$instance instanceof self ) {
			$core_registry = self::$instance;
			$registry      = new self();

			/*
			 * Note that the base registry enforces lazy registration of
			 * actions, such that actions are only registered well after the
			 * 'init' hook has fired.
			 *
			 * This means that, in practice, it's likely impossible that we
			 * find ourselves in a situation where there is data in the
			 * properties of the instance of `WP_Entity_Actions_Registry` that needs
			 * to be copied to the instance of `WP_Entity_Actions_Registry_Gutenberg`.
			 *
			 * THUS, THE ASSIGNMENTS BELOW REFLECT AN ABUNDANCE OF CAUTION AND
			 * NOT AN ACTUAL NEED.
			 *
			 * @see WP_Entity_Actions_Registry::initialize()
			 * @see WP_Entity_Actions_Registry::doing_entity_actions_api_init()
			 */
			if ( null !== $core_registry ) {
				$registry->actions        = $core_registry->actions;
				$registry->action_modules = $core_registry->action_modules;
				$registry->initialized    = $core_registry->initialized;
			}

			self::$instance = $registry;
		}

		return self::$instance;
	}

	/**
	 * Returns the script modules registered for an entity.
	 *
	 * It overrides the method of WordPress versions that ship the registry
	 * before core#14716, which key the ids of the actions by module id, so the
	 * plugin behaves the same whatever the WordPress version. It can be removed
	 * once the plugin requires a WordPress version that includes it.
	 *
	 * @param string $kind The entity kind (e.g. `postType`).
	 * @param string $name The entity name (e.g. `page`).
	 * @return array[] {
	 *     The script modules, in registration order. Empty when the entity
	 *     is invalid.
	 *
	 *     @type array ...$0 {
	 *         @type string   $id      The id of the script module.
	 *         @type string[] $actions The ids of the actions the module
	 *                                 applies to, in registration order.
	 *     }
	 * }
	 */
	public function get_registered_action_modules( $kind, $name ) {
		// Reports the method of the core class, like the method it overrides.
		if ( ! $this->validate_entity( 'WP_Entity_Actions_Registry::get_registered_action_modules', $kind, $name ) ) {
			return array();
		}
		$this->initialize();
		$modules = array();
		foreach ( $this->action_modules[ $kind ][ $name ] ?? array() as $module => $action_ids ) {
			$modules[] = array(
				// A numeric module id is an integer as an array key.
				'id'      => (string) $module,
				'actions' => $action_ids,
			);
		}
		return $modules;
	}
}

/**
 * Replaces the core actions registry with the plugin one, so that all code
 * using `WP_Entity_Actions_Registry::get_instance()` receives it.
 */
function gutenberg_override_wp_entity_actions_registry() {
	WP_Entity_Actions_Registry_Gutenberg::get_instance();
}
add_action( 'init', 'gutenberg_override_wp_entity_actions_registry', 1 );
