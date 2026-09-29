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
 * registered field definitions keyed by id, in registration order, each
 * with the origins that registered and updated it, and to the script modules
 * registered for it, each with the ids of the fields it applies to.
 * register() adds fields, update() changes registered ones, and both
 * validate the definitions before storing them.
 *
 * Fields are registered on the `fields_api_init` action, on the
 * registry its callbacks receive, and only there: register(), update(),
 * and unregister() refuse to run while the action is not firing.
 *
 * The registry is filled lazily: the first time its fields are read, it
 * fires the `fields_api_init` action, on which the default fields of every
 * post type and the fields of plugins are registered. A read before `init`
 * has completed is refused, see initialize().
 *
 * Once the action has fired the registry does not change: every reader of
 * a request, the REST controller as well as the import map of the editor
 * script, sees the same fields.
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
	 * Whether the `fields_api_init` action has fired since the registry
	 * was created.
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
	 * Returns the singleton instance.
	 *
	 * @return Gutenberg_Fields_Registry The registry.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Registers fields for an entity.
	 *
	 * The fields must be new: registering a field with the id of a registered
	 * field, or the same id twice, is refused and registers none of the
	 * fields of the call. To change a registered field, see update(); to
	 * replace it, unregister it first. The script module, if any, applies to
	 * every field of the call.
	 *
	 * The origin is stored as the `origin` property of each field, as
	 * `registeredBy`, replacing any `origin` the definition sets.
	 *
	 * @param string      $origin        Who registers the fields: `core`, or
	 *                                   the slug of the plugin or theme.
	 * @param string      $kind          The entity kind (e.g. `postType`).
	 * @param string      $name          The entity name (e.g. `page`).
	 * @param array[]     $fields        The list of field definitions, each with an `id`.
	 * @param string|null $script_module The id of the script module providing
	 *                                   the JavaScript parts of the fields, if any.
	 * @return bool Whether the fields were registered. False when called
	 *              outside the `fields_api_init` action, when an argument
	 *              is invalid, or when a field is already registered.
	 */
	public function register( $origin, $kind, $name, $fields, $script_module = null ) {
		if ( ! $this->validate_arguments( __METHOD__, $origin, $kind, $name, $fields, $script_module ) ) {
			return false;
		}

		$entity = $this->get_entity_key( $kind, $name );

		$ids = array_column( $fields, 'id' );
		if ( count( array_unique( $ids ) ) !== count( $ids ) || array_intersect_key( array_flip( $ids ), $this->fields[ $entity ] ?? array() ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'A field can only be registered once. Use update() to change a registered field, or unregister it first to replace it.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		foreach ( $fields as $field ) {
			$this->fields[ $entity ][ $field['id'] ] = array_merge(
				$field,
				array(
					'origin' => array(
						'registeredBy' => $origin,
						'updatedBy'    => array(),
					),
				)
			);
		}
		$this->add_field_module( $entity, $ids, $script_module );

		return true;
	}

	/**
	 * Updates registered fields of an entity.
	 *
	 * Each definition is merged into the registered field with its id,
	 * property by property; the field keeps its position. The fields must be
	 * registered: updating a field that is not is refused and updates none
	 * of the fields of the call. The script module, if any, applies to every
	 * field of the call, on top of the modules the fields have.
	 *
	 * The origin is appended to the `updatedBy` list of the `origin` property
	 * of each field, once; the rest of the `origin` property cannot be
	 * updated, and any `origin` the definition sets is ignored.
	 *
	 * Like register(), it only runs on the `fields_api_init` action.
	 *
	 * @param string      $origin        Who updates the fields: `core`, or
	 *                                   the slug of the plugin or theme.
	 * @param string      $kind          The entity kind (e.g. `postType`).
	 * @param string      $name          The entity name (e.g. `page`).
	 * @param array[]     $fields        The list of partial field definitions,
	 *                                   each with the `id` of a registered field.
	 * @param string|null $script_module The id of the script module providing
	 *                                   the JavaScript parts of the fields, if any.
	 * @return bool Whether the fields were updated. False when called outside
	 *              the `fields_api_init` action, when an argument is invalid,
	 *              or when a field is not registered.
	 */
	public function update( $origin, $kind, $name, $fields, $script_module = null ) {
		if ( ! $this->validate_arguments( __METHOD__, $origin, $kind, $name, $fields, $script_module ) ) {
			return false;
		}

		$entity = $this->get_entity_key( $kind, $name );

		$ids = array_column( $fields, 'id' );
		if ( array_diff_key( array_flip( $ids ), $this->fields[ $entity ] ?? array() ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Only registered fields can be updated. Use register() to add a field.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		foreach ( $fields as $field ) {
			$registered   = $this->fields[ $entity ][ $field['id'] ];
			$field_origin = $registered['origin'];
			if ( ! in_array( $origin, $field_origin['updatedBy'], true ) ) {
				$field_origin['updatedBy'][] = $origin;
			}

			$this->fields[ $entity ][ $field['id'] ] = array_merge( $registered, $field, array( 'origin' => $field_origin ) );
		}
		$this->add_field_module( $entity, $ids, $script_module );

		return true;
	}

	/**
	 * Unregisters fields of an entity.
	 *
	 * Unregistering a field removes its registered definition and
	 * drops it from the script modules that applied to it (a module left with
	 * no field is forgotten). Unregistering every field forgets the entity:
	 * its registered fields and script modules.
	 *
	 * Like register(), it only runs on the `fields_api_init` action.
	 *
	 * @param string        $kind The entity kind (e.g. `postType`).
	 * @param string        $name The entity name (e.g. `page`).
	 * @param string[]|null $ids  The ids of the fields to unregister. Default
	 *                            null, every field of the entity.
	 * @return array[] The list of the definitions unregistered, in
	 *                 registration order, as get_registered() returns them.
	 *                 Empty when none of the fields is registered, or when
	 *                 called outside the `fields_api_init` action.
	 */
	public function unregister( $kind, $name, $ids = null ) {
		if ( ! $this->doing_fields_api_init( __METHOD__ ) ) {
			return array();
		}

		$entity = $this->get_entity_key( $kind, $name );

		if ( null === $ids ) {
			$unregistered = array_values( $this->fields[ $entity ] ?? array() );
			unset( $this->fields[ $entity ], $this->field_modules[ $entity ] );
			return $unregistered;
		}

		$unregistered = array_intersect_key( $this->fields[ $entity ] ?? array(), array_flip( (array) $ids ) );
		if ( empty( $unregistered ) ) {
			return array();
		}

		// A script module only ever applies to registered fields: register()
		// and update() add it for fields they store, and fields leave both
		// lists together here. So the fields removed are all the registry
		// loses, and the modules are not returned: the ones that applied to
		// them are listed by get_registered_field_modules(), read beforehand.
		$ids = array_keys( $unregistered );
		foreach ( $ids as $id ) {
			unset( $this->fields[ $entity ][ $id ] );
		}
		foreach ( $this->field_modules[ $entity ] ?? array() as $module => $module_ids ) {
			$remaining = array_values( array_diff( $module_ids, $ids ) );
			if ( empty( $remaining ) ) {
				unset( $this->field_modules[ $entity ][ $module ] );
			} else {
				$this->field_modules[ $entity ][ $module ] = $remaining;
			}
		}
		if ( empty( $this->fields[ $entity ] ) ) {
			unset( $this->fields[ $entity ] );
		}
		if ( empty( $this->field_modules[ $entity ] ) ) {
			unset( $this->field_modules[ $entity ] );
		}

		return array_values( $unregistered );
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
	 * Fires the `fields_api_init` action the first time the registry
	 * is read.
	 *
	 * The read is refused until `init` has completed. The registry holds the
	 * fields of post types, and post types are not known until then: core
	 * registers its own on `init` at priority 0, plugins theirs at the default
	 * priority, and supports are added and removed on `init` too. The default
	 * fields of a post type derive from its supports, and the action fires
	 * once, so a read before or during `init` would fix the defaults from the
	 * post types registered so far for the rest of the request.
	 *
	 * did_action() is true from the first `init` callback on, hence the
	 * doing_action() check for the reads made while it runs.
	 */
	private function initialize() {
		if ( $this->initialized ) {
			return;
		}

		if ( ! did_action( 'init' ) || doing_action( 'init' ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'The registered fields cannot be read until the `init` action has completed: the post types and supports they derive from are registered on `init`. Read them once `init` has completed, or hook `fields_api_init`.', 'gutenberg' ),
				'7.2.0'
			);
			return;
		}

		// Set before firing, so a callback reading the registry to inspect
		// the fields it updates does not fire the action again.
		$this->initialized = true;

		/**
		 * Fires the first time the registered fields are read, after `init`.
		 *
		 * Register or adjust fields here, on `$registry`: it is the only way
		 * to register fields.
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
		do_action( 'fields_api_init', $this );
	}

	/**
	 * Checks that the `fields_api_init` action is firing, as register(),
	 * update(), and unregister() require.
	 *
	 * Outside the action a registration would either come before the
	 * defaults, which could then not be registered, or after the fields have been read
	 * and the import map of the editor script built from them. Refusing
	 * keeps the registry immutable once read.
	 *
	 * @param string $method The calling method, for the notice.
	 * @return bool Whether the action is firing.
	 */
	private function doing_fields_api_init( $method ) {
		if ( doing_action( 'fields_api_init' ) ) {
			return true;
		}

		_doing_it_wrong(
			$method,
			__( 'Fields can only be registered, updated, and unregistered on the `fields_api_init` action, on the registry it passes.', 'gutenberg' ),
			'7.2.0'
		);
		return false;
	}

	/**
	 * Validates the arguments of register() and update().
	 *
	 * @param string $method        The calling method, for the notice.
	 * @param mixed  $origin        The origin.
	 * @param mixed  $kind          The entity kind.
	 * @param mixed  $name          The entity name.
	 * @param mixed  $fields        The field definitions.
	 * @param mixed  $script_module The script module id, if any.
	 * @return bool Whether the call may proceed: the `fields_api_init` action
	 *              is firing and the arguments are valid.
	 */
	private function validate_arguments( $method, $origin, $kind, $name, $fields, $script_module ) {
		if ( ! $this->doing_fields_api_init( $method ) ) {
			return false;
		}

		if ( ! is_string( $origin ) || '' === $origin ) {
			_doing_it_wrong(
				$method,
				__( 'The origin must be a non-empty string.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		foreach ( array( $kind, $name ) as $argument ) {
			if ( ! is_string( $argument ) || '' === $argument ) {
				_doing_it_wrong(
					$method,
					__( 'The entity kind and the entity name must be non-empty strings.', 'gutenberg' ),
					'7.2.0'
				);
				return false;
			}
		}

		if ( ! is_array( $fields ) || empty( $fields ) ) {
			_doing_it_wrong(
				$method,
				__( 'The fields must be a list of non-empty field definitions.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		foreach ( $fields as $field ) {
			if ( ! is_array( $field ) || empty( $field['id'] ) || ! is_string( $field['id'] ) ) {
				_doing_it_wrong(
					$method,
					__( 'Every field definition must be an array with a non-empty string `id`.', 'gutenberg' ),
					'7.2.0'
				);
				return false;
			}
		}

		if ( null !== $script_module && ( ! is_string( $script_module ) || '' === $script_module ) ) {
			_doing_it_wrong(
				$method,
				__( 'The script module must be the id of a script module.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		return true;
	}

	/**
	 * Applies a script module to fields of an entity, after the fields it
	 * already applies to.
	 *
	 * @param string      $entity        The entity key.
	 * @param string[]    $ids           The ids of the fields.
	 * @param string|null $script_module The id of the script module, if any.
	 */
	private function add_field_module( $entity, $ids, $script_module ) {
		if ( null === $script_module ) {
			return;
		}

		$module_ids = $this->field_modules[ $entity ][ $script_module ] ?? array();
		foreach ( $ids as $id ) {
			if ( ! in_array( $id, $module_ids, true ) ) {
				$module_ids[] = $id;
			}
		}
		$this->field_modules[ $entity ][ $script_module ] = $module_ids;
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
