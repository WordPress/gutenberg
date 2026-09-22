<?php
/**
 * Fields registry.
 *
 * @package gutenberg
 */

/**
 * Holds the fields registered for entities with gutenberg_register_fields().
 *
 * The registry maps an entity, identified by its kind and name, to three
 * things: its registered field definitions keyed by id, in registration
 * order; the script modules registered for it, each with the ids of the
 * fields it applies to; and the ids of the fields removed with
 * gutenberg_unregister_fields(), so a default field the entity derives on
 * its own stays out once removed. It only stores what it is given:
 * gutenberg_register_fields() validates the definitions before registering
 * them.
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
					__FUNCTION__,
					__( 'The entity kind and the entity name must be non-empty strings.', 'gutenberg' ),
					'7.2.0'
				);
				return false;
			}
		}

		if ( null !== $script_module && ( ! is_string( $script_module ) || '' === $script_module ) ) {
			_doing_it_wrong(
				__FUNCTION__,
				__( 'The script module must be the id of a script module.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		if ( ! is_array( $fields ) ) {
			_doing_it_wrong(
				__FUNCTION__,
				__( 'The fields must be a list of field definitions.', 'gutenberg' ),
				'7.2.0'
			);
			return false;
		}

		foreach ( $fields as $field ) {
			if ( ! is_array( $field ) || empty( $field['id'] ) || ! is_string( $field['id'] ) ) {
				_doing_it_wrong(
					__FUNCTION__,
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
		return array_values( $this->fields[ $this->get_entity_key( $kind, $name ) ] ?? array() );
	}

	/**
	 * Returns the fields registered for every entity.
	 *
	 * @return array<string, array[]> The lists of field definitions, keyed by
	 *                                `{$kind}/{$name}`.
	 */
	public function get_all_registered() {
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
		return $this->field_modules[ $this->get_entity_key( $kind, $name ) ] ?? array();
	}

	/**
	 * Returns the ids of the script modules registered for every entity.
	 *
	 * @return array<string, string[]> The lists of module ids, keyed by
	 *                                 `{$kind}/{$name}`.
	 */
	public function get_all_registered_script_modules() {
		return array_map( 'array_keys', $this->field_modules );
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
