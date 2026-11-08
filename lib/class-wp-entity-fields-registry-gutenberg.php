<?php
/**
 * Fields registry of the plugin.
 *
 * @package gutenberg
 */

class WP_Entity_Fields_Registry_Gutenberg extends WP_Entity_Fields_Registry {

	/**
	 * Returns the shared registry instance.
	 *
	 * This class intentionally does not redeclare the static `$instance`
	 * property, so that it can be shared between `WP_Entity_Fields_Registry` and
	 * `WP_Entity_Fields_Registry_Gutenberg`.
	 *
	 * In other words, consumers can (and should) continue to call
	 * `WP_Entity_Fields_Registry::get_instance()` to access the registry, but they
	 * will receive an instance of `WP_Entity_Fields_Registry_Gutenberg`.
	 *
	 * @return WP_Entity_Fields_Registry_Gutenberg The registry.
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
			 * properties of the instance of `WP_Entity_Fields_Registry` that needs to
			 * be copied to the instance of `WP_Entity_Fields_Registry_Gutenberg`.
			 *
			 * THUS, THE ASSIGNMENTS BELOW REFLECT AN ABUNDANCE OF CAUTION AND
			 * NOT AN ACTUAL NEED.
			 *
			 * @see WP_Entity_Fields_Registry::initialize()
			 * @see WP_Entity_Fields_Registry::doing_entity_fields_api_init()
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

	/*
	 * The methods below override those of WordPress versions that ship the
	 * registry before core#14716, so the plugin behaves the same whatever the
	 * WordPress version. They can be removed once the plugin requires a
	 * WordPress version that includes it.
	 */

	/**
	 * Returns the script modules registered for an entity.
	 *
	 * @param string $kind The entity kind (e.g. `postType`).
	 * @param string $name The entity name (e.g. `page`).
	 * @return array[] {
	 *     The script modules, in registration order.
	 *
	 *     @type array ...$0 {
	 *         @type string   $id     The id of the script module.
	 *         @type string[] $fields The ids of the fields the module applies
	 *                                to, in registration order.
	 *     }
	 * }
	 */
	public function get_registered_field_modules( $kind, $name ) {
		$this->initialize();
		$modules = array();
		foreach ( $this->field_modules[ $kind ][ $name ] ?? array() as $module => $field_ids ) {
			$modules[] = array(
				// A numeric module id is an integer as an array key.
				'id'     => (string) $module,
				'fields' => $field_ids,
			);
		}
		return $modules;
	}

	/**
	 * Returns the ids of the script modules registered for every entity.
	 *
	 * @return array<string, array<string, string[]>> The lists of module ids,
	 *                                                keyed by kind, then by
	 *                                                name.
	 */
	public function get_all_registered_field_modules() {
		$this->initialize();
		return array_map(
			static function ( $entities ) {
				return array_map(
					static function ( $modules ) {
						// A numeric module id is an integer as an array key.
						return array_map( 'strval', array_keys( $modules ) );
					},
					$entities
				);
			},
			$this->field_modules
		);
	}

	/**
	 * Drops the definitions that are not an array with a non-empty string
	 * `id`, reporting their positions in the call with _doing_it_wrong().
	 * Unlike `empty()`, it keeps the id `0`.
	 *
	 * @param string  $method The calling method, for the notice.
	 * @param string  $kind   The entity kind.
	 * @param string  $name   The entity name.
	 * @param array[] $fields The list of field definitions.
	 * @return array[] The valid definitions, in the order of the call.
	 */
	protected function skip_invalid_definitions( $method, $kind, $name, $fields ) {
		$valid   = array();
		$invalid = array();
		foreach ( $fields as $position => $field ) {
			if ( is_array( $field ) && isset( $field['id'] ) && is_string( $field['id'] ) && '' !== $field['id'] ) {
				$valid[] = $field;
			} else {
				$invalid[] = '#' . ( $position + 1 );
			}
		}

		if ( $invalid ) {
			_doing_it_wrong(
				$method,
				sprintf(
					/* translators: 1: Entity kind, e.g. postType. 2: Entity name, e.g. page. 3: Comma-separated list of positions, e.g. #2, #4. */
					__( 'Every field definition must be an array with a non-empty string `id`. These definitions of %1$s "%2$s" are skipped: %3$s. The rest of the fields of the call are stored.', 'gutenberg' ),
					$kind,
					$name,
					implode( ', ', $invalid )
				),
				'7.2.0'
			);
		}

		return $valid;
	}
}

/**
 * Replaces the core fields registry with the plugin one, so that all code
 * using `WP_Entity_Fields_Registry::get_instance()` receives it.
 */
function gutenberg_override_wp_entity_fields_registry() {
	WP_Entity_Fields_Registry_Gutenberg::get_instance();
}
add_action( 'init', 'gutenberg_override_wp_entity_fields_registry', 1 );
