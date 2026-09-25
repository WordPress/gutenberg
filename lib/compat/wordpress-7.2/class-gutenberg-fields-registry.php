<?php
/**
 * Fields registry.
 *
 * @package gutenberg
 */

/**
 * Holds the fields registered for entities.
 *
 * The registry maps an entity, identified by its kind and name, to its
 * registered field definitions keyed by id, in registration order, and to
 * the script modules registered for it, each with the ids of the fields it
 * applies to. register() validates the definitions before storing them.
 *
 * Fields are registered on the `gutenberg_fields_api_init` action, on the
 * registry its callbacks receive. There is no function wrapping register()
 * or unregister(): the action is the one place a plugin gets the instance,
 * once the default fields are in place, the way `customize_register` hands
 * out the WP_Customize_Manager and `wp_connectors_init` the
 * WP_Connector_Registry. Reading goes through the functions in
 * fields-api.php.
 *
 * The registry exists once `init` has run, see get_instance(), and is
 * filled lazily: the first time its fields are read it fires the
 * `gutenberg_fields_api_init` action, on which the default fields of every
 * post type and the fields of plugins are registered. Registering does not
 * fire the action; reading does, and only once. This mirrors how
 * rest_get_server() fires `rest_api_init` on its first use.
 *
 * @since 7.2.0
 *
 * @access private
 */
final class Gutenberg_Fields_Registry {

	/**
	 * Registered fields, as `{$kind}/{$name}` => array of field id => definition.
	 *
	 * @var array<string, array<string, array>>
	 */
	private $fields = array();

	/**
	 * Registered script modules, as `{$kind}/{$name}` => array of module id =>
	 * list of the ids of the fields the module applies to, in registration
	 * order.
	 *
	 * @var array<string, array<string, string[]>>
	 */
	private $field_modules = array();

	/**
	 * Whether the `gutenberg_fields_api_init` action has fired since the registry
	 * was created or last reset.
	 *
	 * @var bool
	 */
	private $initialized = false;

	/**
	 * The singleton instance.
	 *
	 * @var Gutenberg_Fields_Registry|null
	 */
	private static $instance = null;

	/**
	 * Returns the singleton instance, or null before the `init` action has
	 * run.
	 *
	 * The registry holds the fields of post types, and post types are not
	 * known until `init` has run: core registers its own on `init` at
	 * priority 0, plugins theirs at the default priority, and supports are
	 * added and removed on `init` too. The default fields of a post type
	 * derive from its supports, so a registry available earlier would let a
	 * plugin register a field for a post type that does not exist yet, or
	 * patch a default field before it is known whether the post type gets
	 * it. Like WP_Abilities_Registry::get_instance(), the registry refuses to
	 * exist before then.
	 *
	 * @return Gutenberg_Fields_Registry|null The registry, or null when `init`
	 *                                        has not run yet.
	 */
	public static function get_instance() {
		if ( ! did_action( 'init' ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'The fields registry is not available before the `init` action has run: post types and their supports, which the fields belong to, are registered on `init`.', 'gutenberg' ),
				'7.2.0'
			);
			return null;
		}

		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Registers fields for an entity.
	 *
	 * A field with the id of an already registered field is merged into it,
	 * property by property, keeping its position. The script module, if any,
	 * applies to every field of the call.
	 *
	 * @param string      $kind          The entity kind (e.g. `postType`).
	 * @param string      $name          The entity name (e.g. `page`).
	 * @param array[]     $fields        The list of field definitions, each with an `id`.
	 * @param string|null $script_module The id of the script module providing
	 *                                   the JavaScript parts of the fields, if any.
	 * @return bool Whether the fields were registered. False when an argument is invalid.
	 */
	public function register( $kind, $name, $fields, $script_module = null ) {
		foreach ( array( $kind, $name ) as $argument ) {
			if ( ! is_string( $argument ) || '' === $argument ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'The entity kind and the entity name must be non-empty strings.', 'gutenberg' ),
					'7.2.0'
				);
				return false;
			}
		}

		if ( null !== $script_module && ( ! is_string( $script_module ) || '' === $script_module ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'The script module must be the id of a script module.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		if ( ! is_array( $fields ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'The fields must be a list of field definitions.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		foreach ( $fields as $field ) {
			if ( ! is_array( $field ) || empty( $field['id'] ) || ! is_string( $field['id'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Every field definition must be an array with a non-empty string `id`.', 'gutenberg' ),
					'7.2.0'
				);
				return false;
			}
		}

		$entity = $this->get_entity_key( $kind, $name );

		if ( ! isset( $this->fields[ $entity ] ) ) {
			$this->fields[ $entity ] = array();
		}
		foreach ( $fields as $field ) {
			$id                             = $field['id'];
			$this->fields[ $entity ][ $id ] = isset( $this->fields[ $entity ][ $id ] )
				? array_merge( $this->fields[ $entity ][ $id ], $field )
				: $field;

			if ( null !== $script_module ) {
				$ids = $this->field_modules[ $entity ][ $script_module ] ?? array();
				if ( ! in_array( $id, $ids, true ) ) {
					$ids[] = $id;
				}
				$this->field_modules[ $entity ][ $script_module ] = $ids;
			}
		}

		return true;
	}

	/**
	 * Unregisters fields of an entity.
	 *
	 * Unregistering a field removes its registered definition, if any, drops
	 * it from the script modules that applied to it (a module left with no
	 * field is forgotten), and records it as removed, so a default field of
	 * the entity with that id stays out until the entity is reset.
	 * Unregistering every field resets the entity: registered fields, script
	 * modules, and removals.
	 *
	 * Unregistering reads the registered fields, so it fires the
	 * `gutenberg_fields_api_init` action if it has not fired yet. Call it on that
	 * action or later, once the default fields are registered.
	 *
	 * @param string        $kind The entity kind (e.g. `postType`).
	 * @param string        $name The entity name (e.g. `page`).
	 * @param string[]|null $ids  The ids of the fields to unregister. Default
	 *                            null, every field of the entity.
	 * @return bool Whether the registry changed.
	 */
	public function unregister( $kind, $name, $ids = null ) {
		if ( null !== $ids ) {
			$present = array_column( $this->get_registered( $kind, $name ), 'id' );
			$ids     = array_values( array_intersect( (array) $ids, $present ) );
			if ( empty( $ids ) ) {
				return false;
			}
		}

		$entity = $this->get_entity_key( $kind, $name );

		if ( null === $ids ) {
			$had_state = isset( $this->fields[ $entity ] ) || isset( $this->field_modules[ $entity ] );
			unset( $this->fields[ $entity ], $this->field_modules[ $entity ] );
			return $had_state;
		}

		$changed = false;
		foreach ( (array) $ids as $id ) {
			if ( isset( $this->fields[ $entity ][ $id ] ) ) {
				unset( $this->fields[ $entity ][ $id ] );
				$changed = true;
			}
			foreach ( $this->field_modules[ $entity ] ?? array() as $module => $module_ids ) {
				$remaining = array_values( array_diff( $module_ids, array( $id ) ) );
				if ( count( $remaining ) !== count( $module_ids ) ) {
					$changed = true;
				}
				if ( empty( $remaining ) ) {
					unset( $this->field_modules[ $entity ][ $module ] );
				} else {
					$this->field_modules[ $entity ][ $module ] = $remaining;
				}
			}
		}
		if ( empty( $this->fields[ $entity ] ) ) {
			unset( $this->fields[ $entity ] );
		}
		if ( empty( $this->field_modules[ $entity ] ) ) {
			unset( $this->field_modules[ $entity ] );
		}

		return $changed;
	}

	/**
	 * Returns the fields registered for an entity.
	 *
	 * @param string $kind The entity kind (e.g. `postType`).
	 * @param string $name The entity name (e.g. `page`).
	 * @return array[] The list of field definitions, in registration order.
	 */
	public function get_registered( $kind, $name ) {
		$this->initialize();
		return array_values( $this->fields[ $this->get_entity_key( $kind, $name ) ] ?? array() );
	}

	/**
	 * Returns the fields registered for every entity.
	 *
	 * @return array<string, array[]> The lists of field definitions, keyed by
	 *                                `{$kind}/{$name}`.
	 */
	public function get_all_registered() {
		$this->initialize();
		return array_map( 'array_values', $this->fields );
	}

	/**
	 * Returns the script modules registered for an entity.
	 *
	 * @param string $kind The entity kind (e.g. `postType`).
	 * @param string $name The entity name (e.g. `page`).
	 * @return array<string, string[]> The ids of the fields each module
	 *                                 applies to, keyed by module id, in
	 *                                 registration order.
	 */
	public function get_registered_field_modules( $kind, $name ) {
		$this->initialize();
		return $this->field_modules[ $this->get_entity_key( $kind, $name ) ] ?? array();
	}

	/**
	 * Returns the ids of the script modules registered for every entity.
	 *
	 * @return array<string, string[]> The lists of module ids, keyed by
	 *                                 `{$kind}/{$name}`.
	 */
	public function get_all_registered_field_modules() {
		$this->initialize();
		return array_map( 'array_keys', $this->field_modules );
	}

	/**
	 * Empties the registry, so the next read fires the `gutenberg_fields_api_init`
	 * action again and registers the fields anew.
	 *
	 * Intended for tests.
	 */
	public function reset() {
		$this->fields        = array();
		$this->field_modules = array();
		$this->initialized   = false;
	}

	/**
	 * Fires the `gutenberg_fields_api_init` action the first time the registry
	 * is read.
	 *
	 * The registry only exists once `init` has run, see get_instance(), so
	 * the post types and the supports the default fields derive from are
	 * final by the time the action fires.
	 */
	private function initialize() {
		if ( $this->initialized ) {
			return;
		}

		// Set before firing, so a callback reading the registry to inspect
		// the fields it patches does not fire the action again.
		$this->initialized = true;

		/**
		 * Fires the first time the registered fields are read, after `init`.
		 *
		 * Register or adjust fields here, on `$registry`: it is the only way
		 * to register fields. The default fields of every post
		 * type are registered at priority 0 and adjusted at priority 9, so a
		 * callback at the default priority sees the final defaults. The
		 * plugin that owns a post type shapes its defaults at priority 9,
		 * like core does for its own; a plugin extending a post type it does
		 * not own hooks the default priority or later.
		 *
		 * The first read happens wherever the fields are needed: while
		 * handling a REST request as well as on `admin_init`. A callback
		 * should register fields and nothing else; script modules, styles,
		 * and their enqueue hooks belong on `init`.
		 *
		 * @since 7.2.0
		 *
		 * @param Gutenberg_Fields_Registry $registry The registry being read.
		 */
		do_action( 'gutenberg_fields_api_init', $this );
	}

	/**
	 * Builds the key an entity is stored under.
	 *
	 * @param string $kind The entity kind.
	 * @param string $name The entity name.
	 * @return string The key.
	 */
	private function get_entity_key( $kind, $name ) {
		return "{$kind}/{$name}";
	}
}
